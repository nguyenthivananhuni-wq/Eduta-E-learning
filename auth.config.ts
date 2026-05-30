import type { NextAuthConfig } from "next-auth";
import { can, homePathFor } from "@/lib/auth/roles";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const isAdmin = can(role, "moderate");
      const isInstructor = can(role, "teach");

      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnInstructor = nextUrl.pathname.startsWith("/instructor");
      const isOnStudentArea =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/learn") ||
        nextUrl.pathname.startsWith("/checkout") ||
        nextUrl.pathname.startsWith("/wallet");
      const isOnAuth =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isOnAdmin) return isAdmin;
      if (isOnInstructor) return isInstructor;
      if (isOnStudentArea) return isLoggedIn;
      if (isOnAuth && isLoggedIn) {
        // Tài khoản bị khóa được đẩy về /login?suspended=1 — cho hiển thị để tránh vòng lặp redirect
        if (nextUrl.searchParams.get("suspended")) return true;
        // Đăng nhập xong → về đúng "nhà" của vai trò (admin/instructor/student)
        return Response.redirect(new URL(homePathFor(role), nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "STUDENT" | "INSTRUCTOR" | "ADMIN";
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
