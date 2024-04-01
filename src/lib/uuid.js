export function uuid({ short } = { short: false }) {
  let dt = new Date().getTime()
  const BLUEPRINT = short ? 'xyxxyxyx' : 'xxxxxxxx-xxxx-yxxx-yxxx-xxxxxxxxxxxx'
  const RESULT = BLUEPRINT.replace(/[xy]/g, function check(c) {
    const r = (dt + Math.random() * 16) % 16 | 0
    dt = Math.floor(dt / 16)
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
  return RESULT
}
