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
