import 'dotenv/config';
import {db} from '../src/lib/db';
const user = await db.user.findUniqueOrThrow({
  where: {email: process.argv[2]?.toLowerCase()},
});
const result = await db.session.deleteMany({where: {userId: user.id}});
console.log(`Revoked ${result.count} sessions.`);
await db.$disconnect();
