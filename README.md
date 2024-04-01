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

# An example

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

Whenever you start a session you're actually trying to retrieve a `KITSESSID` cookie from the client, which should hold a session id.

> [!NOTE]
> Sessions are internally mapped with a `Map<string, Session>` object.\
> This map's keys are the sessions `id`s of your application.

If the client doesn't hold a session id cookie, then it means it has no session, then a new one is created.

If the client does have a session id but is expired, then the relative session is immediately destroyed, then a new session is created.\
This new session doesn't contain any of the old session's data.

Finally, if the client has a valid session id cookie, the relative session is retrieved.
\
\
Starting a session should always succeed, wether it is by creating a new session or retrieving an existing one.

# Destroy & Flush

As explained above, in the [lifetime section](#lifetime), clients that present an expired session id have their sessions destroyed immediately.

But sometimes clients want to create new sessions regardless if the current one has expired or not.\
Other times clients abandon their sessions and never awaken them again.

These use cases can be a problem.

Even though these "abandoned" sessions are not active, they will still use some memory, 
so they must be destroyed one way or another.

**You can use `destroy()`**
```js
// src/routes/session/destroy/+server.js
import { session } from 'sveltekit-server-session'

/**
 *
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function delay(milliseconds) {
  return new Promise(function start(resolve) {
    setTimeout(resolve, milliseconds)
  })
}

export async function GET({ cookies }) {
  const {
    error,
    value: { destroy },
  } = await session.start({ cookies })

  if (error) {
    return new Response(error.message, { status: 500 })
  }

  await destroy()

  await delay(3000)

  return new Response('Session destroyed.')
}
```
to destroy each session manually.

For example this may be useful to invoke when clicking a _logout_ button.

![Peek 2024-04-01 04-50](https://github.com/tncrazvan/sveltekit-server-session/assets/6891346/9c096805-ce5b-4883-b8e3-5dc25499c7fd)


### However one problem still remains

> Other times clients abandon their sessions and never awaken them again.

When a client simply stops using your application for days even, destroying a session can become a bit more convoluted, 
because in those cases there's no client to click the hypothetical _logout_ button.

**So what do we do?**

The answer is _nothing_, this library takes care of that.

Whenever you create a session, a destructor function is automatically dispatched to destroy the session when it expires.\
This is simply achieved through the event loop, using a `Timer` through `setTimeout`.


# Custom behavior

You can customize your sessions behavior with `session.setOperations()`.

All non local operations related to session management are described by `SessionInterface`.\
Even though some operations may appear to act directly on an instance of a session, like `.destroy()`, in reality they all use only operations defined bt `SessionInterface`.

This means you have total control over how sessions are retrieved, modified and validated.

Here's an example of how to set a custom set of operations for session management

```js
import { ok } from 'sveltekit-unsafe' // peer dependency
import { session } from 'sveltekit-server-session'
/**
 * @type {Map<string,import('$lib/types').Session>}
 */
const map = new Map()
session.setOperations({
  async exists(id) {
    return ok(map.has(id))
  },
  async isValid(id) {
    const session = map.get(id)
    if (!session) {
      return ok(false)
    }
    return ok(session.getRemainingSeconds() > 0)
  },
  async has(id) {
    return ok(map.has(id))
  },
  async get(id) {
    return ok(map.get(id))
  },
  async set(id, session) {
    map.set(id, session)
    return ok()
  },
  async delete(id) {
    map.delete(id)
    return ok()
  },
})
```

> [!NOTE]
> As you may have figured out, since these function definitions have an implicit asynchronous nature 
> they might as well query a database instead of working with an in-memory map, for improved resilience.


# Using SvelteKit Hooks

**You can simplify your developer experience** by moving the session management logic into your `src/hooks.server.js`.

1. First of all create a new `src/hooks.server.js` and move your session management logic in your `handle` function\
    ![image](https://github.com/tncrazvan/sveltekit-server-session/assets/6891346/a5216dd9-4a5a-43ac-81e2-635b2332343f)
    ```js
    import { session } from 'sveltekit-server-session';
    
    /**
    * @type {import("@sveltejs/kit").Handle}
    */
    export async function handle({ event, resolve }) {
    const { error, value: sessionLocal } = await session.start({ cookies: event.cookies });
    
    if (error) {
      return new Response(error.message, { status: 500 });
    }
    
    event.locals.session = sessionLocal;  // <=== Set session here.
                                          // You will get a type hinting error, this is normal.
                                          // See next step in order to fix this.
    
    const response = await resolve(event);
    
    for (const [key, value] of sessionLocal.response().headers) {
      response.headers.set(key, value);
    }
    
    return response;
    }
    ```
1. Open your `src/app.d.ts` file and define your _session_ key under `interface Locals`\
    ![image](https://github.com/tncrazvan/sveltekit-server-session/assets/6891346/58ac06e9-6e98-4485-9815-17003bfaebf0)
    ```ts
    // See https://kit.svelte.dev/docs/types#app
    
    import type { Session } from 'sveltekit-server-session';
    
    // for information about these interfaces
    declare global {
    namespace App {
      // interface Error {}
      interface Locals {
        session: Session; // <== Here.
      }
      // interface PageData {}
      // interface PageState {}
      // interface Platform {}
    }
    }
    
    export {};
    ```

And you're done, now all you have to do is destruct your session from your endpoints like so

```js
// src/routes/session/quote/update/+server.js
export async function PUT({ locals, request }) {
  const { data, response } = locals.session // <=== Here.
  data.set('quote', await request.text())
  return response(data.get('quote'))
}
```

# Recommended Usage

So far the development process has always involved using a `fetch('/session/quote/get')`  call to retrieve the initial value of the `quote`, but that is not necessary, we can simplify things even further by building on top of the [Using SvelteKit Hooks section](#using-sveltekit-hooks).

Since the hook handler defined above populates our `locals` prop, this means we now have access to the session from any `+page.server.js` file, so the following is now possible

```js
// src/routes/+page.server.js
/**
 * @type {import("./$types").PageServerLoad}
 */
export function load({ locals }) {
  const { data } = locals.session;

  if (!data.has('quote')) {
    data.set('quote', 'initial quote');
  }

  return {
    text: data.get('quote')
  };
}
```

There is no need for the `src/routes/session/quote/get/+server.js` file anymore, it can be removed.

And our `+page.svelte` file is simplified even further

```svelte
<!-- src/routes/+page.svelte -->
<script>
  /** @type {import('./$types').PageData} */
  export let data;

  let sending = false;

  async function set() {
    sending = true;
    await fetch('/session/quote/update', { method: 'PUT', body: data.text });
    sending = false;
  }
</script>

<div class="content">
  <textarea bind:value={data.text}></textarea>
  <br />
  <button disabled={sending} on:mouseup={set}>
    <span>Save</span>
  </button>
</div>
```

Simple as that.

# Don't preload

SvelteKit comes with preload features baked in, however these feature may result in some inconsistent behavior when dealing with server state, like sessions.

Navigate to your src/app.html file and disable preloading by settings `data-sveltekit-preload-data` to `false` on your `body` element.

```html
<!DOCTYPE html/>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="false"> <!-- Here. -->
    <div>%sveltekit.body%</div>
  </body>
</html>
```

The reason for this is due to inconsistencies to how state may change a browser page caching.

Consider the following use case,

 1. Let's say I want to modify my session in some way.<br/><br/>
    ![1](https://github.com/tncrazvan/sveltekit-server-session/assets/6891346/0bff9ac4-c838-44d6-a832-48781c066c10)
    <br/>
 2. Then I want to destroy my session, but the act of destroying it takes a while.<br/><br/>
    ![2](https://github.com/tncrazvan/sveltekit-server-session/assets/6891346/d8b90670-414f-4aff-8e1a-e4affd823eea)
    <br/>
 3. In the meantime, by mistake, I hover over some link that preloads the previous page, with the old state.<br/><br/>
    ![3](https://github.com/tncrazvan/sveltekit-server-session/assets/6891346/13225796-0204-46e1-b60b-b1a785e1324f)
    <br/>
 4. Then the session is finally destroyed, in this order.<br/>
     Well as you can see, when I navigate back to that page, the session state is not updated, because according to SvelteKit it has already preloaded it, and we're good to go.<br/><br/>
    ![4](https://github.com/tncrazvan/sveltekit-server-session/assets/6891346/76a8bd20-289c-4be6-b05d-41bd8266e196)
    <br/>

Which is obviously wrong.

You could technically disable preloading for specific cases and avoid the issue in that way, but at some point your whole application will be filled with links that point to some page that depends on the server session.\
It's just simply not worth the headache.

It's much easier and more straightforward to simply disable preloading.

> [!NOTE]
> Obviously you can still enable preload for resources like assets by manually adding 
> the `data-sveltekit-preload-data="hover"` attribute to specific elements in your page.

# Full Example

**You can find a [full example leveraging the recommended usage here](https://github.com/tncrazvan/sveltekit-server-session-example).**


> [!NOTE]
> Remember to run your SvelteKit server dev at least 
> once to properly generate your glue types.

> [!NOTE]
> Due to technical limitations, and frankly also
> for security reasons, sessions are only directly available under `*.server.js` and `*.server.ts` files.\
> Sessions are meant to be private data, so they will never be directly available [under universal files](https://kit.svelte.dev/docs/load#universal-vs-server) like `+page.js`, for example.
