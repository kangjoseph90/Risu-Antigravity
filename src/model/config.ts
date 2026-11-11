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

export interface ModelSettings {
  version: 2;
  models: Record<string, ModelConfiguration>;
  legacyRequestConfigs?: Record<string, unknown>;
}

/** Convert v1 request-type settings without discarding the original profiles. */
export function migrateModelSettings(value: unknown): ModelSettings {
  const settings: ModelSettings = { version: 2, models: {} };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return settings;
  const source = value as Record<string, unknown>;
  const current = source.version === 2 && source.models && typeof source.models === 'object';
  const configs = (current ? source.models : source) as Record<string, unknown>;
  const entries = Object.entries(configs);
  if (!current) entries.sort(([a], [b]) => (a === 'chat' ? -1 : b === 'chat' ? 1 : 0));
  for (const [key, raw] of entries) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) continue;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const config = raw as ModelConfiguration;
    if (typeof config.model_id !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(config.model_id)
      || !config.parameters || typeof config.parameters !== 'object' || Array.isArray(config.parameters)) continue;
    const normalized = normalizeModelConfig(config);
    const modelId = current ? key : normalized.model_id;
    if (!Object.prototype.hasOwnProperty.call(settings.models, modelId)) settings.models[modelId] = normalized;
  }
  if (!current && Object.keys(configs).length) settings.legacyRequestConfigs = configs;
  else if (source.legacyRequestConfigs && typeof source.legacyRequestConfigs === 'object') {
    settings.legacyRequestConfigs = source.legacyRequestConfigs as Record<string, unknown>;
  }
  return settings;
}
