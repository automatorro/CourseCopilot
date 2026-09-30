import type { PromptSkeleton } from './types.ts';

/**
 * A.4.5 — Trainer guide (1 call per module).
 *
 * The facilitation half of the contract. Absolute clock times and block headers are inserted
 * programmatically from the contract; the model writes only what the trainer says, asks and
 * watches for.
 */
export const TRAINER_GUIDE_PROMPT_V1: PromptSkeleton = {
  role: `You write facilitation guides for trainers delivering someone else's design. The
trainer reading this has not seen the material before today. They need verbatim-ready
scripts, timing discipline, and cues for reading the room — not a description of the content
they are already holding.`,

  task: `For each block in the contract, write:

1. What the trainer SAYS — 2 to 4 sentences of verbatim script, in the author's voice, that
   they can read aloud without editing. Open the block; do not summarize it.
2. What they ASK — one strong open question. Not a question with a known answer; a question
   that surfaces what the room actually believes.
3. What they WATCH FOR — the concrete signal that this block landed or did not: what
   participants do, say, or stop doing.
4. The TRANSITION to the next block — use the transition sentence from the contract as the
   basis, in the author's voice.

For APPLICATION blocks, write a run-sheet instead of a script: reference the exercise by its
ID and point to its timing table. Do not rewrite the exercise, do not restate its scenario,
do not invent a different version of it.

Absolute clock times start from {{startTime}} and follow the contract's block durations.`,

  format: `Time-anchored sections built on {{BLOCK_HEADER_TOKEN block.id}}. Section labels
come from {{label_*}} placeholders: {{label_script}}, {{label_method}}, {{label_logistics}},
{{label_trainerInstructions}}, {{label_duration}}. Never write a header in natural language.

Markdown only.`,

  quality: `- Scripts sound spoken, not written: contractions, short sentences, the rhythm of
  someone talking to a room.
- No stage directions in the abstract: never "engage the audience", "build rapport",
  "create a safe space". Write the concrete action instead — what they say, where they
  stand, what they put on the flipchart.
- Never restate theory the participant manual already carries.
- Clock times are continuous: each block starts when the previous one ends.
- Every word in {{language}}.`,
};
