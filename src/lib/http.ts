import type {NextRequest} from 'next/server';
import {NextResponse} from 'next/server';
import {ZodError} from 'zod';
import {currentUser} from './auth';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function apiUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, 'Please sign in.');
  return user;
}
export function assertOrigin(request: NextRequest) {
  const origin = request.headers.get('origin');
  const expected = new URL(process.env.APP_URL || request.url).origin;
  if (!origin || origin !== expected)
    throw new HttpError(403, 'This action must originate from the application.');
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json({error: error.message}, {status: error.status});
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      },
      {status: 400},
    );
  console.error('Server operation failed:', error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json(
    {
      error: 'The operation failed. Please retry. Your saved work has been preserved.',
    },
    {status: 500},
  );
}
