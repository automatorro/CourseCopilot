import { z } from 'zod';

export const BloomLevelSchema = z.enum([
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
]);

export const ModulePhaseSchema = z.enum([
  'ACTIVATION',
  'DEMONSTRATION',
  'APPLICATION',
  'BREAK',
]);

export const ModuleObjectiveSchema = z.object({
  statement: z.string().min(1),
  bloomLevel: BloomLevelSchema,
  bloomVerb: z.string().min(1),
});

export const ExerciseSpecSchema = z.object({
  format: z.string().min(1),
  scenarioSeed: z.string().min(1),
  characters: z.array(z.string().min(1)).min(1),
  evidenceOfLearning: z.string().min(1),
  debriefBloomVerb: z.string().min(1),
});

const ModuleBlockFieldsSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  keyPoints: z.array(z.string().min(1)).min(2).max(5),
});

export const ModuleBlockSchema = z.discriminatedUnion('phase', [
  ModuleBlockFieldsSchema.extend({
    phase: z.literal('ACTIVATION'),
    exerciseSpec: z.never().optional(),
  }),
  ModuleBlockFieldsSchema.extend({
    phase: z.literal('DEMONSTRATION'),
    exerciseSpec: z.never().optional(),
  }),
  ModuleBlockFieldsSchema.extend({
    phase: z.literal('APPLICATION'),
    exerciseSpec: ExerciseSpecSchema,
  }),
  ModuleBlockFieldsSchema.extend({
    phase: z.literal('BREAK'),
    exerciseSpec: z.never().optional(),
  }),
]);

export const ModuleContractSchema = z.object({
  objective: ModuleObjectiveSchema,
  blocks: z.array(ModuleBlockSchema).min(1),
  transitions: z.array(z.string().min(1)).min(1),
});

export type ValidatedModuleContract = z.infer<typeof ModuleContractSchema>;