<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import type { ModelParameters } from "../../shared/types";
  import { MODELS } from "../../model/list";

    export let currentModelId: string = "";
    export let currentParams: ModelParameters = {};
    export let thinkingMode: "level" | "tokens" = "level";

    const dispatch = createEventDispatcher();
    let isDropdownOpen = false;
    let dropdownContainer: HTMLDivElement;

    $: currentModel = MODELS.find(m => m.id === currentModelId) || {
        id: currentModelId,
        displayName: currentModelId || "Select a model"
    };

    function onConfigChange() {
        dispatch("saveConfig");
    }

    function toggleDropdown(e: MouseEvent) {
        e.stopPropagation();
        isDropdownOpen = !isDropdownOpen;
    }

    function selectModel(model: string) {
        currentModelId = model;
        isDropdownOpen = false;
        onConfigChange();
    }

    onMount(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownContainer &&
                !dropdownContainer.contains(event.target as Node)
            ) {
                isDropdownOpen = false;
            }
        };

        window.addEventListener("click", handleClickOutside);

        return () => {
            window.removeEventListener("click", handleClickOutside);
        };
    });

    function toggleStream() {
        currentParams.use_stream = !currentParams.use_stream;
        onConfigChange();
    }

    function toggleTemperature() {
        if (currentParams.temperature !== undefined) {
            currentParams.temperature = undefined;
        } else {
            currentParams.temperature = 1.0;
        }
        onConfigChange();
    }

    function toggleTopP() {
        if (currentParams.top_p !== undefined) {
            currentParams.top_p = undefined;
        } else {
            currentParams.top_p = 1.0;
        }
        onConfigChange();
    }

    function toggleMinP() {
        if (currentParams.min_p !== undefined) {
            currentParams.min_p = undefined;
        } else {
            currentParams.min_p = 0.0;
        }
        onConfigChange();
    }

    function setThinkingMode(mode: "level" | "tokens") {
        thinkingMode = mode;
        onConfigChange();
    }

    function toggleTool(
        tool: "google_search" | "googleMaps" | "url_context" | "code_execution",
    ) {
        const tools = currentParams.active_tools ?? [];
        if (tools.includes(tool)) {
            currentParams.active_tools = tools.filter((t) => t !== tool);
        } else {
            currentParams.active_tools = [...tools, tool];
        }
        onConfigChange();
    }
</script>

