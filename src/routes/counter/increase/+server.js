import { session } from '$lib/session'

export async function PUT({ cookies }) {
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
  data.set('counter', ++counter)

  return response(JSON.stringify(counter))
}
