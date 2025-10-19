import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

const SUPPORTED_LOCALES = ['en', 'hu'] as const;
const DEFAULT_LOCALE = 'en';

export default async function Home() {
  const headersList = headers();
  const acceptLanguage = (await headersList).get('accept-language');

  let detectedLocale = DEFAULT_LOCALE;
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(',')[0].split('-')[0]; // e.g. "en-US" → "en"
    if (SUPPORTED_LOCALES.includes(preferred as any)) {
      detectedLocale = preferred as (typeof SUPPORTED_LOCALES)[number];
    }
  }

  redirect(`/${detectedLocale}`);
}
