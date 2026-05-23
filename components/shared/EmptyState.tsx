import Link from "next/link";
import { type LucideIcon, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href: string };
};

export function EmptyState({ icon: Icon = Inbox, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
      )}
      {action && (
        <Button asChild className="mt-4">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
}
