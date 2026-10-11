import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateText, Output } from "ai";
import { z } from "zod";
import { inferenceHeaders, liveAiConfig, liveModel } from "../src/lib/ai-model";

beforeEach(() => {
  vi.stubEnv("LLM_BASE_URL", "https://example.test/inference/openai/v1/");
  vi.stubEnv("LLM_API_KEY", "test-key");
  vi.stubEnv("LLM_MODEL", "gpt-6-luna");
  vi.stubEnv("LLM_API_PROTOCOL", "chat-completions");
  vi.stubEnv("LLM_STRUCTURED_OUTPUTS", "true");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("inference protocol transport", () => {
  it("keeps session IDs stable per exam and distinct between exams", () => {
    expect(inferenceHeaders("exam-a")).toEqual(inferenceHeaders("exam-a"));
    expect(inferenceHeaders("exam-a")["x-opencode-session"]).not.toBe(
      inferenceHeaders("exam-b")["x-opencode-session"],
    );
    expect(inferenceHeaders("exam-a")["x-opencode-session"]).not.toContain(
      "exam-a",
    );
    expect(() => inferenceHeaders("")).toThrow("require an exam session");
  });
  it.each(["responses", "chat/completions"])(
    "rejects operation suffix %s before a request",
    (suffix) => {
      vi.stubEnv("LLM_BASE_URL", `https://example.test/v1/${suffix}`);
      expect(liveAiConfig).toThrow("must exclude");
    },
  );
  it("rejects an unknown protocol", () => {
    vi.stubEnv("LLM_API_PROTOCOL", "response");
    expect(liveAiConfig).toThrow("LLM_API_PROTOCOL");
  });
  it.each(["chat-completions", "responses"])(
    "sends native schema output through %s",
    async (protocol) => {
      vi.stubEnv("LLM_API_PROTOCOL", protocol);
      const fetchMock = vi.fn(async () =>
        Response.json(
          protocol === "responses"
            ? {
                id: "resp_test",
                object: "response",
                created_at: 1,
                model: "gpt-6-luna",
                status: "completed",
                output: [
                  {
                    id: "msg_test",
                    type: "message",
                    role: "assistant",
                    status: "completed",
                    content: [
                      {
                        type: "output_text",
                        text: '{"value":3}',
                        annotations: [],
                      },
                    ],
                  },
                ],
                usage: { input_tokens: 1, output_tokens: 3, total_tokens: 4 },
              }
            : {
                id: "chat_test",
                object: "chat.completion",
                created: 1,
                model: "gpt-6-luna",
                choices: [
                  {
                    index: 0,
                    message: { role: "assistant", content: '{"value":3}' },
                    finish_reason: "stop",
                  },
                ],
                usage: {
                  prompt_tokens: 1,
                  completion_tokens: 3,
                  total_tokens: 4,
                },
              },
        ),
      );
      vi.stubGlobal("fetch", fetchMock);
      const result = await generateText({
        model: liveModel("test-exam"),
        prompt: "Return value 3",
        output: Output.object({ schema: z.object({ value: z.number() }) }),
        maxRetries: 0,
      });
      expect(result.output).toEqual({ value: 3 });
      const [url, options] = fetchMock.mock.calls[0] as unknown as [
        string,
        RequestInit,
      ];
      expect(url).toBe(
        `https://example.test/inference/openai/v1/${protocol === "responses" ? "responses" : "chat/completions"}`,
      );
      const body = JSON.parse(options.body as string);
      const headers = new Headers(options.headers);
      expect(headers.get("x-opencode-session")).toBe(
        inferenceHeaders("test-exam")["x-opencode-session"],
      );
      expect(headers.get("user-agent")).toContain("exam-studio/0.1.0");
      expect(body.model).toBe("gpt-6-luna");
      if (protocol === "responses") {
        expect(body.text.format.type).toBe("json_schema");
        expect(body.text.format.strict).toBe(true);
        expect(body.input).toBeDefined();
      } else {
        expect(body.response_format.type).toBe("json_schema");
        expect(body.messages).toBeDefined();
      }
    },
  );
});
