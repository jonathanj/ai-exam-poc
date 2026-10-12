import 'dotenv/config';
import {db} from '../src/lib/db';
import {hashPassword} from '../src/lib/password';
import {z} from 'zod';
const email = z.email().parse(process.argv[2]).toLowerCase();
const name = z.string().min(1).parse(process.argv[3]);
const password = z
  .string()
  .min(12, 'Password must have at least 12 characters.')
  .max(256)
  .parse(process.env.ACCOUNT_PASSWORD);
await db.user.create({
  data: {email, name, passwordHash: hashPassword(password)},
});
console.log(`Created account for ${email}.`);
await db.$disconnect();
