import { AuthManager } from '../auth';
import { RisuAPI } from '../api';
import type { NativeFetchArgs, GlobalFetchArgs, GlobalFetchResult } from '../api';
import { PROJECT_ID, SERVICE_TIER, OPT_OUT, CREDIT_OVERAGE } from '../plugin';
import { Logger } from '../shared/logger';
import { eventEmitter, AppEvent } from '../shared/events';

export class AntigravityManager {
    private static projectId: string | undefined;
    private static serviceTier: string | undefined;
    private static optOut: boolean | undefined;

    static {
        eventEmitter.on(AppEvent.USER_LOGOUT, () => this.clearCache());
        eventEmitter.on(AppEvent.BACKUP_RESTORE, () => this.clearCache());
    }

    /**
     * Ensures the user is initialized for Antigravity.
     * Returns the Project ID.
     */
    static async ensureInitialized(): Promise<string> {
        // 1. Check memory cache
        if (this.projectId) {
            // Ensure other fields are loaded from storage if missing in memory
            if (!this.serviceTier) this.serviceTier = RisuAPI.getArg(SERVICE_TIER) as string;
            if (this.optOut === undefined) this.optOut = (RisuAPI.getArg(OPT_OUT) as number) === 1;
            return this.projectId;
        }

        // 2. Check persistent storage
        const storedProjectId = RisuAPI.getArg(PROJECT_ID) as string;
        if (storedProjectId) {
            this.projectId = storedProjectId;
            this.serviceTier = RisuAPI.getArg(SERVICE_TIER) as string;
            this.optOut = (RisuAPI.getArg(OPT_OUT) as number) === 1;

            // Even if we have project ID, we might want to check opt-out status if not set
            if (!this.optOut) {
                // Run in background to not block
                this.optOutDataCollection().catch((e) => Logger.error(e));
            }
            return storedProjectId;
        }


        // 3. Initialize via API
        await this.initializeUser();

        if (!this.projectId) {
            throw new Error("Failed to initialize Antigravity project ID.");
        }
        return this.projectId;
    }

    private static async initializeUser(): Promise<void> {
        // 1. loadCodeAssist to get status
        const loadData = await this.fetchAntigravity('loadCodeAssist', {
            metadata: {
                ide_type: 'ANTIGRAVITY',
                ide_version: '2.0.4',
                ide_name: 'antigravity',
            }
        });

        let pid = loadData.cloudaicompanionProject;
        let tierId = loadData.paidTier?.name;

        // 2. Onboarding if needed (if currentTier is missing)
        if (!loadData.paidTier) {
            Logger.log('User not onboarded. Starting onboarding...');
            const defaultTier = loadData.allowedTiers?.find((t: any) => t.isDefault);
            tierId = defaultTier?.id || 'free-tier';

            const onboardReq = {
                tier_id: tierId,
                metadata: {
                    ide_type: 'ANTIGRAVITY',
                    ide_version: '2.0.4',
                    ide_name: 'antigravity',
                },
            };

            // Polling for LRO completion
            let onboarded = false;
            while (!onboarded) {
                const lro = await this.fetchAntigravity('onboardUser', onboardReq);
                if (lro.done) {
                    onboarded = true;
                    pid = lro.response?.cloudaicompanionProject?.id;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
                }
            }
        }

        // Save Project ID and Tier
        if (pid) {
            this.projectId = pid;
            RisuAPI.setArg(PROJECT_ID, pid);
        }
        if (tierId) {
            this.serviceTier = tierId;
            RisuAPI.setArg(SERVICE_TIER, tierId);
        }

        // 3. Check & Update Settings (Opt-out)
        await this.optOutDataCollection();
    }

    private static async optOutDataCollection(): Promise<void> {
        try {
            Logger.log('Opting out...');
            await this.fetchAntigravity('setUserSettings', {
                user_settings: {}
            });
            // Mark as opted out in our storage
            this.optOut = true;
            RisuAPI.setArg(OPT_OUT, 1);
        } catch (e) {
            Logger.warn('Failed to update data collection settings:', e);
        }
    }

    static getCachedInfo() {
        return {
            projectId: this.projectId,
            serviceTier: this.serviceTier,
            optOut: this.optOut
        };
    }

    static clearCache(): void {
        this.projectId = undefined;
        this.serviceTier = undefined;
        this.optOut = undefined;
    }

    static async fetchAvailableModels(): Promise<any> {
        const projectId = await this.ensureInitialized();
        return this.fetchAntigravity('fetchAvailableModels', { project: projectId });
    }

