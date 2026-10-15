import type { ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { Difficulty, PhaseId } from "@/types";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "phase";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-3 text-text-muted border-transparent",
  accent: "bg-accent-soft text-accent border-transparent",
  success: "bg-success-soft text-success border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  info: "bg-info-soft text-info border-transparent",
  phase: "border-border-strong text-text-muted",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium leading-5 whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const tone = difficulty === "beginner" ? "success" : difficulty === "intermediate" ? "warning" : "danger";
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return <Badge tone={tone}>{label}</Badge>;
}

export function LevelBadge({ phaseId }: { phaseId: PhaseId }) {
  const map: Record<PhaseId, { label: string; color: string }> = {
    "phase-1": { label: "Phase 1 · Foundations", color: "#38bdf8" },
    "phase-2": { label: "Phase 2 · Backend Developer", color: "#a78bfa" },
    "phase-3": { label: "Phase 3 · Professional Engineer", color: "#f472b6" },
  };
  const info = map[phaseId];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium leading-5"
      style={{ color: info.color, borderColor: `${info.color}55`, background: `${info.color}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: info.color }} />
      {info.label}
    </span>
  );
}
