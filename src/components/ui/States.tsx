import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="surface-card p-5 space-y-3" aria-hidden="true">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface-2/60 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? <div className="mb-3 text-text-faint">{icon}</div> : null}
      <h3 className="text-[15px] font-semibold text-text">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-[13.5px] leading-6 text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-danger/40 bg-danger-soft px-5 py-4">
      <p className="text-sm font-semibold text-danger">{title}</p>
      {description ? <p className="mt-1 text-[13px] text-text-muted">{description}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-[13px] font-medium text-accent animated-underline"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
