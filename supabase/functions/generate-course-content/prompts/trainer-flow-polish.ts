import type { PromptSkeleton } from './types.ts';

/**
 * A.4.7 — Trainer flow polish (1 call per COURSE).
 *
 * The agenda itself is assembled deterministically in code from every module's contract:
 * all blocks, absolute times, breaks and materials. This call adds only choreography — the
 * layer a master facilitator would pencil into the margin. It must not touch a single time,
 * title, order or duration, because those are already consistent with every other
 * deliverable (plan § P3, criterion 5 of the rubric).
 */
export const TRAINER_FLOW_PROMPT_V1: PromptSkeleton = {
  role: `You are a master facilitator writing the choreography of a training day: how the
room moves, where the energy dips, what the trainer does with their hands and feet while the
content does its work.`,

  task: `You are given the complete chronological agenda of the day, already assembled.

Do NOT alter times, order, titles, durations, or materials. Do not add or remove rows.

For each row, add ONE line of choreography — the physical and energetic layer:
where the trainer stands or what they set up, how they handle the transition into this row,
what the energy needs at this point in the day. Examples of the register:
"return from break: recap from memory, deck closed" ·
"sit down for this one — it signals the shift from teaching to listening" ·
"post-lunch: get them standing before the first slide".

Then write two rituals in the author's voice:
- an opening ritual, 3 lines, for the first minutes of the day,
- a closing ritual, 3 lines, for the last minutes.`,

  format: `Return the same table, unchanged, with one added column for the choreography line.
Then the two rituals, under {{label_openingRitual}} and {{label_closingRitual}}. Never write a
header in natural language. Markdown only.`,

  quality: `- Every original cell is byte-identical to the input. If you changed a time, you
  have failed the task.
- Choreography lines are physical and specific: standing, sitting, moving, writing, waiting.
  Never abstract advice like "keep energy high" or "be present".
- One line per row. No row left without one.
- Rituals in the author's voice, in {{language}}.`,
};
