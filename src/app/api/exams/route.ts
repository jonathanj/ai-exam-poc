import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {apiUser, assertOrigin, apiError} from '@/lib/http';
import {briefSchema} from '@/lib/domain';
import {json} from '@/lib/exams';
export async function POST(request: NextRequest) {
  try {
    assertOrigin(request);
    const user = await apiUser();
    const brief = briefSchema.parse(await request.json());
    const exam = await db.exam.create({
      data: {ownerId: user.id, title: brief.title, brief: json(brief)},
    });
    return NextResponse.json({id: exam.id});
  } catch (e) {
    return apiError(e);
  }
}
