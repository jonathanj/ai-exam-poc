import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";
import { apiError, assertOrigin, HttpError } from "@/lib/http";
const attempts = new Map<string, { count: number; until: number }>();
const dummyHash = hashPassword("not-an-account-password");
export async function POST(request: NextRequest) {
  try {
    assertOrigin(request);
    const { email, password } = z
      .object({
        email: z.email().max(254),
        password: z.string().min(1).max(256),
      })
      .parse(await request.json());
    const key = email.toLowerCase();
    const entry = attempts.get(key);
    if (entry && entry.until > Date.now() && entry.count >= 10)
      throw new HttpError(429, "Too many attempts. Try again in 15 minutes.");
    const user = await db.user.findUnique({ where: { email: key } });
    const valid = verifyPassword(password, user?.passwordHash || dummyHash);
    if (!user || !valid) {
      if (attempts.size > 10000) attempts.clear();
      attempts.set(key, {
        count: entry && entry.until > Date.now() ? entry.count + 1 : 1,
        until: Date.now() + 15 * 60000,
      });
      throw new HttpError(401, "Email or password is incorrect.");
    }
    attempts.delete(key);
    await createSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
