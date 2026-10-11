"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock3, AlertCircle, Layers3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  type ExamView,
  metrics,
  targets,
  difficultyLabels,
  demandLabels,
  partNumber,
} from "@/lib/domain";
export function Overview({ exam }: { exam: ExamView }) {
  const m = metrics(exam.questions);
  const progression = exam.questions.flatMap((q, i) =>
    q.content.parts.map((p, j) => ({
      name: partNumber(i, j, q.content.parts.length),
      difficulty: { easy: 1, medium: 2, difficult: 3 }[p.difficulty],
      label: difficultyLabels[p.difficulty],
      marks: p.marks,
      concept: p.concept,
    })),
  );
  const drift = (["difficulty", "demand"] as const).some((f) =>
    Object.entries(targets(exam.brief.marks, exam.brief[f])).some(
      ([k, n]) => (m[f][k] || 0) !== n,
    ),
  );
  return (
    <div className="space-y-4">
      <Card className="p-5 gap-4 shadow-none">
        <div className="flex justify-between">
          <h2 className="font-semibold text-sm">Paper overview</h2>
          <Layers3 className="size-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-2xl font-semibold">
              {m.marks}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                / {exam.brief.marks}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Total marks</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">
              {exam.questions.length}
              <span className="text-xs font-normal text-muted-foreground">
                {" "}
                / {exam.brief.questionCount}
              </span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Questions</p>
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-xs flex gap-2 items-center">
          <Clock3 className="size-4 text-muted-foreground" />
          <span>
            <b>{m.minutes} min</b> estimated / {exam.brief.duration} min
            available
          </span>
        </div>
        {(drift ||
          m.minutes > exam.brief.duration ||
          exam.questions.length !== exam.brief.questionCount) && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>
              {drift ? "Paper balance differs from the brief. " : ""}
              {m.minutes > exam.brief.duration
                ? "Estimated time exceeds the duration. "
                : ""}
              {exam.questions.length !== exam.brief.questionCount
                ? "Question count differs from the brief."
                : ""}{" "}
              Teacher edits are preserved.
            </span>
          </div>
        )}
      </Card>
      <Card className="p-5 gap-3 shadow-none">
        <h3 className="text-sm font-semibold">Difficulty progression</h3>
        <p className="text-xs text-muted-foreground">
          Estimated challenge in question order
        </p>
        <div
          role="img"
          aria-label={`Difficulty progression: ${progression.map((p) => `Question ${p.name}: ${p.label}, ${p.marks} marks`).join("; ")}`}
          className="h-40"
        >
          {progression.length ? (
            <ResponsiveContainer
              width="100%"
              height="100%"
              initialDimension={{ width: 280, height: 160 }}
            >
              <LineChart
                data={progression}
                margin={{ top: 10, right: 8, left: -25, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="#e2e7ea" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[1, 3]}
                  ticks={[1, 2, 3]}
                  tick={{ fontSize: 9 }}
                  tickFormatter={(v) =>
                    ({ 1: "Easy", 2: "Med", 3: "Hard" })[v as 1 | 2 | 3]
                  }
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(_, __, item) => [
                    `${item.payload.label} · ${item.payload.marks} marks`,
                    item.payload.concept,
                  ]}
                  labelFormatter={(v) => `Question ${v}`}
                />
                <Line
                  type="linear"
                  isAnimationActive={false}
                  dataKey="difficulty"
                  stroke="#244f47"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#244f47" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground pt-10 text-center">
              Add questions to see the progression.
            </p>
          )}
        </div>
      </Card>
      {(["difficulty", "demand"] as const).map((field) => (
        <Card className="p-5 gap-3 shadow-none" key={field}>
          <h3 className="text-sm font-semibold">
            {field === "difficulty"
              ? "Estimated difficulty"
              : "Cognitive demand"}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Actual / target marks · independent dimensions
          </p>
          {Object.entries(targets(exam.brief.marks, exam.brief[field])).map(
            ([key, target]) => (
              <div key={key}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span>
                    {
                      (field === "difficulty"
                        ? difficultyLabels
                        : demandLabels)[key]
                    }
                  </span>
                  <span className="text-muted-foreground">
                    {m[field][key] || 0} / {target}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{
                      width: `${Math.min(100, ((m[field][key] || 0) / Math.max(1, exam.brief.marks)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ),
          )}
        </Card>
      ))}
      <Card className="p-5 gap-3 shadow-none">
        <h3 className="font-semibold text-sm">Computational complexity</h3>
        {["low", "moderate", "high"].map((k) => (
          <div className="flex justify-between text-xs" key={k}>
            <span className="capitalize">{k}</span>
            <span className="text-muted-foreground">
              {m.computation[k] || 0} marks
            </span>
          </div>
        ))}
      </Card>
      <Card className="p-5 gap-3 shadow-none">
        <h3 className="font-semibold text-sm">Concept coverage</h3>
        {Object.entries(m.topics).map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs gap-2">
            <span>{k}</span>
            <span className="text-muted-foreground whitespace-nowrap">
              {v} marks
            </span>
          </div>
        ))}
        {!Object.keys(m.topics).length && (
          <p className="text-xs text-muted-foreground">
            No assessable concepts yet.
          </p>
        )}
      </Card>
      <Card className="p-5 gap-3 shadow-none">
        <h3 className="font-semibold text-sm">Paper details</h3>
        {[
          ["School", exam.brief.school || "—"],
          ["Examiner", exam.brief.examiner || "—"],
          ["Date", exam.brief.date || "—"],
          ["Body", exam.brief.body],
          ["Subject", "Grade 7 Mathematics"],
          [
            "Calculator",
            exam.brief.calculator === "allowed" ? "Allowed" : "Not allowed",
          ],
        ].map(([k, v]) => (
          <div key={k} className="text-xs">
            <p className="text-muted-foreground">{k}</p>
            <p className="mt-0.5">{v}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
