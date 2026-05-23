import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: number;
  label?: string;
  showPercentage?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function ProgressBar({
  value,
  label,
  showPercentage = true,
  size = "md",
  className,
}: Props) {
  return (
    <div className={cn("space-y-1", className)}>
      {(label || showPercentage) && (
        <div className="flex items-baseline justify-between text-xs">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="font-medium tabular-nums">{value}%</span>
          )}
        </div>
      )}
      <Progress
        value={value}
        className={cn(size === "sm" ? "h-1.5" : "h-2")}
      />
    </div>
  );
}
