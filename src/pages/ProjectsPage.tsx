import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, FolderKanban, Search, Target } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { Badge, DifficultyBadge, LevelBadge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/States";
import { allProjects, phases } from "@/content";
import { useProgress } from "@/services/progressStore";
import { cn } from "@/utils/cn";

type StatusFilter = "all" | "todo" | "done";

export function ProjectsPage() {
  const progress = useProgress();
  const [query, setQuery] = useState("");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const techOptions = useMemo(
    () => [...new Set(allProjects.flatMap((p) => p.technologies))].sort(),
    [],
  );
  const [techFilter, setTechFilter] = useState("all");

  const filtered = allProjects.filter((project) => {
    const done = Boolean(progress.completedProjects[project.id]);
    if (phaseFilter !== "all" && project.phaseId !== phaseFilter) return false;
    if (difficultyFilter !== "all" && project.difficulty !== difficultyFilter) return false;
    if (techFilter !== "all" && !project.technologies.includes(techFilter)) return false;
    if (statusFilter === "done" && !done) return false;
    if (statusFilter === "todo" && done) return false;
    if (query) {
      const haystack = `${project.title} ${project.description} ${project.technologies.join(" ")}`.toLowerCase();
      if (!haystack.includes(query.trim().toLowerCase())) return false;
    }
    return true;
  });

  const completedCount = allProjects.filter((p) => progress.completedProjects[p.id]).length;

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", to: "/" }, { label: "Projects" }]}
        title="Project library"
        description="Twenty guided projects — six practical builds, eight API designs, and six portfolio capstones. Every project ships with milestones, a suggested structure, acceptance criteria, tests, and hidden hints."
        meta={[
          <Badge key="count" tone="neutral">
            {allProjects.length} projects
          </Badge>,
          <Badge key="done" tone={completedCount > 0 ? "success" : "neutral"}>
            {completedCount} completed
          </Badge>,
        ]}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-faint" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
            className="pl-8"
          />
        </div>
        <select
          aria-label="Filter by phase"
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text"
        >
          <option value="all">All phases</option>
          {phases.map((p) => (
            <option key={p.id} value={p.id}>
              Phase {p.order} — {p.title}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by difficulty"
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text"
        >
          <option value="all">All difficulties</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select
          aria-label="Filter by technology"
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value)}
          className="h-9 rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text"
        >
          <option value="all">All technologies</option>
          {techOptions.map((tech) => (
            <option key={tech} value={tech}>
              {tech}
            </option>
          ))}
        </select>
        <div className="flex items-center overflow-hidden rounded-md border border-border">
          {(["all", "todo", "done"] as StatusFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              aria-pressed={statusFilter === value}
              className={cn(
                "border-l border-border px-3 py-1.5 text-[13px] font-medium capitalize transition-colors first:border-l-0",
                statusFilter === value ? "bg-accent-soft text-accent" : "text-text-muted hover:bg-surface-2",
              )}
            >
              {value === "todo" ? "Not started" : value === "done" ? "Completed" : "All"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No projects match"
          description="Try clearing a filter or searching for a different technology."
          action={
            <button
              type="button"
              className="text-[13px] text-accent underline"
              onClick={() => {
                setQuery("");
                setPhaseFilter("all");
                setDifficultyFilter("all");
                setTechFilter("all");
                setStatusFilter("all");
              }}
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => {
            const done = Boolean(progress.completedProjects[project.id]);
            const checklist = progress.projectChecklist[project.id] ?? {};
            const totalTasks = project.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
            const checkedTasks = Object.values(checklist).filter(Boolean).length;
            const taskCount = totalTasks > 0 ? Math.round((checkedTasks / totalTasks) * 100) : 0;

            return (
              <Link
                key={project.id}
                to={`/projects/${project.slug}`}
                className="group flex flex-col rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent/60"
                data-testid="project-card"
              >
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <LevelBadge phaseId={project.phaseId} />
                  <DifficultyBadge difficulty={project.difficulty} />
                  <Badge tone="neutral">
                    <Clock size={11} className="mr-1 inline" />
                    ~{project.estimatedHours}h
                  </Badge>
                  {done ? (
                    <Badge tone="success">
                      <CheckCircle2 size={11} className="mr-1 inline" />
                      Done
                    </Badge>
                  ) : null}
                </div>
                <h2 className="text-[15px] font-semibold leading-6 text-text group-hover:text-accent">
                  {project.title}
                </h2>
                <p className="mt-1.5 line-clamp-3 flex-1 text-[13px] leading-6 text-text-muted">
                  {project.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {project.technologies.slice(0, 4).map((tech) => (
                    <Badge key={tech} tone="neutral">
                      {tech}
                    </Badge>
                  ))}
                  {project.technologies.length > 4 ? (
                    <Badge tone="neutral">+{project.technologies.length - 4}</Badge>
                  ) : null}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-[11.5px] text-text-faint">
                  <span className="inline-flex items-center gap-1">
                    <FolderKanban size={12} /> {project.milestones.length} milestones
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Target size={12} /> {checkedTasks}/{totalTasks} tasks
                  </span>
                </div>
                {totalTasks > 0 ? (
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${taskCount}%` }} />
                  </div>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
