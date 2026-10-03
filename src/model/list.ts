import type { ReasoningLevel } from '../shared/types';

export type Model = {
  id: string;
  displayName: string;
  isLatest?: boolean;
} & (
  | { reasoningIds: Partial<Record<ReasoningLevel, string>>; requestId?: never }
  | { requestId: string; reasoningIds?: never }
);

export interface ModelSelection {
  model_id: string;
  reasoning_level?: ReasoningLevel;
}

export const DEFAULT_MODEL_ID = 'gemini-3.8-flash';
export const REASONING_LEVELS: ReasoningLevel[] = ['low', 'medium', 'high'];

export const MODELS: Model[] = [
  // Gemini Flash (newest → oldest)
  {
    id: DEFAULT_MODEL_ID, displayName: 'Gemini 3.8 Flash', isLatest: true,
    reasoningIds: { low: 'gemini-3.8-flash-low', medium: 'gemini-3.8-flash-medium', high: 'gemini-3.8-flash-high' },
  },
  {
    id: 'gemini-3.7-flash', displayName: 'Gemini 3.7 Flash',
    reasoningIds: { low: 'gemini-3.7-flash-low', medium: 'gemini-3.7-flash-medium', high: 'gemini-3.7-flash-high' },
  },
  {
    id: 'gemini-3.6-flash', displayName: 'Gemini 3.6 Flash',
    reasoningIds: { low: 'gemini-3.6-flash-low', medium: 'gemini-3.6-flash-medium', high: 'gemini-3.6-flash-high' },
  },
  {
    id: 'gemini-3.5-flash', displayName: 'Gemini 3.5 Flash',
    reasoningIds: { low: 'gemini-3.5-flash-extra-low', medium: 'gemini-3.5-flash-low', high: 'gemini-3-flash-agent' },
  },
  { id: 'gemini-3-flash', displayName: 'Gemini 3 Flash', requestId: 'gemini-3-flash' },
  // Gemini Pro
  {
    id: 'gemini-3.1-pro', displayName: 'Gemini 3.1 Pro', isLatest: true,
    reasoningIds: { low: 'gemini-3.1-pro-low', high: 'gemini-pro-agent' },
  },
  // Claude
  {
    id: 'claude-opus-5-5', displayName: 'Claude Opus 5.5', isLatest: true,
    reasoningIds: { low: 'claude-opus-5-5-low', medium: 'claude-opus-5-5-medium', high: 'claude-opus-5-5-high' },
  },
  {
    id: 'claude-sonnet-5-5', displayName: 'Claude Sonnet 5.5', isLatest: true,
    reasoningIds: { low: 'claude-sonnet-5-5-low', medium: 'claude-sonnet-5-5-medium', high: 'claude-sonnet-5-5-high' },
  },
  // Older models with a single known request ID do not expose a level selector.
  { id: 'claude-sonnet-4-6', displayName: 'Claude Sonnet 4.6', requestId: 'claude-sonnet-4-6' },
  { id: 'claude-opus-4-6', displayName: 'Claude Opus 4.6', requestId: 'claude-opus-4-6-thinking' },
  { id: 'gpt-oss-120b', displayName: 'GPT-OSS 120B', requestId: 'gpt-oss-120b-medium' },
];

export function getModel(modelId: string): Model | undefined {
  return MODELS.find((model) => model.id === modelId);
}

export function getReasoningLevels(modelId: string): ReasoningLevel[] {
  const model = getModel(modelId);
  return REASONING_LEVELS.filter((level) => model?.reasoningIds?.[level]);
}

export function normalizeModelSelection(modelId: string, reasoningLevel?: ReasoningLevel): ModelSelection {
  let model = getModel(modelId);
  let savedLevel: ReasoningLevel | undefined;
  if (!model) {
    // Resolve old raw request IDs, including aliases whose suffixes do not match their UI level.
    model = MODELS.find((candidate) => {
      if (candidate.requestId === modelId) return true;
      savedLevel = REASONING_LEVELS.find((level) => candidate.reasoningIds?.[level] === modelId);
      return savedLevel !== undefined;
    });
  }
  if (!model) return { model_id: modelId }; // Preserve unrecognized saved IDs.
  const levels = getReasoningLevels(model.id);
  const preferredLevel = reasoningLevel ?? savedLevel;
  const selectedLevel = preferredLevel && levels.includes(preferredLevel)
    ? preferredLevel
    : levels[levels.length - 1];
  return { model_id: model.id, ...(selectedLevel ? { reasoning_level: selectedLevel } : {}) };
}

export function getRequestModelId(modelId: string, reasoningLevel?: ReasoningLevel): string {
  const selection = normalizeModelSelection(modelId, reasoningLevel);
  const model = getModel(selection.model_id);
  return (selection.reasoning_level && model?.reasoningIds?.[selection.reasoning_level])
    || model?.requestId || selection.model_id;
}

export function getVisibleModels(showOlderModels: boolean, currentModelId: string): Model[] {
  const visible = MODELS.filter((model) => showOlderModels || model.isLatest || model.id === currentModelId);
  if (currentModelId && !getModel(currentModelId)) {
    visible.push({ id: currentModelId, displayName: `Saved model (${currentModelId})`, requestId: currentModelId });
  }
  return visible;
}
