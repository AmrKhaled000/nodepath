import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/utils/cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full slide-up rounded-xl border border-border bg-bg-elevated shadow-[var(--shadow-md)]",
          wide ? "max-w-3xl" : "max-w-lg",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-[15px] font-semibold text-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1.5 text-text-faint hover:bg-surface-2 hover:text-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: ReactNode; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 border-b border-border", className)} role="tablist">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={selected}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative -mb-px px-3.5 py-2 text-[13.5px] font-medium transition-colors",
              selected ? "text-text" : "text-text-muted hover:text-text",
            )}
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span className="ml-1.5 text-[11.5px] text-text-faint tabular-nums">{tab.count}</span>
            ) : null}
            <span
              className={cn(
                "absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-opacity",
                selected ? "bg-accent opacity-100" : "opacity-0",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warning" | "success" | "danger";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: "border-info/35 bg-info-soft text-info",
    warning: "border-warning/35 bg-warning-soft text-warning",
    success: "border-success/35 bg-success-soft text-success",
    danger: "border-danger/35 bg-danger-soft text-danger",
  };
  return (
    <div className={cn("rounded-lg border px-4 py-3", tones[tone])}>
      {title ? <p className="text-[13px] font-semibold">{title}</p> : null}
      <div className="text-[13.5px] leading-6 text-text-muted [&_a]:text-accent">{children}</div>
    </div>
  );
}
