import assert from 'node:assert/strict';
import test from 'node:test';
import { RisuAPI } from '../src/api';
import { ModelManager } from '../src/model';
import { BackupManager } from '../src/shared/backup';
import { MODEL_CONFIG, QUICK_BACKUP } from '../src/plugin';
import { migrateModelSettings } from '../src/model/config';

const host = globalThis as typeof globalThis & { risuai: any };

test('v3 transport serializes JSON, forwards cancellation, suppresses sensitive host logs and preserves HTTP errors', async () => {
    const controller = new AbortController();
    let captured: any;
    host.risuai = { nativeFetch: async (_url: string, args: any) => {
        captured = args;
        return new Response(JSON.stringify({ error: { message: 'Forbidden' } }), { status: 403 });
    } };
    const result = await RisuAPI.risuFetch('https://example.test/generate', {
        body: { model: 'gemini-4-argon-low' }, headers: { Authorization: 'test-only' }, abortSignal: controller.signal,
    });
    assert.equal(captured.body, JSON.stringify({ model: 'gemini-4-argon-low' }));
    assert.equal(captured.signal, controller.signal);
    assert.equal(captured.logFetch, false);
    assert.equal(result.ok, false);
    assert.equal(result.status, 403);
    assert.deepEqual(result.data, { error: { message: 'Forbidden' } });
});

test('arguments use the v3 scoped API and await persistence; per-model saves cannot finish out of order', async () => {
    const values = new Map<string, unknown>();
    const keys: string[] = [];
    host.risuai = {
        getArgument: async (key: string) => values.get(key),
        setArgument: async (key: string, value: unknown) => {
            keys.push(key);
            await new Promise(resolve => setTimeout(resolve, 5));
            values.set(key, value);
        },
    };
    assert.equal(await RisuAPI.getArg('refresh_token'), undefined);
    await RisuAPI.setArg('is_logged_in', 1);
    assert.equal(await RisuAPI.getArg('is_logged_in'), 1);
    await ModelManager.init();
    ModelManager.setConfig('gemini-4-argon', { model_id: 'gemini-4-argon', reasoning_level: 'low', parameters: { temperature: 0.2 } });
    ModelManager.setConfig('gemini-4-argon', { model_id: 'gemini-4-argon', reasoning_level: 'high', parameters: { temperature: 0.7 } });
    ModelManager.setConfig('gemini-3.8-flash', { model_id: 'gemini-3.8-flash', reasoning_level: 'medium', parameters: { use_stream: true } });
    await ModelManager.flush();
    await ModelManager.init();
    assert.equal(ModelManager.getConfig('gemini-4-argon').parameters.temperature, 0.7);
    assert.equal(ModelManager.getConfig('gemini-3.8-flash').reasoning_level, 'medium');
    assert.equal(JSON.parse(String(values.get(MODEL_CONFIG))).version, 2);
    assert.ok(keys.every(key => !key.includes('::')));
});

test('legacy backups migrate to model profiles and retain conflicting request-type settings for recovery', () => {
    const legacy = {
        chat: { model_id: 'gemini-4-argon-low', parameters: { temperature: 0.2 } },
        memory: { model_id: 'gemini-3.8-flash-medium', parameters: { use_stream: false } },
        other: { model_id: 'gemini-4-argon-high', parameters: { temperature: 0.8 } },
    };
    const migrated = migrateModelSettings(legacy);
    assert.equal(migrated.models['gemini-4-argon'].reasoning_level, 'low');
    assert.equal(migrated.models['gemini-3.8-flash'].reasoning_level, 'medium');
    assert.deepEqual(migrated.legacyRequestConfigs, legacy);
    assert.deepEqual(migrateModelSettings(migrated), migrated);
    assert.deepEqual(migrateModelSettings(null), { version: 2, models: {} });
});


test('v1 backup JSON imports through async arguments and quick backups never recurse or use shared storage', async () => {
    const values = new Map<string, unknown>();
    host.risuai = {
        getArgument: async (key: string) => values.get(key),
        setArgument: async (key: string, value: unknown) => { values.set(key, value); },
    };
    const backup = { version: '1.0', timestamp: new Date().toISOString(), data: {
        is_logged_in: '1', access_token: 'test-only', refresh_token: 'test-refresh',
        model_config: JSON.stringify({ chat: { model_id: 'gemini-4-argon-low', parameters: { temperature: 0 } } }),
    } };
    ModelManager.setConfig('gemini-4-argon', { model_id: 'gemini-4-argon', reasoning_level: 'high', parameters: {} });
    assert.equal(await BackupManager.importBackupFromText(JSON.stringify(backup)), true);
    assert.equal(await RisuAPI.getArg('is_logged_in'), 1);
    assert.equal(ModelManager.getConfig('gemini-4-argon').reasoning_level, 'low');
    assert.equal(await BackupManager.backup(), true);
    const saved = JSON.parse(String(values.get(QUICK_BACKUP)));
    assert.equal(saved.data.access_token, 'test-only');
    assert.equal(QUICK_BACKUP in saved.data, false);
    assert.equal(await RisuAPI.getArg('constructor'), undefined);
    await RisuAPI.setArg('constructor', 'ignored');
    assert.equal(values.has('constructor'), false);
});
