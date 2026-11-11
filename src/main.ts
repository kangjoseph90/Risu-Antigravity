import './style.css';
import { RisuAPI } from './api';
import { ModelManager } from './model';
import { registerProviders } from './chat/providers';
import { UI } from './ui';

async function initialize(): Promise<void> {
    await ModelManager.init();
    const ui = new UI();
    await ui.initialize();
    await registerProviders();
    window.addEventListener('pagehide', () => ui.destroy(), { once: true });
}

void initialize().catch(error => console.error('Antigravity initialization failed:', error));
