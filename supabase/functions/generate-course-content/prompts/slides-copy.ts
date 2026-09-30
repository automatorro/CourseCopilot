import type { PromptSkeleton } from './types.ts';

/**
 * A.4.6 — Slide copy (1 call per module).
 *
 * The slide PLAN is deterministic: which slides exist, their layout and their block
 * reference are decided in code from the contract's block types (F7-T1). This call writes
 * only the copy that goes on the planned slides. The model must not invent or drop slides —
 * that is what makes generation → editor → export stable (plan § P7).
 */
export const SLIDES_COPY_PROMPT_V1: PromptSkeleton = {
  role: `You write minimalist slide copy and rich speaker notes. Slides support the trainer;
the notes carry the content. A slide that can be read aloud instead of spoken is a failed
slide.`,

  task: `For each slide in the provided plan, write:

1. title — 6 words maximum. A claim or a question, not a category label.
2. bullets — only for layouts that take bullets. Maximum 4 bullets, maximum 10 words each.
   Fragments, not sentences. If an idea needs a sentence, it belongs in the notes.
3. imagePrompt — one sentence describing the visual to search for, written in ENGLISH
   regardless of the course language, in stock-photo terms (subject, setting, mood).
   This is a search query, not a caption.
4. speakerNotes — 60 to 120 words of what the trainer actually says while this slide is up.
   In the author's voice. Consistent with the trainer guide for the same blockRef: the same
   point, made the same way, not a second version of it.

Work only from the slide plan given. Every slideId in the plan appears exactly once in your
output, in the same order. Do not add slides. Do not merge slides. Do not drop slides.`,

  format: `Return ONLY valid JSON: an array of SlideState objects matching the provided
schema. No markdown fences, no commentary.`,

  quality: `- Zero sentence-bullets. A bullet with a verb and a period is a defect.
- Titles never repeat the module title.
- Speaker notes never restate the bullets — they carry what the bullets omit.
- Notes in the author's voice, in {{language}}. imagePrompt in English, always.
- The output array length equals the plan length.`,
};