    static async loadAccountData(): Promise<any> {
        return this.fetchAntigravity('loadCodeAssist', {
            metadata: {
                ide_type: 'ANTIGRAVITY',
                ide_version: '2.0.4',
                ide_name: 'antigravity',
            }
        });
    }

    // Helper for fetch with Auth
    private static async fetchAntigravity(path: string, body: any, method: string = 'POST'): Promise<any> {
        const endpoints = [
            'https://cloudcode-pa.googleapis.com/v1internal',
            'https://daily-cloudcode-pa.googleapis.com/v1internal'
        ];
        const token = await AuthManager.getAccessToken();
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Client-Name': 'antigravity',
            'X-Client-Version': '2.0.4',
            'x-goog-api-client': 'gl-node/22.21.1',
            'User-Agent': 'antigravity/2.0.4 windows/amd64 google-api-nodejs-client/10.3.0',
        };

        let lastError: any;
        for (const endpoint of endpoints) {
            try {
                const url = `${endpoint}:${path}`;
                const res = await RisuAPI.risuFetch(url, {
                    method: method as any,
                    headers,
                    body: body
                });
                if (!res.ok) {
                    throw new Error(`Antigravity API Error (${res.status}): ${typeof res.data === 'string' ? res.data : JSON.stringify(res.data)}`);
                }
                return res.data;
            } catch (e) {
                lastError = e;
            }
        }
        throw lastError || new Error('Antigravity fetch failed');
    }

    static async nativeFetchAntigravity(path: string, args: NativeFetchArgs): Promise<Response> {
        const endpoints = [
            'https://cloudcode-pa.googleapis.com/v1internal',
            'https://daily-cloudcode-pa.googleapis.com/v1internal'
        ];
        const token = await AuthManager.getAccessToken();
        const headers = { ...args.headers };
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-Client-Name'] = 'antigravity';
        headers['X-Client-Version'] = '2.0.4';
        headers['x-goog-api-client'] = 'gl-node/22.21.1';
        headers['User-Agent'] = 'antigravity/2.0.4 windows/amd64 google-api-nodejs-client/10.3.0';

        let body = args.body;

        const projectId = await this.ensureInitialized();
        if (typeof body === 'string') {
            const parsed = JSON.parse(body);
            parsed.project = projectId;

            // Inject enabledCreditTypes if credit overage is enabled
            const isOverageEnabled = RisuAPI.getArg(CREDIT_OVERAGE) === 1;
            if (isOverageEnabled) {
                parsed.enabledCreditTypes = ["GOOGLE_ONE_AI"];
            }

            body = JSON.stringify(parsed);
        } else {
            Logger.warn('Cannot inject project ID into non-string body');
        }

        let lastError: any;
        for (const endpoint of endpoints) {
            try {
                const url = `${endpoint}:${path}`;
                return await RisuAPI.nativeFetch(url, {
                    ...args,
                    body,
                    headers
                });
            } catch (e) {
                lastError = e;
            }
        }
        throw lastError || new Error('Antigravity nativeFetch failed');
    }

    static async risuFetchAntigravity(path: string, args: GlobalFetchArgs = {}): Promise<GlobalFetchResult> {
        const endpoints = [
            'https://cloudcode-pa.googleapis.com/v1internal',
            'https://daily-cloudcode-pa.googleapis.com/v1internal'
        ];
        const token = await AuthManager.getAccessToken();
        const headers = { ...args.headers };
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-Client-Name'] = 'antigravity';
        headers['X-Client-Version'] = '2.0.4';
        headers['x-goog-api-client'] = 'gl-node/22.21.1';
        headers['User-Agent'] = 'antigravity/2.0.4 windows/amd64 google-api-nodejs-client/10.3.0';

        let body = args.body;

        const projectId = await this.ensureInitialized();
        if (typeof body === 'object' && body !== null) {
            // Inject enabledCreditTypes if credit overage is enabled
            const isOverageEnabled = RisuAPI.getArg(CREDIT_OVERAGE) === 1;
            body = {
                ...body,
                project: projectId,
                ...(isOverageEnabled ? { enabledCreditTypes: ["GOOGLE_ONE_AI"] } : {})
            };
        } else {
            Logger.warn('Cannot inject project ID into non-object body');
        }

        let lastError: any;
        for (const endpoint of endpoints) {
            try {
                const url = `${endpoint}:${path}`;
                return await RisuAPI.risuFetch(url, {
                    ...args,
                    body,
                    headers
                });
            } catch (e) {
                lastError = e;
            }
        }
        throw lastError || new Error('Antigravity risuFetch failed');
    }
}
