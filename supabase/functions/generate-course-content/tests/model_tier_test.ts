import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { getModelTierCacheInput, resolveClaudeModel } from "../model-tier.ts";

Deno.test("Model tier defaults to the current Claude model", () => {
  assertEquals(resolveClaudeModel(), "claude-sonnet-5");
  assertEquals(resolveClaudeModel("standard"), "claude-sonnet-5");
});

Deno.test("Premium tier preserves the current model until escalation is approved", () => {
  assertEquals(resolveClaudeModel("premium"), "claude-sonnet-5");
});

Deno.test("Premium cache keys are isolated while standard cache keys stay compatible", () => {
  assertEquals(getModelTierCacheInput("prompt", "standard"), "prompt");
  assertEquals(getModelTierCacheInput("prompt", "premium"), "premium\nprompt");
});

Deno.test("Generation entrypoint inlines model-tier helpers for Dashboard deployment", async () => {
  const entrypoint = await Deno.readTextFile(new URL("../index.ts", import.meta.url));
  const hashPromptIndex = entrypoint.indexOf("async function hashPrompt");

  assertEquals(entrypoint.includes('from "./model-tier.ts"'), false);
  assertEquals(entrypoint.includes("function resolveClaudeModel("), true);
  assertEquals(entrypoint.includes("function getModelTierCacheInput("), true);
  assertEquals(entrypoint.indexOf("function getModelTierCacheInput(") < hashPromptIndex, true);
});
