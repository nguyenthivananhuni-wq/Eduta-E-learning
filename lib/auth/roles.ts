/**
 * Nguồn chân lý duy nhất cho logic vai trò PHÂN CẤP: STUDENT < INSTRUCTOR < ADMIN.
 *
 * QUAN TRỌNG: file này phải EDGE-SAFE — được import bởi `auth.config.ts` / `middleware.ts`
 * (chạy edge runtime). Chỉ dùng pure functions, KHÔNG import `@/lib/db` hay `server-only`.
 */

export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN";

/** Năng lực theo bậc thang: ai cũng `learn`; INSTRUCTOR+ trở lên `teach`; chỉ ADMIN `moderate`. */
export type Capability = "learn" | "teach" | "moderate";

const RANK: Record<Role, number> = {
  STUDENT: 0,
  INSTRUCTOR: 1,
  ADMIN: 2,
};

const MIN_RANK: Record<Capability, number> = {
  learn: 0,
  teach: 1,
  moderate: 2,
};

/** `role` có đủ quyền cho `capability` không (phân cấp). */
export function can(role: Role | undefined | null, capability: Capability): boolean {
  if (!role) return false;
  return RANK[role] >= MIN_RANK[capability];
}

/** "Nhà" mặc định của vai trò — dùng cho redirect sau đăng nhập. */
export function homePathFor(role: Role | undefined | null): string {
  if (role === "ADMIN") return "/admin";
  if (role === "INSTRUCTOR") return "/instructor";
  return "/dashboard";
}

/** Nhãn tiếng Việt cho "khu vực" hiện tại — dùng cho context switcher trong UserMenu. */
export function areaLabel(role: Role | undefined | null): string {
  if (role === "ADMIN") return "Quản trị";
  if (role === "INSTRUCTOR") return "Giảng viên";
  return "Học viên";
}
