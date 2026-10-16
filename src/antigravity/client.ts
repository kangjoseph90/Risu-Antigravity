const LEGACY_IDE_USER_AGENT = 'antigravity/ide/2.5.5 (aidev_client; os_type=windows; arch=amd64)';
const ARGON_USER_AGENT = 'antigravity/cli/1.3.6 (aidev_client; os_type=windows; arch=amd64; auth_method=consumer)';

export function getGenerationUserAgent(model: unknown): string {
    // Argon is served to CLI/app clients; the legacy IDE client gets HTTP 404.
    const isArgon = typeof model === 'string'
        && /^gemini-4-argon(?:-(?:low|medium|high))?$/.test(model);
    return isArgon ? ARGON_USER_AGENT : LEGACY_IDE_USER_AGENT;
}
