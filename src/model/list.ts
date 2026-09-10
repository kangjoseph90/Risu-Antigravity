export interface Model {
  id: string;
  displayName: string;
}

export const MODELS: Model[] = [
  // Gemini Flash (newest → oldest, High → Low)
  { id: "gemini-3.8-flash-high", displayName: "Gemini 3.8 Flash (High)" },
  { id: "gemini-3.8-flash-medium", displayName: "Gemini 3.8 Flash (Medium)" },
  { id: "gemini-3.8-flash-low", displayName: "Gemini 3.8 Flash (Low)" },
  { id: "gemini-3.7-flash-high", displayName: "Gemini 3.7 Flash (High)" },
  { id: "gemini-3.7-flash-medium", displayName: "Gemini 3.7 Flash (Medium)" },
  { id: "gemini-3.7-flash-low", displayName: "Gemini 3.7 Flash (Low)" },
  { id: "gemini-3.6-flash-high", displayName: "Gemini 3.6 Flash (High)" },
  { id: "gemini-3.6-flash-medium", displayName: "Gemini 3.6 Flash (Medium)" },
  { id: "gemini-3.6-flash-low", displayName: "Gemini 3.6 Flash (Low)" },
  { id: "gemini-3-flash-agent", displayName: "Gemini 3.5 Flash (High)" },
  { id: "gemini-3.5-flash-low", displayName: "Gemini 3.5 Flash (Medium)" },
  { id: "gemini-3.5-flash-extra-low", displayName: "Gemini 3.5 Flash (Low)" },
  { id: "gemini-3-flash", displayName: "Gemini 3 Flash" },
  // Gemini Pro
  { id: "gemini-pro-agent", displayName: "Gemini 3.1 Pro (High)" },
  { id: "gemini-3.1-pro-low", displayName: "Gemini 3.1 Pro (Low)" },
  // Claude
  { id: "claude-sonnet-4-6", displayName: "Claude Sonnet 4.6 (Thinking)" },
  { id: "claude-opus-4-6-thinking", displayName: "Claude Opus 4.6 (Thinking)" },
  // GPT
  { id: "gpt-oss-120b-medium", displayName: "GPT-OSS 120B (Medium)" },
];
