export const CURRENCY_RATES: Record<string, number> = {
  // All amounts in GBP
  GBP: 1,
  // Approximate PKR -> GBP conversion rate (used to convert PKR amounts into GBP for display)
  // Keep this value conservative; consider replacing with a live rates API for production.
  PKR: 0.0038
};

export function formatCurrency(amount: number | string | null | undefined, currency = 'GBP') {
  const num = Number(amount || 0);
  if (isNaN(num)) return '';
  const locale = 'en-GB';
  const options: Intl.NumberFormatOptions = { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 };
  const converted = Math.round((num * (CURRENCY_RATES[currency] || 1)) * 100) / 100;
  try {
    return new Intl.NumberFormat(locale, options).format(converted);
  } catch (err) {
    // fallback
    const symbol = '£';
    return `${symbol} ${converted}`;
  }
}
