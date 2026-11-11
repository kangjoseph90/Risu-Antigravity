import { RequestType, REQUEST_TYPES, type ConfiguredRequestType, type ModelParameters } from '../shared/types';
import { DEFAULT_MODEL_ID } from './list';
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
  version: 3;
  requests: Partial<Record<ConfiguredRequestType, ModelConfiguration>>;
  // Keep beta.1's model settings available in exported backups.
  previousModelConfigs?: Record<string, unknown>;
}

function readConfig(raw: unknown): ModelConfiguration | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
  const config = raw as ModelConfiguration;
  if (typeof config.model_id !== 'string' || ['__proto__', 'prototype', 'constructor'].includes(config.model_id)
    || !config.parameters || typeof config.parameters !== 'object' || Array.isArray(config.parameters)) return;
  return normalizeModelConfig(config);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Restore the original request tabs; retain beta.1 settings without guessing their purpose. */
export function migrateModelSettings(value: unknown): ModelSettings {
  const settings: ModelSettings = { version: 3, requests: {} };
  if (!isRecord(value)) return settings;
  const beta = value.version === 2 && isRecord(value.models);
  const configs = value.version === 3 && isRecord(value.requests) ? value.requests
    : beta ? (isRecord(value.legacyRequestConfigs) ? value.legacyRequestConfigs : {}) : value;
  for (const type of REQUEST_TYPES) {
    const config = readConfig(Object.prototype.hasOwnProperty.call(configs, type) ? configs[type] : undefined);
    if (config) settings.requests[type] = config;
  }
  if (beta) {
    settings.previousModelConfigs = value.models as Record<string, unknown>;
    // No role information exists for beta.1-only profiles. Use the former default
    // model profile for Chat; leave the other tabs at their normal defaults.
    if (!settings.requests.chat) {
      const chat = readConfig((value.models as Record<string, unknown>)[DEFAULT_MODEL_ID]);
      if (chat) settings.requests[RequestType.Chat] = chat;
    }
  } else if (isRecord(value.previousModelConfigs)) settings.previousModelConfigs = value.previousModelConfigs;
  return settings;
}
