import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/config/locales';
import { classifyPath } from '@/lib/auth/routeGroups';
import { resolveSession, ResolveSessionResult } from '@/lib/auth/resolveSession';
import {
  SESSION_HEADER_NAME,
  encodeSessionHeader,
  VerifiedSession,
} from '@/lib/auth/sessionHeader';
import { Routes } from '@/lib/enums/routes';

const intlMiddleware = createMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
});

function applyCookieInstructions(
  response: NextResponse,
  result: Pick<ResolveSessionResult, 'setCookies' | 'clearCookies'>,
) {
  for (const rawSetCookie of result.setCookies) {
    response.headers.append('set-cookie', rawSetCookie);
  }

  if (result.clearCookies) {
    response.cookies.set('access_token', '', { maxAge: 0, path: '/' });
    response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' });
  }
}

export default async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  // next-intl already decided to redirect/rewrite for a locale reason -
  // return it as-is and defer auth logic to the next request, which will
  // have a stable, locale-prefixed path.
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  const { pathname } = request.nextUrl;
  const [, localeSegment, ...rest] = pathname.split('/');
  const locale = SUPPORTED_LOCALES.includes(
    localeSegment as (typeof SUPPORTED_LOCALES)[number],
  )
    ? localeSegment
    : DEFAULT_LOCALE;
  const pathWithoutLocale = `/${rest.join('/')}`.replace(/\/$/, '') || '/';
  const group = classifyPath(pathWithoutLocale);

  if (group === 'public') {
    return intlResponse;
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const result = await resolveSession({ accessToken, refreshToken });

  if (group === 'protected' && !result.authenticated) {
    const redirectUrl = new URL(`/${locale}${Routes.Login_Start}`, request.url);
    const response = NextResponse.redirect(redirectUrl);
    applyCookieInstructions(response, result);
    return response;
  }

  // protected+authenticated, or auth-group (either state): continue,
  // attaching the verified-session header. The (auth) layout - not this
  // file - owns the "already authenticated, bounce to dashboard" decision.
  const session: VerifiedSession = result.authenticated
    ? { authenticated: true, user: result.user! }
    : { authenticated: false, user: null };

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(SESSION_HEADER_NAME); // anti-spoof: never trust a client-supplied value
  requestHeaders.set(SESSION_HEADER_NAME, encodeSessionHeader(session));

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  for (const setCookie of intlResponse.headers.getSetCookie()) {
    response.headers.append('set-cookie', setCookie);
  }
  applyCookieInstructions(response, result);

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
