import type {
  DashboardDateRange,
  DashboardSourceData,
  DashboardViewModel,
} from '@/features/dashboard/types/dashboard';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getDashboardDateRange(referenceDate = new Date()): DashboardDateRange {
  const end = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const start = new Date(end.getTime() - 29 * DAY_IN_MILLISECONDS);
  return { start, end, startDate: toDateKey(start), endDate: toDateKey(end) };
}

export function buildDashboardViewModel(
  source: DashboardSourceData,
  range: DashboardDateRange,
): DashboardViewModel {
  const invoices = source.invoices.filter(
    (invoice) => invoice.date >= range.startDate && invoice.date <= range.endDate,
  );

  const productById = new Map(source.products.map((product) => [product.id, product]));
  const stockByProduct = new Map<number, number>();
  for (const balance of source.balances) {
    stockByProduct.set(
      balance.productId,
      (stockByProduct.get(balance.productId) ?? 0) + balance.quantity,
    );
  }

  const lowStockProducts = [...stockByProduct.entries()]
    .flatMap(([productId, quantity]) => {
      const product = productById.get(productId);
      if (
        !product ||
        product.minimumStockQuantity == null ||
        quantity > product.minimumStockQuantity
      ) {
        return [];
      }
      return [{ ...product, quantity }];
    })
    .sort((first, second) => first.quantity - second.quantity);

  const salesTrend = Array.from({ length: 30 }, (_, dayIndex) => {
    const day = new Date(range.start.getTime() + dayIndex * DAY_IN_MILLISECONDS);
    const key = toDateKey(day);
    return invoices.filter((invoice) => invoice.date.slice(0, 10) === key).length;
  });

  const totalsByCurrency = new Map<string, number>();
  for (const invoice of invoices) {
    if (invoice.status === 'CANCELLED' || !invoice.totals) continue;
    const currency = invoice.totals.currencyCode ?? '—';
    totalsByCurrency.set(
      currency,
      (totalsByCurrency.get(currency) ?? 0) + invoice.totals.gross,
    );
  }

  const inboundMovementCount = source.movements.filter(
    (movement) => movement.quantityChange > 0,
  ).length;

  return {
    activeProductCount: source.activeProductCount,
    lowStockProducts,
    salesDocumentCount: invoices.length,
    salesTrend,
    salesTotals: [...totalsByCurrency.entries()].map(([currency, amount]) => ({
      currency,
      amount,
    })),
    movements: source.movements,
    inboundMovementCount,
    outboundMovementCount: source.movements.length - inboundMovementCount,
  };
}
