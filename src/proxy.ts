import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';
import { classifyPath } from '@/lib/auth/routeGroups';
import { resolveSession, ResolveSessionResult } from '@/lib/auth/resolveSession';
import {
  SESSION_HEADER_NAME,
  encodeSessionHeader,
  VerifiedSession,
} from '@/lib/auth/sessionHeader';
import { Routes } from '@/lib/enums/routes';

const intlMiddleware = createMiddleware(routing);

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
  const { pathname } = request.nextUrl;
  const [, localeSegment, ...rest] = pathname.split('/');
  const locale = (routing.locales as readonly string[]).includes(
    localeSegment,
  )
    ? localeSegment
    : routing.defaultLocale;
  const pathWithoutLocale = `/${rest.join('/')}`.replace(/\/$/, '') || '/';
  const group = classifyPath(pathWithoutLocale);

  if (group === 'public') {
    return intlMiddleware(request);
  }

  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;
  const result = await resolveSession({ accessToken, refreshToken });

  if (group === 'protected' && !result.authenticated) {
    // Built directly rather than deferring to next-intl, since the
    // fallback locale computed above already produces a correctly
    // prefixed URL regardless of whether the incoming request had one.
    const redirectUrl = new URL(`/${locale}${Routes.Login_Start}`, request.url);
    const response = NextResponse.redirect(redirectUrl);
    applyCookieInstructions(response, result);
    return response;
  }

  // protected+authenticated, or auth-group (either state): continue,
  // attaching the verified-session header. The (auth) layout - not this
  // file - owns the "already authenticated, bounce to dashboard" decision.
  //
  // Important: the header must be set on the REQUEST *before* handing it
  // to intlMiddleware, not by wrapping its result in a second
  // NextResponse.next() afterward. next-intl builds its own forwarded
  // request headers as `new Headers(request.headers)` internally - a
  // second, independent NextResponse.next() call here would silently
  // replace that forwarded header set, dropping next-intl's own locale
  // negotiation header and breaking translations for non-default locales.
  const session: VerifiedSession = result.authenticated
    ? { authenticated: true, user: result.user! }
    : { authenticated: false, user: null };

  const headers = new Headers(request.headers);
  headers.delete(SESSION_HEADER_NAME); // anti-spoof: never trust a client-supplied value
  headers.set(SESSION_HEADER_NAME, encodeSessionHeader(session));

  const requestWithSession = new NextRequest(request, { headers });
  const response = intlMiddleware(requestWithSession);
  applyCookieInstructions(response, result);

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
