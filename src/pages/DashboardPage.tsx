import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Flame,
  FolderKanban,
  Gauge,
  Play,
  Puzzle,
  Timer,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, LevelBadge } from "@/components/ui/Badge";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useProgress } from "@/services/progressStore";
import { computeDashboardStats } from "@/services/progressStats";
import { getLesson, getModule, getProject, getPhase, phases } from "@/content";
import { formatMinutes, formatRelative } from "@/utils/dates";

export function DashboardPage() {
  const progress = useProgress();
  const stats = computeDashboardStats(progress);

  const nextLesson = stats.nextLessonId ? getLesson(stats.nextLessonId) : undefined;
  const nextModule = nextLesson ? getModule(nextLesson.moduleId) : undefined;
  const recommended = stats.recommendedProjectId ? getProject(stats.recommendedProjectId) : undefined;
  const currentPhase = stats.currentPhaseId ? getPhase(stats.currentPhaseId) : undefined;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <PageContainer>
      <PageHeader
        title={`${greeting}.`}
        description={
          stats.completedLessons === 0
            ? "Start your Node.js journey with Phase 1 — Foundations. Your progress is saved automatically in this browser."
            : `You are ${stats.overallPercent}% through the roadmap. Keep the momentum going — your next lesson is ready.`
        }
        actions={
          nextLesson ? (
            <ButtonLink to={`/lessons/${nextLesson.slug}`} size="lg">
              <Play size={15} />
              Continue learning
            </ButtonLink>
          ) : null
        }
      />

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Gauge size={16} />}
          label="Overall completion"
          value={`${stats.overallPercent}%`}
          sub={`${stats.completedLessons} of ${stats.totalLessons} lessons`}
          ring={stats.overallPercent}
        />
        <StatCard
          icon={<BookOpen size={16} />}
          label="Lessons remaining"
          value={String(stats.remainingLessons)}
          sub={stats.remainingLessons > 0 ? `≈ ${formatMinutes(stats.estimatedRemainingMinutes)} of study` : "All lessons complete"}
        />
        <StatCard
          icon={<Flame size={16} />}
          label="Learning streak"
          value={`${stats.streakDays} day${stats.streakDays === 1 ? "" : "s"}`}
          sub="Active study days in a row"
          tone={stats.streakDays > 0 ? "success" : undefined}
        />
        <StatCard
          icon={<Timer size={16} />}
          label="Study time"
          value={formatMinutes(stats.totalStudyMinutes)}
          sub={
            stats.averageQuizScore !== null
              ? `Quiz average ${stats.averageQuizScore}%`
              : "No quiz results yet"
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Continue learning */}
          <Card>
            <CardHeader
              title="Continue learning"
              description={
                nextModule
                  ? `${currentPhase?.title ?? ""} · ${nextModule.title}`
                  : "Every lesson is complete — explore the project library."
              }
              action={nextLesson ? <LevelBadge phaseId={nextLesson.phaseId} /> : null}
            />
            <CardBody>
              {nextLesson ? (
                <div className="rounded-lg border border-border bg-surface-2 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium uppercase tracking-wide text-text-faint">
                        Up next
                      </p>
                      <h3 className="mt-1 text-[16px] font-semibold text-text">{nextLesson.title}</h3>
                      <p className="mt-1 line-clamp-2 text-[13.5px] leading-6 text-text-muted">
                        {nextLesson.description}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] text-text-faint">
                        <Badge tone="neutral">{nextLesson.estimatedMinutes} min</Badge>
                        <Badge tone={nextLesson.difficulty === "beginner" ? "success" : nextLesson.difficulty === "intermediate" ? "warning" : "danger"}>
                          {nextLesson.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <ProgressRing value={stats.overallPercent} size={56} strokeWidth={5} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ButtonLink to={`/lessons/${nextLesson.slug}`}>
                      Open lesson
                      <ArrowRight size={15} />
                    </ButtonLink>
                    <ButtonLink to="/roadmap" variant="outline">
                      View roadmap
                    </ButtonLink>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="Roadmap complete"
                  description="You have finished every lesson. Revisit weak areas from the roadmap or start a capstone project."
                  action={
                    <ButtonLink to="/projects">Browse projects</ButtonLink>
                  }
                />
              )}
            </CardBody>
          </Card>

          {/* Phase progress */}
          <Card>
            <CardHeader
              title="Phase progress"
              description="Completion is calculated from your saved lesson data."
            />
            <CardBody className="space-y-4">
              {phases.map((phase) => {
                const phaseStats = stats.phaseStats.find((p) => p.phaseId === phase.id);
                if (!phaseStats) return null;
                return (
                  <Link
                    key={phase.id}
                    to={`/phases/${phase.id}`}
                    className="block rounded-lg border border-border bg-surface-2 p-3.5 transition-colors hover:border-border-strong"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[14px] font-semibold text-text">
                          <span className="h-2 w-2 rounded-full" style={{ background: phase.accent }} />
                          Phase {phase.order} — {phase.title}
                        </p>
                        <p className="mt-0.5 truncate text-[12.5px] text-text-faint">{phase.subtitle}</p>
                      </div>
                      <span className="text-[13px] font-semibold tabular-nums text-text">
                        {phaseStats.percent}%
                      </span>
                    </div>
                    <ProgressBar value={phaseStats.percent} />
                    <p className="mt-1.5 text-[12px] tabular-nums text-text-faint">
                      {phaseStats.completed}/{phaseStats.total} lessons · {phase.estimatedHoursRange}
                    </p>
                  </Link>
                );
              })}
            </CardBody>
          </Card>

          {/* Recently studied */}
          <Card>
            <CardHeader title="Recently studied" description="Your latest completed lessons and projects." />
            <CardBody>
              {stats.recentlyStudied.length === 0 ? (
                <EmptyState
                  icon={<Play size={26} />}
                  title="Nothing studied yet"
                  description="Complete your first lesson and it will appear here."
                  action={
                    nextLesson ? (
                      <ButtonLink to={`/lessons/${nextLesson.slug}`} size="sm">
                        Start first lesson
                      </ButtonLink>
                    ) : null
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {stats.recentlyStudied.map((item) => {
                    const isProject = item.type === "project";
                    const project = isProject ? getProject(item.id) : undefined;
                    const lesson = !isProject ? getLesson(item.id) : undefined;
                    const to = isProject
                      ? `/projects/${project?.slug ?? ""}`
                      : `/lessons/${lesson?.slug ?? ""}`;
                    return (
                      <li key={`${item.type}-${item.id}`}>
                        <Link
                          to={to}
                          className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:opacity-80"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                                isProject ? "bg-accent-soft text-accent" : "bg-success-soft text-success"
                              }`}
                            >
                              {isProject ? <FolderKanban size={14} /> : <CheckCircle2 size={14} />}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-[13.5px] font-medium text-text">
                                {item.title}
                              </span>
                              <span className="block text-[11.5px] text-text-faint capitalize">
                                {item.type} · {formatRelative(item.completedAt)}
                              </span>
                            </span>
                          </span>
                          <ArrowRight size={14} className="shrink-0 text-text-faint" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Recommended project" description="Matched to your current progress." />
            <CardBody>
              {recommended ? (
                <div>
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <Badge tone="accent">{recommended.phaseId.replace("phase-", "Phase ")}</Badge>
                    <Badge tone="neutral">{recommended.difficulty}</Badge>
                    <Badge tone="neutral">~{recommended.estimatedHours}h</Badge>
                  </div>
                  <h3 className="text-[15px] font-semibold text-text">{recommended.title}</h3>
                  <p className="mt-1 line-clamp-3 text-[13px] leading-6 text-text-muted">
                    {recommended.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {recommended.technologies.slice(0, 4).map((tech) => (
                      <Badge key={tech} tone="neutral">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <ButtonLink to={`/projects/${recommended.slug}`} variant="outline" className="mt-4 w-full">
                    Start project
                    <ArrowRight size={15} />
                  </ButtonLink>
                </div>
              ) : (
                <EmptyState title="All projects completed" description="Amazing work — try a Phase 3 capstone you have not done yet." />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quick links" />
            <CardBody className="space-y-1.5">
              <QuickLink to="/resources?type=resource" icon={<ExternalLink size={15} />} label="Official documentation" sub="Curated docs per topic" />
              <QuickLink to="/search?type=resource&language=en" icon={<Play size={15} />} label="Video lessons" sub="Search-linked video resources" />
              <QuickLink to="/projects" icon={<FolderKanban size={15} />} label="Projects" sub={`${stats.completedProjects}/${stats.totalProjects} completed`} />
              <QuickLink to="/search?type=exercise" icon={<Puzzle size={15} />} label="Exercises" sub="Practice by topic" />
              <QuickLink to="/study-plan" icon={<CalendarClock size={15} />} label="Study plan" sub="Weekly schedule from your availability" />
            </CardBody>
          </Card>

          {currentPhase ? (
            <Card className="overflow-hidden">
              <div className="border-b border-border px-5 py-4" style={{ background: `${currentPhase.accent}12` }}>
                <p className="text-[12px] font-medium uppercase tracking-wide text-text-faint">Current phase</p>
                <p className="mt-1 text-[15px] font-semibold text-text">
                  Phase {currentPhase.order} — {currentPhase.title}
                </p>
              </div>
              <CardBody>
                <p className="text-[13px] leading-6 text-text-muted">{currentPhase.description}</p>
                <ButtonLink to={`/phases/${currentPhase.id}`} size="sm" variant="outline" className="mt-3">
                  Open phase
                  <ArrowRight size={14} />
                </ButtonLink>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  ring,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  ring?: number;
  tone?: "success";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-text-faint">
            <span className={tone === "success" ? "text-success" : "text-accent"}>{icon}</span>
            {label}
          </p>
          <p className="mt-1.5 text-[21px] font-bold tabular-nums leading-7 text-text">{value}</p>
          <p className="mt-0.5 truncate text-[11.5px] text-text-muted">{sub}</p>
        </div>
        {typeof ring === "number" ? <ProgressRing value={ring} size={46} strokeWidth={4} /> : null}
      </div>
    </Card>
  );
}

function QuickLink({
  to,
  icon,
  label,
  sub,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-md border border-transparent px-2.5 py-2 transition-colors hover:border-border hover:bg-surface-2"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-3 text-text-muted">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium text-text">{label}</span>
        <span className="block truncate text-[11.5px] text-text-faint">{sub}</span>
      </span>
      <ArrowRight size={14} className="shrink-0 text-text-faint" />
    </Link>
  );
}
