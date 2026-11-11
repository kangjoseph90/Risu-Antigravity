import { RisuAPI } from '../api';
import { MODEL_CONFIG } from '../plugin';
import { AppEvent, eventEmitter } from '../shared/events';
import { DEFAULT_MODEL_ID } from './list';
import { migrateModelSettings, normalizeModelConfig, type ModelConfiguration, type ModelSettings } from './config';

export class ModelManager {
    private static settings: ModelSettings = { version: 2, models: {} };
    private static writes: Promise<void> = Promise.resolve();

    static { eventEmitter.on(AppEvent.BACKUP_RESTORE, () => { void this.init(); }); }

    static async init(): Promise<void> {
        await this.flush();
        const raw = await RisuAPI.getArg(MODEL_CONFIG);
        let parsed: unknown;
        try { parsed = raw ? JSON.parse(String(raw)) : {}; } catch { parsed = {}; }
        this.settings = migrateModelSettings(parsed);
    }

    static getConfig(modelId: string = DEFAULT_MODEL_ID): ModelConfiguration {
        return this.settings.models[modelId] ?? normalizeModelConfig({ model_id: modelId, parameters: {} });
    }

    static setConfig(modelId: string, config: ModelConfiguration): void {
        this.settings.models[modelId] = normalizeModelConfig({ ...config, model_id: modelId });
        const serialized = JSON.stringify(this.settings);
        this.writes = this.writes.catch(() => {}).then(() => RisuAPI.setArg(MODEL_CONFIG, serialized));
    }

    static flush(): Promise<void> { return this.writes; }
}
