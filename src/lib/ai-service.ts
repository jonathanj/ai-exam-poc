import { generateText, streamText, Output, type ModelMessage } from "ai";
import { liveAiConfig, liveModel } from "./ai-model";
import { logAiFailure } from "./ai-diagnostics";
import { z } from "zod";
import { HttpError } from "./http";
import { db } from "./db";
import { json } from "./exams";
import * as prompts from "./prompts/v1";
export const fixtureMode = () => process.env.AI_ADAPTER === "fixture";
export function checkAi() {
  if (!fixtureMode()) liveAiConfig();
}
export async function startRun(
  examId: string,
  operation: string,
  inputRevision: number,
  questionId?: string,
) {
  checkAi();
  const snapshot = await db.exam.findUnique({
    where: { id: examId },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: { revisions: true, messages: true },
      },
    },
  });
  return db.aiRun.create({
    data: {
      examId,
      operation,
      inputRevision,
      questionId,
      inputSnapshot: json(snapshot),
      model: fixtureMode() ? "deterministic-fixture" : process.env.LLM_MODEL!,
      promptVersion: prompts.VERSION,
    },
  });
}
export async function finishRun(
  id: string,
  outcome: string,
  data: { usage?: unknown; result?: unknown; errors?: unknown } = {},
) {
  await db.aiRun.update({
    where: { id },
    data: {
      outcome,
      completedAt: new Date(),
      ...(data.usage ? { usage: json(data.usage) } : {}),
      ...(data.result ? { result: json(data.result) } : {}),
      ...(data.errors ? { validationErrors: json(data.errors) } : {}),
    },
  });
}
export async function validatedGeneration<T>({
  examId,
  task,
  context,
  schema,
  validate,
  fixture,
  onValidation,
}: {
  examId: string;
  task: string;
  context: unknown;
  schema: z.ZodType<T>;
  validate?: (value: T) => T;
  fixture: () => T;
  onValidation?: (errors: string[]) => Promise<void>;
}) {
  if (fixtureMode()) {
    const value = schema.parse(fixture());
    return {
      value: validate ? validate(value) : value,
      usage: { inputTokens: 0, outputTokens: 0 },
      errors: [],
    };
  }
  checkAi();
  const errors: string[] = [];
  let usage: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw: unknown;
    try {
      const prompt = `${task}\nCONTEXT:\n${JSON.stringify(context)}\nReturn only JSON matching this schema: ${JSON.stringify(z.toJSONSchema(schema))}${errors.length ? `\nRepair these validation errors in a fresh complete response: ${errors.join("; ")}` : ""}`;
      if (process.env.LLM_STRUCTURED_OUTPUTS === "true") {
        const result = await generateText({
          model: liveModel(examId),
          system: prompts.common,
          prompt,
          output: Output.object({ schema }),
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(70000),
        });
        raw = result.output;
        usage = result.totalUsage;
      } else {
        const result = await generateText({
          model: liveModel(examId),
          system: prompts.common,
          prompt,
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(70000),
        });
        usage = result.totalUsage;
        raw = JSON.parse(
          result.text
            .replace(/^\s*```(?:json)?\s*/, "")
            .replace(/\s*```\s*$/, ""),
        );
      }
    } catch (error) {
      if (
        error instanceof SyntaxError ||
        (error instanceof Error &&
          ["NoObjectGeneratedError", "AI_NoObjectGeneratedError"].includes(
            error.name,
          ))
      ) {
        errors.push(error.message.slice(0, 1500));
        await onValidation?.(errors);
        continue;
      }
      logAiFailure(error);
      throw new HttpError(
        502,
        "AI endpoint request failed or timed out. Check server configuration and retry. Saved questions have not been changed.",
      );
    }
    try {
      const value = schema.parse(raw);
      return { value: validate ? validate(value) : value, usage, errors };
    } catch (error) {
      errors.push((error as Error).message.slice(0, 3000));
      await onValidation?.(errors);
    }
  }
  throw new HttpError(
    422,
    `AI output did not pass validation after one repair attempt. ${errors.join(" | ")}`,
  );
}
export async function* conversation(
  context: unknown,
  messages: ModelMessage[],
  signal: AbortSignal,
  examId: string,
): AsyncGenerator<string, unknown> {
  if (fixtureMode()) {
    const text =
      "This is a fixture response. Consider making the context more familiar to learners and checking that the rubric rewards the method as well as the final answer. Ask for a revision proposal to preview a change; this conversation does not edit your paper.";
    for (const word of text.split(" ")) {
      if (signal.aborted) throw new Error("Interrupted");
      yield word + " ";
      await new Promise((r) => setTimeout(r, 15));
    }
    return { inputTokens: 0, outputTokens: 0 };
  }
  const result = streamText({
    model: liveModel(examId),
    system: `${prompts.common}\n${prompts.conversation}\nCONTEXT: ${JSON.stringify(context)}`,
    messages,
    maxRetries: 0,
    abortSignal: AbortSignal.any([signal, AbortSignal.timeout(70000)]),
  });
  for await (const chunk of result.textStream) yield chunk;
  return await result.totalUsage;
}
export const analysisSchema = z.object({
  summary: z.string().min(1),
  findings: z
    .array(
      z.object({
        category: z.enum([
          "ambiguity",
          "duplication",
          "coverage",
          "answer",
          "balance",
          "timing",
        ]),
        severity: z.enum(["info", "warning"]),
        questionId: z.string().nullable(),
        message: z.string().min(1),
      }),
    )
    .max(30),
});
export type Analysis = z.infer<typeof analysisSchema>;
