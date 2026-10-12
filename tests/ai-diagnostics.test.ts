import {afterEach, expect, it, vi} from 'vitest';
import {logAiFailure} from '../src/lib/ai-diagnostics';
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it('logs only selected diagnostic fields and redacts credentials', () => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('LLM_API_KEY', 'test-secret');
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  logAiFailure({
    statusCode: 400,
    responseBody: JSON.stringify({
      error: {
        code: 'invalid_request',
        message: 'Bad test-secret Bearer another-secret oc_sk_some_key',
      },
      prompt: 'PRIVATE PAPER',
    }),
    requestBodyValues: {prompt: 'PRIVATE PAPER'},
  });
  expect(log).toHaveBeenCalledWith('AI provider request failed:', {
    status: 400,
    code: 'invalid_request',
    type: undefined,
    message: 'Bad [redacted] Bearer [redacted] [redacted]',
  });
  expect(JSON.stringify(log.mock.calls)).not.toContain('PRIVATE PAPER');
});
it('does not log provider details in production', () => {
  vi.stubEnv('NODE_ENV', 'production');
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  logAiFailure({
    statusCode: 400,
    data: {error: {message: 'Bad request'}},
  });
  expect(log).not.toHaveBeenCalled();
});
