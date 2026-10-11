import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { z } from "zod";
const mock = vi.hoisted(() => ({ generate: vi.fn(), stream: vi.fn() }));
vi.mock("ai", () => ({
  generateText: mock.generate,
  streamText: mock.stream,
  Output: { object: vi.fn() },
}));
vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: () => () => ({}),
}));
vi.mock("../src/lib/db", () => ({ db: {} }));
import {
  checkAi,
  validatedGeneration,
  conversation,
} from "../src/lib/ai-service";
const schema = z.object({ value: z.number().int().positive() });
const args = {
  examId: "test-exam",
  task: "test",
  context: {},
  schema,
  fixture: () => ({ value: 1 }),
};
beforeEach(() => {
  vi.stubEnv("AI_ADAPTER", "live");
  vi.stubEnv("LLM_BASE_URL", "https://example.test/v1");
  vi.stubEnv("LLM_API_KEY", "fixture-test-key");
  vi.stubEnv("LLM_MODEL", "test");
  vi.stubEnv("LLM_STRUCTURED_OUTPUTS", "false");
  vi.stubEnv("LLM_API_PROTOCOL", "chat-completions");
  mock.generate.mockReset();
});
afterEach(() => vi.unstubAllEnvs());
describe("AI boundaries", () => {
  it("validates native structured output", async () => {
    vi.stubEnv("LLM_STRUCTURED_OUTPUTS", "true");
    mock.generate.mockResolvedValue({
      output: { value: 3 },
      totalUsage: { outputTokens: 2 },
    });
    expect((await validatedGeneration(args)).value.value).toBe(3);
  });
  it("repairs native structured-output validation failures", async () => {
    vi.stubEnv("LLM_STRUCTURED_OUTPUTS", "true");
    const error = new Error("Invalid structured result");
    error.name = "AI_NoObjectGeneratedError";
    mock.generate
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ output: { value: 2 } });
    expect((await validatedGeneration(args)).value.value).toBe(2);
    expect(mock.generate).toHaveBeenCalledTimes(2);
  });
  it("fails clearly when live configuration is missing", () => {
    vi.stubEnv("LLM_API_KEY", "");
    expect(checkAi).toThrow("not configured");
  });
  it("runs fixtures only when explicitly configured", async () => {
    vi.stubEnv("AI_ADAPTER", "fixture");
    vi.stubEnv("LLM_API_KEY", "");
    expect((await validatedGeneration(args)).value).toEqual({ value: 1 });
    expect(mock.generate).not.toHaveBeenCalled();
  });
  it("repairs invalid JSON once and records validation errors", async () => {
    mock.generate
      .mockResolvedValueOnce({ text: "bad json" })
      .mockResolvedValueOnce({
        text: '{"value":2}',
        totalUsage: { outputTokens: 5 },
      });
    const result = await validatedGeneration(args);
    expect(result.value.value).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(mock.generate).toHaveBeenCalledTimes(2);
  });
  it("repairs domain constraints, not merely JSON shape", async () => {
    mock.generate
      .mockResolvedValueOnce({ text: '{"value":1}' })
      .mockResolvedValueOnce({ text: '{"value":2}' });
    const result = await validatedGeneration({
      ...args,
      validate: (v) => {
        if (v.value !== 2) throw new Error("Expected 2");
        return v;
      },
    });
    expect(result.value.value).toBe(2);
  });
  it("stops after one repair", async () => {
    mock.generate.mockResolvedValue({ text: '{"value":-1}' });
    await expect(validatedGeneration(args)).rejects.toThrow(
      "one repair attempt",
    );
    expect(mock.generate).toHaveBeenCalledTimes(2);
  });
  it("does not retry endpoint failures or substitute fixtures", async () => {
    mock.generate.mockRejectedValue(new Error("Network failed"));
    await expect(validatedGeneration(args)).rejects.toThrow(
      "endpoint request failed",
    );
    expect(mock.generate).toHaveBeenCalledTimes(1);
  });
  it("honours aborted fixture conversations", async () => {
    vi.stubEnv("AI_ADAPTER", "fixture");
    const abort = new AbortController();
    const iterator = conversation({}, [], abort.signal, "test-exam");
    expect((await iterator.next()).done).toBe(false);
    abort.abort();
    await expect(iterator.next()).rejects.toThrow("Interrupted");
  });
});
