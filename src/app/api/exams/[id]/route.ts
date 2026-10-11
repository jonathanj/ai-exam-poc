import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiUser, apiError, assertOrigin, HttpError } from "@/lib/http";
import { ownedExam, examView, json, criteria } from "@/lib/exams";
import {
  briefSchema,
  questionSchema,
  type QuestionContent,
} from "@/lib/domain";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: NextRequest, ctx: Context) {
  try {
    const user = await apiUser();
    return NextResponse.json(await examView((await ctx.params).id, user.id));
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(req: NextRequest, ctx: Context) {
  try {
    assertOrigin(req);
    const user = await apiUser();
    const { id } = await ctx.params;
    const exam = await ownedExam(id, user.id);
    const body = z
      .object({
        action: z.enum([
          "brief",
          "add",
          "edit",
          "delete",
          "reorder",
          "duplicate",
          "archive",
        ]),
        revision: z.number().int(),
        payload: z.unknown().optional(),
      })
      .parse(await req.json());
    if (body.revision !== exam.revision)
      throw new HttpError(
        409,
        "This paper changed in another tab. Reload before saving.",
      );
    if (
      exam.generationToken &&
      exam.generationStartedAt &&
      Date.now() - exam.generationStartedAt.getTime() < 180000
    )
      throw new HttpError(409, "Generation is in progress. Please wait.");
    if (body.action === "duplicate") {
      const copy = await db.exam.create({
        data: {
          ownerId: user.id,
          title: `${exam.title} (copy)`,
          brief: json({
            ...(exam.brief as object),
            title: `${exam.title} (copy)`,
          }),
          sample: exam.sample,
          questions: {
            create: exam.questions.map((q) => ({
              position: q.position,
              provenance: q.provenance,
              content: json(q.content),
              criteria: {
                create: criteria(q.content as unknown as QuestionContent),
              },
              revisions: {
                create: {
                  revision: 0,
                  source: "duplicate",
                  content: json(q.content),
                },
              },
            })),
          },
        },
      });
      return NextResponse.json({ id: copy.id });
    }
    await db.$transaction(async (tx) => {
      const changed = await tx.exam.updateMany({
        where: { id, ownerId: user.id, revision: body.revision },
        data: { revision: { increment: 1 }, status: "draft" },
      });
      if (!changed.count)
        throw new HttpError(409, "Paper changed. Reload before saving.");
      if (body.action === "brief") {
        const brief = briefSchema.parse(body.payload);
        await tx.exam.update({
          where: { id },
          data: { title: brief.title, brief: json(brief) },
        });
      }
      if (body.action === "archive")
        await tx.exam.update({
          where: { id },
          data: { archived: z.boolean().parse(body.payload) },
        });
      if (body.action === "add") {
        const content = questionSchema.parse(body.payload);
        await tx.question.create({
          data: {
            examId: id,
            position: exam.questions.length,
            content: json(content),
            criteria: { create: criteria(content) },
            revisions: {
              create: { revision: 0, source: "manual", content: json(content) },
            },
          },
        });
      }
      if (body.action === "edit") {
        const p = z
          .object({
            id: z.string(),
            revision: z.number().int(),
            content: questionSchema,
          })
          .parse(body.payload);
        const q = exam.questions.find((q) => q.id === p.id);
        if (!q) throw new HttpError(404, "Question not found.");
        if (q.revision !== p.revision)
          throw new HttpError(409, "Question changed. Reload before editing.");
        await tx.question.update({
          where: { id: q.id },
          data: {
            revision: { increment: 1 },
            content: json(p.content),
            criteria: { deleteMany: {}, create: criteria(p.content) },
            revisions: {
              create: {
                revision: q.revision + 1,
                source: "manual-edit",
                content: json(p.content),
              },
            },
          },
        });
      }
      if (body.action === "delete") {
        const qid = z.string().parse(body.payload);
        if (!exam.questions.some((q) => q.id === qid))
          throw new HttpError(404, "Question not found.");
        await tx.question.delete({ where: { id: qid } });
        const remaining = exam.questions.filter((q) => q.id !== qid);
        for (const [position, q] of remaining.entries())
          await tx.question.update({ where: { id: q.id }, data: { position } });
      }
      if (body.action === "reorder") {
        const ids = z.array(z.string()).parse(body.payload);
        if (
          ids.length !== exam.questions.length ||
          new Set(ids).size !== ids.length ||
          ids.some((qid) => !exam.questions.some((q) => q.id === qid))
        )
          throw new HttpError(
            400,
            "Order must contain each paper question exactly once.",
          );
        for (const [position, qid] of ids.entries())
          await tx.question.update({ where: { id: qid }, data: { position } });
      }
    });
    return NextResponse.json(await examView(id, user.id));
  } catch (e) {
    return apiError(e);
  }
}
