import { session } from '$lib/session'

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
