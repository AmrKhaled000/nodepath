import { cn } from "@/utils/cn";

export function ProgressRing({
  value,
  size = 44,
  strokeWidth = 4,
  className,
  label,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `Progress ${clamped}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <span className="absolute text-[11px] font-semibold tabular-nums text-text">{clamped}%</span>
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  tone = "accent",
  showLabel,
}: {
  value: number;
  className?: string;
  tone?: "accent" | "success" | "warning" | "info";
  showLabel?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    tone === "success"
      ? "var(--success)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "info"
          ? "var(--info)"
          : "var(--accent)";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%`, background: color }}
        />
      </div>
      {showLabel ? (
        <span className="text-[12px] tabular-nums text-text-muted w-9 text-right">{clamped}%</span>
      ) : null}
    </div>
  );
}
