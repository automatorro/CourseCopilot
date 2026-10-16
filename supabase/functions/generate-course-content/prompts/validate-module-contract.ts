import type { BloomLevel, ModuleContract, ModulePhase } from './contract.ts';

export type ContractLanguage = 'ro' | 'en';

export interface ModuleContractValidationOptions {
  durationMinutes: number;
  language: ContractLanguage;
}

export interface ModuleContractValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface ModuleContractValidationResult {
  contract: ModuleContract;
  issues: ModuleContractValidationIssue[];
  durationAdjustment?: {
    blockId: string;
    fromMinutes: number;
    toMinutes: number;
  };
}

const BLOOM_ORDER: readonly BloomLevel[] = [
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
];

const BLOOM_VERBS: Record<ContractLanguage, Record<BloomLevel, readonly string[]>> = {
  en: {
    REMEMBER: ['define', 'identify', 'list', 'name', 'recall', 'recognize', 'select'],
    UNDERSTAND: ['classify', 'compare', 'describe', 'explain', 'interpret', 'summarize'],
    APPLY: ['apply', 'choose', 'complete', 'demonstrate', 'execute', 'map', 'solve', 'use'],
    ANALYZE: ['analyze', 'correlate', 'distinguish', 'examine', 'organize', 'structure'],
    EVALUATE: ['argue', 'critique', 'decide', 'evaluate', 'justify', 'prioritize', 'validate'],
    CREATE: ['build', 'compose', 'create', 'design', 'develop', 'formulate', 'plan', 'propose'],
  },
  ro: {
    REMEMBER: ['definește', 'identifică', 'listează', 'numește', 'recunoaște', 'reamintește', 'selectează'],
    UNDERSTAND: ['clasifică', 'compară', 'descrie', 'explică', 'interpretează', 'rezumă'],
    APPLY: ['aplică', 'alege', 'completează', 'demonstrează', 'execută', 'mapează', 'rezolvă', 'utilizează'],
    ANALYZE: ['analizează', 'corelează', 'diferențiază', 'examinează', 'organizează', 'structurează'],
    EVALUATE: ['argumentează', 'decide', 'evaluează', 'justifică', 'prioritizează', 'validează'],
    CREATE: ['construiește', 'creează', 'dezvoltă', 'elaborează', 'formulează', 'planifică', 'propune', 'proiectează'],
  },
};

const REQUIRED_PHASES: readonly ModulePhase[] = ['ACTIVATION', 'DEMONSTRATION', 'APPLICATION'];

function normalizeVerb(verb: string): string {
  return verb
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{Letter}]/gu, '');
}

function findVerbLevels(verb: string, language: ContractLanguage): BloomLevel[] {
  const normalized = normalizeVerb(verb);
  return BLOOM_ORDER.filter(level =>
    BLOOM_VERBS[language][level].some(candidate => normalizeVerb(candidate) === normalized),
  );
}

function formatIssue(issue: ModuleContractValidationIssue): string {
  return `${issue.path}: ${issue.message}`;
}

