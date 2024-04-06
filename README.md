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

      // Save session to `locals`.
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
      // Load session data.
      /** @type {import('./$types').PageData} */
      export let data

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



# Don't Preload

SvelteKit comes with preload features baked in, however these feature may result in some inconsistent behavior when dealing with server state, like sessions.

Navigate to your `src/app.html` file and disable preloading by settings `data-sveltekit-preload-data` to `false` on your `body` element.

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

The reason for this is due to inconsistencies to how state may become out of sync after preloading.

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

# Complete Example

**You can find a [complete example leveraging the recommended usage here](https://github.com/tncrazvan/sveltekit-server-session-example).**


> [!NOTE]
> Remember to run your SvelteKit server dev at least 
> once to properly generate your glue types.

> [!NOTE]
> Sessions are only directly available under `*.server.js` and `*.server.ts` files.\
> Sessions are meant to be private data, so they will never be directly available [under universal files](https://kit.svelte.dev/docs/load#universal-vs-server) like `+page.js`, for example.
