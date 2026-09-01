/**
 * Cheap, signature-less JWT check: is the token well-formed and unexpired?
 * Used for routing decisions (middleware, layout chrome) — the backend still
 * does real signature validation on every request. Works in both the Edge
 * runtime and Node (`atob` is global in both).
 */
export function isJwtValid(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const seg = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(seg)) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}
