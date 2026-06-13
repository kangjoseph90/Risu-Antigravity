/**
 * log,
 * error,
 * warn,
 * info,
 * debug
 */
export class Logger {
    static log(...message: any[]) {
        console.log("[Antigravity]", ...message);
    }
    static error(...message: any[]) {
        console.error("[Antigravity]", ...message);
    }   
    static warn(...message: any[]) {
        console.warn("[Antigravity]", ...message);
    }
    static info(...message: any[]) {
        console.info("[Antigravity]", ...message);
    }
    static debug(...message: any[]) {
        console.debug("[Antigravity]", ...message);
    }
}
