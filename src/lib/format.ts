const chfFormatter = new Intl.NumberFormat("de-CH", {
  style: "currency",
  currency: "CHF",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("de-CH", {
  maximumFractionDigits: 0,
});

export const formatCHF = (amount: number): string => chfFormatter.format(amount);

export const formatNumber = (value: number): string => numberFormatter.format(value);

export const formatCHFDelta = (amount: number): string => {
  const sign = amount >= 0 ? "+" : "−";
  return `${sign}${chfFormatter.format(Math.abs(amount))}`;
};
