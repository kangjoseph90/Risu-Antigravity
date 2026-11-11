import './style.css';
import { RisuAPI } from './api';
import { ModelManager } from './model';
import { MODELS } from './model/list';
import { handleRequest } from './chat';
import { UI } from './ui';

async function initialize(): Promise<void> {
    await ModelManager.init();
    const ui = new UI();
    await ui.initialize();
    for (const model of MODELS) {
        const name = `[Antigravity] ${model.displayName}`;
        await RisuAPI.addProvider(name, (args, signal) => handleRequest(args, signal, model.id), {
            tokenizer: 'gemma',
            model: {
                name, shortName: model.displayName, fullName: name,
                // RisuAI v2026.10.295: image input, full system prompt, streaming.
                flags: model.id === 'gpt-oss-120b' ? [6, 8] : [0, 6, 8],
                tokenizer: 9,
                parameters: ['temperature', 'top_p', 'frequency_penalty', 'presence_penalty', 'top_k'],
            },
        });
    }
    window.addEventListener('pagehide', () => ui.destroy(), { once: true });
}

void initialize().catch(error => console.error('Antigravity initialization failed:', error));
