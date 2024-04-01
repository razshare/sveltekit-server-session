export async function PUT({ locals, request }) {
  const { data, response } = locals.session
  data.set('quote', await request.text())
  return response(data.get('quote'))
}
