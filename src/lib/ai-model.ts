import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { HttpError } from "./http";

export function liveAiConfig() {
  const {
    LLM_BASE_URL: baseURL,
    LLM_API_KEY: apiKey,
    LLM_MODEL: modelId,
  } = process.env;
  if (!baseURL || !apiKey || !modelId)
    throw new HttpError(
      503,
      "Live AI is not configured. Set LLM_BASE_URL, LLM_API_KEY and LLM_MODEL on the server, or explicitly enable AI_ADAPTER=fixture for sample data.",
    );
  const protocol = process.env.LLM_API_PROTOCOL || "chat-completions";
  if (protocol !== "chat-completions" && protocol !== "responses")
    throw new HttpError(
      503,
      "LLM_API_PROTOCOL must be chat-completions or responses.",
    );
  let url: URL;
  try {
    url = new URL(baseURL);
  } catch {
    throw new HttpError(
      503,
      "LLM_BASE_URL must be an absolute HTTP or HTTPS base URL.",
    );
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new HttpError(
      503,
      "LLM_BASE_URL must be an HTTP or HTTPS base URL without credentials, query parameters or fragments.",
    );
  if (/\/(responses|chat\/completions)\/?$/.test(url.pathname))
    throw new HttpError(
      503,
      "LLM_BASE_URL must exclude /responses or /chat/completions. For OpenCode Console use https://opencode.ai/inference/openai/v1.",
    );
  return { baseURL: baseURL.replace(/\/+$/, ""), apiKey, modelId, protocol };
}

export function liveModel() {
  const { baseURL, apiKey, modelId, protocol } = liveAiConfig();
  if (protocol === "responses") return createOpenAI({ baseURL, apiKey }).responses(modelId);
  return createOpenAICompatible({ name: "exam-endpoint", baseURL, apiKey, supportsStructuredOutputs: process.env.LLM_STRUCTURED_OUTPUTS === "true" })(modelId);
}
