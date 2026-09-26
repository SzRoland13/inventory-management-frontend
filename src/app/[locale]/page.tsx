import { redirect } from '@/i18n/navigation';
import { Routes } from '@/lib/enums/routes';

export default async function LocaleRootPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: Routes.Login_Start, locale });
}
