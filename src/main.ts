//@ts-ignore
import './style.css';
import { RisuAPI } from './api';
import { AuthManager } from './auth';
import { ModelManager } from './model';
import { handleRequest } from './chat';
import { UI } from './ui';

/* Plugin Entry */

ModelManager.init();

RisuAPI.addProvider('[Google] Antigravity', handleRequest, { tokenizer: 'gemma' });

const ui = new UI()

// Cleanup OpenButton on unload
RisuAPI.onUnload(() => {
    ui.destroy();
})

