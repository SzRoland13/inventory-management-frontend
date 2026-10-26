export function formatStockQuantity(
  value: number | null,
  unitSymbol: string,
  locale: string,
) {
  if (value === null) return null;

  const formattedValue = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 8,
  }).format(value);

  return `${formattedValue} ${unitSymbol}`;
}

export function formatStockDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}
