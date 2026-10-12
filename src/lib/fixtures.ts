import {targets, type Brief, type QuestionContent, type Part} from './domain';
export function fixturePaper(brief: Brief): QuestionContent[] {
  const ds = Object.entries(targets(brief.marks, brief.difficulty)).filter(([, n]) => n > 0);
  const cs = Object.entries(targets(brief.marks, brief.demand)).filter(([, n]) => n > 0);
  const atoms: {
    difficulty: Part['difficulty'];
    demand: Part['demand'];
    marks: number;
  }[] = [];
  let i = 0,
    j = 0;
  while (i < ds.length && j < cs.length) {
    const n = Math.min(ds[i][1], cs[j][1]);
    atoms.push({
      difficulty: ds[i][0] as Part['difficulty'],
      demand: cs[j][0] as Part['demand'],
      marks: n,
    });
    ds[i][1] -= n;
    cs[j][1] -= n;
    if (!ds[i][1]) i++;
    if (!cs[j][1]) j++;
  }
  while (atoms.length < brief.questionCount) {
    const index = atoms.findIndex((a) => a.marks > 1);
    const atom = atoms[index];
    atom.marks--;
    atoms.push({...atom, marks: 1});
  }
  const questions: QuestionContent[] = Array.from({length: brief.questionCount}, () => ({
    introduction: '',
    parts: [],
  }));
  atoms.forEach((a, k) => {
    const amount = 80 + k * 8;
    const answer = (amount * 3) / 8;
    questions[k % questions.length].parts.push({
      ...a,
      prompt: `A school has ${amount} learners. $\\frac{3}{8}$ of them join the mathematics club. How many learners join? Show your working.`,
      concept: brief.topics[k % brief.topics.length],
      computation: 'low',
      minutes: Math.max(1, a.marks * 1.5),
      answer: `${answer} learners`,
      explanation: `Divide ${amount} by 8, then multiply by 3: $${amount} \\div 8 \\times 3 = ${answer}$.`,
      strategies: [`Convert $\\frac{3}{8}$ to 0.375 and multiply ${amount} by 0.375.`],
      noAlternativesReason: '',
      rubric: [
        {
          description: `Correct fraction method and final answer of ${answer} learners. Fixture rubric: teacher review required.`,
          marks: a.marks,
        },
      ],
    });
  });
  return questions;
}
