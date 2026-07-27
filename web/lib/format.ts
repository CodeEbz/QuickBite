export const toNumber = (value: number | string | null | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatCurrency = (value: number | string | null | undefined) => {
  return `\u20A6${toNumber(value).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatRating = (value: number | string | null | undefined) => {
  return toNumber(value).toFixed(1);
};
