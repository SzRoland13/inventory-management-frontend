import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  AppLocale,
  DEFAULT_LOCALE,
  isSupportedLocale,
} from '@/lib/config/locales';

export default async function Home() {
  const headersList = headers();
  const acceptLanguage = (await headersList).get('accept-language');

  let detectedLocale: AppLocale = DEFAULT_LOCALE;
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(',')[0].split('-')[0]; // e.g. "en-US" → "en"
    if (isSupportedLocale(preferred)) {
      detectedLocale = preferred;
    }
  }

  redirect(`/${detectedLocale}`);
}
