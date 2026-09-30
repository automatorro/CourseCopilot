/**
 * Shared shape for the system's prompt skeletons (plan v2.0 § A.1).
 *
 * Every content call is assembled from 7 layers, in this order:
 *   [1] ROLE FRAME      — fixed per call type   → `role` below
 *   [2] TONE PREAMBLE   — runtime (buildTonePreamble)
 *   [3] COURSE CONTEXT  — runtime
 *   [4] UNIT CONTEXT    — runtime
 *   [5] TASK SPEC       — fixed per call type   → `task` below
 *   [6] FORMAT SPEC     — fixed per call type   → `format` below
 *   [7] QUALITY RULES   — fixed per call type   → `quality` below
 *
 * Layers 1, 5, 6, 7 are the skeleton and live in this folder. Layers 2, 3, 4 are
 * built from data at runtime in index.ts and passed to `buildPrompt(layers)`.
 *
 * Assembly rule: never concatenate ad-hoc — always go through `buildPrompt`.
 *
 * Mapping onto `PromptLayers` in index.ts (F3-T1): role → roleFrame, task → taskSpec,
 * format → formatSpec, quality → qualityRules.
 */
export interface PromptSkeleton {
  /** [1] Who the model is and the quality bar it works to. */
  role: string;
  /** [5] What this specific call produces, with pedagogical criteria. */
  task: string;
  /** [6] Output structure. Labels ONLY via {{label_*}} placeholders — no natural-language headers. */
  format: string;
  /** [7] Prohibitions and concreteness requirements. Short, max ~10 lines. */
  quality: string;
}
