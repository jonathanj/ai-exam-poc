import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { examView } from "@/lib/exams";
import { HttpError } from "@/lib/http";
import { partNumber, metrics } from "@/lib/domain";
import { MathText } from "@/components/math";
import { PrintControls } from "@/components/print-controls";
export const dynamic = "force-dynamic";
export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const user = await requireUser();
  let exam;
  try {
    exam = await examView((await params).id, user.id);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  const mode = (await searchParams).mode === "memo" ? "memo" : "paper";
  const m = metrics(exam.questions);
  return (
    <>
      <PrintControls id={exam.id} mode={mode} status={exam.status} />
      <main className="print-paper">
        <header className="border-b-2 border-black pb-5">
          <p className="uppercase text-xs tracking-widest mb-3">
            {exam.brief.school || "Mathematics assessment"} · {exam.brief.body}
          </p>
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <h2 className="font-semibold mt-2">
            {mode === "memo" ? "Teacher memorandum" : "Learner paper"} · Grade 7
            Mathematics
          </h2>
          <div className="flex flex-wrap justify-between text-xs mt-4">
            <span>
              {m.marks} marks · {exam.brief.duration} minutes
            </span>
            <span>
              {exam.brief.date} · Examiner: {exam.brief.examiner}
            </span>
          </div>
          {exam.status !== "reviewed" && (
            <p className="text-xs mt-3 font-bold">UNREVIEWED DRAFT</p>
          )}
          {exam.sample && (
            <p className="text-xs mt-2 font-bold">
              SAMPLE DATA — NOT FOR CLASSROOM USE WITHOUT REVISION
            </p>
          )}
        </header>
        {mode === "paper" && (
          <section className="my-6">
            <p className="text-sm mb-5">
              Learner name: ____________________________________ Class:
              __________
            </p>
            <h2 className="font-semibold text-sm mb-2">Instructions</h2>
            <MathText>{exam.brief.instructions}</MathText>
            <p className="text-xs mt-2">
              Calculators{" "}
              {exam.brief.calculator === "allowed"
                ? "are permitted"
                : "are not permitted"}
              .
            </p>
          </section>
        )}
        {exam.questions.map((q, i) => (
          <section key={q.id} className="mt-8">
            <h2 className="font-semibold border-b pb-2 text-sm">
              Question {i + 1}{" "}
              <span className="float-right">
                [{q.content.parts.reduce((s, p) => s + p.marks, 0)}]
              </span>
            </h2>
            {q.content.introduction && (
              <div className="mt-3">
                <MathText>{q.content.introduction}</MathText>
              </div>
            )}
            {q.content.parts.map((p, j) => (
              <div key={j} className="print-question mt-4">
                <div className="flex gap-3">
                  <span className="font-semibold text-sm min-w-8">
                    {partNumber(i, j, q.content.parts.length)}
                  </span>
                  <div className="flex-1">
                    <MathText>{p.prompt}</MathText>
                  </div>
                  <span className="text-sm">({p.marks})</span>
                </div>
                {mode === "paper" ? (
                  <div
                    className="answer-space"
                    style={{ minHeight: `${Math.min(80, 24 + p.marks * 6)}mm` }}
                  />
                ) : (
                  <div className="ml-11 mt-3 space-y-3">
                    <div>
                      <p className="text-xs font-semibold">Model answer</p>
                      <MathText>{p.answer}</MathText>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Explanation</p>
                      <MathText>{p.explanation}</MathText>
                    </div>
                    <div>
                      <p className="text-xs font-semibold">
                        Alternative strategies
                      </p>
                      {p.strategies.length ? (
                        p.strategies.map((s, k) => (
                          <MathText key={k}>{s}</MathText>
                        ))
                      ) : (
                        <p className="text-xs">{p.noAlternativesReason}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold mb-1">Rubric</p>
                      {p.rubric.map((r, k) => (
                        <div
                          key={k}
                          className="flex gap-4 justify-between text-xs border-b py-2"
                        >
                          <span>{r.description}</span>
                          <span>{r.marks}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        ))}
        <footer className="text-xs border-t mt-8 pt-3 flex justify-between">
          <span>End of {mode === "memo" ? "memorandum" : "paper"}</span>
          <span>Total: {m.marks} marks</span>
        </footer>
      </main>
    </>
  );
}
