export async function GET({ locals }) {
  const { data, response } = locals.session

  if (!data.has('quote')) {
    data.set('quote', 'initial quote')
  }

  return response(data.get('quote'))
}
