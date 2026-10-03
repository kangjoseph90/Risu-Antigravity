<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { ModelParameters, ReasoningLevel } from "../../shared/types";
    import { MODELS, getVisibleModels, getReasoningLevels, normalizeModelSelection } from "../../model/list";

    export let currentModelId: string = "";
    export let currentParams: ModelParameters = {};
    export let currentReasoningLevel: ReasoningLevel | undefined = undefined;

    const dispatch = createEventDispatcher();
    let showOlderModels = false;

    $: visibleModels = getVisibleModels(showOlderModels, currentModelId);
    $: selectedOlderModel = MODELS.some((model) => model.id === currentModelId && !model.isLatest);
    $: reasoningLevels = getReasoningLevels(currentModelId);

    function onModelChange() {
        currentReasoningLevel = normalizeModelSelection(currentModelId, currentReasoningLevel).reasoning_level;
        onConfigChange();
    }

    function onConfigChange() {
        dispatch("saveConfig");
    }

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
        <div class="flex flex-wrap items-center justify-between gap-3">
            <label for="model-config" class="text-sm font-medium text-zinc-300"
                >Model Configuration</label
            >
            <div class="flex items-center gap-3">
                <label for="older-models-toggle" class="text-sm text-zinc-400"
                    >Show older models</label
                >
                <button
                    id="older-models-toggle"
                    type="button"
                    role="switch"
                    aria-checked={showOlderModels}
                    aria-label="Show older models"
                    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 {showOlderModels
                        ? 'bg-blue-600'
                        : 'bg-zinc-700'}"
                    on:click={() => (showOlderModels = !showOlderModels)}
                >
                    <span
                        class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm {showOlderModels
                            ? 'translate-x-6'
                            : 'translate-x-1'}"
                    />
                </button>
            </div>
        </div>
        <select
            id="model-config"
            bind:value={currentModelId}
            on:change={onModelChange}
            class="w-full px-4 py-2.5 bg-[#252528] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
        >
            {#each visibleModels as model}
                <option value={model.id}>{model.displayName}</option>
            {/each}
        </select>
        {#if !showOlderModels && selectedOlderModel}
            <p class="text-xs text-zinc-400">
                Your saved older model is kept selected. Enable "Show older models" to see all models.
            </p>
        {/if}
        {#if reasoningLevels.length > 0}
            <div class="space-y-2">
                <label for="model-reasoning" class="text-sm font-medium text-zinc-300"
                    >Reasoning Level</label
                >
                <select
                    id="model-reasoning"
                    bind:value={currentReasoningLevel}
                    on:change={onConfigChange}
                    class="w-full px-4 py-2.5 bg-[#252528] border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                >
                    {#each reasoningLevels as level}
                        <option value={level}>{level === 'low' ? 'Low' : level === 'medium' ? 'Medium' : 'High'}</option>
                    {/each}
                </select>
            </div>
        {/if}
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
