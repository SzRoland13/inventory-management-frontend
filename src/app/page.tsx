import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

const SUPPORTED_LOCALES = ['en', 'hu'] as const;
const DEFAULT_LOCALE = 'en';

function isSupportedLocale(
  value: string,
): value is (typeof SUPPORTED_LOCALES)[number] {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export default async function Home() {
  const headersList = headers();
  const acceptLanguage = (await headersList).get('accept-language');

  let detectedLocale: (typeof SUPPORTED_LOCALES)[number] = DEFAULT_LOCALE;
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(',')[0].split('-')[0]; // e.g. "en-US" → "en"
    if (isSupportedLocale(preferred)) {
      detectedLocale = preferred;
    }
  }

  redirect(`/${detectedLocale}`);
}
