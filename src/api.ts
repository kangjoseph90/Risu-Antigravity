import { RISU_ARGS, RisuArgType } from './plugin'

const SETTINGS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="-4 -4.5 61.793579 61.793579" fill="currentColor" aria-hidden="true"><g transform="translate(153.99875 -167.7638)"><path d="m-105.26502 216.1732c3.00216 2.25163 7.505419.75057 3.3774-3.37739-12.3838-12.00856-9.75696-45.032-25.14285-45.032-15.38595 0-12.75911 33.02344-25.14291 45.032-4.50319 4.50319.37525 5.62902 3.3774 3.37739 11.63331-7.88059 10.88276-21.76543 21.76551-21.76543 10.88269 0 10.1322 13.88484 21.76545 21.76543z"/></g></svg>`;

export interface GlobalFetchArgs {
  plainFetchForce?: boolean;
  plainFetchDeforce?: boolean;
  body?: any;
  headers?: { [key: string]: string };
  rawResponse?: boolean;
  method?: 'POST' | 'GET';
  abortSignal?: AbortSignal;
  useRisuToken?: boolean;
  chatId?: string;
}

export interface GlobalFetchResult {
  ok: boolean;
  data: any;
  headers: { [key: string]: string };
  status: number;
}

export interface NativeFetchArgs {
    body?:string|Uint8Array|ArrayBuffer,
    headers?:{[key:string]:string},
    method?:"POST"|"GET"|"PUT"|"DELETE",
    signal?:AbortSignal,
    useRisuTk?:boolean,
    chatId?:string
}

export interface MultiModal{
    type:'image'|'video'|'audio'
    base64:string,
    height?:number,
    width?:number
}

export interface OpenAIChat{
    role: 'system'|'user'|'assistant'|'function'
    content: string
    memo?:string
    name?:string
    removable?:boolean
    attr?:string[]
    multimodals?: MultiModal[]
    thoughts?: string[]
    cachePoint?: boolean
}

export type PluginV2ProviderArgument = {
    prompt_chat: OpenAIChat[] 
    frequency_penalty: number
    min_p: number
    presence_penalty: number
    repetition_penalty: number
    top_k: number
    top_p: number
    temperature: number
    mode: string
    max_tokens: number
}

export type PluginV2ProviderOptions = {
    tokenizer?: string
    tokenizerFunc?: (content: string) => number[] | Promise<number[]>
    model?: { name: string; shortName: string; fullName: string; flags: number[]; tokenizer?: number; parameters: string[] }
}

export type PluginV2ProviderResult = {
    success: boolean
    content: string | ReadableStream
}

interface PluginAPI {
    nativeFetch(url: string, args: NativeFetchArgs & { logFetch?: boolean }): Promise<Response>;
    getArgument(name: string): Promise<string | number | undefined>;
    setArgument(name: string, value: string | number): Promise<void>;
    addProvider(name: string, callback: (args: PluginV2ProviderArgument, signal?: AbortSignal) => Promise<PluginV2ProviderResult>, options?: PluginV2ProviderOptions): Promise<void>;
    registerSetting(name: string, callback: () => void | Promise<void>, icon?: string, iconType?: string, id?: string): Promise<{ id: string }>;
    showContainer(mode: 'fullscreen'): Promise<void>;
    hideContainer(): Promise<void>;

}

declare const risuai: PluginAPI;

/** The only bridge to the host. UI components use their own iframe document. */
export class RisuAPI {
    static async risuFetch(url: string, args: GlobalFetchArgs = {}): Promise<GlobalFetchResult> {
        const response = await this.nativeFetch(url, {
            method: args.method ?? 'POST',
            headers: args.headers,
            body: typeof args.body === 'string' ? args.body : args.body === undefined ? undefined : JSON.stringify(args.body),
            signal: args.abortSignal,
        });
        const text = await response.text();
        let data: unknown = text;
        try { data = JSON.parse(text); } catch { /* Some errors are plain text. */ }
        return { ok: response.ok, status: response.status, data, headers: Object.fromEntries(response.headers.entries()) };
    }

    static nativeFetch(url: string, args: NativeFetchArgs): Promise<Response> {
        // Google authentication and chat contents must not enter the host fetch log.
        return risuai.nativeFetch(url, { ...args, method: args.method ?? 'GET', logFetch: false });
    }

    static async getArg(name: string): Promise<string | number | undefined> {
        if (!Object.prototype.hasOwnProperty.call(RISU_ARGS, name)) return undefined;
        const value = await risuai.getArgument(name);
        if (value === undefined || value === null) return undefined;
        return RISU_ARGS[name] === RisuArgType.Int ? Number(value) : String(value);
    }

    static async setArg(name: string, value: string | number): Promise<void> {
        if (!Object.prototype.hasOwnProperty.call(RISU_ARGS, name)) return;
        await risuai.setArgument(name, RISU_ARGS[name] === RisuArgType.Int ? Number(value) : String(value));
    }

    static addProvider(name: string, callback: (args: PluginV2ProviderArgument, signal?: AbortSignal) => Promise<PluginV2ProviderResult>, options?: PluginV2ProviderOptions): Promise<void> {
        return risuai.addProvider(name, callback, options);
    }

    static registerSetting(callback: () => void | Promise<void>): Promise<{ id: string }> {
        return risuai.registerSetting('Antigravity', callback, SETTINGS_ICON, 'html', 'risu-antigravity-settings');
    }

    static showContainer(): Promise<void> { return risuai.showContainer('fullscreen'); }
    static hideContainer(): Promise<void> { return risuai.hideContainer(); }
}
