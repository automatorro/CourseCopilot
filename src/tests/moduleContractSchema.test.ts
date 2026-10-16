import { describe, expect, it } from 'vitest';
import type { ModuleContract } from '../../supabase/functions/generate-course-content/prompts/contract.ts';
import {
  generateValidatedModuleContract,
  ModuleContractValidationError,
  validateModuleContract,
} from '../../supabase/functions/generate-course-content/prompts/validate-module-contract.ts';
import { ModuleContractSchema } from '../schemas/moduleContractSchema';

const validContract: ModuleContract = {
  objective: {
    statement: 'Map stakeholders by influence and interest.',
    bloomLevel: 'APPLY',
    bloomVerb: 'Map',
  },
  blocks: [
    {
      id: 'activation-1',
      phase: 'ACTIVATION',
      title: 'Recall a difficult stakeholder relationship',
      durationMinutes: 15,
      keyPoints: [
        'Stakeholder priorities can conflict.',
        'Past communication choices shape current trust.',
      ],
    },
    {
      id: 'application-1',
      phase: 'APPLICATION',
      title: 'Map project stakeholders',
      durationMinutes: 20,
      keyPoints: [
        'Influence and interest determine engagement needs.',
        'A sponsor can have high influence but limited availability.',
      ],
      exerciseSpec: {
        format: 'Small-group case analysis',
        scenarioSeed: 'A delayed IT rollout has divided its sponsor and delivery lead.',
        characters: ['a skeptical sponsor', 'a delivery lead under deadline pressure'],
        evidenceOfLearning: 'Participants place each stakeholder and justify their communication choice.',
        debriefBloomVerb: 'Justify',
      },
    },
  ],
  transitions: [
    'Connect the reported stakeholder tensions to the influence-interest map.',
    'Close by naming the next practice opportunity.',
  ],
};

const validFullContract: ModuleContract = {
  objective: {
    statement: 'Map stakeholders by influence and interest.',
    bloomLevel: 'APPLY',
    bloomVerb: 'map',
  },
  blocks: [
    {
      id: 'activation-1',
      phase: 'ACTIVATION',
      title: 'Recall a difficult stakeholder relationship',
      durationMinutes: 20,
      keyPoints: ['Priorities can conflict.', 'Past choices shape trust.'],
    },
    {
      id: 'demonstration-1',
      phase: 'DEMONSTRATION',
      title: 'Model a stakeholder map',
      durationMinutes: 20,
      keyPoints: ['Influence affects engagement.', 'Interest affects communication cadence.'],
    },
    {
      id: 'application-1',
      phase: 'APPLICATION',
      title: 'Map project stakeholders',
      durationMinutes: 20,
      keyPoints: ['Use evidence to place stakeholders.', 'Match communication to their needs.'],
      exerciseSpec: {
        format: 'Small-group case analysis',
        scenarioSeed: 'A delayed IT rollout has divided its sponsor and delivery lead.',
        characters: ['a skeptical sponsor', 'a delivery lead under deadline pressure'],
        evidenceOfLearning: 'Participants place stakeholders and justify a communication choice.',
        debriefBloomVerb: 'justify',
      },
    },
    {
      id: 'application-2',
      phase: 'APPLICATION',
      title: 'Choose a communication response',
      durationMinutes: 20,
      keyPoints: ['Communication cadence should reflect stakeholder needs.', 'Trade-offs should be explicit.'],
      exerciseSpec: {
        format: 'Paired role-play',
        scenarioSeed: 'A sponsor requests daily detail while the team is missing milestones.',
        characters: ['a time-constrained sponsor', 'a project manager'],
        evidenceOfLearning: 'Participants negotiate a cadence and support it with stakeholder evidence.',
        debriefBloomVerb: 'justify',
      },
    },
    {
      id: 'application-3',
      phase: 'APPLICATION',
      title: 'Revise the stakeholder map',
      durationMinutes: 20,
      keyPoints: ['Stakeholder positions can change.', 'New evidence can change the engagement plan.'],
      exerciseSpec: {
        format: 'Individual case decision',
        scenarioSeed: 'A newly appointed director challenges the rollout timeline.',
        characters: ['a newly appointed director', 'a project manager'],
        evidenceOfLearning: 'Participants revise the map and explain the resulting engagement change.',
        debriefBloomVerb: 'justify',
      },
    },
    {
      id: 'break-1',
      phase: 'BREAK',
      title: 'Break',
      durationMinutes: 20,
      keyPoints: ['Rest supports attention.', 'The next activity applies the model.'],
    },
  ],
  transitions: [
    'Connect prior experience to the modeled map.',
    'Move from the model to guided practice.',
    'Compare the first map with the communication choice.',
    'Use the role-play evidence to revise the map.',
    'Pause before the final practice.',
    'Close the module and preview the next topic.',
  ],
};

const validationOptions = { durationMinutes: 120, language: 'en' as const };

describe('ModuleContractSchema (F3-T3)', () => {
  it('accepts the server contract shape', () => {
    const parsedContract: ModuleContract = ModuleContractSchema.parse(validContract);
    expect(parsedContract).toEqual(validContract);
  });

  it('requires exerciseSpec for APPLICATION blocks', () => {
    const contract = structuredClone(validContract);
    const applicationBlock = contract.blocks[1];
    if (applicationBlock.phase === 'APPLICATION') {
      delete (applicationBlock as { exerciseSpec?: unknown }).exerciseSpec;
    }

    expect(ModuleContractSchema.safeParse(contract).success).toBe(false);
  });

  it('rejects exerciseSpec on non-APPLICATION blocks', () => {
    const contract = structuredClone(validContract);
    const activationBlock = contract.blocks[0];
    if (activationBlock.phase === 'ACTIVATION') {
      Object.assign(activationBlock, { exerciseSpec: validContract.blocks[1] });
    }

    expect(ModuleContractSchema.safeParse(contract).success).toBe(false);
  });

  it('enforces the planned key point count', () => {
    const contract = structuredClone(validContract);
    contract.blocks[0].keyPoints = ['Only one point.'];

    expect(ModuleContractSchema.safeParse(contract).success).toBe(false);
  });
});

