import { session } from '$lib/session'

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

  if (!data.has('counter')) {
    data.set('counter', 0)
  }

  let counter = data.get('counter')

  return response(JSON.stringify(counter))
}
