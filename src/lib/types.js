export {}

/**
 * @typedef {"destroy"} Events
 */

/**
 * @typedef {Map<Events,Array<function(Session):void>>} EventsMap
 */

/**
 * @callback EventCallback
 * @param {Session} session
 */

/**
 * @typedef Session
 * @property {string} id Session id (readonly).
 * @property {Map<string, any>} data Session data.
 * @property {number} createdUnix Unix timestamp indicating the creation date of the session (readonly).
 * @property {number} expiresAtUnix Unix timestamp of when the session will expire (readonly).
 * @property {GetRemainingSeconds} getRemainingSeconds Get the seconds remaining before the session expires.
 * @property {Destroy} destroy Get the seconds remaining before the session expires.
 * @property {ResponseCreator} response Create a new `Response` with the required headers for managing the session.
 * @property {AddEventListener} addEventListener Add an event listener.
 * @property {RemoveEventListener} removeEventListener Remove an event listener.
 */

/**
 * @callback AddEventListener
 * @param {Events} event
 * @param {EventCallback} callback
 */

/**
 * @callback RemoveEventListener
 * @param {Events} event
 * @param {EventCallback} callback
 */

/**
 * @callback Destroy
 * @returns {Promise<import("sveltekit-unsafe").Unsafe<void>>}
 */

/**
 * @callback GetRemainingSeconds
 * @returns {number} The seconds remaining before the session expires.
 */

/**
 * @callback ResponseCreator
 * @param {BodyInit} [body]
 * @param {ResponseInit} [init]
 * @returns {Response} The `Response` to serve.
 */
