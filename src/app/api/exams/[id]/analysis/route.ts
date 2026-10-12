import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {apiUser, apiError, assertOrigin, HttpError} from '@/lib/http';
import {examView, json} from '@/lib/exams';
import {analysisSchema, validatedGeneration, startRun, finishRun} from '@/lib/ai-service';
import {analysis} from '@/lib/prompts/v1';
export const maxDuration = 180;
export async function POST(req: NextRequest, ctx: {params: Promise<{id: string}>}) {
  let runId: string | undefined;
  try {
    assertOrigin(req);
    const user = await apiUser();
    const exam = await examView((await ctx.params).id, user.id);
    if (!exam.questions.length) throw new HttpError(400, 'Add questions before analysing.');
    const run = await startRun(exam.id, 'analysis', exam.revision);
    runId = run.id;
    const {value, usage, errors} = await validatedGeneration({
      examId: exam.id,
      task: analysis,
      context: exam,
      schema: analysisSchema,
      fixture: () => ({
        summary:
          'Fixture analysis: this sample demonstrates the review workflow, not mathematical moderation.',
        findings: [
          {
            category: 'duplication' as const,
            severity: 'warning' as const,
            questionId: exam.questions[0].id,
            message:
              'Fixture questions repeat a fraction method. Replace some with varied tasks before classroom use.',
          },
        ],
      }),
      validate: (v) => {
        if (
          v.findings.some((f) => f.questionId && !exam.questions.some((q) => q.id === f.questionId))
        )
          throw new Error('Finding references an unknown question.');
        return v;
      },
      onValidation: async (errors) => {
        await db.aiRun.update({
          where: {id: run.id},
          data: {validationErrors: json(errors)},
        });
      },
    });
    await finishRun(run.id, 'completed', {usage, errors, result: value});
    return NextResponse.json({...value, inputRevision: exam.revision});
  } catch (e) {
    if (runId) await finishRun(runId, 'failed');
    return apiError(e);
  }
}
