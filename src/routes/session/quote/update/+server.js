// src/routes/session/quote/update/+server.js
export async function PUT({ locals, request }) {
  // Get the session data and response function.
  const { data, response } = locals.session

  // Update the "quote".
  data.set('quote', await request.text())

  // Respond with the new "quote".
  return response(data.get('quote'))
}
