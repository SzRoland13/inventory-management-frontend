import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  const activeLocale = locale ?? 'en';

  return {
    locale: activeLocale,
    messages: (await import(`@/lib/locales/messages/${activeLocale}.json`))
      .default,
  };
});
