<script lang="ts">
    import { onMount, createEventDispatcher } from "svelte";
    import { AntigravityManager } from "../../antigravity";
    import { Logger } from "../../shared/logger";
    import { MODELS } from "../../model/list";
    import { RisuAPI } from "../../api";
    import { CREDIT_OVERAGE } from "../../plugin";

    const dispatch = createEventDispatcher();

    interface ModelQuota {
        id: string;
        displayName: string;
        remainingFraction: number;
        resetTime: string;
    }

    let credits: number = 0;
    let modelQuotas: ModelQuota[] = [];
    let isLoading = true;
    let error = "";
    let isOverageEnabled = false;

    function toggleOverage() {
        isOverageEnabled = !isOverageEnabled;
        RisuAPI.setArg(CREDIT_OVERAGE, isOverageEnabled ? 1 : 0);
    }

    function formatResetTime(isoTime: string): string {
        if (!isoTime) return "Unknown";
        try {
            const date = new Date(isoTime);
            const now = new Date();
            const diffMs = date.getTime() - now.getTime();

            if (diffMs <= 0) return "Resetting soon";

            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;

            if (diffHours > 0) {
                return `${diffHours}h ${mins}m`;
            }
            return `${mins}m`;
        } catch {
            return isoTime;
        }
    }

    function getBarColor(fraction: number): string {
        if (fraction > 0.5) return "bg-emerald-500";
        if (fraction > 0.2) return "bg-amber-500";
        return "bg-red-500";
    }

    function getBarBgColor(fraction: number): string {
        if (fraction > 0.5) return "bg-emerald-500/10";
        if (fraction > 0.2) return "bg-amber-500/10";
        return "bg-red-500/10";
    }

    async function loadQuotaData() {
        isLoading = true;
        error = "";

        try {
            const [modelsRes, accountRes] = await Promise.all([
                AntigravityManager.fetchAvailableModels(),
                AntigravityManager.loadAccountData(),
            ]);

            // Parse credits
            const availableCredits = accountRes?.paidTier?.availableCredits;
            if (availableCredits && availableCredits.length > 0) {
                credits = parseInt(availableCredits[0].creditAmount, 10) || 0;
            } else {
                credits = 0;
            }

            // Parse model quotas
            const models = modelsRes?.models || {};
            modelQuotas = Object.entries(models)
                .filter(([id, data]: [string, any]) => data?.quotaInfo && MODELS.some(m => m.id === id))
                .map(([id, data]: [string, any]) => {
                    const localModel = MODELS.find(m => m.id === id);
                    return {
                        id,
                        displayName: localModel?.displayName || data.displayName || id,
                        remainingFraction: data.quotaInfo?.remainingFraction ?? 0,
                        resetTime: data.quotaInfo?.resetTime || "",
                    };
                })
                .sort((a, b) => {
                    const idxA = MODELS.findIndex(m => m.id === a.id);
                    const idxB = MODELS.findIndex(m => m.id === b.id);
                    return idxA - idxB;
                });
        } catch (e) {
            Logger.error("Failed to load quota data", e);
            error = "Failed to load quota data. Please try again.";
        } finally {
            isLoading = false;
        }
    }

    onMount(() => {
        isOverageEnabled = RisuAPI.getArg(CREDIT_OVERAGE) === 1;
        loadQuotaData();
    });
</script>

<div class="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
            <button
                class="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all flex items-center justify-center border border-transparent hover:border-zinc-700"
                on:click={() => dispatch("back")}
                title="Back to Settings"
                aria-label="Back to Settings"
            >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <div class="p-2 bg-purple-500/10 rounded-lg">
                <svg class="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
            <h3 class="text-lg font-semibold text-zinc-100">Usage & Quota</h3>
        </div>
        <button
            class="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all border border-zinc-700 {isLoading ? 'opacity-50 pointer-events-none' : ''}"
            on:click={loadQuotaData}
            disabled={isLoading}
        >
            <svg class="w-4 h-4 {isLoading ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reload
        </button>
    </div>

    {#if error}
        <div class="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {error}
        </div>
    {/if}

    <!-- Credits Card -->
    <div class="px-5 py-4 bg-[#252528] rounded-xl border border-zinc-800 shadow-sm">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="p-2 bg-amber-500/10 rounded-lg">
                    <svg class="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <p class="text-sm text-zinc-400 font-medium">Available Credits</p>
                    <p class="text-2xl font-bold text-white tracking-tight">
                        {#if isLoading}
                            <span class="text-zinc-600">...</span>
                        {:else}
                            {credits.toLocaleString()}
                        {/if}
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Credit Overage Toggle Card -->
    <div class="px-5 py-4 bg-[#252528] rounded-xl border border-zinc-800 shadow-sm flex items-center justify-between">
        <div class="flex items-center gap-3">
            <div class="p-2 bg-blue-500/10 rounded-lg">
                <svg class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <div>
                <p class="text-sm font-medium text-zinc-200">Use Credits Overage</p>
            </div>
        </div>
        <button
            id="overage-toggle"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 {isOverageEnabled ? 'bg-blue-600' : 'bg-zinc-700'}"
            on:click={toggleOverage}
            title="Toggle credit overage"
            aria-label="Toggle credit overage"
        >
            <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm {isOverageEnabled ? 'translate-x-6' : 'translate-x-1'}"
            />
        </button>
    </div>

    <!-- Model Quotas -->
    <div class="space-y-3">
        <h4 class="text-sm font-medium text-zinc-400 uppercase tracking-wider">Model Quotas</h4>

        {#if isLoading && modelQuotas.length === 0}
            <div class="space-y-3">
                {#each [1, 2, 3] as _}
                    <div class="px-4 py-3 bg-[#252528] rounded-xl border border-zinc-800 animate-pulse">
                        <div class="h-4 bg-zinc-700 rounded w-1/3 mb-3"></div>
                        <div class="h-2 bg-zinc-700 rounded w-full mb-2"></div>
                        <div class="h-3 bg-zinc-700 rounded w-1/4"></div>
                    </div>
                {/each}
            </div>
        {:else if modelQuotas.length === 0 && !isLoading}
            <div class="px-4 py-6 bg-[#252528] rounded-xl border border-zinc-800 text-center text-zinc-500 text-sm">
                No quota data available.
            </div>
        {:else}
            {#each modelQuotas as quota}
                <div class="px-4 py-3 bg-[#252528] rounded-xl border border-zinc-800 shadow-sm space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-zinc-200">{quota.displayName}</span>
                        <span class="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                            {Math.round(quota.remainingFraction * 100)}%
                        </span>
                    </div>
                    <!-- Progress Bar -->
                    <div class="w-full h-2 rounded-full {getBarBgColor(quota.remainingFraction)} overflow-hidden">
                        <div
                            class="h-full rounded-full transition-all duration-500 {getBarColor(quota.remainingFraction)}"
                            style="width: {Math.round(quota.remainingFraction * 100)}%"
                        ></div>
                    </div>
                    <!-- Reset Time -->
                    <div class="flex items-center gap-1.5 text-xs text-zinc-500">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Resets in {formatResetTime(quota.resetTime)}
                    </div>
                </div>
            {/each}
        {/if}
    </div>
</div>
