<script lang="ts">
    import { onMount } from "svelte";
    import { AuthManager } from "../auth";
    import { AntigravityManager } from "../antigravity";
    import { ModelManager } from "../model";
    import { RequestType, type ModelParameters } from "../shared/types";
    import { BackupManager } from "../shared/backup";
    import { Logger } from "../shared/logger";
    import { alert, confirm } from "./popup";

    import ModalHeader from "./modal/ModalHeader.svelte";
    import RequestTypeSidebar from "./modal/RequestTypeSidebar.svelte";
    import ModelSettings from "./modal/ModelSettings.svelte";
    import QuotaView from "./modal/QuotaView.svelte";

    export let onClose: () => void;

    let isLoggedIn = false;
    let userProfile: { name: string; picture: string; email: string } | null =
        null;
    let projectId = "";
    let serviceTier = "";
    let optOut = false;

    let activeTab: RequestType = RequestType.Chat;
    let activeView: "settings" | "quota" = "settings";

    // Local state for the current tab's config to bind to inputs
    let currentModelId = "";
    let currentParams: ModelParameters = {};
    let modalHeader: ModalHeader;

    // Thinking mode state
    let thinkingMode: "level" | "tokens" = "level";

    const requestTypes = Object.values(RequestType).filter(
        (t) => t !== RequestType.Unknown
    );

    onMount(async () => {
        await checkLoginStatus();
        loadModelConfig(activeTab);
    });

    async function checkLoginStatus() {
        isLoggedIn = AuthManager.isLoggedIn();
        if (isLoggedIn) {
            try {
                userProfile = await AuthManager.fetchUserProfile();

                // Initialize Antigravity to get project ID and tier
                try {
                    await AntigravityManager.ensureInitialized();
                    const antigravityInfo = AntigravityManager.getCachedInfo();
                    projectId = antigravityInfo.projectId || "";
                    serviceTier = antigravityInfo.serviceTier || "";
                    optOut = antigravityInfo.optOut || false;
                } catch (e) {
                    Logger.error("Failed to initialize Antigravity:", e);
                }
            } catch (e) {
                Logger.error("Error checking login status:", e);
                isLoggedIn = false;
            }
        }
    }

    async function handleLogin() {
        try {
            await AuthManager.login();
            await checkLoginStatus();
        } catch (e) {
            Logger.error("Login failed:", e);
        }
    }

    function handleLogout() {
        AuthManager.logout();
        isLoggedIn = false;
        userProfile = null;
        projectId = "";
        serviceTier = "";
        activeView = "settings";
    }

    function handleQuota() {
        activeView = "quota";
    }

    function loadModelConfig(type: RequestType) {
        const config = ModelManager.getConfig(type);
        currentModelId = config.model_id;
        currentParams = { ...config.parameters };

        // Determine thinking mode
        if (currentParams.thinking_tokens !== undefined) {
            thinkingMode = "tokens";
        } else {
            thinkingMode = "level";
        }
    }

    function saveCurrentConfig() {
        // Clean up thinking params based on mode
        const paramsToSave = { ...currentParams };
        if (thinkingMode === "level") {
            delete paramsToSave.thinking_tokens;
        } else {
            delete paramsToSave.thinking_level;
        }

        ModelManager.setConfig(activeTab, {
            model_id: currentModelId,
            parameters: paramsToSave,
        });
    }

    function handleTabChange(event: CustomEvent<RequestType>) {
        const type = event.detail;
        saveCurrentConfig(); // Save previous tab
        activeTab = type;
        activeView = "settings";
        loadModelConfig(type);
    }

    // Backup Handlers
    async function handleQuickBackup() {
        if (await BackupManager.backup()) {
            await alert("Backup saved successfully!");
        } else {
            await alert("Backup failed.");
        }
    }

    async function handleQuickRestore() {
        if (
            await confirm(
                "Are you sure you want to restore? Current settings will be overwritten."
            )
        ) {
            if (await BackupManager.restore()) {
                await alert("Restored successfully!");
                await checkLoginStatus();
                loadModelConfig(activeTab);
            } else {
                await alert("Restore failed or no backup found.");
            }
        }
    }

    async function handleExport() {
        await BackupManager.exportBackupToFile();
    }

    async function handleImport(event: CustomEvent<File>) {
        const file = event.detail;
        if (file) {
            if (await BackupManager.importBackupFromFile(file)) {
                await alert("Imported successfully!");
                await checkLoginStatus();
                loadModelConfig(activeTab);
            } else {
                await alert("Import failed.");
            }
        }
    }
</script>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
    class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-0 sm:p-4 sm:p-6"
    on:click={onClose}
    on:keydown={(e) => e.key === "Escape" && onClose()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="flex flex-col bg-[#1e1e20] w-full h-full sm:h-[90vh] sm:max-w-4xl sm:rounded-xl shadow-2xl border-0 sm:border border-zinc-800 overflow-hidden ring-0 sm:ring-1 ring-white/10 cursor-default"
        on:click|stopPropagation={() => modalHeader?.closeAllDropdowns()}
    >
        <ModalHeader
            bind:this={modalHeader}
            {isLoggedIn}
            {userProfile}
            {projectId}
            {serviceTier}
            {optOut}
            on:close={onClose}
            on:login={handleLogin}
            on:logout={handleLogout}
            on:quota={handleQuota}
            on:quickBackup={handleQuickBackup}
            on:quickRestore={handleQuickRestore}
            on:export={handleExport}
            on:importFile={handleImport}
        />

        <!-- Body -->
        <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
            {#if activeView === "quota"}
                <!-- Quota View (full width, no sidebar) -->
                <div class="flex-1 overflow-y-auto bg-[#1e1e20]">
                    <QuotaView on:back={() => activeView = "settings"} />
                </div>
            {:else}
                <RequestTypeSidebar
                    {requestTypes}
                    {activeTab}
                    on:tabChange={handleTabChange}
                />

                <!-- Content -->
                <div class="flex-1 overflow-y-auto bg-[#1e1e20]">
                    <ModelSettings
                        bind:currentModelId
                        bind:currentParams
                        bind:thinkingMode
                        on:saveConfig={saveCurrentConfig}
                    />
                </div>
            {/if}
        </div>
    </div>
</div>
