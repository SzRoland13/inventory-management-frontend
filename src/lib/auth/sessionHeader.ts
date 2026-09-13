import { UserDto } from '@/lib/services/dtos/userDtos';

/**
 * proxy.ts <-> layout contract. proxy.ts resolves the session once per
 * request and forwards the result via this request header; the (protected)
 * and (auth) layouts decode it instead of re-checking the session
 * themselves. proxy.ts MUST strip any client-supplied value of this header
 * before setting its own computed value - never trust an incoming one.
 */
export const SESSION_HEADER_NAME = 'x-verified-session';

export type VerifiedSession =
  | { authenticated: true; user: UserDto }
  | { authenticated: false; user: null };

export function encodeSessionHeader(session: VerifiedSession): string {
  return Buffer.from(JSON.stringify(session), 'utf-8').toString('base64');
}

const UNAUTHENTICATED: VerifiedSession = { authenticated: false, user: null };

export function decodeSessionHeader(
  raw: string | null | undefined,
): VerifiedSession {
  if (!raw) return UNAUTHENTICATED;

  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));

    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.authenticated === 'boolean'
    ) {
      return parsed as VerifiedSession;
    }
  } catch {
    // fall through to the fail-safe default below
  }

  return UNAUTHENTICATED;
}
