export const formatCurrency = (amount: number | string) => {
  return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', minimumFractionDigits: 0 }).format(Number(amount));
};
