import { 
    IS_LOGGED_IN, 
    ACCESS_TOKEN, 
    ACCESS_TOKEN_EXPIRES, 
    REFRESH_TOKEN, 
    PROJECT_ID,
    SERVICE_TIER,
    OPT_OUT
} from "../plugin";
import { RisuAPI } from "../api";
import { Logger } from "../shared/logger";
import { prompt } from "../ui/popup";
import { eventEmitter, AppEvent } from "../shared/events";

const CLIENT_ID =
  '1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/cclog',
  'https://www.googleapis.com/auth/experimentsandconfigs',
].join(' ');

function base64UrlEncode(array: Uint8Array): string {
    let binary = '';
    const len = array.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(array[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

function getCrypto(): any {
    if (typeof window !== 'undefined' && window.crypto) {
        return window.crypto;
    }
    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
        return globalThis.crypto;
    }
    if (typeof crypto !== 'undefined') {
        return crypto;
    }
    return null;
}

function getRandomValues(array: Uint8Array): Uint8Array {
    const c = getCrypto();
    if (c && typeof c.getRandomValues === 'function') {
        c.getRandomValues(array);
    } else {
        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    return array;
}

function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    getRandomValues(array);
    return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const c = getCrypto();
    if (c && c.subtle && typeof c.subtle.digest === 'function') {
        const hashBuffer = await c.subtle.digest('SHA-256', data);
        return base64UrlEncode(new Uint8Array(hashBuffer));
    }
    throw new Error('Web Crypto Subtle digest (SHA-256) is not supported in this environment.');
}

function generateState(): string {
    const array = new Uint8Array(16);
    getRandomValues(array);
    return base64UrlEncode(array);
}

export class AuthManager {
    private static userProfileCache: any = null;

    static {
        eventEmitter.on(AppEvent.BACKUP_RESTORE, () => this.userProfileCache = null);
        eventEmitter.on(AppEvent.USER_LOGOUT, () => this.userProfileCache = null);
    }

    static async getAccessToken(): Promise<string> {
        if (!this.isLoggedIn()) {
            throw new Error('User is not logged in');
        }
        const accessToken = RisuAPI.getArg(ACCESS_TOKEN) as string;
        const accessTokenExpiresStr = RisuAPI.getArg(ACCESS_TOKEN_EXPIRES) as string;

        if (!accessToken || !accessTokenExpiresStr) {
             return await this.login();
        }

        const accessTokenExpires = new Date(accessTokenExpiresStr);
        
        // Check if expired (with 1 minute buffer)
        if (new Date().getTime() + 60 * 1000 < accessTokenExpires.getTime()) {
            return accessToken;
        }

        // Access token expired, try to refresh using Refresh Token
        try {
            Logger.log('Token expired, refreshing...');
            return await this.refreshAccessToken();
        } catch (e) {
            Logger.log('Refresh failed, prompting user...', e);
            // If refresh fails, request new login
            return await this.login();
        }
    }

    static isLoggedIn(): boolean {
        return (RisuAPI.getArg(IS_LOGGED_IN) as number) === 1;
    }

    static async login(): Promise<string> {
        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);
        const state = generateState();

        return new Promise((resolve, reject) => {
            // Use localhost redirect which is allowed for Native clients
            const redirectUri = 'http://localhost:3000/oauth2callback';
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent&code_challenge=${challenge}&code_challenge_method=S256&state=${state}`;
            try {
                const width = 600;
                const height = 600;
                const screenWidth = (typeof window !== 'undefined' && window.screen) ? window.screen.width : 1920;
                const screenHeight = (typeof window !== 'undefined' && window.screen) ? window.screen.height : 1080;
                const left = screenWidth / 2 - width / 2;
                const top = screenHeight / 2 - height / 2;
                
                if (typeof window !== 'undefined' && typeof window.open === 'function') {
                    window.open(
                        authUrl,
                        'google_auth',
                        `width=${width},height=${height},top=${top},left=${left}`
                    );
                }
            } catch (e) {
                Logger.error('Failed to open auth window', e);
            }

            setTimeout(async () => {
                const message = `Log in to Google and PASTE the full URL you were redirected to.

If the window did not open, please copy the URL below and open it in your browser:
<a href="${authUrl}" target="_blank" class="block p-2 bg-zinc-950 rounded border border-zinc-800 break-all select-all cursor-pointer font-mono text-xs my-2 text-zinc-400 hover:text-zinc-300">${authUrl}</a>`;
                const pastedUrl = await prompt(message);

                if (pastedUrl) {
                    try {
                        // Handle both full URL and just the code
                        let code = pastedUrl.trim();
                        
                        if (code.includes('code=')) {
                            // Extract code from URL
                            const match = code.match(/[?&]code=([^&]+)/);
                            if (match) {
                                code = match[1];
                            } else {
                                reject(new Error("Could not find code in URL"));
                                return;
                            }
                        }
                        
                        if (code && code.length > 10) {
                            // We must use the SAME redirect_uri for exchange
                            AuthManager.exchangeCodeForToken(code, redirectUri, verifier)
                                .then(tokens => resolve(tokens.access_token))
                                .catch(e => reject(e));
                        } else {
                            reject(new Error("Could not find valid code"));
                        }
                    } catch (e) {
                        Logger.error('Login error:', e);
                        reject(new Error(`Invalid URL or code: ${e}`));
                    }
                } else {
                    reject(new Error("Login cancelled"));
                }
            }, 100);
        });
    }

    private static async exchangeCodeForToken(code: string, redirectUri: string, codeVerifier: string): Promise<any> {
        const params = new URLSearchParams();
        params.append('code', code);
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('redirect_uri', redirectUri);
        params.append('grant_type', 'authorization_code');
        params.append('code_verifier', codeVerifier);

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to exchange code for token: ${errorText}`);
        }

        const tokens = await response.json();
        this.saveTokens(tokens);
        return tokens;
    }

    private static async refreshAccessToken(): Promise<string> {
        const refreshToken = RisuAPI.getArg(REFRESH_TOKEN) as string;
        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        const params = new URLSearchParams();
        params.append('refresh_token', refreshToken);
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('grant_type', 'refresh_token');

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to refresh token: ${errorText}`);
        }

        const tokens = await response.json();
        this.saveTokens(tokens);
        return tokens.access_token;
    }

    private static saveTokens(tokens: any) {
        const expiresIn = tokens.expires_in; // seconds
        const expiresAt = new Date(new Date().getTime() + expiresIn * 1000);
        
        RisuAPI.setArg(IS_LOGGED_IN, 1);
        RisuAPI.setArg(ACCESS_TOKEN, tokens.access_token);
        RisuAPI.setArg(ACCESS_TOKEN_EXPIRES, expiresAt.toISOString());
        
        if (tokens.refresh_token) {
            RisuAPI.setArg(REFRESH_TOKEN, tokens.refresh_token);
        }
    }

    static logout(): void {
        this.userProfileCache = null;
        RisuAPI.setArg(IS_LOGGED_IN, 0);
        RisuAPI.setArg(ACCESS_TOKEN, '');
        RisuAPI.setArg(ACCESS_TOKEN_EXPIRES, '');
        RisuAPI.setArg(REFRESH_TOKEN, '');
        RisuAPI.setArg(PROJECT_ID, '');
        RisuAPI.setArg(SERVICE_TIER, '');
        RisuAPI.setArg(OPT_OUT, 0);

        // Emit logout event
        eventEmitter.emit(AppEvent.USER_LOGOUT);
    }

    static async fetchUserProfile(): Promise<any> {
        if (this.userProfileCache) {
            return this.userProfileCache;
        }
        try {
            const token = await this.getAccessToken();
            const res = await fetch(
                "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.ok) {
                this.userProfileCache = await res.json();
                return this.userProfileCache;
            }
        } catch (e) {
            Logger.error("Failed to fetch user profile:", e);
        }
        return null;
    }
}
