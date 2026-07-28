export function formatPKR(value) {
  const num = Number(value || 0);
  if (Number.isNaN(num)) return "Rs. 0";
  return `Rs. ${num.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export function toNumber(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}
