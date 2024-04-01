/**
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function delay(milliseconds) {
  return new Promise(function start(resolve) {
    setTimeout(resolve, milliseconds)
  })
}

export async function GET({ locals }) {
  const { destroy } = locals.session
  await destroy()
  await delay(3000)
  return new Response('Session destroyed.')
}
