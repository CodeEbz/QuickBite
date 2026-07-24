export function toNumber(value: number | string | null | undefined, fallback = 0) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function formatCurrency(value: number | string | null | undefined) {
  return `$${toNumber(value).toFixed(2)}`;
}

export function formatRating(value: number | string | null | undefined) {
  return toNumber(value).toFixed(1);
}
