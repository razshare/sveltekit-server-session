<style>
  .content {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    overflow-x: hidden;
    padding: 1rem;
    display: grid;
    justify-content: center;
    align-content: center;
  }
  textarea {
    max-width: 100%;
  }
</style>

<script>
  import { onMount } from 'svelte'
  let text = ''
  let ready = false
  let sending = false

  onMount(async function start() {
    const response = await fetch('/session/quote/get')
    text = await response.text()
    ready = true
  })

  async function set() {
    sending = true
    await fetch('/session/quote/update', { method: 'PUT', body: text })
    sending = false
  }
</script>

{#if ready}
  <div class="content">
    <textarea bind:value={text}></textarea>
    <br />
    <button disabled={sending} on:mouseup={set}>
      <span>Save</span>
    </button>
  </div>
{/if}
