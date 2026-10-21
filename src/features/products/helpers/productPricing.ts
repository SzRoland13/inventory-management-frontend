const MAX_INPUT_VALUE = 1e21;
const PRICE_DECIMAL_PLACES = 8;

function parseNonNegativeInput(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function formatPriceInput(value: number): string | null {
  if (!Number.isFinite(value) || value >= MAX_INPUT_VALUE) return null;
  return String(Number(value.toFixed(PRICE_DECIMAL_PLACES)));
}

export function calculateGrossPriceInput(
  netPrice: string,
  vatRate: string,
): string | null {
  const net = parseNonNegativeInput(netPrice);
  const vat = parseNonNegativeInput(vatRate);
  if (net === null || vat === null || vat > 99.999) return null;
  return formatPriceInput(net * (1 + vat / 100));
}

export function calculateNetPriceInput(
  grossPrice: string,
  vatRate: string,
): string | null {
  const gross = parseNonNegativeInput(grossPrice);
  const vat = parseNonNegativeInput(vatRate);
  if (gross === null || vat === null || vat > 99.999) return null;
  return formatPriceInput(gross / (1 + vat / 100));
}
