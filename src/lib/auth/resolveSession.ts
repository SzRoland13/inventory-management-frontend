import { getServerApiUrl } from '@/lib/config/serverApiUrl';
import { ApiResponse } from '@/lib/services/dtos/genericDtos';
import { UserDto } from '@/lib/services/dtos/userDtos';

export type ResolveSessionInput = {
  accessToken?: string;
  refreshToken?: string;
};

export type ResolveSessionResult = {
  authenticated: boolean;
  user: UserDto | null;
  /** Raw Set-Cookie strings to relay verbatim onto the outgoing response. */
  setCookies: string[];
  /**
   * True only when the backend gave an authoritative "this is invalid"
   * answer (a rejected check-session with nothing left to try, or an
   * explicit refresh failure) - never on a caught network/fetch exception,
   * since a transient backend hiccup must not wipe a possibly-still-valid
   * session's cookies.
   */
  clearCookies: boolean;
};

function buildCookieHeader(pairs: Record<string, string | undefined>): string {
  return Object.entries(pairs)
    .filter((entry): entry is [string, string] => entry[1] !== undefined)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

function extractCookieValue(setCookie: string, name: string): string | undefined {
  return new RegExp(`^${name}=([^;]+)`).exec(setCookie)?.[1];
}

async function fetchCheckSession(cookieHeader: string): Promise<UserDto | null> {
  const res = await fetch(`${getServerApiUrl()}/auth/check-session`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const body = (await res.json()) as ApiResponse<UserDto>;
  return body.success ? body.payload : null;
}

async function fetchRefresh(
  refreshToken: string,
): Promise<{ ok: boolean; setCookies: string[] }> {
  const res = await fetch(`${getServerApiUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: `refresh_token=${refreshToken}` },
    cache: 'no-store',
  });

  return { ok: res.ok, setCookies: res.headers.getSetCookie() };
}

function unauthenticated(
  overrides: Partial<ResolveSessionResult> = {},
): ResolveSessionResult {
  return {
    authenticated: false,
    user: null,
    setCookies: [],
    clearCookies: false,
    ...overrides,
  };
}

export async function resolveSession(
  input: ResolveSessionInput,
): Promise<ResolveSessionResult> {
  try {
    if (input.accessToken) {
      const user = await fetchCheckSession(
        buildCookieHeader({
          access_token: input.accessToken,
          refresh_token: input.refreshToken,
        }),
      );

      if (user) {
        return { authenticated: true, user, setCookies: [], clearCookies: false };
      }

      if (!input.refreshToken) {
        // Backend explicitly rejected the access token and there's nothing
        // else to try - it's dead weight, clean it up.
        return unauthenticated({ clearCookies: true });
      }
      // else fall through to the refresh attempt below, using input.refreshToken
    } else if (!input.refreshToken) {
      // Neither cookie present - nothing to authenticate with, nothing to clean up.
      return unauthenticated();
    }

    const refreshToken = input.refreshToken!;
    const refreshResult = await fetchRefresh(refreshToken);

    if (!refreshResult.ok) {
      // Explicit backend rejection (e.g. TOKEN_EXPIRED). Relay its own
      // Set-Cookie (it already clears refresh_token) and defensively clear
      // both ourselves regardless.
      return unauthenticated({
        setCookies: refreshResult.setCookies,
        clearCookies: true,
      });
    }

    const newAccessToken = refreshResult.setCookies
      .map((cookie) => extractCookieValue(cookie, 'access_token'))
      .find((value) => value !== undefined);

    if (!newAccessToken) {
      // Defensive: a 2xx refresh that somehow didn't set a new access token.
      return unauthenticated({
        setCookies: refreshResult.setCookies,
        clearCookies: true,
      });
    }

    const user = await fetchCheckSession(
      buildCookieHeader({ access_token: newAccessToken }),
    );

    if (!user) {
      // Shouldn't normally happen - fail-safe, still an authoritative rejection.
      return unauthenticated({
        setCookies: refreshResult.setCookies,
        clearCookies: true,
      });
    }

    return {
      authenticated: true,
      user,
      setCookies: refreshResult.setCookies,
      clearCookies: false,
    };
  } catch {
    // Network/fetch exception at any step: fail-safe unauthenticated, but
    // never touch cookies - this must not log a valid session out over a
    // transient backend blip.
    return unauthenticated();
  }
}
