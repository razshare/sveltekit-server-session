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

```js
import { session } from 'sveltekit-server-session'

export async function GET({ cookies }) {
  const {
    error,
    value: { data, response },
  } = await session.start({ cookies })

  if (error) {
    return new Response(error.message, { status: 500 })
  }

  if (!data.has('counter')) {
    data.set('counter', 0)
  }

  let counter = data.get('counter')

  return response(counter)
}
```