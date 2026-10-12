import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {z} from 'zod';
import {db} from '@/lib/db';
import {apiUser, apiError, assertOrigin, HttpError} from '@/lib/http';
import {ownedQuestion} from '@/lib/exams';
import {conversation, startRun, finishRun, checkAi} from '@/lib/ai-service';
export const maxDuration = 90;
type Context = {params: Promise<{id: string; qid: string}>};
export async function GET(_: NextRequest, ctx: Context) {
  try {
    const user = await apiUser();
    const {id, qid} = await ctx.params;
    await ownedQuestion(id, qid, user.id);
    const messages = await db.chatMessage.findMany({
      where: {questionId: qid},
      orderBy: {createdAt: 'asc'},
    });
    const proposals = await db.proposal.findMany({
      where: {questionId: qid, acceptedAt: null},
      orderBy: {createdAt: 'desc'},
      take: 5,
    });
    const revisions = await db.questionRevision.findMany({
      where: {questionId: qid},
      orderBy: {revision: 'desc'},
    });
    return NextResponse.json({messages, proposals, revisions});
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: NextRequest, ctx: Context) {
  try {
    assertOrigin(req);
    const user = await apiUser();
    const {id, qid} = await ctx.params;
    const {exam, question} = await ownedQuestion(id, qid, user.id);
    checkAi();
    const {text} = z.object({text: z.string().trim().min(1).max(5000)}).parse(await req.json());
    const ongoing = await db.aiRun.findFirst({
      where: {
        examId: id,
        questionId: qid,
        operation: 'chat',
        outcome: 'running',
        startedAt: {gt: new Date(Date.now() - 90000)},
      },
    });
    if (ongoing) throw new HttpError(409, 'A response is already in progress for this question.');
    const run = await startRun(id, 'chat', question.revision, qid);
    await db.chatMessage.create({
      data: {questionId: qid, role: 'user', content: text},
    });
    const history = await db.chatMessage.findMany({
      where: {questionId: qid},
      orderBy: {createdAt: 'desc'},
      take: 30,
    });
    const abort = new AbortController();
    const signal = AbortSignal.any([req.signal, abort.signal]);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let full = '';
        try {
          const iterator = conversation(
            {brief: exam.brief, question: question.content},
            history.reverse().map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
            signal,
            id,
          );
          let usage: unknown;
          while (true) {
            const chunk = await iterator.next();
            if (chunk.done) {
              usage = chunk.value;
              break;
            }
            full += chunk.value;
            controller.enqueue(encoder.encode(JSON.stringify({delta: chunk.value}) + '\n'));
          }
          if (signal.aborted || !full.trim()) throw new Error('Interrupted');
          await db.chatMessage.create({
            data: {questionId: qid, role: 'assistant', content: full},
          });
          await finishRun(run.id, 'completed', {usage});
          controller.enqueue(encoder.encode(JSON.stringify({done: true}) + '\n'));
          controller.close();
        } catch {
          await finishRun(run.id, signal.aborted ? 'interrupted' : 'failed');
          if (!signal.aborted) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  error: 'Response interrupted. Partial text has not been saved. Please retry.',
                }) + '\n',
              ),
            );
            controller.close();
          }
        }
      },
      cancel() {
        abort.abort();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
