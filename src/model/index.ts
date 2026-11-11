import { RisuAPI } from '../api';
import { MODEL_CONFIG } from '../plugin';
import { RequestType, type ConfiguredRequestType } from '../shared/types';
import { DEFAULT_MODEL_ID } from './list';
import { migrateModelSettings, normalizeModelConfig, type ModelConfiguration, type ModelSettings } from './config';

export class ModelManager {
    private static settings: ModelSettings = { version: 3, requests: {} };
    private static writes: Promise<void> = Promise.resolve();

    static async init(): Promise<void> {
        await this.flush();
        const raw = await RisuAPI.getArg(MODEL_CONFIG);
        let parsed: unknown;
        try { parsed = raw ? JSON.parse(String(raw)) : {}; } catch { parsed = {}; }
        this.settings = migrateModelSettings(parsed);
    }

    static getConfig(type: ConfiguredRequestType = RequestType.Chat): ModelConfiguration {
        return this.settings.requests[type] ?? normalizeModelConfig({ model_id: DEFAULT_MODEL_ID, parameters: {} });
    }

    static setConfig(type: ConfiguredRequestType, config: ModelConfiguration): void {
        this.settings.requests[type] = normalizeModelConfig(config);
        const serialized = JSON.stringify(this.settings);
        this.writes = this.writes.catch(() => {}).then(() => RisuAPI.setArg(MODEL_CONFIG, serialized));
    }

    static flush(): Promise<void> { return this.writes; }
}
