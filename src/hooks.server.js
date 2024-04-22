// src/hooks.server.js
import { session } from '$lib/session'

/**
 * @type {import("@sveltejs/kit").Handle}
 */
export async function handle({ event, resolve }) {
  // Start the session.
  const [sessionLocal, error] = await session.start({
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
