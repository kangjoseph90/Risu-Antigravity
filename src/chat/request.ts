import type { GlobalFetchResult } from "../api";
import { AntigravityManager } from "../antigravity";

export async function requestGenerateContent(body: any, abortSignal?: AbortSignal): Promise<GlobalFetchResult> {
    return AntigravityManager.risuFetchAntigravity('generateContent', {
        method: 'POST',
        body: body,
        headers: { 'Content-Type': 'application/json' },
        abortSignal: abortSignal
    });
}

export async function requestGenerateStreamContent(body: any, abortSignal?: AbortSignal): Promise<Response> {
    return AntigravityManager.nativeFetchAntigravity('streamGenerateContent?alt=sse', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
        signal: abortSignal
    });
}
