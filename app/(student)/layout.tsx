import { requireAuth } from "@/lib/auth-helpers";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
