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
</style>

<script>
  let sending = false
  let count = 0

  async function destroy() {
    sending = true
    await fetch('/session/destroy')
    count++
    sending = false
  }
</script>

<div class="content">
  <a href="/">
    <span>&lt; Back</span>
  </a>
  <br />
  <button disabled={sending} on:mouseup={destroy}>
    <span>Destroy</span>
  </button>
  {#if sending}
    <span>Destroying session...</span>
  {:else if count > 0}
    <span>Done.</span>
  {/if}
</div>
