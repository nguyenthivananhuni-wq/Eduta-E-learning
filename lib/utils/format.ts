export function formatVND(amount: number): string {
  if (amount === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format số tiền dạng "+500.000đ" / "-100.000đ" (luôn hiển thị số). */
export function formatVNDSigned(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("vi-VN").format(abs);
  if (amount > 0) return `+${formatted}đ`;
  if (amount < 0) return `-${formatted}đ`;
  return `${formatted}đ`;
}
