import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser, apiError, assertOrigin, HttpError } from "@/lib/http";
import { ownedQuestion, examView, json, criteria } from "@/lib/exams";
import { questionSchema, type QuestionContent } from "@/lib/domain";
import { validatedGeneration, startRun, finishRun } from "@/lib/ai-service";
import { revision as revisionPrompt } from "@/lib/prompts/v1";
export const maxDuration = 180;
type Context = { params: Promise<{ id: string; qid: string }> };
export async function POST(req: NextRequest, ctx: Context) {
  let runId: string | undefined;
  try {
    assertOrigin(req);
    const user = await apiUser();
    const { id, qid } = await ctx.params;
    const { exam, question } = await ownedQuestion(id, qid, user.id);
    const body = z
      .discriminatedUnion("action", [
        z.object({
          action: z.literal("propose"),
          request: z.string().trim().min(1).max(5000),
        }),
        z.object({ action: z.literal("accept"), proposalId: z.string() }),
      ])
      .parse(await req.json());
    if (body.action === "propose") {
      const run = await startRun(id, "revision", question.revision, qid);
      runId = run.id;
      const messages = await db.chatMessage.findMany({
        where: { questionId: qid },
        orderBy: { createdAt: "desc" },
        take: 30,
      });
      const content = question.content as unknown as QuestionContent;
      const { value, usage, errors } = await validatedGeneration({
        examId: id,
        task: revisionPrompt,
        context: {
          brief: exam.brief,
          question: content,
          request: body.request,
          messages: messages.reverse(),
        },
        schema: questionSchema,
        fixture: () => ({
          ...content,
          parts: content.parts.map((p) => ({
            ...p,
            prompt: p.prompt.replace(
              "A school has",
              "At a community school, there are",
            ),
          })),
        }),
        onValidation: async (errors) => {
          await db.aiRun.update({
            where: { id: run.id },
            data: { validationErrors: json(errors) },
          });
        },
      });
      const proposal = await db.proposal.create({
        data: {
          questionId: qid,
          inputRevision: question.revision,
          content: json(value),
        },
      });
      await finishRun(run.id, "completed", {
        usage,
        errors,
        result: { proposalId: proposal.id },
      });
      return NextResponse.json(proposal);
    }
    const proposal = await db.proposal.findFirst({
      where: { id: body.proposalId, questionId: qid },
    });
    if (!proposal) throw new HttpError(404, "Proposal not found.");
    if (proposal.acceptedAt || proposal.inputRevision !== question.revision)
      throw new HttpError(
        409,
        "This proposal is stale or already accepted. Request a new proposal against the current question.",
      );
    if (
      exam.generationToken &&
      exam.generationStartedAt &&
      Date.now() - exam.generationStartedAt.getTime() < 180000
    )
      throw new HttpError(409, "Generation is in progress.");
    const content = questionSchema.parse(proposal.content);
    await db.$transaction(async (tx) => {
      const changed = await tx.exam.updateMany({
        where: { id, ownerId: user.id, revision: exam.revision },
        data: { revision: { increment: 1 }, status: "draft" },
      });
      if (!changed.count)
        throw new HttpError(409, "Paper changed. Reload before accepting.");
      const updated = await tx.question.updateMany({
        where: { id: qid, revision: proposal.inputRevision },
        data: {
          revision: { increment: 1 },
          provenance: "ai-assisted",
          content: json(content),
        },
      });
      if (!updated.count)
        throw new HttpError(409, "Question changed. Request a fresh proposal.");
      await tx.rubricCriterion.deleteMany({ where: { questionId: qid } });
      await tx.rubricCriterion.createMany({
        data: criteria(content).map((c) => ({ ...c, questionId: qid })),
      });
      await tx.questionRevision.create({
        data: {
          questionId: qid,
          revision: question.revision + 1,
          source: "accepted-ai-proposal",
          content: json(content),
        },
      });
      await tx.proposal.update({
        where: { id: proposal.id },
        data: { acceptedAt: new Date() },
      });
    });
    return NextResponse.json(await examView(id, user.id));
  } catch (e) {
    if (runId) await finishRun(runId, "failed");
    return apiError(e);
  }
}
