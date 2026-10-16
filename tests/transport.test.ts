import assert from 'node:assert/strict';
import test from 'node:test';
import { getGenerationUserAgent } from '../src/antigravity/client';
import { MODELS, getRequestModelId, getReasoningLevels } from '../src/model/list';

test('every selectable Argon reasoning level uses a CLI client for generation', () => {
    for (const level of getReasoningLevels('gemini-4-argon')) {
        assert.match(getGenerationUserAgent(getRequestModelId('gemini-4-argon', level)), /^antigravity\/cli\//);
    }
});

test('other selectable models retain their existing IDE client', () => {
    for (const model of MODELS.filter(model => model.id !== 'gemini-4-argon')) {
        const levels = getReasoningLevels(model.id);
        for (const level of levels.length ? levels : [undefined]) {
            assert.match(getGenerationUserAgent(getRequestModelId(model.id, level)), /^antigravity\/ide\/2\.5\.5 /);
        }
    }
});

test('unrecognized or missing model IDs do not select Argon transport', () => {
    for (const model of [undefined, null, {}, 'future-model', 'gemini-4-argon-low-extra']) {
        assert.match(getGenerationUserAgent(model), /^antigravity\/ide\//);
    }
});
