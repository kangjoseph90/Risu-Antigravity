<script lang="ts">
    import Modal from "./Modal.svelte";

    export let id: string;

    function onClick(): void {
        const container = document.createElement("div");
        container.id = "risu-antigravity-container";
        document.body.appendChild(container);
        const modal = new Modal({
            target: container,
            props: {
                onClose: () => {
                    modal.$destroy();
                    document.body.removeChild(container);
                },
            },
        });
    }
</script>

<button
    class="flex gap-2 items-center hover:text-textcolor text-textcolor2"
    {id}
    on:click={onClick}
>
    <svg
        class="h-6 w-6 shrink-0"
        viewBox="-4 -4.5 61.793579 61.793579"
        fill="currentColor"
        aria-hidden="true"
    >
        <g transform="translate(153.99875 -167.7638)">
            <path
                d="m-105.26502 216.1732c3.00216 2.25163 7.505419.75057 3.3774-3.37739-12.3838-12.00856-9.75696-45.032-25.14285-45.032-15.38595 0-12.75911 33.02344-25.14291 45.032-4.50319 4.50319.37525 5.62902 3.3774 3.37739 11.63331-7.88059 10.88276-21.76543 21.76551-21.76543 10.88269 0 10.1322 13.88484 21.76545 21.76543z"
            />
        </g>
    </svg>
    <span>Antigravity</span>
</button>
