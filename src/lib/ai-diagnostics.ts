// Only log selected provider error fields; never dump the SDK error object.
export function logAiFailure(error: unknown) {
  if (process.env.NODE_ENV !== 'development' || !error || typeof error !== 'object') return;
  const failure = error as {
    statusCode?: unknown;
    data?: unknown;
    responseBody?: unknown;
    name?: unknown;
  };
  let data = failure.data;
  if (!data && typeof failure.responseBody === 'string') {
    try {
      data = JSON.parse(failure.responseBody);
    } catch {
      /* Omit non-JSON response bodies. */
    }
  }
  const detail = data && typeof data === 'object' ? (data as {error?: unknown}).error : undefined;
  const fields =
    detail && typeof detail === 'object'
      ? (detail as {message?: unknown; code?: unknown; type?: unknown})
      : {};
  const redact = (value: unknown) => {
    if (typeof value !== 'string') return undefined;
    let text = value;
    const secret = process.env.LLM_API_KEY;
    if (secret) text = text.split(secret).join('[redacted]');
    return text
      .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [redacted]')
      .replace(/\b(?:oc_sk_|sk-)[a-zA-Z0-9_-]+/g, '[redacted]')
      .replace(/[\r\n\t]+/g, ' ')
      .slice(0, 600);
  };
  console.error('AI provider request failed:', {
    status: typeof failure.statusCode === 'number' ? failure.statusCode : undefined,
    code: redact(fields.code),
    type: redact(fields.type),
    message: redact(typeof detail === 'string' ? detail : fields.message),
  });
}