describe('validateModuleContract (F3-T4)', () => {
  it('accepts a valid contract and normalizes a duration difference of at most five minutes', () => {
    const input = structuredClone(validFullContract);
    input.blocks[0].durationMinutes = 18;

    const result = validateModuleContract(input, validationOptions);

    expect(result.issues).toEqual([]);
    expect(result.durationAdjustment).toEqual({
      blockId: 'application-3',
      fromMinutes: 20,
      toMinutes: 22,
    });
    expect(result.contract.blocks[0].durationMinutes).toBe(18);
    expect(result.contract.blocks[4].durationMinutes).toBe(22);
  });

  it('reports required phases and duration mismatches over five minutes', () => {
    const input = structuredClone(validFullContract);
    input.blocks = input.blocks.filter(block => block.phase !== 'DEMONSTRATION');
    input.blocks[0].durationMinutes = 10;

    const result = validateModuleContract(input, validationOptions);

    expect(result.issues.map(issue => issue.code)).toContain('MISSING_REQUIRED_PHASE');
    expect(result.issues.map(issue => issue.code)).toContain('MODULE_DURATION_MISMATCH');
  });

  it('requires application time to reach 40 percent at APPLY or higher', () => {
    const input = structuredClone(validFullContract);
    input.blocks[0].durationMinutes = 25;
    input.blocks[1].durationMinutes = 25;
    for (const block of input.blocks) {
      if (block.phase === 'APPLICATION') block.durationMinutes = 15;
    }
    input.blocks[5].durationMinutes = 25;

    const result = validateModuleContract(input, validationOptions);

    expect(result.issues.map(issue => issue.code)).toContain('INSUFFICIENT_APPLICATION_TIME');
  });

  it('rejects blocks over 25 minutes and requires a break at 90 minutes or more', () => {
    const longBlockContract = structuredClone(validFullContract);
    longBlockContract.blocks[0].durationMinutes = 26;

    const longBlockResult = validateModuleContract(longBlockContract, validationOptions);
    expect(longBlockResult.issues.map(issue => issue.code)).toContain('BLOCK_TOO_LONG');

    const noBreakContract = structuredClone(validFullContract);
    noBreakContract.blocks = noBreakContract.blocks.filter(block => block.phase !== 'BREAK');
    noBreakContract.blocks[0].durationMinutes = 25;
    noBreakContract.blocks[1].durationMinutes = 25;
    noBreakContract.blocks[2].durationMinutes = 25;
    if (noBreakContract.blocks[3].phase === 'APPLICATION') {
      noBreakContract.blocks[3].durationMinutes = 25;
    }

    const noBreakResult = validateModuleContract(noBreakContract, { durationMinutes: 120, language: 'en' });
    expect(noBreakResult.issues.map(issue => issue.code)).toContain('MISSING_BREAK');

    const invalidDurationContract = structuredClone(validFullContract);
    invalidDurationContract.blocks[0].durationMinutes = 20.5;
    expect(validateModuleContract(invalidDurationContract, validationOptions).issues.map(issue => issue.code))
      .toContain('INVALID_BLOCK_DURATION');
  });

  it('validates Bloom verbs for Romanian and flags unknown or too-low verbs', () => {
    const romanianContract = structuredClone(validFullContract);
    romanianContract.objective.bloomVerb = 'mapează';
    for (const block of romanianContract.blocks) {
      if (block.phase === 'APPLICATION') block.exerciseSpec.debriefBloomVerb = 'justifică';
    }
    expect(validateModuleContract(romanianContract, { ...validationOptions, language: 'ro' }).issues).toEqual([]);

    const invalidContract = structuredClone(validFullContract);
    invalidContract.objective.bloomVerb = 'explain';
    for (const block of invalidContract.blocks) {
      if (block.phase === 'APPLICATION') block.exerciseSpec.debriefBloomVerb = 'list';
    }
    const invalidResult = validateModuleContract(invalidContract, validationOptions);
    expect(invalidResult.issues.map(issue => issue.code)).toContain('OBJECTIVE_BLOOM_VERB_LEVEL_MISMATCH');
    expect(invalidResult.issues.map(issue => issue.code)).toContain('DEBRIEF_BLOOM_VERB_LEVEL_TOO_LOW');

    invalidContract.objective.bloomVerb = 'invent';
    expect(validateModuleContract(invalidContract, validationOptions).issues.map(issue => issue.code))
      .toContain('UNKNOWN_OBJECTIVE_BLOOM_VERB');
  });

  it('retries exactly once with validation errors and throws after a second failure', async () => {
    const invalidContract = structuredClone(validFullContract);
    invalidContract.objective.bloomVerb = 'explain';
    const retryErrors: Array<readonly string[] | undefined> = [];

    const result = await generateValidatedModuleContract(async errors => {
      retryErrors.push(errors);
      return retryErrors.length === 1 ? invalidContract : validFullContract;
    }, validationOptions);

    expect(retryErrors).toHaveLength(2);
    expect(retryErrors[0]).toBeUndefined();
    expect(retryErrors[1]?.[0]).toContain('objective.bloomVerb');
    expect(result).toEqual(validFullContract);

    await expect(generateValidatedModuleContract(async () => invalidContract, validationOptions))
      .rejects.toBeInstanceOf(ModuleContractValidationError);
  });
});