import type { ModelParameters } from '../shared/types';
import { normalizeModelSelection, type ModelSelection } from './list';

export interface ModelConfiguration extends ModelSelection {
  parameters: ModelParameters;
}

export function normalizeModelConfig(config: ModelConfiguration): ModelConfiguration {
  const parameters: ModelParameters & { thinking_level?: unknown; thinking_tokens?: unknown } = { ...config.parameters };
  // Reasoning now selects a request ID; old API overrides must not survive migration or restore.
  delete parameters.thinking_level;
  delete parameters.thinking_tokens;
  return { ...normalizeModelSelection(config.model_id, config.reasoning_level), parameters };
}
