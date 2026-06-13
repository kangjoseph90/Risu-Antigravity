export interface Model {
    id: string;
    displayName: string;
}

export const MODELS: Model[] = [
    { id: "gemini-3-flash", displayName: "Gemini 3 Flash" },
    { id: "gemini-3.5-flash-extra-low", displayName: "Gemini 3.5 Flash (Low)" },
    { id: "gemini-3.5-flash-low", displayName: "Gemini 3.5 Flash (Medium)" },
    { id: "gemini-3-flash-agent", displayName: "Gemini 3.5 Flash (High)" },
    { id: "gemini-3.1-pro-low", displayName: "Gemini 3.1 Pro (Low)" },
    { id: "gemini-pro-agent", displayName: "Gemini 3.1 Pro (High)" },
    { id: "claude-sonnet-4-6", displayName: "Claude Sonnet 4.6 (Thinking)" },
    { id: "claude-opus-4-6-thinking", displayName: "Claude Opus 4.6 (Thinking)" },
    { id: "gpt-oss-120b-medium", displayName: "GPT-OSS 120B (Medium)" },
];