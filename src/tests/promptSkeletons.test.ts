import { describe, expect, it } from 'vitest';
import type { PromptSkeleton } from '../../supabase/functions/generate-course-content/prompts/types.ts';
import {
  LABEL_KEYS,
  LOCALIZED_LABELS_PROMPT_V1,
} from '../../supabase/functions/generate-course-content/prompts/localized-labels.ts';
import { CONTRACT_PROMPT_V1 } from '../../supabase/functions/generate-course-content/prompts/module-contract.ts';
import { MANUAL_PROMPT_V1 } from '../../supabase/functions/generate-course-content/prompts/participant-manual.ts';
import { EXERCISE_PROMPT_V1 } from '../../supabase/functions/generate-course-content/prompts/exercise-sheet.ts';
import { TRAINER_GUIDE_PROMPT_V1 } from '../../supabase/functions/generate-course-content/prompts/trainer-guide.ts';
import { SLIDES_COPY_PROMPT_V1 } from '../../supabase/functions/generate-course-content/prompts/slides-copy.ts';
import { TRAINER_FLOW_PROMPT_V1 } from '../../supabase/functions/generate-course-content/prompts/trainer-flow-polish.ts';
import { roDiacritics } from './fixtures/etalonCourse';

// F3-T2 guard: the 7 skeletons from plan v2.0 § A.4.
const skeletons: Record<string, PromptSkeleton> = {
  localizedLabels: LOCALIZED_LABELS_PROMPT_V1,
  moduleContract: CONTRACT_PROMPT_V1,
  participantManual: MANUAL_PROMPT_V1,
  exerciseSheet: EXERCISE_PROMPT_V1,
  trainerGuide: TRAINER_GUIDE_PROMPT_V1,
  slidesCopy: SLIDES_COPY_PROMPT_V1,
  trainerFlow: TRAINER_FLOW_PROMPT_V1,
};

const allText = (s: PromptSkeleton) => [s.role, s.task, s.format, s.quality].join('\n');

describe('prompt skeletons (F3-T2)', () => {
  it('installs exactly the 7 skeletons, each with all 4 fixed layers', () => {
    expect(Object.keys(skeletons)).toHaveLength(7);
    for (const [name, s] of Object.entries(skeletons)) {
      for (const layer of ['role', 'task', 'format', 'quality'] as const) {
        expect(s[layer].trim().length, `${name}.${layer}`).toBeGreaterThan(0);
      }
    }
  });

  it('only uses {{label_*}} placeholders declared in LABEL_KEYS', () => {
    const known = new Set<string>(LABEL_KEYS);
    for (const [name, s] of Object.entries(skeletons)) {
      const used = [...allText(s).matchAll(/\{\{label_([a-zA-Z]+)\}\}/g)].map(m => m[1]);
      for (const key of used) {
        expect(known.has(key), `${name} uses undeclared label "${key}"`).toBe(true);
      }
    }
  });

  it('keeps meta-instructions in English (no Romanian diacritics)', () => {
    for (const [name, s] of Object.entries(skeletons)) {
      expect(roDiacritics.test(allText(s)), `${name} contains Romanian diacritics`).toBe(false);
    }
  });
});
