# SvelteKit Server Session

This library provides an easy way to create and read sessions in `+server.js` files.

Install with:

```sh
npm i -D sveltekit-server-session
```

# Start a session

Use `session::start` to start a session, in requires SvelteKits' `Cookies` interface.

```js
import { session } from 'sveltekit-server-session'

export async function GET({ cookies }) {
    await session.start({ cookies })
    // ...
}
```

A full example

```svelte
<!-- src/routes/+page.svelte -->
<script>
  import { onMount } from 'svelte'
  let text = ''
  let ready = false
  let sending = false

  onMount(async function start() {
    const response = await fetch('/counter/get')
    text = await response.text()
    ready = true
  })

  async function set() {
    sending = true
    await fetch('/counter/update', { method: 'PUT', body: text })
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
```
```js
// src/routes/counter/get/+server.js
import { session } from 'sveltekit-server-session'

/**
 * Periodically remove abandoned sessions.\
 * Every 1 minute in this example.
 */
setInterval(session.flush, 1000 * 60)

export async function GET({ cookies }) {
  const {
    error,
    value: { data, response },
  } = await session.start({ cookies })

  if (error) {
    return new Response(error.message, { status: 500 })
  }

  if (!data.has('quote')) {
    data.set('quote', 'initial quote')
  }

  return response(data.get('quote'))
}
```

```js
// src/routes/counter/get/+server.js
import { session } from 'sveltekit-server-session'

export async function PUT({ cookies, request }) {
  const {
    error,
    value: { data, response },
  } = await session.start({ cookies })

  if (error) {
    return new Response(error.message, { status: 500 })
  }

  data.set('quote', await request.text())

  return response(data.get('quote'))
}
```

![Peek 2024-04-01 03-15](https://github.com/tncrazvan/sveltekit-server-session/assets/6891346/c633f001-bead-4d94-9927-c1602cd1dfac)

