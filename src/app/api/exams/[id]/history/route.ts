import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiUser, apiError } from "@/lib/http";
import { ownedExam } from "@/lib/exams";
export async function GET(
  _: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const user = await apiUser();
    const { id } = await ctx.params;
    await ownedExam(id, user.id);
    const runs = await db.aiRun.findMany({
      where: { examId: id },
      orderBy: { startedAt: "desc" },
      take: 40,
    });
    return NextResponse.json(runs);
  } catch (e) {
    return apiError(e);
  }
}
