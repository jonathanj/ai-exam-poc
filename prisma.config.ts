import 'dotenv/config';
import {mkdirSync, closeSync, openSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {defineConfig} from 'prisma/config';
const databaseUrl = process.env.DATABASE_URL || 'file:./data/exam-studio.db';
if (databaseUrl.startsWith('file:')) {
  const file = resolve(databaseUrl.slice(5));
  mkdirSync(dirname(file), {recursive: true});
  closeSync(openSync(file, 'a'));
}
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {path: 'prisma/migrations'},
  datasource: {url: databaseUrl},
});
