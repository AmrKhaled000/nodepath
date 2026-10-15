import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, Lock, PlayCircle, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";
import type { LessonNodeData, LessonStatus } from "./roadmapLayout";

const statusStyles: Record<LessonStatus, { ring: string; badge: string; icon: React.ReactNode }> = {
  completed: {
    ring: "border-success/60 bg-success-soft/60",
    badge: "text-success",
    icon: <Check size={13} strokeWidth={3} />,
  },
  current: {
    ring: "border-accent bg-accent-soft shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_22%,transparent)]",
    badge: "text-accent",
    icon: <PlayCircle size={13} />,
  },
  available: {
    ring: "border-border-strong bg-surface hover:border-accent/70",
    badge: "text-text-faint",
    icon: <Sparkles size={13} />,
  },
  locked: {
    ring: "border-border bg-surface-2/70 opacity-75",
    badge: "text-text-faint",
    icon: <Lock size={12} />,
  },
};

function LessonNodeComponent({ data, selected }: NodeProps & { data: LessonNodeData }) {
  const style = statusStyles[data.status];
  const dimmed = data.dimmed ? "opacity-30 pointer-events-none" : "";

  return (
    <div
      className={cn(
        "relative w-[258px] cursor-pointer rounded-lg border px-3 py-2.5 transition-all duration-150 nodrag",
        style.ring,
        dimmed,
        selected ? "ring-2 ring-accent" : "",
      )}
      style={{ width: 258 }}
      data-status={data.status}
      data-testid={`roadmap-node-${data.lessonId}`}
      title={statusLabelSafe(data.status)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          (event.currentTarget as HTMLElement).click();
        }
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-border-strong !border-0 !h-1.5 !w-1.5 !min-w-0 !min-h-0" />
      <div className="flex items-start gap-2">
        <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current", style.badge)}>
          {style.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-5 text-text" data-testid="node-title">
            {data.title}
          </p>
          <p className="mt-0.5 truncate text-[11px] leading-4 text-text-faint">
            {data.moduleTitle} · {data.minutes} min
          </p>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-[10.5px] uppercase tracking-wide text-text-faint">
          Phase {data.phaseOrder} · {data.difficulty}
        </span>
        <span className="nodrag flex shrink-0 items-center gap-1">
          <span className="rounded border border-border bg-surface px-1.5 py-px text-[10.5px] text-text-muted opacity-0 transition-opacity group-hover/node:opacity-100">
            Open
          </span>
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border-strong !border-0 !h-1.5 !w-1.5 !min-w-0 !min-h-0" />
    </div>
  );
}

function statusLabelSafe(status: LessonStatus): string {
  switch (status) {
    case "completed":
      return "Completed lesson";
    case "current":
      return "Your next lesson";
    case "available":
      return "Ready to start";
    default:
      return "Finish prerequisites to unlock";
  }
}

export const LessonNode = memo(LessonNodeComponent);
