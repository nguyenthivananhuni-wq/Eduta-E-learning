import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  }
}

export {};
