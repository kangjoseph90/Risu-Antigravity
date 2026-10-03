
import { RisuAPI } from '../api';
import { MODEL_CONFIG } from '../plugin';
import { AppEvent, eventEmitter } from '../shared/events';
import { RequestType } from '../shared/types';
import { debounce } from '../shared/util';
import { DEFAULT_MODEL_ID } from './list';
import { normalizeModelConfig, type ModelConfiguration } from './config';

type ModelConfig = Partial<Record<RequestType, ModelConfiguration>>;

export class ModelManager {
    private static config: ModelConfig = {};
    private static readonly DEBOUNCE_WAIT = 500;

    static {
        eventEmitter.on(AppEvent.BACKUP_RESTORE, () => this.init())
    }

    private static debouncedSave = debounce(() => {
        RisuAPI.setArg(MODEL_CONFIG, JSON.stringify(ModelManager.config));
    }, ModelManager.DEBOUNCE_WAIT);

    static init() {
        try {
            const storedMap = RisuAPI.getArg(MODEL_CONFIG) as string;
            this.config = storedMap ? JSON.parse(storedMap) : {};
            const before = JSON.stringify(this.config);
            for (const type of Object.values(RequestType)) {
                const config = this.config[type];
                if (config) this.config[type] = normalizeModelConfig(config);
            }
            if (before !== JSON.stringify(this.config)) this.debouncedSave();
        } catch (e) {
            this.config = {};
            this.debouncedSave();
        }
    }

    static getConfig(type: RequestType): ModelConfiguration {
        if (!this.config[type]) {
            this.config[type] = normalizeModelConfig({ model_id: DEFAULT_MODEL_ID, parameters: {} });
            this.debouncedSave();
        }
        return this.config[type]!
    }

    static setConfig(type: RequestType, config: ModelConfiguration) {
        this.config[type] = normalizeModelConfig(config);
        this.debouncedSave();
    }

}
