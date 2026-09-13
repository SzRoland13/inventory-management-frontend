import { headers } from 'next/headers';
import { decodeSessionHeader, SESSION_HEADER_NAME } from '@/lib/auth/sessionHeader';
import { Routes } from '@/lib/enums/routes';
import { redirect } from '@/i18n/navigation';

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const headerList = await headers();
  const session = decodeSessionHeader(headerList.get(SESSION_HEADER_NAME));

  // The literal "reverse check": proxy.ts already resolved the session for
  // this request (one backend call total) - this layout owns the decision
  // to bounce an already-authenticated guest away from these pages.
  if (session.authenticated) {
    redirect({ href: Routes.Dashboard, locale });
  }

  return (
    <main className='flex min-h-screen items-center justify-center'>
      {children}
    </main>
  );
}
