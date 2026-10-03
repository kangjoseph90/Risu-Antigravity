import type { PluginV2ProviderArgument } from "../api";
import type { ModelParameters, PluginParameters } from "../shared/types";


export function getPluginParams(args: PluginV2ProviderArgument): PluginParameters {
    return {
        frequency_penalty: args.frequency_penalty,
        presence_penalty: args.presence_penalty,
        repetition_penalty: args.repetition_penalty,
        min_p: args.min_p,
        top_k: args.top_k,
        top_p: args.top_p,
        temperature: args.temperature,
        max_tokens: args.max_tokens,
    }
}

export function applyPluginParams(params: ModelParameters, pluginParams: PluginParameters): ModelParameters {
    const newParams = { ...params };
    for (const [key, value] of Object.entries(pluginParams)) {
        if (value !== undefined && !(key in newParams)) {
            (newParams as any)[key] = value;
        }
    }
    return newParams;
}

export function getGenerationConfig(params: ModelParameters): any {
    const generationConfig: any = {};

    if (params.frequency_penalty) generationConfig.frequencyPenalty = params.frequency_penalty;
    if (params.presence_penalty) generationConfig.presencePenalty = params.presence_penalty;
    if (params.repetition_penalty) generationConfig.repetitionPenalty = params.repetition_penalty;
    if (params.min_p) generationConfig.minP = params.min_p;
    if (params.top_k) generationConfig.topK = params.top_k;
    if (params.top_p) generationConfig.topP = params.top_p;
    if (params.temperature) generationConfig.temperature = params.temperature;
    if (params.max_tokens) generationConfig.maxOutputTokens = params.max_tokens;
    if (params.seed !== undefined) generationConfig.seed = params.seed;

    generationConfig.thinkingConfig = { includeThoughts: true };
    if (params.media_resolution) generationConfig.mediaResolution = params.media_resolution;
    if (params.stop_sequences) generationConfig.stopSequences = params.stop_sequences;

    return generationConfig;
}

export function getSafetySettings(): any {
    return [
        {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_NONE"
        },
        {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_NONE"
        },
        {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_NONE"
        },
        {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_NONE"
        },
        {
            category: "HARM_CATEGORY_CIVIC_INTEGRITY",
            threshold: "BLOCK_NONE"
        }
    ]
}
