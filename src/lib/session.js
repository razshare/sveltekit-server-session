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

/**
 * @typedef CreatePayload
 * @property {string} id
 * @property {any} data
 */

import { ok, error } from 'sveltekit-unsafe'
import { uuid } from './uuid'

let sessionKey = 'KITSESSID'
let durationUnix = 60 * 60 * 24 * 7 // 7 days

/**
 * @type {Map<string,import('./types').Session>}
 */
const map = new Map()

/**
 * Create a new session.
 * @param {CreatePayload} payload
 * @returns {import('./types').Session}
 */
function create({ id, data }) {
  const created = Math.floor(Date.now() / 1000)
  const duration = durationUnix
  const expiresAtUnix = created + duration
  let destroying = false
  let destroyed = false

  /**
   * @type {import('./types').EventsMap}
   */
  const events = new Map()

  /**
   * @type {Array<import('./types').EventCallback>}
   */
  events.set('destroy', [])

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
    async destroy() {
      if (destroyed) {
        return ok()
      }
      if (destroying) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this
        return new Promise(function start(resolve) {
          self.addEventListener('destroy', function start() {
            resolve(ok())
          })
        })
      }
      destroying = true
      const destroyAttempt = await _interface.delete(id)
      if (destroyAttempt.error) {
        return destroyAttempt
      }
      destroyed = true
      const callbacks = events.get('destroy') ?? []

      for (const callback of callbacks) {
        callback(this)
      }

      return ok()
    },
    addEventListener(event, callback) {
      const callbacks = events.get(event)
      if (!callbacks) {
        return
      }
      callbacks.push(callback)
    },
    removeEventListener(event, callback) {
      const callbacks = events.get(event)
      if (!callbacks) {
        return
      }

      callbacks.filter(function pass(callbackLocal) {
        return callbackLocal !== callback
      })

      events.set(event, callbacks)
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
 * @callback Exists
 * @param {string} id Session id.
 * @returns {Promise<import('sveltekit-unsafe').Unsafe<boolean>>}
 */

/**
 * @callback IsValid
 * @param {string} id Session id.
 * @returns {Promise<import('sveltekit-unsafe').Unsafe<boolean>>}
 */

/**
 * @callback Has
 * @param {string} id Session id.
 * @returns {Promise<import('sveltekit-unsafe').Unsafe<boolean>>}
 */

/**
 * @callback Get
 * @param {string} id Session id.
 * @returns {Promise<import('sveltekit-unsafe').Unsafe<import('./types').Session>>}
 */

/**
 * @callback Delete
 * @param {string} id Session id.
 * @returns {Promise<import('sveltekit-unsafe').Unsafe<void>>}
 */

/**
 * @callback Set
 * @param {string} id Session id.
 * @param {import('./types').Session} session
 * @returns {Promise<import('sveltekit-unsafe').Unsafe<void>>}
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
}

export const session = {
  /**
   * Set the lifetime of all sessions.\
   * Default value is `7` days (which is `60 * 60 * 24 * 7` seconds).
   * @param {{seconds:number}} payload
   */
  setDurationUnix({ seconds }) {
    durationUnix = seconds
  },
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
   * @param {StartPayload} payload
   * @returns {Promise<import('sveltekit-unsafe').Unsafe<import('./types').Session>>}
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
     * @type {import('./types').Session}
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

    const timer = setTimeout(async function run() {
      await sessionLocal.destroy()
    }, sessionLocal.getRemainingSeconds() * 1000)

    sessionLocal.addEventListener('destroy', function run() {
      clearTimeout(timer)
    })

    return ok(sessionLocal)
  },
  /**
   * Destroy a session.
   * @param {{id:string}} payload
   * @returns {Promise<import('sveltekit-unsafe').Unsafe<void>>} Error if no session with the given `id` is found, otherwise success.
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
    /**
     * @type {Array<Promise<import('sveltekit-unsafe').Unsafe<void>>>}
     */
    const destructors = []
    for (const [, session] of map) {
      if (await _interface.isValid(session.id)) {
        continue
      }
      destructors.push(session.destroy())
    }

    await Promise.all(destructors)
    flushing = false
  },
}

let flushing = false
