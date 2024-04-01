export {}

/**
 * @template T
 * @typedef {{value:T,error:false|Error}} Unsafe
 */

/**
 * @template [T = Map<string, any>]
 * @typedef Session
 * @property {string} id Session id (readonly).
 * @property {T} data Session data.
 * @property {number} createdUnix Unix timestamp indicating the creation date of the session (readonly).
 * @property {number} expiresAtUnix Unix timestamp of when the session will expire (readonly).
 * @property {GetRemainingSeconds} getRemainingSeconds Get the seconds remaining before the session expires.
 * @property {ResponseCreator} response Create a new `Response` with the required headers for managing the session.
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
