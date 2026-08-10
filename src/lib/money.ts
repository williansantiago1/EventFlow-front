export function formatMoney(cents: number, currency = "BRL"): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: currency || "BRL",
  });
}
