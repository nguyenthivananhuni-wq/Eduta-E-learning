import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { requireInstructor } from "@/lib/auth-helpers";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { InstructorNavLinks } from "@/components/instructor/InstructorNavLinks";

export default async function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireInstructor();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r bg-muted/30 flex flex-col">
        <Link
          href="/instructor"
          className="flex items-center gap-2 px-6 h-16 border-b font-bold text-lg"
        >
          <GraduationCap className="size-5 text-primary" />
          <span>Eduta Teach</span>
        </Link>

        <nav className="flex-1 p-4 space-y-1">
          <InstructorNavLinks />
        </nav>

        <div className="p-4 border-t space-y-2">
          <div className="text-xs text-muted-foreground truncate">
            {session.user.email}
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Về trang chủ
          </Link>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
