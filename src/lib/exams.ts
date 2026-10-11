import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { HttpError } from "./http";
import { type Brief, type QuestionContent, type ExamView } from "./domain";
export const json = (value: unknown) =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
export function criteria(content: QuestionContent) {
  return content.parts.flatMap((part, partIndex) =>
    part.rubric.map((c) => ({ ...c, partIndex })),
  );
}
export async function ownedExam(id: string, ownerId: string) {
  const exam = await db.exam.findFirst({
    where: { id, ownerId },
    include: { questions: { orderBy: { position: "asc" } } },
  });
  if (!exam) throw new HttpError(404, "Exam not found.");
  return exam;
}
export async function ownedQuestion(
  examId: string,
  id: string,
  ownerId: string,
) {
  const exam = await ownedExam(examId, ownerId);
  const question = exam.questions.find((q) => q.id === id);
  if (!question) throw new HttpError(404, "Question not found.");
  return { exam, question };
}
export async function examView(id: string, ownerId: string): Promise<ExamView> {
  const exam = await ownedExam(id, ownerId);
  return {
    ...exam,
    brief: exam.brief as unknown as Brief,
    updatedAt: exam.updatedAt.toISOString(),
    questions: exam.questions.map((q) => ({
      ...q,
      content: q.content as unknown as QuestionContent,
    })),
  };
}
