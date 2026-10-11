import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { examView } from "@/lib/exams";
import { HttpError } from "@/lib/http";
import { ExamEditor } from "@/components/exam-editor";
export default async function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  let exam;
  try {
    exam = await examView((await params).id, user.id);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  return <ExamEditor initial={exam} />;
}
