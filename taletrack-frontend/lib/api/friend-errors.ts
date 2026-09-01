import { ApiError } from './client';

const SEND_ERROR_CODES = new Set([
  'already_friends',
  'already_pending',
  'reverse_pending',
  'self',
  'target_not_found',
]);

/**
 * Map a failed "send friend request" error to a localized message key
 * (`friends.sendError.*`). The backend supplies a stable `code`; anything
 * unrecognized falls back to the generic key.
 */
export function sendErrorKey(err: unknown): string {
  const code = err instanceof ApiError ? err.code : undefined;
  return code && SEND_ERROR_CODES.has(code)
    ? `friends.sendError.${code}`
    : 'friends.sendError.generic';
}
