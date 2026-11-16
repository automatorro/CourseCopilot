export type ModelTier = 'standard' | 'premium';

const CLAUDE_MODEL_BY_TIER: Record<ModelTier, string> = {
  standard: 'claude-sonnet-5',
  premium: 'claude-sonnet-5',
};

export function resolveClaudeModel(modelTier: ModelTier = 'standard'): string {
  return CLAUDE_MODEL_BY_TIER[modelTier];
}

export function getModelTierCacheInput(prompt: string, modelTier: ModelTier): string {
  return modelTier === 'standard' ? prompt : `${modelTier}\n${prompt}`;
}
