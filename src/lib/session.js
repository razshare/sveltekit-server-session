/**
 * @typedef StartPayload
 * @property {import('@sveltejs/kit').Cookies} cookies Request cookies.\
 * Usually retrieved from the SvelteKit endpoint definition itself, for example
 * ```js
 * export function GET({ cookies }) {
 *  session.start({ cookies })
 *  return new Response('hello')
 * }
 * ```
 */

/**
 * @typedef FindPayload
 * @property {string} id Session id.
 */

import { error } from './error'
import { ok } from './ok'
import { uuid } from './uuid'

let sessionKey = 'KITSESSID'
let durationUnix = 60 * 60 * 24 * 7 // 7 days

/**
 * @type {Map<string,import('./types').Session>}
 */
const map = new Map()

/**
 * Create a new session.
 * @template [T = Map<string, any>]
 * @param {{id:string,data:any}} payload
 * @returns {import('./types').Session<T>}
 */
function create({ id, data }) {
  const created = Math.floor(Date.now() / 1000)
  const duration = durationUnix
  const expiresAtUnix = created + duration

  return {
    get id() {
      return id
    },
    get data() {
      return data
    },
    get createdUnix() {
      return created
    },
    get expiresAtUnix() {
      return expiresAtUnix
    },
    getRemainingSeconds() {
      const now = Math.floor(Date.now() / 1000)
      const remaining = expiresAtUnix - now
      return remaining >= 0 ? remaining : 0
    },
    response(body, init) {
      const cookieName = encodeURI(sessionKey)
      const cookieValue = encodeURI(id)
      const cookieExpires = new Date(expiresAtUnix * 1000).toUTCString()
      return new Response(body, {
        ...init,
        headers: {
          'Set-Cookie': `${cookieName}=${cookieValue}; Expires=${cookieExpires}; Path=/`,
          ...init?.headers,
        },
      })
    },
  }
}

/**
 * @param {{id:string}} payload
 */
function isValid({ id }) {
  const session = map.get(id)
  if (!session) {
    return false
  }
  return session.getRemainingSeconds() > 0
}

/**
 * @callback Exists
 * @param {string} id Session id.
 * @returns {Promise<import('./types').Unsafe<boolean>>}
 */

/**
 * @callback IsValid
 * @param {string} id Session id.
 * @returns {Promise<import('./types').Unsafe<boolean>>}
 */

/**
 * @callback Has
 * @param {string} id Session id.
 * @returns {Promise<import('./types').Unsafe<boolean>>}
 */

/**
 * @template [T = Map<string, any>]
 * @callback Get
 * @param {string} id Session id.
 * @returns {Promise<import('./types').Unsafe<import('./types').Session<T>>>}
 */

/**
 * @callback Delete
 * @param {string} id Session id.
 * @returns {Promise<import('./types').Unsafe<void>>}
 */

/**
 * @template [T = Map<string, any>]
 * @callback Set
 * @param {string} id Session id.
 * @param {import('./types').Session<T>} session
 * @returns {Promise<import('./types').Unsafe<void>>}
 */

/**
 * @typedef SessionInterface
 * @property {Exists} exists Check wether or not the session id already exists.
 * @property {IsValid} isValid Check wether or not the session id is valid.\
 * This is where you may checked wether or not the session has expired or not, for example.
 * @property {Has} has Get the session.
 * @property {Get} get Get the session.
 * @property {Set} set Set a session.
 * @property {Delete} delete Delete a session.
 */

/**
 * @type {SessionInterface}
 */
let _interface = {
  async exists(id) {
    return ok(map.has(id))
  },
  async isValid(id) {
    return ok(isValid({ id }))
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
}

export const session = {
  /**
   * Get the current session operations.
   * @returns {SessionInterface}
   */
  getOperations() {
    return _interface
  },
  /**
   * Customize your session operations.
   * @param {SessionInterface} operations
   */
  async setOperations(operations) {
    _interface = operations
  },
  /**
   * Start a parked session from `cookies` or create a new one if no
   * parked session is found or is expired.\
   * @template [T = Map<string, any>]
   * @param {StartPayload} payload
   * @returns {Promise<import('./types').Unsafe<import('./types').Session<T>>>}
   */
  async start({ cookies }) {
    let id = cookies.get(sessionKey) ?? ''

    if ('' === id) {
      let exists = true
      do {
        id = uuid()
        const existsAttempt = await _interface.exists(id)
        if (existsAttempt.error) {
          return error(existsAttempt.error)
        }
        exists = existsAttempt.value
      } while (exists)
    }

    /**
     * @type {import('./types').Session<any>}
     */
    let sessionLocal

    const hasAttempt = await _interface.has(id)

    if (hasAttempt.error) {
      return error(hasAttempt.error)
    }

    if (hasAttempt.value) {
      const getAttempt = await _interface.get(id)
      if (getAttempt.error) {
        return error(getAttempt.error)
      }
      sessionLocal = getAttempt.value
    } else {
      sessionLocal = create({ id, data: new Map() })
      const setAttempt = await _interface.set(id, sessionLocal)
      if (setAttempt.error) {
        return error(setAttempt.error)
      }
    }

    return ok(sessionLocal)
  },
  /**
   * Destroy a session.
   * @param {{id:string}} payload
   * @returns {Promise<import('./types').Unsafe<void>>} Error if no session with the given `id` is found, otherwise success.
   */
  async destroy({ id }) {
    const getAttempt = await _interface.get(id)
    if (getAttempt.error) {
      return error(getAttempt.error)
    }
    const session = getAttempt.value

    if (!session) {
      return error(`Session ${id} not found.`)
    }

    const deleteAttempt = await _interface.delete(id)
    if (deleteAttempt.error) {
      return error(deleteAttempt.error)
    }

    return ok()
  },
  /**
   * Clear all invalid local sessions.
   * - You should invoke this periodically.
   * - This uses an internal semaphore and too many `flush()` submissions will be ignored silently.
   */
  async flush() {
    if (flushing) {
      return
    }
    flushing = true
    const promisses = []
    /**
     * @type {Array<string>}
     */
    const toBeRemoved = []
    for (const [, session] of map) {
      if (isValid({ id: session.id })) {
        continue
      }
      toBeRemoved.push(session.id)
    }

    for (const id of toBeRemoved) {
      promisses.push(_interface.delete(id))
    }

    await Promise.all(promisses)
    flushing = false
  },
}

let flushing = false
