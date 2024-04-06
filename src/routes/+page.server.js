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
