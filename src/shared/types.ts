export enum RequestType {
    Chat = 'chat',
    Memory = 'memory',
    Emotion = 'emotion',
    Translate = 'translate',
    Other = 'other',
    Unknown = 'unknown',
}

export const REQUEST_TYPES = [RequestType.Chat, RequestType.Memory, RequestType.Emotion, RequestType.Translate, RequestType.Other] as const;
export type ConfiguredRequestType = typeof REQUEST_TYPES[number];
export function getRequestTypeLabel(type: ConfiguredRequestType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
}

export interface PluginParameters {
    frequency_penalty?: number
    presence_penalty?: number
    repetition_penalty?: number
    min_p?: number
    top_k?: number
    top_p?: number
    temperature?: number
    max_tokens?: number
}

export type ReasoningLevel = 'low' | 'medium' | 'high';

export interface ModelParameters extends PluginParameters {
    media_resolution?: 'media_resolution_low' | 'media_resolution_medium' | 'media_resolution_high'
    stop_sequences?: string[]
    use_stream?: boolean
    active_tools?: ('google_search' | 'googleMaps' | 'url_context' | 'code_execution')[]
    seed?: number
}
