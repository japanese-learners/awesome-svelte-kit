<script lang="ts">
  let innerWidth: number
</script>

<svelte:window bind:innerWidth />

<svelte:head>
  {#if innerWidth > 600}
    <base target="_blank" />
  {/if}
</svelte:head>

<slot />
