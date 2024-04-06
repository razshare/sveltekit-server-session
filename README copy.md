# SvelteKit Server Session

This library provides an easy way to start, serve and modify server sessions.

Install with:

```sh
npm i -D sveltekit-server-session
```

# Usage

1. Open your `src/app.d.ts` file and define your _session_ key under `interface Locals`.
    ```ts
    // See https://kit.svelte.dev/docs/types#app
    
    import type { Session } from 'sveltekit-server-session';
    
    // for information about these interfaces
    declare global {
      namespace App {
        // interface Error {}
        interface Locals {
          // Add type hints to "locals".
          session: Session;
        }
        // interface PageData {}
        // interface PageState {}
        // interface Platform {}
      }
    }
    
    export {};
    ```
    This will give you proper type hints when you access your `locals` property.
1. Create a new `src/hooks.server.js` and start the session in your `handle` function.
    ```js
    // src/hooks.server.js
    import { session } from 'sveltekit-server-session';
    
    /**
    * @type {import("@sveltejs/kit").Handle}
    */
    export async function handle({ event, resolve }) {
      // Start the session.
      const { error, value: sessionLocal } = await session.start({
        cookies: event.cookies,
      })

      // Check for errors.
      if (error) {
        return new Response(error.message, { status: 500 })
      }

      // Saving session to `locals`.
      event.locals.session = sessionLocal

      // Resolve the sveltekit response.
      const response = await resolve(event)

      // Adding required headers to the response.
      for (const [key, value] of sessionLocal.response().headers) {
        response.headers.set(key, value)
      }

      return response
    }
    ```
    This will make sure every api request has access to the session.
1. Create an api endpoint that updates the session.
    ```js
    // src/routes/session/quote/update/+server.js
    export async function PUT({ locals, request }) {
      // Get the session data and response function.
      const { data, response } = locals.session

      // Update the "quote".
      data.set('quote', await request.text())

      // Respond with the new "quote".
      return response(data.get('quote'))
    }
    ```
1. Retrieve the session and load it into the svelte page.
    ```js
    // src/routes/+page.server.svelte
    /**
    * @type {import("./$types").PageServerLoad}
    */
    export function load({ locals }) {
      // Get the session data.
      const { data } = locals.session

      if (!data.has('quote')) {
        // Set a default "quote".
        data.set('quote', 'initial quote')
      }

      return {
        // Load the "quote" into the page.
        quote: data.get('quote'),
      }
    }
    ```
1. Create a svelte page.
    ```svelte
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

    <textarea bind:value={data.quote}></textarea>
    <br />
    <button disabled={sending} on:mouseup={set}>
      <span>Save</span>
    </button>
    ```


![Peek 2024-04-01 03-15](https://github.com/tncrazvan/sveltekit-server-session/assets/6891346/c633f001-bead-4d94-9927-c1602cd1dfac)