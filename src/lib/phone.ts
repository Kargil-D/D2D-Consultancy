/** Strips formatting so "+91 77083 02280", "917708302280" and "7708302280" all match as the same number. */
export function normalizeMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}
