<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { getVisibleModels } from "../../model/list";

    export let activeModelId: string;
    let showOlderModels = false;
    $: models = getVisibleModels(showOlderModels, activeModelId);

    const dispatch = createEventDispatcher();
</script>

<div
    class="w-full md:w-56 bg-[#202022] border-b md:border-b-0 md:border-r border-zinc-800 flex md:flex-col overflow-x-auto md:overflow-y-auto shrink-0"
>
    <div class="p-2 md:p-4 flex md:flex-col gap-1 md:gap-0 w-full">
        <h3
            class="hidden md:block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 px-2"
        >
            Models
        </h3>
        <label class="text-xs text-zinc-400 flex items-center gap-2 px-2 pb-3">
            <input type="checkbox" bind:checked={showOlderModels} /> Show older models
        </label>
        <div class="flex md:flex-col space-x-1 md:space-x-0 md:space-y-1 w-full">
            {#each models as model}
                <button
                    class="whitespace-nowrap flex-1 md:flex-none px-3 py-2 md:py-2.5 text-left rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center md:justify-start gap-2 md:gap-3
                    {activeModelId === model.id
                        ? 'bg-blue-600/10 text-blue-400 shadow-sm ring-1 ring-blue-500/20'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}"
                    on:click={() => dispatch("modelChange", model.id)}
                >
                    <div
                        class="w-1.5 h-1.5 rounded-full shrink-0 {activeModelId ===
                        model.id
                            ? 'bg-blue-400'
                            : 'bg-zinc-600'}"
                    ></div>
                    {model.displayName}
                </button>
            {/each}
        </div>
    </div>
</div>
