"use client";
import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  questionSchema,
  blankPart,
  type QuestionContent,
  type Part,
  demandLabels,
} from "@/lib/domain";
export function QuestionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: QuestionContent;
  onSave: (content: QuestionContent) => Promise<void>;
  onCancel: () => void;
}) {
  const [content, setContent] = useState<QuestionContent>(
    initial
      ? structuredClone(initial)
      : { introduction: "", parts: [blankPart()] },
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function update<K extends keyof Part>(index: number, key: K, value: Part[K]) {
    setContent((c) => ({
      ...c,
      parts: c.parts.map((p, i) => (i === index ? { ...p, [key]: value } : p)),
    }));
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      await onSave(
        questionSchema.parse({
          ...content,
          parts: content.parts.map((p) => ({
            ...p,
            strategies: p.strategies.map((s) => s.trim()).filter(Boolean),
          })),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="intro">Question introduction (optional)</Label>
        <Textarea
          id="intro"
          value={content.introduction}
          onChange={(e) =>
            setContent((c) => ({ ...c, introduction: e.target.value }))
          }
          placeholder="Shared context for this question and its subparts…"
        />
      </div>
      {content.parts.map((part, i) => (
        <section key={i} className="rounded-xl border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {content.parts.length === 1 ? "Question" : "Subpart " + (i + 1)}
            </h3>
            {content.parts.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove subpart ${i + 1}`}
                onClick={() =>
                  setContent((c) => ({
                    ...c,
                    parts: c.parts.filter((_, j) => j !== i),
                  }))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor={`prompt-${i}`}>Question text</Label>
            <Textarea
              id={`prompt-${i}`}
              value={part.prompt}
              onChange={(e) => update(i, "prompt", e.target.value)}
              placeholder="Use $…$ for inline maths and $$…$$ for display equations."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`concept-${i}`}>Concept being assessed</Label>
            <Input
              id={`concept-${i}`}
              value={part.concept}
              onChange={(e) => update(i, "concept", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                {
                  key: "difficulty",
                  label: "Estimated difficulty",
                  options: {
                    easy: "Easy",
                    medium: "Medium",
                    difficult: "Difficult",
                  },
                },
                {
                  key: "computation",
                  label: "Computational complexity",
                  options: { low: "Low", moderate: "Moderate", high: "High" },
                },
                {
                  key: "demand",
                  label: "Cognitive demand",
                  options: demandLabels,
                },
              ] as const
            ).map((f) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={`${f.key}-${i}`} className="text-xs">
                  {f.label}
                </Label>
                <select
                  id={`${f.key}-${i}`}
                  className="w-full text-sm h-10 border rounded-md px-2 bg-card"
                  value={part[f.key]}
                  onChange={(e) => update(i, f.key, e.target.value as never)}
                >
                  {Object.entries(f.options).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor={`marks-${i}`} className="text-xs">
                  Marks
                </Label>
                <Input
                  id={`marks-${i}`}
                  type="number"
                  min="1"
                  value={part.marks}
                  onChange={(e) => update(i, "marks", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`minutes-${i}`} className="text-xs">
                  Minutes
                </Label>
                <Input
                  id={`minutes-${i}`}
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={part.minutes}
                  onChange={(e) => update(i, "minutes", Number(e.target.value))}
                />
              </div>
            </div>
          </div>
          {(
            [
              { key: "answer", label: "Model answer" },
              { key: "explanation", label: "Solution explanation" },
            ] as const
          ).map((f) => (
            <div className="space-y-2" key={f.key}>
              <Label htmlFor={`${f.key}-${i}`}>{f.label}</Label>
              <Textarea
                id={`${f.key}-${i}`}
                value={part[f.key]}
                onChange={(e) => update(i, f.key, e.target.value)}
              />
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor={`strategies-${i}`}>
              Alternative strategies (one per line, up to two)
            </Label>
            <Textarea
              id={`strategies-${i}`}
              value={part.strategies.join("\n")}
              onChange={(e) =>
                update(i, "strategies", e.target.value.split("\n"))
              }
            />
          </div>
          {!part.strategies.some((s) => s.trim()) && (
            <div className="space-y-2">
              <Label htmlFor={`reason-${i}`}>
                Why are no alternative strategies applicable?
              </Label>
              <Input
                id={`reason-${i}`}
                value={part.noAlternativesReason}
                onChange={(e) =>
                  update(i, "noAlternativesReason", e.target.value)
                }
              />
            </div>
          )}
          <div className="space-y-3">
            <Label>
              Marking rubric · {part.rubric.reduce((s, r) => s + r.marks, 0)} /{" "}
              {part.marks} marks
            </Label>
            {part.rubric.map((r, j) => (
              <div className="flex gap-2" key={j}>
                <Input
                  aria-label={`Part ${i + 1} criterion ${j + 1}`}
                  placeholder="What earns these marks?"
                  value={r.description}
                  onChange={(e) =>
                    update(
                      i,
                      "rubric",
                      part.rubric.map((c, k) =>
                        k === j ? { ...c, description: e.target.value } : c,
                      ),
                    )
                  }
                />
                <Input
                  aria-label={`Part ${i + 1} criterion ${j + 1} marks`}
                  className="w-20"
                  type="number"
                  min="1"
                  value={r.marks}
                  onChange={(e) =>
                    update(
                      i,
                      "rubric",
                      part.rubric.map((c, k) =>
                        k === j ? { ...c, marks: Number(e.target.value) } : c,
                      ),
                    )
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove criterion"
                  disabled={part.rubric.length === 1}
                  onClick={() =>
                    update(
                      i,
                      "rubric",
                      part.rubric.filter((_, k) => k !== j),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                update(i, "rubric", [
                  ...part.rubric,
                  { description: "", marks: 1 },
                ])
              }
            >
              <Plus className="size-3" />
              Add criterion
            </Button>
          </div>
        </section>
      ))}
      <Button
        variant="outline"
        onClick={() =>
          setContent((c) => ({ ...c, parts: [...c.parts, blankPart()] }))
        }
        disabled={content.parts.length >= 12}
      >
        <Plus className="size-4" />
        Add subpart
      </Button>
      {error && (
        <p
          role="alert"
          className="text-sm text-destructive whitespace-pre-wrap"
        >
          {error}
        </p>
      )}
      <div className="sticky bottom-0 bg-card border-t pt-4 pb-2 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button onClick={save} disabled={busy}>
          <Save className="size-4" />
          {busy ? "Saving…" : "Save question"}
        </Button>
      </div>
    </div>
  );
}
