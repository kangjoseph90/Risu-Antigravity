
import { RisuAPI } from '../api';
import { MODEL_CONFIG } from '../plugin';
import { AppEvent, eventEmitter } from '../shared/events';
import { RequestType, type ModelParameters } from '../shared/types';
import { debounce } from '../shared/util';

type ModelConfig = {
    [K in RequestType]?: {
        model_id: string;
        parameters: ModelParameters;
    };
};

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
        } catch (e) {
            this.config = {};
            this.debouncedSave();
        }
    }

    static getConfig(type: RequestType): { model_id: string; parameters: ModelParameters } {
        if (!this.config[type]) {
            this.config[type] = { model_id: "gemini-3-flash", parameters: {} as ModelParameters };
            this.debouncedSave();
        }
        return this.config[type]
    }

    static setConfig(type: RequestType, { model_id, parameters }: { model_id: string; parameters: ModelParameters }) {
        this.config[type] = { model_id, parameters };
        this.debouncedSave();
    }

}