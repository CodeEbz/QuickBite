export const formatNaira = (value) => {
  const amount = Number(value || 0);
  return `\u20A6${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
