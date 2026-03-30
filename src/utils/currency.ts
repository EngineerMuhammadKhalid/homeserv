export const CURRENCY_RATES: Record<string, number> = {
  // Base amounts in PKR in the database. Rates are PKR -> target currency multiplier.
  PKR: 1,
  GBP: 0.0035 // default approximate rate; make configurable in production
};

export function formatCurrency(amount: number | string | null | undefined, currency = 'PKR') {
  const num = Number(amount || 0);
  if (isNaN(num)) return '';
  const locale = currency === 'GBP' ? 'en-GB' : 'en-PK';
  const options: Intl.NumberFormatOptions = { style: 'currency', currency: currency === 'GBP' ? 'GBP' : 'PKR', maximumFractionDigits: 2 };
  const converted = Math.round((num * (CURRENCY_RATES[currency] || 1)) * 100) / 100;
  try {
    return new Intl.NumberFormat(locale, options).format(converted);
  } catch (err) {
    // fallback
    const symbol = currency === 'GBP' ? '£' : 'Rs.';
    return `${symbol} ${converted}`;
  }
}
