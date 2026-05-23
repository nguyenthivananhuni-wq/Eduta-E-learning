# Report 03 — Auth.js v5 Setup

Cấu hình Auth.js v5 (NextAuth beta) với Credentials provider, JWT session, route protection middleware.

## File map

| File                              | Runtime | Purpose                                              |
|-----------------------------------|---------|------------------------------------------------------|
| `auth.config.ts` (root)           | Edge    | Shared config (callbacks, pages) — KHÔNG import Prisma/bcrypt |
| `auth.ts` (root)                  | Node    | Extend config + add Credentials provider with Prisma + bcrypt |
| `middleware.ts` (root)            | Edge    | Use `auth.config.ts` to protect routes               |
| `app/api/auth/[...nextauth]/route.ts` | Node | Re-export `auth.ts` handlers                         |
| `lib/auth-helpers.ts`             | Node    | `requireAuth()` + `requireAdmin()` in Server Components/Actions |

## `auth.config.ts` (Edge-safe)

```ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdmin = auth?.user?.role === "ADMIN";

      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnStudent =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/learn") ||
        nextUrl.pathname.startsWith("/checkout");
      const isOnAuth =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isOnAdmin) return isAdmin;
      if (isOnStudent) return isLoggedIn;
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
        session.user.role = token.role as "STUDENT" | "ADMIN";
      }
      return session;
    },
  },
  providers: [], // filled in auth.ts
} satisfies NextAuthConfig;
```

## `auth.ts` (Node, uses Prisma + bcrypt)

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
```

## `middleware.ts`

```ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protect everything except auth API routes, _next, public assets
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
```

## `app/api/auth/[...nextauth]/route.ts`

```ts
export { GET, POST } from "@/auth";
```

Wait — Auth.js v5 cần re-export `handlers`:

```ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

## `lib/auth-helpers.ts`

```ts
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  return session;
}
```

## Type augmentation `types/next-auth.d.ts`

```ts
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: "STUDENT" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      role: "STUDENT" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "STUDENT" | "ADMIN";
  }
}
```

Add to `tsconfig.json` `"include": [..., "types/**/*.d.ts"]`.

## Register Server Action `lib/actions/auth.actions.ts`

```ts
"use server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";

export async function registerUser(input: unknown) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dữ liệu không hợp lệ" };
  }
  const { email, name, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: "Email đã được sử dụng" };

  const hash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: {
      email,
      name,
      password: hash,
      role: email === process.env.ADMIN_EMAIL ? "ADMIN" : "STUDENT",
    },
  });

  return { ok: true };
}
```

## Login client snippet (form submit)

```ts
"use client";
import { signIn } from "next-auth/react";
// onSubmit:
const res = await signIn("credentials", {
  email,
  password,
  redirect: false,
});
if (res?.error) toast.error("Email hoặc mật khẩu sai");
else router.push("/dashboard");
```

## `.env.local` needed vars

```
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@eduta.local"
```

## Notes / pitfalls

- **DO NOT import Prisma in `auth.config.ts`** — Edge runtime will fail.
- **JWT strategy bắt buộc** vì middleware Edge không query Prisma được. Database session sẽ cần DB call ở middleware → blocked by Edge constraints.
- bcryptjs salt rounds = 10 (đồ án OK, prod realistic dùng 12).
- `signIn` from `next-auth/react` (client) vs `signIn` from `auth.ts` (server). Khi dùng trong client form → import từ `next-auth/react`.
- Auth.js v5 vẫn beta — pin version trong `package.json`, đừng update giữa sprint.
