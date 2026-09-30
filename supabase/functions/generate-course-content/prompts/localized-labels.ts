import type { PromptSkeleton } from './types.ts';

/**
 * A.4.1 — Localized labels (1 call per course, at course creation).
 *
 * Translates the structural label dictionary into the course language. The result is
 * stored in `courses.localized_labels` and every downstream renderer reads its headers
 * from there, so no natural-language header is ever written by a content prompt.
 *
 * The key inventory below is a SUPERSET of the one implemented in F2-T1
 * (`LOCALIZED_LABEL_KEYS` + `getDefaultEnglishLabels()` in index.ts): the 18 keys live
 * today, plus the keys the exercise sheet and trainer flow skeletons need (D-017). The
 * index.ts inventory and its English fallback are aligned to this list in F4-T3, when the
 * renderers start consuming these prompts.
 */
export const LOCALIZED_LABELS_PROMPT_V1: PromptSkeleton = {
  role: `You are a professional translator specializing in corporate training materials.
You translate structural labels the way a working trainer in the target culture would write them
on a handout — not the way a dictionary would render them.`,

  task: `Translate the dictionary of structural labels below into {{language}}.

Rules:
1. Use the register a professional trainer in that culture uses on printed course materials:
   concise, noun-phrase style, title case where the language's conventions call for it.
2. Preserve the meaning of the ENGLISH source exactly. These are section headers in a
   participant workbook, a facilitator manual and exercise sheets.
3. If a term is a standard loanword in the target language (e.g. "Debrief", "Script",
   "Format"), keep the loanword rather than forcing a native coinage.
4. Never leave a value in English unless the loanword rule above applies.
5. Keep every key exactly as given. Do not add, remove or rename keys.

INPUT (English source dictionary):
{{labelDictionaryJson}}`,

  format: `Return ONLY a valid JSON object with exactly the same keys as the input.
Values are the translated strings. No markdown fences, no commentary, no explanation.`,

  quality: `- Every value is a label, not a sentence: no trailing punctuation, no verbs in
  imperative form unless the English source uses one.
- No key left untranslated (loanwords excepted, per rule 3).
- Consistent register across all values — do not mix formal and casual forms.
- Output is parseable JSON on the first attempt.`,
};

/**
 * The canonical label inventory. The first 18 keys mirror `LOCALIZED_LABEL_KEYS` in
 * index.ts (F2-T1); the rest are pending alignment there in F4-T3 (D-017).
 * `src/tests/promptSkeletons.test.ts` checks that every {{label_*}} used by a skeleton
 * is declared here, so the prompts and the inventory cannot drift apart silently.
 */
export const LABEL_KEYS = [
  'duration',
  'format',
  'section',
  'theory',
  'keyTakeaways',
  'actionPlan',
  'reflection',
  'trainerInstructions',
  'method',
  'logistics',
  'script',
  'activity',
  'objective',
  'instructionsParticipant',
  'instructionsFacilitator',
  'debrief',
  'example',
  'videoScript',
  // Pending alignment in index.ts (F4-T3, D-017):
  'workspace',
  'timing',
  'observerChecklist',
  'successIndicators',
  'adaptation',
  'openingRitual',
  'closingRitual',
] as const;

export type LabelKey = typeof LABEL_KEYS[number];
