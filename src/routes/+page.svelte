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
  /** @type {import('./$types').PageData} */
  export let data

  let sending = false

  async function set() {
    sending = true
    await fetch('/session/quote/update', { method: 'PUT', body: data.text })
    sending = false
  }
</script>

<div class="content">
  <a href="/manage">
    <span>Manage Session</span>
  </a>
  <br />
  <textarea bind:value={data.text}></textarea>
  <br />
  <button disabled={sending} on:mouseup={set}>
    <span>Save</span>
  </button>
</div>
