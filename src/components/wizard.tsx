"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowLeft, ArrowRight, Sparkles, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Brief,
  defaultBrief,
  briefSchema,
  targets,
  demandLabels,
  difficultyLabels,
  ExamView,
} from "@/lib/domain";
import { request } from "@/lib/client";
export function Wizard({
  examiner,
  initial,
}: {
  examiner: string;
  initial?: ExamView;
}) {
  const router = useRouter();
  const [brief, setBrief] = useState<Brief>(
    initial?.brief || { ...defaultBrief, examiner },
  );
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<{ id: string; revision: number } | null>(
    initial ? { id: initial.id, revision: initial.revision } : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const update = <K extends keyof Brief>(key: K, value: Brief[K]) =>
    setBrief((b) => ({ ...b, [key]: value }));
  async function save(next?: number) {
    setBusy(true);
    setError("");
    try {
      const parsed = briefSchema.parse(brief);
      let savedId = saved?.id;
      if (saved) {
        const e = await request<ExamView>(`/api/exams/${saved.id}`, {
          action: "brief",
          revision: saved.revision,
          payload: parsed,
        });
        setSaved({ id: e.id, revision: e.revision });
      } else {
        const e = await request<{ id: string }>("/api/exams", parsed);
        setSaved({ id: e.id, revision: 0 });
        savedId = e.id;
      }
      setNotice("Draft saved");
      if (next !== undefined) setStep(next);
      return savedId || null;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const fields = (
    items: { key: keyof Brief; label: string; type?: string }[],
  ) =>
    items.map(({ key, label, type }) => (
      <div key={key} className="space-y-2">
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          value={String(brief[key])}
          type={type || "text"}
          onChange={(e) =>
            update(
              key,
              (type === "number"
                ? Number(e.target.value)
                : e.target.value) as never,
            )
          }
        />
      </div>
    ));
  const names = [
    "Paper details",
    "Teaching brief",
    "Paper blueprint",
    "Review & create",
  ];
  return (
    <div className="max-w-5xl mx-auto">
      <p className="eyebrow text-primary mb-3">BUILD A THOUGHTFUL PAPER</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        {initial ? "Edit paper brief" : "Create an exam"}
      </h1>
      <p className="text-muted-foreground mt-2">
        Start with your intent. Give the AI a clear brief.
      </p>
      <ol className="grid grid-cols-4 gap-3 mt-8 mb-8">
        {names.map((name, i) => (
          <li
            key={name}
            className={`border-t-2 pt-3 ${i <= step ? "border-primary" : "border-border"}`}
          >
            <span
              className={`inline-flex size-6 rounded-full justify-center items-center text-xs mr-2 ${i <= step ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
            >
              {i < step ? <Check className="size-3" /> : i + 1}
            </span>
            <span
              className={`text-xs sm:text-sm ${i === step ? "font-semibold" : "text-muted-foreground"}`}
            >
              {name}
            </span>
          </li>
        ))}
      </ol>
      <Card className="p-6 md:p-8 shadow-none">
        <div>
          <h2 className="text-xl font-semibold">{names[step]}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {
              [
                "The essentials that identify your paper.",
                "Ground questions in what your learners have studied.",
                "Difficulty and cognitive demand are separate, mark-weighted targets.",
                "Check the brief before generating. You can refine everything afterward.",
              ][step]
            }
          </p>
        </div>
        {step === 0 && (
          <div className="grid sm:grid-cols-2 gap-5">
            {fields([
              { key: "title", label: "Exam title" },
              { key: "school", label: "School" },
              { key: "examiner", label: "Examiner" },
              { key: "date", label: "Exam date", type: "date" },
              { key: "body", label: "Examining body (e.g. IEB, GEC)" },
            ])}
            <div className="space-y-2">
              <Label>Grade and subject</Label>
              <div className="rounded-md border bg-muted/40 p-2.5 text-sm">
                Grade 7 · Mathematics
              </div>
            </div>
            <p className="col-span-full text-xs text-muted-foreground">
              Body labels inform the brief; they do not certify official
              compliance.
            </p>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="topics">Topics (comma separated)</Label>
              <Input
                id="topics"
                value={brief.topics.join(", ")}
                onChange={(e) =>
                  update(
                    "topics",
                    e.target.value.split(",").map((t) => t.trim()),
                  )
                }
              />
            </div>
            {(
              [
                {
                  key: "guidance",
                  label: "Curriculum and assessment guidance",
                  placeholder:
                    "Describe scope, taught methods, exclusions, and expectations.",
                },
                {
                  key: "prerequisites",
                  label: "Prerequisite knowledge",
                  placeholder: "What can learners already do?",
                },
                {
                  key: "instructions",
                  label: "Paper instructions",
                  placeholder: "Instructions printed on the learner paper.",
                },
              ] as const
            ).map((f) => (
              <div className="space-y-2" key={f.key}>
                <Label htmlFor={f.key}>{f.label}</Label>
                <Textarea
                  id={f.key}
                  value={brief[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="calculator">Calculator policy</Label>
              <select
                id="calculator"
                className="border rounded-md h-10 px-3 text-sm w-full bg-card"
                value={brief.calculator}
                onChange={(e) =>
                  update("calculator", e.target.value as Brief["calculator"])
                }
              >
                <option value="not-allowed">Calculators not allowed</option>
                <option value="allowed">Calculators allowed</option>
              </select>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-7">
            <div className="grid sm:grid-cols-3 gap-4">
              {fields([
                { key: "marks", label: "Total marks", type: "number" },
                {
                  key: "duration",
                  label: "Duration (minutes)",
                  type: "number",
                },
                { key: "questionCount", label: "Questions", type: "number" },
              ])}
            </div>
            {(["difficulty", "demand"] as const).map((field) => (
              <section key={field}>
                <h3 className="font-medium text-sm mb-1">
                  {field === "difficulty"
                    ? "Estimated difficulty"
                    : "Cognitive demand"}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {field === "demand"
                    ? "Editable POC preset; not an official examining-body prescription."
                    : "Estimated challenge for an appropriately prepared Grade 7 learner."}
                </p>
                <div className="grid sm:grid-cols-4 gap-3">
                  {Object.entries(brief[field]).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-muted/40 border rounded-lg p-3 space-y-2"
                    >
                      <Label htmlFor={`${field}-${key}`} className="text-xs">
                        {
                          (field === "demand"
                            ? demandLabels
                            : difficultyLabels)[key]
                        }
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id={`${field}-${key}`}
                          type="number"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) =>
                            update(field, {
                              ...brief[field],
                              [key]: Number(e.target.value),
                            })
                          }
                        />
                        <span className="text-muted-foreground text-xs">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {targets(brief.marks, brief[field])[key]} marks
                      </p>
                    </div>
                  ))}
                </div>
                <p
                  className={`text-xs mt-3 ${Object.values(brief[field]).reduce((s, n) => s + n, 0) !== 100 ? "text-destructive" : "text-muted-foreground"}`}
                >
                  Total:{" "}
                  {Object.values(brief[field]).reduce((s, n) => s + n, 0)}% ·
                  Integer marks allocated by largest remainder.
                </p>
              </section>
            ))}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {[
                ["Title", brief.title],
                ["Grade / subject", "Grade 7 Mathematics"],
                ["Examining body", brief.body],
                ["School", brief.school || "—"],
                ["Examiner", brief.examiner],
                [
                  "Blueprint",
                  `${brief.marks} marks · ${brief.duration} min · ${brief.questionCount} questions`,
                ],
                ["Topics", brief.topics.join(", ")],
                [
                  "Calculator",
                  brief.calculator === "allowed" ? "Allowed" : "Not allowed",
                ],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-muted-foreground mb-1">{k}</p>
                  <p>{v}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-secondary p-4 text-sm text-primary">
              Generated questions are drafts. Review answers, rubrics, and
              curriculum alignment before approving the paper.
            </div>
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="text-sm text-destructive whitespace-pre-wrap"
          >
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3 items-center justify-between border-t pt-5">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={busy || step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => save()}>
              <Save className="size-4" />
              Save draft
            </Button>
          </div>
          <span aria-live="polite" className="text-xs text-muted-foreground">
            {busy ? (step === 3 ? "Saving / generating…" : "Saving…") : notice}
          </span>
          {step === 3 && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                const id = await save();
                if (id) {
                  router.push(`/exams/${id}`);
                  router.refresh();
                }
              }}
            >
              Open draft without AI
            </Button>
          )}
          {step < 3 ? (
            <Button disabled={busy} onClick={() => save(step + 1)}>
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              disabled={busy}
              onClick={async () => {
                const id = await save();
                if (id) {
                  setBusy(true);
                  setError("");
                  try {
                    const current = await request<ExamView>(`/api/exams/${id}`);
                    await request<ExamView>(`/api/exams/${id}/generate`, {
                      revision: current.revision,
                    });
                    router.push(`/exams/${id}`);
                    router.refresh();
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }
              }}
            >
              <Sparkles className="size-4" />
              {busy ? "Generating…" : "Generate paper"}
            </Button>
          )}
        </div>
      </Card>
      <p className="text-xs text-muted-foreground mt-4">
        Drafts persist when you save or continue. Reopen an unfinished draft
        from My exams.
      </p>
    </div>
  );
}
