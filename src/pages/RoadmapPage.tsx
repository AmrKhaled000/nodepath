import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  CheckCircle2,
  Filter,
  Lock,
  Map as MapIcon,
  PlayCircle,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, DifficultyBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form";
import { nodeTypes } from "@/components/roadmap/nodeTypes";
import {
  buildPrerequisiteEdges,
  buildRoadmap,
  statusLabel,
  type LessonNodeData,
  type LessonStatus,
} from "@/components/roadmap/roadmapLayout";
import { allModules, getLesson, getModulesForPhase, getPhase, phases } from "@/content";
import { useProgress, progressStore } from "@/services/progressStore";
import { computeDashboardStats } from "@/services/progressStats";
import { cn } from "@/utils/cn";

type StatusFilter = "all" | LessonStatus;

export function RoadmapPage() {
  const progress = useProgress();
  const stats = computeDashboardStats(progress);
  const [view, setView] = useState<"graph" | "list">(
    typeof window !== "undefined" && window.innerWidth < 900 ? "list" : "graph",
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [phaseFilter, setPhaseFilter] = useState<string>("all");
  const [showPrereqs, setShowPrereqs] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { nodes: baseNodes, edges: baseEdges } = useMemo(
    () => buildRoadmap(progress.completedLessons, stats.nextLessonId),
    [progress.completedLessons, stats.nextLessonId],
  );

  const q = query.trim().toLowerCase();

  const nodes: Node<LessonNodeData>[] = useMemo(() => {
    const matches = (data: LessonNodeData): boolean => {
      if (statusFilter !== "all" && data.status !== statusFilter) return false;
      if (phaseFilter !== "all" && String(data.phaseOrder) !== phaseFilter) return false;
      if (q && !`${data.title} ${data.moduleTitle} ${data.tags.join(" ")}`.toLowerCase().includes(q))
        return false;
      return true;
    };
    return baseNodes.map((node) => ({ ...node, data: { ...node.data, dimmed: !matches(node.data) } }));
  }, [baseNodes, q, statusFilter, phaseFilter]);

  const edges: Edge[] = useMemo(() => {
    const prereqs = showPrereqs ? buildPrerequisiteEdges(progress.completedLessons) : [];
    return [...baseEdges, ...prereqs];
  }, [baseEdges, showPrereqs, progress.completedLessons]);

  const selected = selectedId ? getLesson(selectedId) : undefined;
  const selectedModule = selected ? allModules.find((m) => m.id === selected.moduleId) : undefined;

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const statsByStatus = useMemo(() => {
    const counts: Record<LessonStatus, number> = { completed: 0, current: 0, available: 0, locked: 0 };
    for (const node of baseNodes) counts[node.data.status] += 1;
    return counts;
  }, [baseNodes]);

  const toolbar = (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2">
      <div className="relative min-w-[180px] flex-1">
        <Search
          size={14}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-faint"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter topics…"
          aria-label="Filter roadmap topics"
          className="pl-8"
        />
      </div>
      <label className="flex items-center gap-1.5 text-[12.5px] text-text-muted">
        <Filter size={13} className="text-text-faint" />
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="h-9 rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text focus-visible:outline-2 focus-visible:outline-accent"
        >
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="current">Continue here</option>
          <option value="available">Ready</option>
          <option value="locked">Locked</option>
        </select>
      </label>
      <select
        aria-label="Filter by phase"
        value={phaseFilter}
        onChange={(e) => setPhaseFilter(e.target.value)}
        className="h-9 rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text focus-visible:outline-2 focus-visible:outline-accent"
      >
        <option value="all">All phases</option>
        {phases.map((p) => (
          <option key={p.id} value={String(p.order)}>
            Phase {p.order} — {p.title}
          </option>
        ))}
      </select>
      <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-[12.5px] text-text-muted hover:border-border-strong">
        <input
          type="checkbox"
          checked={showPrereqs}
          onChange={(e) => setShowPrereqs(e.target.checked)}
          className="accent-[var(--accent)]"
        />
        Prerequisite links
      </label>
      <div className="flex items-center overflow-hidden rounded-md border border-border">
        <button
          type="button"
          onClick={() => setView("graph")}
          aria-pressed={view === "graph"}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors",
            view === "graph" ? "bg-accent-soft text-accent" : "text-text-muted hover:bg-surface-2",
          )}
        >
          <MapIcon size={14} /> Graph
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          aria-pressed={view === "list"}
          className={cn(
            "flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-[13px] font-medium transition-colors",
            view === "list" ? "bg-accent-soft text-accent" : "text-text-muted hover:bg-surface-2",
          )}
        >
          List
        </button>
      </div>
      {(query || statusFilter !== "all" || phaseFilter !== "all") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQuery("");
            setStatusFilter("all");
            setPhaseFilter("all");
          }}
        >
          <RotateCcw size={13} />
          Reset filters
        </Button>
      )}
    </div>
  );

  return (
    <PageContainer className="max-w-[1500px]">
      <PageHeader
        title="Learning roadmap"
        description="All 317 lessons across 3 phases and 18 modules. Nodes unlock as you finish prerequisites — pick any node to inspect it and jump straight to its lesson."
        meta={[
          <div key="legend" className="flex flex-wrap items-center gap-3 text-[12px] text-text-muted">
            <LegendItem icon={<CheckCircle2 size={13} className="text-success" />} label={`Completed ${statsByStatus.completed}`} />
            <LegendItem icon={<PlayCircle size={13} className="text-accent" />} label={`Continue here ${statsByStatus.current}`} />
            <LegendItem icon={<Sparkles size={13} className="text-text-faint" />} label={`Ready ${statsByStatus.available}`} />
            <LegendItem icon={<Lock size={13} className="text-text-faint" />} label={`Locked ${statsByStatus.locked}`} />
          </div>,
        ]}
        actions={
          <ButtonLink to="/" variant="outline" size="sm">
            Dashboard
          </ButtonLink>
        }
      />

      {toolbar}

      <div className={cn("grid gap-4", selected ? "lg:grid-cols-[1fr_340px]" : "lg:grid-cols-1")}>
        <div className="min-w-0">
          {view === "graph" ? (
            <Card className="h-[72vh] min-h-[520px] overflow-hidden p-0">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => setSelectedId(node.id)}
                onPaneClick={() => setSelectedId(null)}
                fitView
                fitViewOptions={{ padding: 0.15, maxZoom: 1.1 }}
                minZoom={0.15}
                maxZoom={1.6}
                nodesDraggable
                nodesConnectable={false}
                elementsSelectable
                proOptions={{ hideAttribution: false }}
                aria-label="Interactive Node.js learning roadmap"
              >
                <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="var(--border-strong)" />
                <Controls showInteractive={false} />
                <MiniMap
                  pannable
                  zoomable
                  className="!bg-surface-2"
                  nodeColor={(n) => {
                    const status = (n.data as LessonNodeData)?.status;
                    if (status === "completed") return "var(--success)";
                    if (status === "current") return "var(--accent)";
                    if (status === "available") return "var(--border-strong)";
                    return "var(--surface-3)";
                  }}
                />
              </ReactFlow>
            </Card>
          ) : (
            <RoadmapListView
              query={q}
              statusFilter={statusFilter}
              phaseFilter={phaseFilter}
              currentId={stats.nextLessonId}
              onSelect={setSelectedId}
            />
          )}
        </div>

        {selected ? (
          <LessonDetailPanel
            lessonId={selected.id}
            onClose={() => setSelectedId(null)}
            moduleTitle={selectedModule?.title}
          />
        ) : null}
      </div>
    </PageContainer>
  );
}

function LegendItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {icon}
      {label}
    </span>
  );
}

function LessonDetailPanel({
  lessonId,
  onClose,
  moduleTitle,
}: {
  lessonId: string;
  onClose: () => void;
  moduleTitle?: string;
}) {
  const progress = useProgress();
  const lesson = getLesson(lessonId);
  if (!lesson) return null;
  const done = Boolean(progress.completedLessons[lesson.id]);
  const status = lessonStatusOf(
    lesson.id,
    progress.completedLessons,
    computeDashboardStats(progress).nextLessonId,
  );
  const phase = getPhase(lesson.phaseId);

  return (
    <Card className="h-fit lg:sticky lg:top-4" data-testid="roadmap-detail">
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11.5px] font-medium uppercase tracking-wide text-text-faint">
              {phase?.title} · {moduleTitle}
            </p>
            <h2 className="mt-1 text-[16px] font-bold leading-6 text-text">{lesson.title}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close details">
            Esc
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge tone={done ? "success" : status === "current" ? "accent" : "neutral"}>
            {statusLabel[status]}
          </Badge>
          <Badge tone="neutral">{lesson.estimatedMinutes} min</Badge>
          <DifficultyBadge difficulty={lesson.difficulty} />
        </div>

        <p className="text-[13px] leading-6 text-text-muted">{lesson.description}</p>

        {lesson.prerequisites.length > 0 ? (
          <div>
            <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-text-faint">
              Prerequisites
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lesson.prerequisites.map((id) => {
                const prereq = getLesson(id);
                const prereqDone = Boolean(progress.completedLessons[id]);
                return prereq ? (
                  <Link
                    key={id}
                    to={`/lessons/${prereq.slug}`}
                    className={cn(
                      "rounded border px-2 py-1 text-[12px] transition-colors",
                      prereqDone
                        ? "border-success/40 bg-success-soft text-success"
                        : "border-border bg-surface-2 text-text-muted hover:border-border-strong",
                    )}
                  >
                    {prereqDone ? "✓ " : ""}
                    {prereq.title}
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <ButtonLink to={`/lessons/${lesson.slug}`} className="w-full">
            Open lesson
          </ButtonLink>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => progressStore.setLessonCompleted(lesson.id, !done)}
          >
            {done ? "Mark as not done" : "Mark complete"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function RoadmapListView({
  query,
  statusFilter,
  phaseFilter,
  currentId,
  onSelect,
}: {
  query: string;
  statusFilter: StatusFilter;
  phaseFilter: string;
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  const progress = useProgress();

  return (
    <div className="space-y-5" data-testid="roadmap-list">
      {phases.map((phase) => {
        if (phaseFilter !== "all" && String(phase.order) !== phaseFilter) return null;
        const modules = getModulesForPhase(phase.id);
        const visibleModules = modules
          .map((mod) => {
            const lessons = mod.lessonIds
              .map((id) => getLesson(id))
              .filter((l): l is NonNullable<typeof l> => Boolean(l))
              .filter((l) => {
                const status = lessonStatusOf(l.id, progress.completedLessons, currentId);
                if (statusFilter !== "all" && status !== statusFilter) return false;
                if (
                  query &&
                  !`${l.title} ${mod.title} ${l.tags.join(" ")}`.toLowerCase().includes(query)
                )
                  return false;
                return true;
              });
            return { mod, lessons };
          })
          .filter((entry) => entry.lessons.length > 0);

        if (visibleModules.length === 0) return null;

        return (
          <div key={phase.id} className="rounded-lg border border-border bg-surface">
            <div
              className="flex items-center justify-between gap-3 rounded-t-lg border-b border-border px-4 py-3"
              style={{ background: `${phase.accent}10` }}
            >
              <p className="text-[14px] font-semibold text-text">
                <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: phase.accent }} />
                Phase {phase.order} — {phase.title}
              </p>
              <Badge tone="neutral">{phase.estimatedHoursRange}</Badge>
            </div>
            <div className="divide-y divide-border">
              {visibleModules.map(({ mod, lessons }) => (
                <div key={mod.id} className="px-4 py-3">
                  <p className="mb-2 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-text-muted">
                    {mod.title}
                    <Badge tone="neutral">{mod.lessonIds.length} lessons</Badge>
                    <Link to={`/quizzes/${mod.quizId ?? ""}`} className="text-[12px] text-accent animated-underline">
                      {mod.quizId ? "Module quiz →" : ""}
                    </Link>
                  </p>
                  <ul className="space-y-1.5">
                    {lessons.map((lesson) => {
                      const status = lessonStatusOf(lesson.id, progress.completedLessons, currentId);
                      return (
                        <li key={lesson.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(lesson.id)}
                            className="flex w-full items-center gap-3 rounded-md border border-transparent px-2.5 py-2 text-left transition-colors hover:border-border hover:bg-surface-2"
                            data-testid={`roadmap-row-${lesson.id}`}
                          >
                            <StatusDot status={status} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13.5px] font-medium text-text">
                                {lesson.title}
                              </span>
                              <span className="block truncate text-[11.5px] text-text-faint">
                                {statusLabel[status]} · {lesson.estimatedMinutes} min
                              </span>
                            </span>
                            <Link
                              to={`/lessons/${lesson.slug}`}
                              className="shrink-0 rounded border border-border bg-surface-2 px-2 py-1 text-[11.5px] text-text-muted hover:border-border-strong nodrag"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open
                            </Link>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusDot({ status }: { status: LessonStatus }) {
  const map: Record<LessonStatus, string> = {
    completed: "bg-success",
    current: "bg-accent shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_25%,transparent)]",
    available: "bg-border-strong",
    locked: "bg-surface-3",
  };
  return (
    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", map[status])} aria-hidden />
  );
}

function lessonStatusOf(
  lessonId: string,
  completed: Record<string, unknown>,
  currentId: string | null,
): LessonStatus {
  const lesson = getLesson(lessonId);
  if (!lesson) return "locked";
  if (completed[lesson.id]) return "completed";
  if (currentId === lesson.id) return "current";
  return lesson.prerequisites.every((id) => completed[id]) ? "available" : "locked";
}
