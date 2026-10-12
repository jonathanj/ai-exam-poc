import {requireUser} from '@/lib/auth';
import {db} from '@/lib/db';
import {metrics, type QuestionContent} from '@/lib/domain';
import {ExamLibrary} from '@/components/exam-library';
export default async function ExamsPage() {
  const user = await requireUser();
  const exams = await db.exam.findMany({
    where: {ownerId: user.id},
    include: {questions: true},
    orderBy: {updatedAt: 'desc'},
  });
  return (
    <ExamLibrary
      exams={exams.map((e) => ({
        id: e.id,
        title: e.title,
        status: e.status,
        archived: e.archived,
        sample: e.sample,
        revision: e.revision,
        updatedAt: e.updatedAt.toISOString(),
        marks: metrics(
          e.questions.map((q) => ({
            content: q.content as unknown as QuestionContent,
          })),
        ).marks,
        body: (e.brief as {body: string}).body,
        questionCount: e.questions.length,
      }))}
    />
  );
}
