import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const isAdmin = role === "ADMIN";
      const isInstructor = role === "INSTRUCTOR" || isAdmin;

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
        return Response.redirect(new URL("/dashboard", nextUrl));
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
