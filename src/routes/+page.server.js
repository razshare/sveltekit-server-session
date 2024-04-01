/**
 * @type {import("./$types").PageServerLoad}
 */
export function load({ locals }) {
  const { data } = locals.session;

  if (!data.has('quote')) {
    data.set('quote', 'initial quote');
  }

  return {
    text: data.get('quote')
  };
}
