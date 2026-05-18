export function formatCurrency(value, symbol = "₹") {
  return `${symbol}${Number(value || 0).toFixed(2)}`;
}

export function formatCurrencyCompact(value) {
  const n = Number(value || 0);
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)}K`;
  return `₹${n.toFixed(2)}`;
}
