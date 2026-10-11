import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser, apiError, assertOrigin, HttpError } from "@/lib/http";
import { ownedExam, examView, json, criteria } from "@/lib/exams";
import {
  briefSchema,
  questionSchema,
  validatePaper,
  targets,
} from "@/lib/domain";
import { fixturePaper } from "@/lib/fixtures";
import {
  validatedGeneration,
  startRun,
  finishRun,
  checkAi,
  fixtureMode,
} from "@/lib/ai-service";
import { generation } from "@/lib/prompts/v1";
export const maxDuration = 180;
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  let token: string | undefined;
  let examId: string | undefined;
  let runId: string | undefined;
  try {
    assertOrigin(req);
    const user = await apiUser();
    const { id } = await ctx.params;
    examId = id;
    const exam = await ownedExam(id, user.id);
    checkAi();
    const { revision } = z
      .object({ revision: z.number().int() })
      .parse(await req.json());
    if (exam.revision !== revision)
      throw new HttpError(409, "Paper changed. Reload before generation.");
    token = randomUUID();
    const lease = await db.exam.updateMany({
      where: {
        id,
        ownerId: user.id,
        revision,
        OR: [
          { generationToken: null },
          { generationStartedAt: { lt: new Date(Date.now() - 180000) } },
        ],
      },
      data: { generationToken: token, generationStartedAt: new Date() },
    });
    if (!lease.count)
      throw new HttpError(409, "Generation is already in progress.");
    const brief = briefSchema.parse(exam.brief);
    const run = await startRun(id, "generation", revision);
    runId = run.id;
    const schema = z.object({ questions: z.array(questionSchema) });
    const { value, usage, errors } = await validatedGeneration({
      task: generation,
      context: {
        brief,
        integerTargets: {
          difficulty: targets(brief.marks, brief.difficulty),
          demand: targets(brief.marks, brief.demand),
        },
      },
      schema,
      fixture: () => ({ questions: fixturePaper(brief) }),
      validate: (v) => ({ questions: validatePaper(brief, v.questions) }),
      onValidation: async (errors) => {
        await db.aiRun.update({
          where: { id: run.id },
          data: { validationErrors: json(errors) },
        });
      },
    });
    await db.$transaction(async (tx) => {
      const updated = await tx.exam.updateMany({
        where: { id, ownerId: user.id, revision, generationToken: token },
        data: {
          revision: { increment: 1 },
          status: "draft",
          sample: fixtureMode(),
          generationToken: null,
          generationStartedAt: null,
        },
      });
      if (!updated.count)
        throw new HttpError(
          409,
          "Paper changed during generation. Result was not applied.",
        );
      await tx.question.deleteMany({ where: { examId: id } });
      for (const [position, content] of value.questions.entries())
        await tx.question.create({
          data: {
            examId: id,
            position,
            provenance: "ai-generated",
            content: json(content),
            criteria: { create: criteria(content) },
            revisions: {
              create: {
                revision: 0,
                source: "generation",
                content: json(content),
              },
            },
          },
        });
    });
    await finishRun(run.id, "completed", { usage, errors, result: value });
    return NextResponse.json(await examView(id, user.id));
  } catch (e) {
    if (runId) await finishRun(runId, "failed");
    return apiError(e);
  } finally {
    if (token && examId)
      await db.exam.updateMany({
        where: { id: examId, generationToken: token },
        data: { generationToken: null, generationStartedAt: null },
      });
  }
}
