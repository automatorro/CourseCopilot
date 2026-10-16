export type BloomLevel =
  | 'REMEMBER'
  | 'UNDERSTAND'
  | 'APPLY'
  | 'ANALYZE'
  | 'EVALUATE'
  | 'CREATE';

export type ModulePhase =
  | 'ACTIVATION'
  | 'DEMONSTRATION'
  | 'APPLICATION'
  | 'BREAK';

export interface ModuleObjective {
  statement: string;
  bloomLevel: BloomLevel;
  bloomVerb: string;
}

export interface ExerciseSpec {
  format: string;
  scenarioSeed: string;
  characters: string[];
  evidenceOfLearning: string;
  debriefBloomVerb: string;
}

interface ModuleBlockFields {
  id: string;
  title: string;
  durationMinutes: number;
  keyPoints: string[];
}

export type ModuleBlock = ModuleBlockFields & (
  | {
      phase: 'ACTIVATION' | 'DEMONSTRATION' | 'BREAK';
      exerciseSpec?: never;
    }
  | {
      phase: 'APPLICATION';
      exerciseSpec: ExerciseSpec;
    }
);

export interface ModuleContract {
  objective: ModuleObjective;
  blocks: ModuleBlock[];
  transitions: string[];
}