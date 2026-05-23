export const CATEGORIES = ["Lập trình", "Thiết kế", "Kinh doanh", "Ngoại ngữ"] as const;

export type Category = (typeof CATEGORIES)[number];

// ===== Wallet & Revenue (Phase 07) =====

/** Welcome bonus credit cho student mới (VND) */
export const WELCOME_BONUS = 500_000;

/** % platform giữ lại từ mỗi purchase */
export const PLATFORM_FEE_PERCENT = 30;

/** % instructor nhận từ mỗi purchase */
export const INSTRUCTOR_EARNING_PERCENT = 70;

/** Preset amounts cho top-up dialog (VND) */
export const TOPUP_PRESETS = [100_000, 200_000, 500_000, 1_000_000] as const;

/** Giới hạn top-up tối đa một lần để tránh abuse */
export const TOPUP_MAX = 10_000_000;
