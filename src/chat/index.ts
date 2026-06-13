import type { PluginV2ProviderArgument, PluginV2ProviderResult } from "../api";
import { Logger } from "../shared/logger";
import { ModelManager } from "../model";
import { RequestType } from "../shared/types";
import { parseRequestType } from "../shared/util";
import { applyPluginParams, getGenerationConfig, getPluginParams, getSafetySettings } from "./config";
import { parseGeminiChat } from "./format";
import { requestGenerateContent, requestGenerateStreamContent } from "./request";
import { handleResponse, handleStreamResponse } from "./response";

export async function handleRequest(args: PluginV2ProviderArgument, abortSignal?: AbortSignal): Promise<PluginV2ProviderResult> {
    const requestType = parseRequestType(args.mode);
    const config = ModelManager.getConfig(requestType);

    const model = config.model_id;
    const params = config.parameters;
    const pluginParams = getPluginParams(args);
    const newParams = applyPluginParams(params, pluginParams);

    const stream = newParams.use_stream === true && requestType === RequestType.Chat;
        
    const contents = parseGeminiChat(args.prompt_chat);
    const generationConfig = getGenerationConfig(newParams);
    const safetySettings = getSafetySettings();
    const activeTools = newParams.active_tools || [];
    const tools: any[] = [];

    if (activeTools.includes('google_search')) {
        tools.push({ google_search: {} });
    }
    if (activeTools.includes('googleMaps')) {
        tools.push({ googleMaps: {} });
    }
    if (activeTools.includes('url_context')) {
        tools.push({ url_context: {} });
    }
    if (activeTools.includes('code_execution')) {
        tools.push({ code_execution: {} });
    }

    const generateUUID = () => {
        try {
            if (typeof crypto !== 'undefined' && crypto.randomUUID) {
                return crypto.randomUUID();
            }
        } catch (e) {}
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const body = {
        model: model,
        requestType: 'agent',
        requestId: 'agent-' + generateUUID(),
        userAgent: 'antigravity',
        request: {
            contents: contents,
            generationConfig: generationConfig,
            safetySettings: safetySettings,
            tools,
        }
    };

    if (stream) {
        const res = await requestGenerateStreamContent(body, abortSignal);
        return await handleStreamResponse(res);
    } else {
        const res = await requestGenerateContent(body, abortSignal);
        return handleResponse(res);
    }
}
