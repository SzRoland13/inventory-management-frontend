import { headers } from 'next/headers';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { decodeSessionHeader, SESSION_HEADER_NAME } from '@/lib/auth/sessionHeader';
import { queryKeys } from '@/lib/queries/queryKeys';
import { Routes } from '@/lib/enums/routes';
import { redirect } from '@/i18n/navigation';
import ProtectedLayoutClient from '@/components/layout/ProtectedLayoutClient';

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const headerList = await headers();
  const session = decodeSessionHeader(headerList.get(SESSION_HEADER_NAME));

  // proxy.ts already redirects unauthenticated requests away from protected
  // routes - this is a defense-in-depth fallback (e.g. a future route added
  // under (protected) before PROTECTED_ROUTES is updated), not the primary gate.
  if (!session.authenticated) {
    redirect({ href: Routes.Login_Start, locale });
  }

  // Fresh QueryClient per request - never a module-level singleton, which
  // would leak session data between users.
  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKeys.auth.session, {
    success: true,
    messageKey: '',
    payload: session.user,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProtectedLayoutClient>{children}</ProtectedLayoutClient>
    </HydrationBoundary>
  );
}
