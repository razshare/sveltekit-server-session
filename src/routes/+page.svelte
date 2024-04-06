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

<!-- src/routes/+page.svelte -->
<script>
  /** @type {import('./$types').PageData} */
  export let data // Load session data.

  let sending = false

  async function set() {
    sending = true
    // Update the session.
    await fetch('/session/quote/update', { method: 'PUT', body: data.quote })
    sending = false
  }
</script>

<div class="content">
  <textarea bind:value={data.quote}></textarea>
  <br />
  <button disabled={sending} on:mouseup={set}>
    <span>Save</span>
  </button>
</div>
