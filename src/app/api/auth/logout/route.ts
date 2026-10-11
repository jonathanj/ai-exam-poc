import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE, tokenHash } from "@/lib/auth";
import { apiError, assertOrigin } from "@/lib/http";
export async function POST(request: NextRequest) {
  try {
    assertOrigin(request);
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token) await db.session.deleteMany({ where: { id: tokenHash(token) } });
    jar.delete(SESSION_COOKIE);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
