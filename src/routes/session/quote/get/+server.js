import { ok } from 'sveltekit-unsafe'
import { session } from '$lib/session'
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
