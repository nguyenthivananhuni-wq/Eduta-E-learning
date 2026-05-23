import { cn } from "@/lib/utils/cn";

export type BarPoint = {
  label: string;
  value: number;
  /** Optional secondary label (e.g. count / total like "8/10") */
  secondary?: string;
  /** Override bar color class */
  colorClass?: string;
};

type CommonProps = {
  data: BarPoint[];
  /** Format the bar value display. Defaults to localized number */
  formatValue?: (v: number) => string;
  /** Empty-state message when all values are 0 */
  emptyLabel?: string;
};

type VerticalProps = CommonProps & {
  orientation: "vertical";
  /** Pixel height of chart area */
  height?: number;
  /** Show first/middle/last x-axis labels only (true) vs all */
  sparseXLabels?: boolean;
};

type HorizontalProps = CommonProps & {
  orientation: "horizontal";
  /** Max rows to display (top N); rest truncated */
  maxRows?: number;
};

type Props = VerticalProps | HorizontalProps;

function defaultFormat(v: number) {
  return new Intl.NumberFormat("vi-VN").format(v);
}

export function BarChart(props: Props) {
  const { data, formatValue = defaultFormat, emptyLabel = "Chưa có dữ liệu" } = props;
  const allZero = data.length === 0 || data.every((d) => d.value === 0);

  if (allZero) {
    return (
      <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (props.orientation === "horizontal") {
    const rows = props.maxRows ? data.slice(0, props.maxRows) : data;
    return (
      <ul className="space-y-2">
        {rows.map((p, i) => {
          const pct = (p.value / maxValue) * 100;
          return (
            <li key={`${i}-${p.label}`} className="flex items-center gap-3 text-sm">
              <span
                className="w-32 sm:w-40 truncate shrink-0 text-foreground/80"
                title={p.label}
              >
                {p.label}
              </span>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    p.colorClass ?? "bg-primary/70"
                  )}
                  style={{ width: `${Math.max(pct, p.value > 0 ? 3 : 0)}%` }}
                />
              </div>
              <span className="w-24 text-right tabular-nums shrink-0 font-medium">
                {formatValue(p.value)}
              </span>
              {p.secondary != null && (
                <span className="w-12 text-right tabular-nums shrink-0 text-xs text-muted-foreground">
                  {p.secondary}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  // vertical
  const height = props.height ?? 128;
  const sparseLabels = props.sparseXLabels ?? data.length > 8;
  return (
    <div className="space-y-2">
      <div
        className="flex items-end gap-1 overflow-hidden"
        style={{ height: `${height}px` }}
      >
        {data.map((p, i) => {
          const pct = (p.value / maxValue) * 100;
          return (
            <div
              key={`${i}-${p.label}`}
              className="flex-1 flex flex-col justify-end group relative min-w-0"
              title={`${p.label}: ${formatValue(p.value)}`}
            >
              <div
                className={cn(
                  "w-full rounded-t transition group-hover:opacity-100",
                  p.colorClass ?? "bg-primary/30 group-hover:bg-primary/80"
                )}
                style={{ height: `${Math.max(2, pct)}%` }}
              />
              {p.value > 0 && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition bg-foreground text-background px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
                  {formatValue(p.value)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {sparseLabels ? (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{data[0]?.label}</span>
          <span>{data[Math.floor(data.length / 2)]?.label}</span>
          <span>{data[data.length - 1]?.label}</span>
        </div>
      ) : (
        <div className="flex gap-1">
          {data.map((p, i) => (
            <span
              key={`label-${i}`}
              className="flex-1 text-center text-[10px] text-muted-foreground truncate"
            >
              {p.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
