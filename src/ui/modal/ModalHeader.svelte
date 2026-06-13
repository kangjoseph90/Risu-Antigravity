<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import antigravityLogo from "../../assets/antigravity-logo.svg";

    export let isLoggedIn: boolean = false;
    export let userProfile: { name: string; picture: string; email: string } | null = null;
    export let projectId: string = "";
    export let serviceTier: string = "";
    export let optOut: boolean = false;

    const dispatch = createEventDispatcher();

    let showBackupDropdown = false;
    let showRestoreDropdown = false;
    let showProfileDropdown = false;
    let fileInput: HTMLInputElement;

    function formatServiceTier(tier: string): string {
        if (!tier) return "Unknown Tier";
        return tier
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    }

    function handleFileChange(e: Event) {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            const file = target.files[0];
            dispatch("importFile", file);
        }
        target.value = ""; // Reset
    }

    export function closeAllDropdowns() {
        showBackupDropdown = false;
        showRestoreDropdown = false;
        showProfileDropdown = false;
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    class="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 bg-[#252528] border-b border-zinc-800 select-none shadow-2xl gap-4 sm:gap-0"
    on:click|stopPropagation={closeAllDropdowns}
>
    <div class="flex items-center gap-4">
        <div class="p-2 bg-blue-500/10 rounded-lg shrink-0">
            <img src={antigravityLogo} alt="" class="h-6 w-6" />
        </div>
        <div>
            <h2 class="text-lg font-bold text-zinc-100 tracking-tight">
                Risu Antigravity
            </h2>
        </div>
    </div>

    <div class="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
        <!-- Backup Menu -->
        <div class="relative">
            <button
                class="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 rounded-lg transition-all duration-200"
                on:click|stopPropagation={() => {
                    const wasOpen = showBackupDropdown;
                    closeAllDropdowns();
                    showBackupDropdown = !wasOpen;
                }}
                title="Backup"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                </svg>
            </button>

            {#if showBackupDropdown}
                <div
                    class="absolute right-0 mt-2 w-56 bg-[#252528] rounded-xl shadow-xl border border-zinc-700/50 py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    on:click|stopPropagation
                >
                    <button
                        class="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
                        on:click={() => {
                            dispatch("quickBackup");
                            showBackupDropdown = false;
                        }}
                    >
                        Backup to Browser
                    </button>
                    <button
                        class="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
                        on:click={() => {
                            dispatch("export");
                            showBackupDropdown = false;
                        }}
                    >
                        Export to File
                    </button>
                </div>
            {/if}
        </div>

        <!-- Restore Menu -->
        <div class="relative">
            <button
                class="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 rounded-lg transition-all duration-200"
                on:click|stopPropagation={() => {
                    const wasOpen = showRestoreDropdown;
                    closeAllDropdowns();
                    showRestoreDropdown = !wasOpen;
                }}
                title="Restore"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                </svg>
            </button>

            {#if showRestoreDropdown}
                <div
                    class="absolute right-0 mt-2 w-56 bg-[#252528] rounded-xl shadow-xl border border-zinc-700/50 py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    on:click|stopPropagation
                >
                    <button
                        class="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
                        on:click={() => {
                            dispatch("quickRestore");
                            showRestoreDropdown = false;
                        }}
                    >
                        Restore from Browser
                    </button>
                    <button
                        class="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-blue-600 hover:text-white transition-colors flex items-center gap-2"
                        on:click={() => {
                            fileInput.click();
                            showRestoreDropdown = false;
                        }}
                    >
                        Import from File
                    </button>
                </div>
            {/if}
            <input
                type="file"
                class="hidden"
                bind:this={fileInput}
                on:change={handleFileChange}
                accept=".json"
            />
        </div>

        <div class="h-6 w-px bg-zinc-700/50 mx-1"></div>

        {#if isLoggedIn && userProfile}
            <div class="relative">
                <button
                    class="flex items-center gap-3 pl-4 pr-1 py-1 rounded-full hover:bg-zinc-700/50 transition-all duration-200 group"
                    on:click|stopPropagation={() => {
                        const wasOpen = showProfileDropdown;
                        closeAllDropdowns();
                        showProfileDropdown = !wasOpen;
                    }}
                >
                    <span
                        class="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors hidden sm:block"
                        >{userProfile.name}</span
                    >
                    <img
                        src={userProfile.picture}
                        alt="Profile"
                        class="w-8 h-8 rounded-full ring-2 ring-zinc-700 group-hover:ring-blue-500/50 transition-all"
                    />
                </button>

                {#if showProfileDropdown}
                    <div
                        class="absolute right-0 mt-2 w-72 bg-[#252528] rounded-xl shadow-xl border border-zinc-700/50 z-50 animate-in fade-in zoom-in-95 duration-100"
                        on:click|stopPropagation
                    >
                        <div class="px-5 py-3 border-b border-zinc-700/50">
                            <p class="text-sm font-semibold text-white">
                                {userProfile.name}
                            </p>
                            <p class="text-xs text-zinc-400 mt-0.5">
                                {userProfile.email}
                            </p>
                        </div>
                        <div class="px-5 py-3 text-sm space-y-2.5">
                            <div class="flex justify-between items-center">
                                <span class="text-zinc-500">Project ID</span>
                                <span
                                    class="text-zinc-300 font-mono text-xs bg-zinc-800 px-2 py-1 rounded"
                                    >{projectId || "N/A"}</span
                                >
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-zinc-500">Tier</span>
                                <span class="text-zinc-300 font-medium"
                                    >{formatServiceTier(serviceTier)}</span
                                >
                            </div>
                            {#if serviceTier === "free-tier" || serviceTier === "free"}
                                <div class="flex justify-between items-center">
                                    <span class="text-zinc-500">Opt-out</span>
                                    <span class="text-zinc-300"
                                        >{optOut ? "Yes" : "No"}</span
                                    >
                                </div>
                            {/if}
                        </div>
                        <div class="border-t border-zinc-700/50 mt-2 py-2 px-2">
                            <button
                                class="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-purple-500/10 hover:text-purple-300 rounded-lg transition-colors flex items-center gap-2"
                                on:click={() => {
                                    dispatch("quota");
                                    showProfileDropdown = false;
                                }}
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Usage & Quota
                            </button>
                            <button
                                class="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors flex items-center gap-2"
                                on:click={() => dispatch("logout")}
                            >
                                <svg
                                    class="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                    ></path></svg
                                >
                                Sign out
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        {:else}
            <button
                class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-900/20"
                on:click={() => dispatch("login")}
            >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"
                    ><path
                        d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                    /></svg
                >
                <span class="hidden sm:inline">Sign in</span>
            </button>
        {/if}

        <button
            class="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-all duration-200 ml-1"
            on:click={() => dispatch("close")}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                />
            </svg>
        </button>
    </div>
</div>
