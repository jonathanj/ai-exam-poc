import {z} from 'zod';
export const difficulties = ['easy', 'medium', 'difficult'] as const;
export const demands = ['knowledge', 'routine', 'complex', 'problemSolving'] as const;
export const demandLabels: Record<string, string> = {
  knowledge: 'Knowledge',
  routine: 'Routine procedures',
  complex: 'Complex procedures',
  problemSolving: 'Problem-solving',
};
export const difficultyLabels: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  difficult: 'Difficult',
};
const text = z.string().trim().min(1).max(15000);
const split = (keys: readonly string[]) =>
  z
    .record(z.enum(keys as [string, ...string[]]), z.number().min(0).max(100))
    .refine(
      (v) => Math.abs(Object.values(v).reduce((a, b) => a + b, 0) - 100) < 0.001,
      'Percentages must total 100%.',
    );
export const briefSchema = z
  .object({
    title: text.max(200),
    school: z.string().max(200),
    examiner: z.string().max(200),
    date: z.string().max(40),
    grade: z.literal(7),
    subject: z.literal('Mathematics'),
    body: text.max(100),
    topics: z.array(text.max(200)).min(1).max(30),
    guidance: z.string().max(15000),
    prerequisites: z.string().max(5000),
    calculator: z.enum(['allowed', 'not-allowed']),
    instructions: z.string().max(5000),
    marks: z.number().int().min(4).max(200),
    duration: z.number().int().min(10).max(240),
    questionCount: z.number().int().min(1).max(30),
    difficulty: split(difficulties),
    demand: split(demands),
  })
  .refine((v) => v.questionCount <= v.marks, 'Each question needs at least one mark.');
export type Brief = z.infer<typeof briefSchema>;
export const defaultBrief: Brief = {
  title: 'Grade 7 Mathematics assessment',
  school: '',
  examiner: '',
  date: '',
  grade: 7,
  subject: 'Mathematics',
  body: 'IEB',
  topics: ['Fractions', 'Percentages', 'Proportional reasoning'],
  guidance: '',
  prerequisites: '',
  calculator: 'not-allowed',
  instructions: 'Show all your working. Write your answers clearly. Answer every question.',
  marks: 40,
  duration: 60,
  questionCount: 8,
  difficulty: {easy: 20, medium: 50, difficult: 30},
  demand: {knowledge: 25, routine: 45, complex: 20, problemSolving: 10},
};
export const criterionSchema = z.object({
  description: text.max(2000),
  marks: z.number().int().positive().max(200),
});
export const partSchema = z
  .object({
    prompt: text,
    concept: text.max(200),
    difficulty: z.enum(difficulties),
    computation: z.enum(['low', 'moderate', 'high']),
    demand: z.enum(demands),
    marks: z.number().int().positive().max(200),
    minutes: z.number().min(0.5).max(240),
    answer: text,
    explanation: text,
    strategies: z.array(text).max(2),
    noAlternativesReason: z.string().max(2000),
    rubric: z.array(criterionSchema).min(1).max(30),
  })
  .superRefine((v, ctx) => {
    if (v.rubric.reduce((s, c) => s + c.marks, 0) !== v.marks)
      ctx.addIssue({
        code: 'custom',
        path: ['rubric'],
        message: 'Rubric marks must equal the part marks.',
      });
    if (!v.strategies.length && !v.noAlternativesReason.trim())
      ctx.addIssue({
        code: 'custom',
        path: ['noAlternativesReason'],
        message: 'Explain why no alternative strategy is applicable.',
      });
  });
export const questionSchema = z.object({
  introduction: z.string().max(15000),
  parts: z.array(partSchema).min(1).max(12),
});
export type Part = z.infer<typeof partSchema>;
export type QuestionContent = z.infer<typeof questionSchema>;
export type StoredQuestion = {
  id: string;
  position: number;
  revision: number;
  provenance: string;
  content: QuestionContent;
};
export type ExamView = {
  id: string;
  title: string;
  status: string;
  archived: boolean;
  sample: boolean;
  revision: number;
  brief: Brief;
  questions: StoredQuestion[];
  updatedAt: string;
};
export const blankPart = (): Part => ({
  prompt: '',
  concept: '',
  difficulty: 'medium',
  computation: 'low',
  demand: 'routine',
  marks: 1,
  minutes: 2,
  answer: '',
  explanation: '',
  strategies: [],
  noAlternativesReason: 'No distinct alternative strategy is required for this direct calculation.',
  rubric: [{description: 'Correct answer', marks: 1}],
});
export function targets(
  total: number,
  percentages: Record<string, number>,
): Record<string, number> {
  const rows = Object.entries(percentages).map(([key, value], i) => ({
    key,
    value: (total * value) / 100,
    i,
  }));
  const result = Object.fromEntries(rows.map((r) => [r.key, Math.floor(r.value)]));
  const left = total - Object.values(result).reduce((s, n) => s + n, 0);
  rows
    .sort((a, b) => b.value - Math.floor(b.value) - (a.value - Math.floor(a.value)) || a.i - b.i)
    .slice(0, left)
    .forEach((r) => result[r.key]++);
  return result;
}
export function metrics(questions: {content: QuestionContent}[]) {
  const parts = questions.flatMap((q) => q.content.parts);
  const group = (field: 'difficulty' | 'demand' | 'computation' | 'concept') =>
    parts.reduce<Record<string, number>>((a, p) => {
      a[p[field]] = (a[p[field]] || 0) + p.marks;
      return a;
    }, {});
  return {
    marks: parts.reduce((s, p) => s + p.marks, 0),
    minutes: parts.reduce((s, p) => s + p.minutes, 0),
    difficulty: group('difficulty'),
    demand: group('demand'),
    computation: group('computation'),
    topics: group('concept'),
  };
}
export function validatePaper(brief: Brief, questions: QuestionContent[]) {
  const parsed = z.array(questionSchema).length(brief.questionCount).parse(questions);
  const m = metrics(parsed.map((content) => ({content})));
  if (m.marks !== brief.marks)
    throw new Error(`Paper has ${m.marks} marks; expected ${brief.marks}.`);
  for (const field of ['difficulty', 'demand'] as const) {
    for (const [key, value] of Object.entries(targets(brief.marks, brief[field])))
      if ((m[field][key] || 0) !== value)
        throw new Error(`${field} ${key}: expected ${value} marks, got ${m[field][key] || 0}.`);
  }
  return parsed;
}
export function partNumber(questionIndex: number, partIndex: number, count: number) {
  return count === 1 ? `${questionIndex + 1}` : `${questionIndex + 1}.${partIndex + 1}`;
}
