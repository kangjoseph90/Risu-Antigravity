import assert from 'node:assert/strict';
import test from 'node:test';
import { RisuAPI } from '../src/api';
import { ModelManager } from '../src/model';
import { BackupManager } from '../src/shared/backup';
import { MODEL_CONFIG, QUICK_BACKUP } from '../src/plugin';
import { migrateModelSettings } from '../src/model/config';
import { RequestType } from '../src/shared/types';
import { registerProviders } from '../src/chat/providers';

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

test('arguments use the v3 scoped API and await persistence; request-tab saves cannot finish out of order', async () => {
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
    ModelManager.setConfig(RequestType.Chat, { model_id: 'gemini-4-argon', reasoning_level: 'low', parameters: { temperature: 0.2 } });
    ModelManager.setConfig(RequestType.Chat, { model_id: 'gemini-4-argon', reasoning_level: 'high', parameters: { temperature: 0.7 } });
    ModelManager.setConfig(RequestType.Memory, { model_id: 'gemini-3.8-flash', reasoning_level: 'medium', parameters: { use_stream: true } });
    await ModelManager.flush();
    await ModelManager.init();
    assert.equal(ModelManager.getConfig(RequestType.Chat).parameters.temperature, 0.7);
    assert.equal(ModelManager.getConfig(RequestType.Memory).reasoning_level, 'medium');
    assert.equal(JSON.parse(String(values.get(MODEL_CONFIG))).version, 3);
    assert.ok(keys.every(key => !key.includes('::')));
});

test('request tabs preserve distinct legacy settings, including two uses of the same model', () => {
    const legacy = {
        chat: { model_id: 'gemini-4-argon-low', parameters: { temperature: 0.2 } },
        memory: { model_id: 'gemini-3.8-flash-medium', parameters: { use_stream: false } },
        other: { model_id: 'gemini-4-argon-high', parameters: { temperature: 0.8 } },
    };
    const migrated = migrateModelSettings(legacy);
    assert.equal(migrated.requests.chat?.reasoning_level, 'low');
    assert.equal(migrated.requests.memory?.reasoning_level, 'medium');
    assert.equal(migrated.requests.other?.parameters.temperature, 0.8);
    assert.deepEqual(migrateModelSettings(migrated), migrated);
    assert.deepEqual(migrateModelSettings(null), { version: 3, requests: {} });
    const beta = { version: 2, models: {
        'gemini-4-argon': { model_id: 'gemini-4-argon', parameters: { temperature: 1 } },
    }, legacyRequestConfigs: legacy };
    const fromBeta = migrateModelSettings(beta);
    assert.deepEqual(fromBeta.requests, migrated.requests);
    assert.deepEqual(fromBeta.previousModelConfigs, beta.models);
    const onlyBeta = migrateModelSettings({ version: 2, models: {
        'gemini-3.8-flash': { model_id: 'gemini-3.8-flash', reasoning_level: 'low', parameters: { use_stream: true } },
    } });
    assert.equal(onlyBeta.requests.chat?.reasoning_level, 'low');
    assert.equal(onlyBeta.requests.memory, undefined);
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
    ModelManager.setConfig(RequestType.Chat, { model_id: 'gemini-4-argon', reasoning_level: 'high', parameters: {} });
    assert.equal(await BackupManager.importBackupFromText(JSON.stringify(backup)), true);
    assert.equal(await RisuAPI.getArg('is_logged_in'), 1);
    assert.equal(ModelManager.getConfig(RequestType.Chat).reasoning_level, 'low');
    assert.equal(await BackupManager.backup(), true);
    const saved = JSON.parse(String(values.get(QUICK_BACKUP)));
    assert.equal(saved.data.access_token, 'test-only');
    assert.equal(QUICK_BACKUP in saved.data, false);
    assert.equal(await RisuAPI.getArg('constructor'), undefined);
    await RisuAPI.setArg('constructor', 'ignored');
    assert.equal(values.has('constructor'), false);
});

test('fixed providers route v3 requests to independent tabs and read changed settings without re-registering', async () => {
    const values = new Map<string, unknown>([
        ['is_logged_in', 1], ['access_token', 'test-only'], ['access_token_expires', '2030-01-01T00:00:00Z'],
        ['project_id', 'test-project'], ['service_tier', 'paid-tier'], ['opt_out', 1],
    ]);
    const providers = new Map<string, Function>();
    const sent: {url: string; body: any; signal?: AbortSignal}[] = [];
    const envelope = { response: { candidates: [{ content: { parts: [{ text: 'ROUTED_OK' }] } }] } };
    host.risuai = {
        getArgument: async (key: string) => values.get(key),
        setArgument: async (key: string, value: unknown) => { values.set(key, value); },
        addProvider: async (name: string, callback: Function) => { providers.set(name, callback); },
        nativeFetch: async (url: string, args: any) => {
            sent.push({url, body: JSON.parse(args.body), signal: args.signal});
            return url.includes('streamGenerateContent')
                ? new Response('data: '+JSON.stringify(envelope)+'\n\n', { headers: {'Content-Type':'text/event-stream'} })
                : Response.json(envelope);
        },
    };
    await ModelManager.init();
    ModelManager.setConfig(RequestType.Chat, {model_id:'gemini-4-argon',reasoning_level:'low',parameters:{temperature:0,use_stream:false}});
    ModelManager.setConfig(RequestType.Memory, {model_id:'gemini-3.8-flash',reasoning_level:'low',parameters:{temperature:0.7,use_stream:true}});
    await ModelManager.flush();
    await registerProviders();
    assert.deepEqual([...providers.keys()], ['Chat','Memory','Emotion','Translate','Other'].map(x=>'[Antigravity] '+x));
    const args = {mode:'v3',prompt_chat:[{role:'user',content:'Test'}],temperature:1,max_tokens:64};
    const controller = new AbortController();
    const chat = await providers.get('[Antigravity] Chat')!(args, controller.signal);
    assert.equal(chat.content, 'ROUTED_OK');
    const memory = await providers.get('[Antigravity] Memory')!(args, controller.signal);
    const read = async (stream: ReadableStream<string>) => {
        let content=''; const reader=stream.getReader();
        while(true) { const next=await reader.read(); if(next.done) break; content+=next.value; }
        return content;
    };
    assert.equal(await read(memory.content), 'ROUTED_OK');
    assert.equal(sent[0].body.model, 'gemini-4-argon-low');
    assert.equal(sent[0].body.request.generationConfig.temperature, 0);
    assert.ok(sent[0].url.endsWith(':generateContent'));
    assert.equal(sent[1].body.model, 'gemini-3.8-flash-low');
    assert.equal(sent[1].body.request.generationConfig.temperature, 0.7);
    assert.ok(sent[1].url.endsWith(':streamGenerateContent?alt=sse'));
    assert.equal(sent[1].signal, controller.signal);
    ModelManager.setConfig(RequestType.Chat, {model_id:'gemini-3.8-flash',reasoning_level:'high',parameters:{use_stream:true}});
    assert.equal(await read((await providers.get('[Antigravity] Chat')!(args)).content), 'ROUTED_OK');
    assert.equal(sent[2].body.model, 'gemini-3.8-flash-high');
    assert.ok(sent[2].url.includes(':streamGenerateContent'));
    assert.equal(providers.size, 5);
    await ModelManager.flush();
});
