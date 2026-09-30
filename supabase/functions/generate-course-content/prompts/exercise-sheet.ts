import type { PromptSkeleton } from './types.ts';

/**
 * A.4.4 — Exercise sheet (1 call per exerciseSpec).
 *
 * Maximum capacity is spent here, on the material with the highest impact on the room.
 * This is where character names are invented — locally, inside this one exercise, never
 * globally (plan § P4). There is no post-processing pass over names: what the model writes
 * is what ships.
 */
export const EXERCISE_PROMPT_V1: PromptSkeleton = {
  role: `You design experiential learning activities. Your exercise sheets are standalone
handouts: a participant holding only this sheet can run the activity without asking a single
clarifying question and without any other material.`,

  task: `Build the complete exercise from the exerciseSpec provided.

1. Expand scenarioSeed into a full scenario. Name the characters — distinct, realistic names
   for the {{language}} culture. These characters exist ONLY in this exercise; do not carry
   over names from anywhere else. Give each a concrete stake and a tension: what they want,
   what it costs them, why they cannot simply be reasonable. The scenario must make the
   dilemma unavoidable — if a participant can resolve it by being nice, it is not a dilemma.

2. Participant instructions: numbered, imperative, unambiguous. Each step is one action.
   State the time budget per step.

3. A REAL workspace: actual Markdown tables, matrices, or ruled line-space sized for
   handwriting. Never write "(write your answer here)" — draw the structure they write into.

4. Facilitator section:
   - a setup / execution / debrief timing table whose minutes sum to the exercise duration,
   - an observer checklist of 3–5 concrete behaviors to watch for,
   - debrief questions escalating from factual recall to "{{debriefBloomVerb}}" level,
   - success indicators tied directly to the spec's evidenceOfLearning,
   - adaptation notes for a resistant group and for a group that finishes early.`,

  format: `Use the exercise sheet structure with headers drawn exclusively from {{label_*}}
placeholders: {{label_objective}}, {{label_instructionsParticipant}},
{{label_instructionsFacilitator}}, {{label_workspace}}, {{label_timing}},
{{label_observerChecklist}}, {{label_debrief}}, {{label_successIndicators}},
{{label_adaptation}}, {{label_duration}}, {{label_method}}, {{label_logistics}}.
Never write a header in natural language.

Markdown only. Tables as real Markdown tables.`,

  quality: `- The scenario is specific enough that swapping the industry would break it.
- Character names appear only in this exercise, and each character is named exactly once
  in the setup before being referred to by name.
- Zero placeholders: no "X%", no "Company A", no "[role]".
- Environment rules apply strictly ({{envConstraints}}): ONLINE means breakout rooms, chat
  and shared-board mechanics; LIVE means physical materials and room movement only. Never
  mix the two.
- The facilitator timing table sums to the exercise duration exactly.
- Every word in {{language}}.`,
};
