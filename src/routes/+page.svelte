<script>
  import { onMount } from 'svelte'
  let counter = 0
  let ready = false

  onMount(async function start() {
    const response = await fetch('/counter/get')
    counter = await response.json()
    ready = true
  })

  async function increase() {
    await fetch('/counter/increase', { method: 'PUT' })
    counter++
  }
</script>

{#if ready}
  <button on:mouseup={increase}>
    <span>Increase ({counter})</span>
  </button>
{/if}
