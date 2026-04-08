export const CURRENCY_RATES: Record<string, number> = {
  // All amounts in GBP
  GBP: 1
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
