import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Library,
  Map,
  CalendarRange,
  Settings,
  Check,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { allModules, getLessonBySlug, getModulesForPhase, getLessonsForModule, phases } from "@/content";
import { useProgress } from "@/services/progressStore";
import { phaseProgress } from "@/services/progressStats";
import { ProgressBar } from "@/components/ui/Progress";

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function NavItem({
  to,
  icon,
  label,
  onNavigate,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] font-medium transition-colors",
          isActive
            ? "bg-accent-soft text-accent"
            : "text-text-muted hover:text-text hover:bg-surface-2",
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const progress = useProgress();
  const location = useLocation();
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    "phase-1": true,
    "phase-2": false,
    "phase-3": false,
  });
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const lessonSlug = location.pathname.startsWith("/lessons/")
    ? decodeURIComponent(location.pathname.slice("/lessons/".length))
    : null;
  const activeLesson = lessonSlug ? getLessonBySlug(lessonSlug) : undefined;
  const activeModuleId = activeLesson?.moduleId;
  const activePhaseId =
    activeLesson?.phaseId ??
    (location.pathname.startsWith("/phases/")
      ? location.pathname.slice("/phases/".length)
      : undefined);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (activeModuleId || activePhaseId) {
      setExpandedModules((prev) => (prev[activeModuleId ?? ""] ? prev : { ...prev, [activeModuleId ?? ""]: true }));
      setExpandedPhases((prev) =>
        activePhaseId && !prev[activePhaseId] ? { ...prev, [activePhaseId]: true } : prev,
      );
    }
  }, [activeModuleId, activePhaseId]);

  const totalDone = Object.keys(progress.completedLessons).length;

  return (
    <aside
      className={cn(
        "flex h-full w-72 shrink-0 flex-col border-r border-border bg-bg-elevated",
        "max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-40 max-lg:w-[19rem] max-lg:transition-transform max-lg:duration-200",
        open ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
      )}
      aria-label="Sidebar"
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <NavLink to="/" className="flex items-center gap-2.5" onClick={onClose}>
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent">
            <GraduationCap size={17} />
          </span>
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold leading-4 text-text">NodePath</span>
            <span className="block text-[11px] leading-4 text-text-faint">Node.js developer roadmap</span>
          </span>
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        <div className="space-y-0.5">
          <NavItem to="/" icon={<LayoutDashboard size={16} />} label="Dashboard" onNavigate={onClose} />
          <NavItem to="/roadmap" icon={<Map size={16} />} label="Interactive roadmap" onNavigate={onClose} />
          <NavItem to="/projects" icon={<FolderKanban size={16} />} label="Project library" onNavigate={onClose} />
          <NavItem to="/resources" icon={<Library size={16} />} label="Resources" onNavigate={onClose} />
          <NavItem to="/study-plan" icon={<CalendarRange size={16} />} label="Study plan" onNavigate={onClose} />
          <NavItem to="/settings" icon={<Settings size={16} />} label="Settings" onNavigate={onClose} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between px-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-faint">Curriculum</p>
            <span className="text-[11px] tabular-nums text-text-faint">{totalDone} done</span>
          </div>

          <div className="space-y-1.5">
            {phases.map((phase) => {
              const stats = phaseProgress(progress, phase.id);
              const modules = getModulesForPhase(phase.id);
              const expanded = expandedPhases[phase.id] ?? false;

              return (
                <div key={phase.id} className="rounded-lg border border-border bg-surface">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpandedPhases((prev) => ({ ...prev, [phase.id]: !expanded }))}
                    className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-surface-2 transition-colors rounded-t-lg"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: phase.accent }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-text">
                        {phase.order}. {phase.title}
                      </span>
                      <span className="block text-[11px] text-text-faint tabular-nums">
                        {stats.completed}/{stats.total} · {stats.percent}%
                      </span>
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn("shrink-0 text-text-faint transition-transform", expanded ? "rotate-180" : "")}
                    />
                  </button>

                  <div className="px-2.5 pb-2">
                    <ProgressBar value={stats.percent} />
                  </div>

                  {expanded ? (
                    <div className="space-y-0.5 border-t border-border/70 p-1.5">
                      <NavLink
                        to={`/phases/${phase.id}`}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] font-medium",
                            isActive
                              ? "bg-accent-soft text-accent"
                              : "text-text-muted hover:bg-surface-2 hover:text-text",
                          )
                        }
                      >
                        <BookOpen size={14} />
                        Phase overview
                      </NavLink>

                      {modules.map((mod) => {
                        const done = mod.lessonIds.filter((id) => progress.completedLessons[id]).length;
                        const modExpanded = expandedModules[mod.id] ?? false;
                        const isActiveModule = activeModuleId === mod.id;
                        return (
                          <div key={mod.id}>
                            <button
                              type="button"
                              aria-expanded={modExpanded}
                              onClick={() => setExpandedModules((prev) => ({ ...prev, [mod.id]: !modExpanded }))}
                              className={cn(
                                "flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors",
                                isActiveModule ? "bg-surface-3 text-text" : "text-text-muted hover:bg-surface-2 hover:text-text",
                              )}
                            >
                              <ChevronDown
                                size={12}
                                className={cn(
                                  "shrink-0 text-text-faint transition-transform",
                                  modExpanded ? "rotate-180" : "-rotate-90",
                                )}
                              />
                              <span className="min-w-0 flex-1 truncate text-[12.5px]">{mod.title}</span>
                              <span
                                className={cn(
                                  "shrink-0 text-[10.5px] tabular-nums",
                                  done === mod.lessonIds.length ? "text-success" : "text-text-faint",
                                )}
                              >
                                {done}/{mod.lessonIds.length}
                              </span>
                            </button>

                            {modExpanded ? (
                              <ul className="ml-3.5 mt-0.5 space-y-0.5 border-l border-border pl-2">
                                {getLessonsForModule(mod.id).map((lesson) => {
                                  const isDone = Boolean(progress.completedLessons[lesson.id]);
                                  const isCurrent = progress.currentLessonId === lesson.id;
                                  return (
                                    <li key={lesson.id}>
                                      <NavLink
                                        to={`/lessons/${lesson.slug}`}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                          cn(
                                            "flex items-start gap-2 rounded-md px-2 py-1 text-[12.5px] leading-[1.45] transition-colors",
                                            isActive
                                              ? "text-accent bg-accent-soft/70"
                                              : isCurrent
                                                ? "text-text bg-surface-2"
                                                : isDone
                                                  ? "text-text-faint hover:text-text-muted hover:bg-surface-2"
                                                  : "text-text-muted hover:text-text hover:bg-surface-2",
                                          )
                                        }
                                      >
                                        <span
                                          className={cn(
                                            "mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                                            isDone
                                              ? "border-success bg-success"
                                              : isCurrent
                                                ? "border-accent"
                                                : "border-border-strong",
                                          )}
                                          aria-hidden
                                        >
                                          {isDone ? (
                                            <Check size={9} strokeWidth={3.5} style={{ color: "var(--bg-elevated)" }} />
                                          ) : null}
                                        </span>
                                        <span className="min-w-0">{lesson.title}</span>
                                      </NavLink>
                                    </li>
                                  );
                                })}
                              </ul>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="text-[11.5px] text-text-faint">3 phases · 18 modules · {allModules.reduce((n, m) => n + m.lessonIds.length, 0)} lessons</p>
      </div>
    </aside>
  );
}