export function validateModuleContract(
  input: ModuleContract,
  options: ModuleContractValidationOptions,
): ModuleContractValidationResult {
  const issues: ModuleContractValidationIssue[] = [];
  const addIssue = (code: string, path: string, message: string) => {
    issues.push({ code, path, message });
  };

  if (!Number.isInteger(options.durationMinutes) || options.durationMinutes <= 0) {
    addIssue('INVALID_MODULE_DURATION', 'durationMinutes', 'Module duration must be a positive integer.');
  }

  const phases = new Set(input.blocks.map(block => block.phase));
  for (const phase of REQUIRED_PHASES) {
    if (!phases.has(phase)) {
      addIssue('MISSING_REQUIRED_PHASE', 'blocks', `At least one ${phase} block is required.`);
    }
  }

  let contract = input;
  let durationAdjustment: ModuleContractValidationResult['durationAdjustment'];
  const blockMinutes = input.blocks.reduce((sum, block) => sum + block.durationMinutes, 0);
  const delta = options.durationMinutes - blockMinutes;

  if (Math.abs(delta) > 5) {
    addIssue(
      'MODULE_DURATION_MISMATCH',
      'blocks',
      `Block durations total ${blockMinutes} minutes; expected ${options.durationMinutes} (maximum correction is 5 minutes).`,
    );
  } else if (delta !== 0) {
    let lastNonBreakIndex = -1;
    input.blocks.forEach((block, index) => {
      if (block.phase !== 'BREAK') lastNonBreakIndex = index;
    });
    if (lastNonBreakIndex < 0) {
      addIssue('NO_ADJUSTABLE_BLOCK', 'blocks', 'No non-break block is available for duration correction.');
    } else {
      const block = input.blocks[lastNonBreakIndex];
      const correctedMinutes = block.durationMinutes + delta;
      if (correctedMinutes <= 0) {
        addIssue('INVALID_DURATION_CORRECTION', `blocks.${block.id}.durationMinutes`, 'Duration correction would make this block non-positive.');
      } else {
        const blocks = input.blocks.map((current, index) =>
          index === lastNonBreakIndex ? { ...current, durationMinutes: correctedMinutes } : current,
        );
        contract = { ...input, blocks };
        durationAdjustment = {
          blockId: block.id,
          fromMinutes: block.durationMinutes,
          toMinutes: correctedMinutes,
        };
      }
    }
  }

  const totalMinutes = contract.blocks.reduce((sum, block) => sum + block.durationMinutes, 0);
  for (const block of contract.blocks) {
    if (!Number.isInteger(block.durationMinutes) || block.durationMinutes <= 0) {
      addIssue('INVALID_BLOCK_DURATION', `blocks.${block.id}.durationMinutes`, 'Block duration must be a positive integer.');
    }
    if (block.phase !== 'BREAK' && block.durationMinutes < 15) {
      addIssue('BLOCK_TOO_SHORT', `blocks.${block.id}.durationMinutes`, 'Non-break blocks must be at least 15 minutes.');
    }
    if (block.durationMinutes > 25) {
      addIssue('BLOCK_TOO_LONG', `blocks.${block.id}.durationMinutes`, 'Blocks over 25 minutes are not allowed without a phase change.');
    }
  }

  const applicationMinutes = contract.blocks
    .filter(block => block.phase === 'APPLICATION')
    .reduce((sum, block) => sum + block.durationMinutes, 0);
  const objectiveLevelIndex = BLOOM_ORDER.indexOf(input.objective.bloomLevel);

  if (objectiveLevelIndex >= BLOOM_ORDER.indexOf('APPLY')
    && (totalMinutes <= 0 || applicationMinutes / totalMinutes < 0.4)) {
    addIssue(
      'INSUFFICIENT_APPLICATION_TIME',
      'blocks',
      `APPLICATION blocks must total at least 40% of module time for Bloom level ${input.objective.bloomLevel}.`,
    );
  }

  if (options.durationMinutes >= 90 && !phases.has('BREAK')) {
    addIssue('MISSING_BREAK', 'blocks', 'Modules lasting 90 minutes or longer require a BREAK block.');
  }

  const objectiveVerbLevels = findVerbLevels(input.objective.bloomVerb, options.language);
  if (objectiveVerbLevels.length === 0) {
    addIssue(
      'UNKNOWN_OBJECTIVE_BLOOM_VERB',
      'objective.bloomVerb',
      `Bloom verb "${input.objective.bloomVerb}" is not in the ${options.language.toUpperCase()} dictionary.`,
    );
  } else if (!objectiveVerbLevels.includes(input.objective.bloomLevel)) {
    addIssue(
      'OBJECTIVE_BLOOM_VERB_LEVEL_MISMATCH',
      'objective.bloomVerb',
      `Bloom verb "${input.objective.bloomVerb}" must match level ${input.objective.bloomLevel}.`,
    );
  }

  contract.blocks.forEach(block => {
    if (block.phase !== 'APPLICATION') return;
    const verbLevels = findVerbLevels(block.exerciseSpec.debriefBloomVerb, options.language);
    if (verbLevels.length === 0) {
      addIssue(
        'UNKNOWN_DEBRIEF_BLOOM_VERB',
        `blocks.${block.id}.exerciseSpec.debriefBloomVerb`,
        `Bloom verb "${block.exerciseSpec.debriefBloomVerb}" is not in the ${options.language.toUpperCase()} dictionary.`,
      );
      return;
    }

    const highestVerbLevelIndex = Math.max(...verbLevels.map(level => BLOOM_ORDER.indexOf(level)));
    if (highestVerbLevelIndex < objectiveLevelIndex) {
      addIssue(
        'DEBRIEF_BLOOM_VERB_LEVEL_TOO_LOW',
        `blocks.${block.id}.exerciseSpec.debriefBloomVerb`,
        `Debrief Bloom verb must be at or above objective level ${input.objective.bloomLevel}.`,
      );
    }
  });

  return { contract, issues, durationAdjustment };
}

export class ModuleContractValidationError extends Error {
  constructor(readonly issues: readonly ModuleContractValidationIssue[]) {
    super(`Module contract remained invalid after one retry:\n${issues.map(formatIssue).join('\n')}`);
    this.name = 'ModuleContractValidationError';
  }
}

export async function generateValidatedModuleContract(
  generate: (validationErrors?: readonly string[]) => Promise<ModuleContract>,
  options: ModuleContractValidationOptions,
): Promise<ModuleContract> {
  let contract = await generate();
  let result = validateModuleContract(contract, options);
  if (result.issues.length === 0) return result.contract;

  contract = await generate(result.issues.map(formatIssue));
  result = validateModuleContract(contract, options);
  if (result.issues.length > 0) throw new ModuleContractValidationError(result.issues);
  return result.contract;
}