<div class="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
    <!-- Model Selection -->
    <div class="space-y-3">
        <label
            for="model-config"
            class="block text-sm font-medium text-zinc-300"
            >Model Configuration</label
        >
        <div class="relative group" bind:this={dropdownContainer}>
            <div
                class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10"
            >
                <svg
                    class="h-5 w-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                </svg>
            </div>
            <div class="relative">
                <button
                    id="model-config"
                    type="button"
                    on:click={toggleDropdown}
                    class="w-full pl-10 pr-10 py-3 bg-[#252528] border border-zinc-700 rounded-xl text-left text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm flex items-center justify-between"
                >
                    <span>{currentModel.displayName}</span>
                </button>
                <button
                    type="button"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                    on:click={toggleDropdown}
                >
                    <svg
                        class="h-5 w-5 transform transition-transform {isDropdownOpen
                            ? 'rotate-180'
                            : ''}"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>
            </div>

            {#if isDropdownOpen}
                <div
                    class="absolute z-50 mt-2 w-full bg-[#2a2a2e] border border-zinc-700 rounded-xl shadow-xl overflow-hidden"
                >
                    <div class="max-h-60 overflow-y-auto py-1">
                        {#each MODELS as model}
                            <button
                                type="button"
                                class="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-blue-600/20 hover:text-white transition-colors flex items-center justify-between {currentModelId ===
                                model.id
                                    ? 'bg-blue-600/10 text-blue-400 font-medium'
                                    : ''}"
                                on:click={() => selectModel(model.id)}
                            >
                                <span>{model.displayName}</span>
                                {#if currentModelId === model.id}
                                    <svg
                                        class="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-width="2"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                {/if}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <!-- Parameters -->
    <div class="space-y-6">
        <!-- Stream Toggle -->
        <div
            class="flex items-center justify-between px-4 py-3 bg-[#252528] rounded-xl border border-zinc-800 shadow-sm"
        >
            <label for="stream-toggle" class="text-sm font-medium text-zinc-200"
                >Streaming Response</label
            >
            <button
                id="stream-toggle"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 {currentParams.use_stream
                    ? 'bg-blue-600'
                    : 'bg-zinc-700'}"
                on:click={toggleStream}
            >
                <span class="sr-only">Enable streaming</span>
                <span
                    class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm {currentParams.use_stream
                        ? 'translate-x-6'
                        : 'translate-x-1'}"
                />
            </button>
        </div>

        <div class="grid grid-cols-1 gap-6">
            <!-- Temperature -->
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <label
                            for="temperature-toggle"
                            class="text-sm font-medium text-zinc-300"
                            >Temperature</label
                        >
                        <!-- Toggle -->
                        <button
                            id="temperature-toggle"
                            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 {currentParams.temperature !==
                            undefined
                                ? 'bg-blue-600'
                                : 'bg-zinc-700'}"
                            on:click={toggleTemperature}
                        >
                            <span class="sr-only">Enable Temperature</span>
                            <span
                                class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm {currentParams.temperature !==
                                undefined
                                    ? 'translate-x-4.5'
                                    : 'translate-x-1'}"
                                style="transform: translateX({currentParams.temperature !==
                                undefined
                                    ? '18px'
                                    : '4px'});"
                            />
                        </button>
                    </div>
                    <span
                        class="text-xs font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded"
                        >{currentParams.temperature ?? "Default"}</span
                    >
                </div>
                <div
                    class="flex gap-4 items-center {currentParams.temperature ===
                    undefined
                        ? 'opacity-50'
                        : ''}"
                >
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={currentParams.temperature ?? 1.0}
                        on:input={(e) => {
                            currentParams.temperature = +e.currentTarget.value;
                            onConfigChange();
                        }}
                        class="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>

            <!-- Top P -->
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <label
                            for="top-p-toggle"
                            class="text-sm font-medium text-zinc-300"
                            >Top P</label
                        >
                        <!-- Toggle -->
                        <button
                            id="top-p-toggle"
                            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 {currentParams.top_p !==
                            undefined
                                ? 'bg-blue-600'
                                : 'bg-zinc-700'}"
                            on:click={toggleTopP}
                        >
                            <span class="sr-only">Enable Top P</span>
                            <span
                                class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm"
                                style="transform: translateX({currentParams.top_p !==
                                undefined
                                    ? '18px'
                                    : '4px'});"
                            />
                        </button>
                    </div>
                    <span
                        class="text-xs font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded"
                        >{currentParams.top_p ?? "Default"}</span
                    >
                </div>
                <div
                    class="flex gap-4 items-center {currentParams.top_p ===
                    undefined
                        ? 'opacity-50'
                        : ''}"
                >
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={currentParams.top_p ?? 1.0}
                        on:input={(e) => {
                            currentParams.top_p = +e.currentTarget.value;
                            onConfigChange();
                        }}
                        class="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>

            <!-- Min P -->
            <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <label
                            for="min-p-toggle"
                            class="text-sm font-medium text-zinc-300"
                            >Min P</label
                        >
                        <!-- Toggle -->
                        <button
                            id="min-p-toggle"
                            class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 {currentParams.min_p !==
                            undefined
                                ? 'bg-blue-600'
                                : 'bg-zinc-700'}"
                            on:click={toggleMinP}
                        >
                            <span class="sr-only">Enable Min P</span>
                            <span
                                class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm"
                                style="transform: translateX({currentParams.min_p !==
                                undefined
                                    ? '18px'
                                    : '4px'});"
                            />
                        </button>
                    </div>
                    <span
                        class="text-xs font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded"
                        >{currentParams.min_p ?? "Default"}</span
                    >
                </div>
                <div
                    class="flex gap-4 items-center {currentParams.min_p ===
                    undefined
                        ? 'opacity-50'
                        : ''}"
                >
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={currentParams.min_p ?? 0.0}
                        on:input={(e) => {
                            currentParams.min_p = +e.currentTarget.value;
                            onConfigChange();
                        }}
                        class="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                </div>
            </div>
        </div>

        <!-- Top K -->
        <div class="space-y-2">
            <div class="flex justify-between">
                <label for="top-k" class="text-sm font-medium text-zinc-300"
                    >Top K</label
                >
            </div>
            <input
                id="top-k"
                type="number"
                bind:value={currentParams.top_k}
                on:change={onConfigChange}
                class="w-full px-4 py-2.5 bg-[#252528] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
        </div>

        <!-- Seed -->
        <div class="space-y-2">
            <div class="flex justify-between">
                <label for="seed" class="text-sm font-medium text-zinc-300"
                    >Seed</label
                >
            </div>
            <input
                id="seed"
                type="number"
                bind:value={currentParams.seed}
                on:change={onConfigChange}
                class="w-full px-4 py-2.5 bg-[#252528] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
        </div>

        <!-- Penalties -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-2">
                <label
                    for="frequency-penalty"
                    class="text-sm font-medium text-zinc-300"
                    >Frequency Penalty</label
                >
                <input
                    id="frequency-penalty"
                    type="number"
                    step="0.1"
                    bind:value={currentParams.frequency_penalty}
                    on:change={onConfigChange}
                    class="w-full px-4 py-2.5 bg-[#252528] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>
            <div class="space-y-2">
                <label
                    for="presence-penalty"
                    class="text-sm font-medium text-zinc-300"
                    >Presence Penalty</label
                >
                <input
                    id="presence-penalty"
                    type="number"
                    step="0.1"
                    bind:value={currentParams.presence_penalty}
                    on:change={onConfigChange}
                    class="w-full px-4 py-2.5 bg-[#252528] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>
            <div class="space-y-2">
                <label
                    for="repetition-penalty"
                    class="text-sm font-medium text-zinc-300"
                    >Repetition Penalty</label
                >
                <input
                    id="repetition-penalty"
                    type="number"
                    step="0.1"
                    bind:value={currentParams.repetition_penalty}
                    on:change={onConfigChange}
                    class="w-full px-4 py-2.5 bg-[#252528] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>
        </div>

        <!-- Thinking -->
        <div
            class="space-y-3 px-5 py-3 bg-[#252528] rounded-xl border border-zinc-800 shadow-sm"
        >
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <svg
                        class="w-5 h-5 text-purple-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                    </svg>
                    <label
                        for="thinking-mode"
                        class="text-sm font-medium text-zinc-200"
                        >Thinking Configuration</label
                    >
                </div>
                <div
                    class="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800"
                >
                    <button
                        class="px-3 py-1 text-xs font-medium rounded-md transition-all {thinkingMode ===
                        'level'
                            ? 'bg-zinc-700 text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-300'}"
                        on:click={() => setThinkingMode("level")}
                    >
                        Level
                    </button>
                    <button
                        class="px-3 py-1 text-xs font-medium rounded-md transition-all {thinkingMode ===
                        'tokens'
                            ? 'bg-zinc-700 text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-300'}"
                        on:click={() => setThinkingMode("tokens")}
                    >
                        Tokens
                    </button>
                </div>
            </div>

            {#if thinkingMode === "level"}
                <select
                    bind:value={currentParams.thinking_level}
                    on:change={onConfigChange}
                    class="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                    <option value={undefined}>Default</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
            {:else}
                <input
                    type="number"
                    bind:value={currentParams.thinking_tokens}
                    on:change={onConfigChange}
                    placeholder="e.g. 4096"
                    class="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
            {/if}
        </div>

        <!-- Media Resolution -->
        <div class="space-y-2">
            <label
                for="media-resolution"
                class="text-sm font-medium text-zinc-300"
                >Media Resolution</label
            >
            <select
                id="media-resolution"
                bind:value={currentParams.media_resolution}
                on:change={onConfigChange}
                class="w-full px-4 py-2.5 bg-[#252528] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
                <option value={undefined}>Default</option>
                <option value="media_resolution_low">Low</option>
                <option value="media_resolution_medium">Medium</option>
                <option value="media_resolution_high">High</option>
            </select>
        </div>

        <!-- Active Tools -->
        <div class="space-y-3">
            <label
                for="active-tools"
                class="block text-sm font-medium text-zinc-300"
                >Active Tools</label
            >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Google Search -->
                <div
                    class="flex items-center justify-between px-4 py-3 bg-[#252528] rounded-xl border border-zinc-800 shadow-sm"
                >
                    <span class="text-sm font-medium text-zinc-200"
                        >Google Search</span
                    >
                    <button
                        type="button"
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 {currentParams.active_tools?.includes(
                            'google_search',
                        )
                            ? 'bg-blue-600'
                            : 'bg-zinc-700'}"
                        on:click={() => toggleTool("google_search")}
                    >
                        <span class="sr-only">Toggle Google Search</span>
                        <span
                            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm {currentParams.active_tools?.includes(
                                'google_search',
                            )
                                ? 'translate-x-6'
                                : 'translate-x-1'}"
                        />
                    </button>
                </div>

                <!-- Google Maps -->
                <div
                    class="flex items-center justify-between px-4 py-3 bg-[#252528] rounded-xl border border-zinc-800 shadow-sm"
                >
                    <span class="text-sm font-medium text-zinc-200"
                        >Google Maps</span
                    >
                    <button
                        type="button"
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 {currentParams.active_tools?.includes(
                            'googleMaps',
                        )
                            ? 'bg-blue-600'
                            : 'bg-zinc-700'}"
                        on:click={() => toggleTool("googleMaps")}
                    >
                        <span class="sr-only">Toggle Google Maps</span>
                        <span
                            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm {currentParams.active_tools?.includes(
                                'googleMaps',
                            )
                                ? 'translate-x-6'
                                : 'translate-x-1'}"
                        />
                    </button>
                </div>

                <!-- URL Context -->
                <div
                    class="flex items-center justify-between px-4 py-3 bg-[#252528] rounded-xl border border-zinc-800 shadow-sm"
                >
                    <span class="text-sm font-medium text-zinc-200"
                        >URL Context</span
                    >
                    <button
                        type="button"
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 {currentParams.active_tools?.includes(
                            'url_context',
                        )
                            ? 'bg-blue-600'
                            : 'bg-zinc-700'}"
                        on:click={() => toggleTool("url_context")}
                    >
                        <span class="sr-only">Toggle URL Context</span>
                        <span
                            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm {currentParams.active_tools?.includes(
                                'url_context',
                            )
                                ? 'translate-x-6'
                                : 'translate-x-1'}"
                        />
                    </button>
                </div>

                <!-- Code Execution -->
                <div
                    class="flex items-center justify-between px-4 py-3 bg-[#252528] rounded-xl border border-zinc-800 shadow-sm"
                >
                    <span class="text-sm font-medium text-zinc-200"
                        >Code Execution</span
                    >
                    <button
                        type="button"
                        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 {currentParams.active_tools?.includes(
                            'code_execution',
                        )
                            ? 'bg-blue-600'
                            : 'bg-zinc-700'}"
                        on:click={() => toggleTool("code_execution")}
                    >
                        <span class="sr-only">Toggle Code Execution</span>
                        <span
                            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm {currentParams.active_tools?.includes(
                                'code_execution',
                            )
                                ? 'translate-x-6'
                                : 'translate-x-1'}"
                        />
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
