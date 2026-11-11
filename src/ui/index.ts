import Modal from './Modal.svelte';
import { Popup } from './popup';
import { RisuAPI } from '../api';
import { ModelManager } from '../model';

export class UI {
    private modal: Modal | null = null;
    private readonly root = document.createElement('div');
    private readonly container = document.createElement('div');
    private readonly popupContainer = document.createElement('div');
    private readonly popup: Popup;

    constructor() {
        this.root.id = 'risu-antigravity-container';
        this.root.append(this.container, this.popupContainer);
        document.body.append(this.root);
        this.popup = new Popup({ target: this.popupContainer });
    }

    async initialize(): Promise<void> {
        await RisuAPI.registerSetting(() => this.open());
    }

    async open(): Promise<void> {
        await ModelManager.init();
        if (!this.modal) {
            this.modal = new Modal({ target: this.container, props: { onClose: () => { void this.close(); } } });
        }
        await RisuAPI.showContainer();
    }

    async close(): Promise<void> {
        this.modal?.$destroy();
        this.modal = null;
        await ModelManager.flush();
        await RisuAPI.hideContainer();
    }

    destroy(): void {
        this.modal?.$destroy();
        this.popup.$destroy();
        this.root.remove();
    }
}
