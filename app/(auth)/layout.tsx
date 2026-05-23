import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 font-bold text-2xl"
      >
        <GraduationCap className="size-7 text-primary" />
        <span>Eduta</span>
      </Link>
      {children}
    </div>
  );
}
