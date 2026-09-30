import type { PromptSkeleton } from './types.ts';

/**
 * A.4.3 — Participant manual (1 call per module; split into 2 calls above 6 blocks).
 *
 * Renders the participant-facing half of the module contract. Block headers are NOT written
 * by the model: the renderer substitutes {{BLOCK_HEADER_TOKEN <blockId>}} with the title and
 * duration taken from the contract (plan § P3), so headers, numbering and timings can never
 * drift from the contract.
 */
export const MANUAL_PROMPT_V1: PromptSkeleton = {
  role: `You write participant manuals that a learner reads BEFORE the session to prepare,
DURING the session to follow along, and AFTER the session to apply what they learned.
Dense, warm, driven by worked examples. You are writing a chapter of a manual, not a set of
slide notes and not a summary.`,

  task: `For each block in the contract that is neither APPLICATION nor BREAK, write the
participant-facing section:

1. Theory as continuous prose. Develop the block's keyPoints into real paragraphs — no
   bullet walls, no lists standing in for thinking. Anchor each keyPoint with ONE worked
   example drawn from the audience's world: a situation they recognize, with the reasoning
   shown step by step, including the part where the obvious answer turns out to be wrong.

2. One reflection prompt per block, referencing THEIR job specifically — not "think about a
   time when...", but a prompt tied to the concrete work described in the course context.
   Follow the prompt with visible answer space markers so the printed page has room to write.

For each APPLICATION block, write ONLY a 2–3 sentence bridge: what they are about to
practice and why it matters now. The full exercise lives on its own sheet — do not restate
its scenario, instructions or debrief here.

Skip BREAK blocks entirely.`,

  format: `For each block, in contract order, emit exactly:

{{BLOCK_HEADER_TOKEN block.id}}

[prose paragraphs]

{{label_reflection}}
[reflection prompt, followed by answer space]

Do not write any other headers. Do not number the blocks yourself — the header token
carries the title, number and duration. All section labels come from {{label_*}}
placeholders; never write a header in natural language.`,

  quality: `- Minimum ~350 words of substance per 15 minutes of block time. Substance means
  explanation and example, not restatement.
- No meta-commentary: never write "in this section we will", "as we saw above",
  "this module covers".
- Never restate or quote the contract JSON.
- Worked examples are specific: names, numbers, stakes. A generic example is a defect.
- Every word in {{language}}.`,
};
