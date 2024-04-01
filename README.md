# SvelteKit Server Session

This library provides an easy way to start, serve and modify server sessions.

Install with:

```sh
npm i -D sveltekit-server-session
```

# Start a session

Use `session.start()` to start a session.\
It requires SvelteKits' _Cookies_ interface.

```js
import { session } from 'sveltekit-server-session'

export async function GET({ cookies }) {
    const {data, response} await session.start({ cookies })
    return response("hello world")
}
```

> [!NOTE]
> The `response()` function creates a `Response` object and appends to it the headers required for session management.

# A full example

```svelte
<!-- src/routes/+page.svelte -->
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
```
```js
// src/routes/session/quote/get/+server.js
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
// src/routes/session/quote/update/+server.js
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

# Lifetime

The only way to start a session is through

```js
await session.start({ cookies })
```

Whenever you start a session you're actually trying to retrieve a `KITSESSID` cookie from the client, which holds a session id.

> [!NOTE]
> Sessions are internally mapped with a `Map<string, Session>` object.\
> This map's keys are the sessions `id`s of your application.

If the client doesn't hold a session id cookie, then it means it has no session, and a new one is created.

If the client does have a session id but is expired, then the relative session is immediately destroyed, and a new session is created.\
This new session doesn't contain any of the old session's data.

Finally, if the client has a valid session id cookie, the relative session is retrieved.