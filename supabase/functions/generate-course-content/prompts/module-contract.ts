import type { PromptSkeleton } from './types.ts';

/**
 * A.4.2 — Module contract (1 call per module).
 *
 * The highest-leverage call in the system. Everything downstream (manual, exercise sheets,
 * trainer guide, slides, trainer flow) is a *rendering* of this contract, never an
 * independent generation (plan § P2). If the contract is vague, every deliverable is vague.
 *
 * Output is validated deterministically by `validateModuleContract()` (F3-T4) before any
 * downstream call runs: block coverage (ACTIVATION/DEMONSTRATION/APPLICATION), minute sums,
 * APPLICATION share at Bloom APPLY+, and Bloom verb membership per language.
 */
export const CONTRACT_PROMPT_V1: PromptSkeleton = {
  role: `You are a senior instructional designer. You design modules using Bloom's taxonomy
and Merrill's First Principles of Instruction. Your contracts are executed literally by
downstream writers who see nothing but the contract, so every field must be specific and
self-sufficient. A field that requires the reader to guess your intent is a defect.`,

  task: `Produce the ModuleContract JSON for this module.

1. objective.statement — one sentence describing observable behavior, opening with an
   explicit Bloom verb that matches objective.bloomLevel. Not "understand X", not
   "be familiar with X": state what the participant will DO, under what conditions, to
   what standard.

2. blocks — decompose the module's duration into blocks of 15–25 minutes. Every module
   needs at least:
   - one ACTIVATION block that connects to the participants' own prior experience
     (their cases, their frustrations — not a generic warm-up),
   - one DEMONSTRATION block built on a worked example (show the thinking, do not lecture
     the rule),
   - one APPLICATION block where they perform and receive feedback.
   If objective.bloomLevel is APPLY or higher, APPLICATION blocks must total at least 40%
   of module time. Insert a BREAK block if the module runs 90 minutes or longer.
   Block durations must sum to the module duration.

3. keyPoints — 2 to 5 per block. Each is a complete, concrete idea: a claim that can be
   true or false, not a topic label.
   Good: "Stakeholders with high power and low interest need summary-level updates, not
   detail — detail reads as noise and costs you their attention."
   Bad: "stakeholder types".

4. exerciseSpec — required on every APPLICATION block:
   - scenarioSeed: anchored in the audience's real work context, containing a built-in
     tension or dilemma with no clean answer.
   - characters: ROLES ONLY (e.g. "a skeptical department head", "a peer who owns the
     budget"). Do NOT assign names — names are invented later, locally, inside each
     exercise sheet.
   - evidenceOfLearning: what a successful participant visibly does or produces.
   - debriefBloomVerb: at or above objective.bloomLevel.

5. transitions — one sentence per block describing how the trainer moves from this block
   to the next, referencing what just happened.`,

  format: `Return ONLY valid JSON matching this schema. No markdown fences, no commentary:
{{schemaJson}}`,

  quality: `- No placeholders of any kind: no "X%", no "TBD", no "[insert example]", no
  "various". Invent plausible, specific values.
- Every duration is an integer number of minutes; block durations sum to module duration.
- keyPoints are claims, not labels. If a keyPoint fits in three words, it is too thin.
- exerciseSpec characters carry roles and stakes, never names.
- The scenario must be specific enough that swapping the industry would break it.
- All natural-language strings in {{language}}. Field names stay in English.`,
};
