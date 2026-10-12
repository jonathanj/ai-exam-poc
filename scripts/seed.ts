import 'dotenv/config';
import {db} from '../src/lib/db';
import {defaultBrief} from '../src/lib/domain';
import {fixturePaper} from '../src/lib/fixtures';
import {json, criteria} from '../src/lib/exams';
const user = await db.user.findUniqueOrThrow({
  where: {email: process.argv[2]?.toLowerCase()},
});
const brief = {
  ...defaultBrief,
  title: 'Sample · Fractions & percentages',
  examiner: user.name,
  school: 'Example Preparatory School',
};
const questions = fixturePaper(brief);
const exam = await db.exam.create({
  data: {
    ownerId: user.id,
    title: brief.title,
    brief: json(brief),
    sample: true,
    questions: {
      create: questions.map((content, position) => ({
        position,
        provenance: 'ai-generated',
        content: json(content),
        criteria: {create: criteria(content)},
        revisions: {
          create: {revision: 0, source: 'sample', content: json(content)},
        },
      })),
    },
  },
});
console.log(`Created explicitly labelled sample exam ${exam.id}.`);
await db.$disconnect();
