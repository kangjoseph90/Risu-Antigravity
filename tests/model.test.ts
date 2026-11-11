import assert from 'node:assert/strict';
import test from 'node:test';
import { MODELS, getReasoningLevels, getRequestModelId, getVisibleModels, normalizeModelSelection } from '../src/model/list';
import { normalizeModelConfig } from '../src/model/config';
import { getGenerationConfig } from '../src/chat/config';

test('latest model list contains Argon and existing families without reasoning suffixes', () => {
  assert.deepEqual(getVisibleModels(false, '').map((model) => model.id), [
    'gemini-4-argon', 'gemini-3.8-flash', 'claude-opus-5-5', 'claude-sonnet-5-5',
  ]);
  assert.equal(getVisibleModels(true, '').length, MODELS.length);
});

test('supported levels and request IDs are specific to each model', () => {
  for (const model of ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'claude-opus-5-5', 'claude-sonnet-5-5']) {
    assert.deepEqual(getReasoningLevels(model), ['low', 'medium', 'high']);
    for (const level of ['low', 'medium', 'high'] as const) {
      assert.equal(getRequestModelId(model, level), `${model}-${level}`);
    }
  }
  assert.deepEqual(getReasoningLevels('gemini-3.1-pro'), ['low', 'high']);
  assert.equal(getRequestModelId('gemini-3.1-pro', 'low'), 'gemini-3.1-pro-low');
  assert.equal(getRequestModelId('gemini-3.1-pro', 'high'), 'gemini-pro-agent');
  assert.deepEqual(getReasoningLevels('gpt-oss-120b'), []);
  assert.equal(getRequestModelId('gpt-oss-120b', 'high'), 'gpt-oss-120b-medium');
});

test('older Flash aliases use their original level mapping', () => {
  assert.equal(getRequestModelId('gemini-3.5-flash', 'low'), 'gemini-3.5-flash-extra-low');
  assert.equal(getRequestModelId('gemini-3.5-flash', 'medium'), 'gemini-3.5-flash-low');
  assert.equal(getRequestModelId('gemini-3.5-flash', 'high'), 'gemini-3-flash-agent');
  assert.deepEqual(normalizeModelSelection('gemini-3.5-flash-low'), { model_id: 'gemini-3.5-flash', reasoning_level: 'medium' });
});

test('migration preserves every old request ID and its encoded level', () => {
  const oldIds = [
    'gemini-4-argon-high', 'gemini-4-argon-medium', 'gemini-4-argon-low',
    'gemini-3.8-flash-high', 'gemini-3.8-flash-medium', 'gemini-3.8-flash-low',
    'gemini-3.7-flash-high', 'gemini-3.7-flash-medium', 'gemini-3.7-flash-low',
    'gemini-3.6-flash-high', 'gemini-3.6-flash-medium', 'gemini-3.6-flash-low',
    'gemini-3-flash-agent', 'gemini-3.5-flash-low', 'gemini-3.5-flash-extra-low', 'gemini-3-flash',
    'gemini-pro-agent', 'gemini-3.1-pro-low',
    'claude-opus-5-5-high', 'claude-opus-5-5-medium', 'claude-opus-5-5-low',
    'claude-sonnet-5-5-high', 'claude-sonnet-5-5-medium', 'claude-sonnet-5-5-low',
    'claude-sonnet-4-6', 'claude-opus-4-6-thinking', 'gpt-oss-120b-medium',
  ];
  for (const id of oldIds) {
    const config = normalizeModelConfig({ model_id: id, parameters: {} });
    assert.equal(getRequestModelId(config.model_id, config.reasoning_level), id);
    assert.deepEqual(normalizeModelConfig(config), config);
  }
});

test('invalid or missing levels fall back to the highest supported level; fixed models have no level', () => {
  assert.deepEqual(normalizeModelSelection('gemini-3.1-pro', 'medium'), { model_id: 'gemini-3.1-pro', reasoning_level: 'high' });
  assert.deepEqual(normalizeModelSelection('gemini-3.8-flash'), { model_id: 'gemini-3.8-flash', reasoning_level: 'high' });
  assert.deepEqual(normalizeModelSelection('gemini-4-argon'), { model_id: 'gemini-4-argon', reasoning_level: 'high' });
  assert.deepEqual(normalizeModelSelection('gpt-oss-120b', 'medium'), { model_id: 'gpt-oss-120b' });
  assert.equal(getRequestModelId('claude-opus-4-6'), 'claude-opus-4-6-thinking');
});

test('legacy reasoning overrides are removed without losing other parameters', () => {
  const legacy = { model_id: 'claude-sonnet-5-5-low', parameters: { thinking_level: 'high', thinking_tokens: 4096, temperature: 0.7, use_stream: true } };
  const config = normalizeModelConfig(legacy);
  assert.deepEqual(config, { model_id: 'claude-sonnet-5-5', reasoning_level: 'low', parameters: { temperature: 0.7, use_stream: true } });
  const generation = getGenerationConfig(legacy.parameters);
  assert.deepEqual(generation.thinkingConfig, { includeThoughts: true });
  assert.equal(generation.temperature, 0.7);
});

test('filtered lists preserve saved legacy and unknown IDs', () => {
  assert.equal(getVisibleModels(false, 'gemini-3.7-flash').length, 5);
  for (const id of ['gemini-3.1-pro', 'gpt-oss-120b']) {
    assert.ok(!getVisibleModels(false, '').some(model => model.id === id));
    assert.ok(getVisibleModels(true, '').some(model => model.id === id));
    assert.ok(getVisibleModels(false, id).some(model => model.id === id));
  }
  assert.equal(getVisibleModels(false, 'future-model').at(-1)?.id, 'future-model');
  assert.deepEqual(normalizeModelSelection('future-model', 'high'), { model_id: 'future-model' });
  assert.equal(getRequestModelId('future-model'), 'future-model');
});

test('unsupported penalties are removed for every Argon and Flash 3.8 request ID, while supported models retain them', () => {
  const params = { frequency_penalty: 0.5, presence_penalty: 0.6, temperature: 0.7 };
  for (const id of ['gemini-4-argon', 'gemini-3.8-flash']) {
    for (const requestId of [id, ...getReasoningLevels(id).map(level => getRequestModelId(id, level))]) {
      const generation = getGenerationConfig(params, requestId);
      assert.equal('frequencyPenalty' in generation, false);
      assert.equal('presencePenalty' in generation, false);
      assert.equal(generation.temperature, 0.7);
    }
  }
  for (const id of ['claude-opus-5-5-low', 'claude-sonnet-5-5-low', 'gpt-oss-120b-medium']) {
    const generation = getGenerationConfig(params, id);
    assert.equal(generation.frequencyPenalty, 0.5);
    assert.equal(generation.presencePenalty, 0.6);
  }
});


test('host defaults do not send unsupported Antigravity sampling fields; zero temperature is preserved', () => {
  const generation = getGenerationConfig({ repetition_penalty: 1, min_p: 0.1, temperature: 0, max_tokens: 256 });
  assert.equal(generation.temperature, 0);
  assert.equal(generation.maxOutputTokens, 256);
  assert.equal('repetitionPenalty' in generation, false);
  assert.equal('minP' in generation, false);
});
