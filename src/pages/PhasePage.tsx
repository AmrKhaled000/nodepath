import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleDashed, ListChecks, Puzzle } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/States";
import { getLessonsForModule, getModulesForPhase, getPhase, getProjectsForPhase, getQuizzesForModule, phases } from "@/content";
import { useProgress } from "@/services/progressStore";

export function PhasePage() {
  const { phaseId } = useParams();
  const progress = useProgress();
  const phase = phaseId ? getPhase(phaseId) : undefined;

  if (!phase) return <NotFound />;

  const modules = getModulesForPhase(phase.id);
  const lessons = modules.flatMap((m) => getLessonsForModule(m.id));
  const completedCount = lessons.filter((l) => progress.completedLessons[l.id]).length;
  const percent = lessons.length === 0 ? 0 : Math.round((completedCount / lessons.length) * 100);
  const projects = getProjectsForPhase(phase.id);
  const currentIndex = phases.findIndex((p) => p.id === phase.id);
  const prev = phases[currentIndex - 1];
  const next = phases[currentIndex + 1];

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: "Roadmap", to: "/roadmap" },
          { label: `Phase ${phase.order}` },
        ]}
        title={
          <span className="flex items-center gap-3">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: phase.accent }} />
            Phase {phase.order} — {phase.title}
          </span>
        }
        description={phase.description}
        meta={[
          <Badge key="hours" tone="neutral">
            {phase.estimatedHoursRange}
          </Badge>,
          <Badge key="modules" tone="neutral">
            {modules.length} modules
          </Badge>,
          <Badge key="lessons" tone="neutral">
            {lessons.length} lessons
          </Badge>,
          <Badge key="projects" tone="neutral">
            {projects.length} projects
          </Badge>,
        ]}
        actions={<ProgressRing value={percent} size={58} strokeWidth={5} label={`${percent}%`} />}
      />

      <Card className="mb-6">
        <CardHeader title="What you will achieve" description="By the end of this phase you can:" />
        <CardBody>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {phase.outcomes.map((outcome) => (
              <li key={outcome} className="flex items-start gap-2.5 text-[13.5px] leading-6 text-text-muted">
                <CheckCircle2 size={15} className="mt-1 shrink-0 text-success" />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-text">
            {completedCount} of {lessons.length} lessons completed
          </p>
          <div className="mt-2">
            <ProgressBar value={percent} />
          </div>
        </div>
        <span className="text-[13px] font-bold tabular-nums text-text">{percent}%</span>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-[16px] font-semibold text-text">Modules</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((mod) => {
            const modLessons = getLessonsForModule(mod.id);
            const done = modLessons.filter((l) => progress.completedLessons[l.id]).length;
            const modPercent = modLessons.length === 0 ? 0 : Math.round((done / modLessons.length) * 100);
            const quiz = getQuizzesForModule(mod.id);
            const firstUnfinished =
              modLessons.find((l) => !progress.completedLessons[l.id]) ?? modLessons[0];
            const state = modPercent === 100 ? "completed" : done > 0 ? "in-progress" : "new";

            return (
              <Card
                key={mod.id}
                className="flex flex-col"
                data-testid={`module-card-${mod.id}`}
              >
                <CardHeader
                  title={
                    <span className="flex items-center gap-2">
                      {modPercent === 100 ? (
                        <CheckCircle2 size={15} className="shrink-0 text-success" />
                      ) : (
                        <CircleDashed size={15} className="shrink-0 text-text-faint" />
                      )}
                      {mod.title}
                    </span>
                  }
                  description={mod.description}
                  action={
                    <Badge
                      tone={state === "completed" ? "success" : state === "in-progress" ? "accent" : "neutral"}
                    >
                      {state === "completed" ? "Done" : state === "in-progress" ? "In progress" : "Not started"}
                    </Badge>
                  }
                />
                <CardBody className="mt-auto space-y-3">
                  <div className="flex items-center justify-between text-[12px] text-text-faint">
                    <span>{modLessons.length} lessons</span>
                    <span className="tabular-nums">
                      {done}/{modLessons.length} · {modPercent}%
                    </span>
                  </div>
                  <ProgressBar value={modPercent} />
                  <div className="flex flex-wrap gap-2">
                    {firstUnfinished ? (
                      <ButtonLink to={`/lessons/${firstUnfinished.slug}`} size="sm">
                        {state === "new" ? "Start module" : state === "completed" ? "Review" : "Continue"}
                      </ButtonLink>
                    ) : null}
                    {quiz ? (
                      <ButtonLink to={`/quizzes/${quiz.id}`} size="sm" variant="outline">
                        <Puzzle size={14} />
                        Quiz
                      </ButtonLink>
                    ) : null}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-[16px] font-semibold text-text">Projects in this phase</h2>
        {projects.length === 0 ? (
          <EmptyState title="No projects" description="This phase builds knowledge only — projects start in later phases." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => {
              const done = Boolean(progress.completedProjects[project.id]);
              return (
                <Link
                  key={project.id}
                  to={`/projects/${project.slug}`}
                  className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent/60"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone={done ? "success" : "neutral"}>{done ? "Completed" : project.difficulty}</Badge>
                    <Badge tone="neutral">~{project.estimatedHours}h</Badge>
                  </div>
                  <p className="text-[14.5px] font-semibold text-text group-hover:text-accent">
                    {project.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] leading-6 text-text-muted">
                    {project.description}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-1.5 text-[11.5px] text-text-faint">
                    {project.technologies.slice(0, 5).join(" · ")}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <nav className="flex items-center justify-between gap-3 border-t border-border pt-5">
        {prev ? (
          <ButtonLink to={`/phases/${prev.id}`} variant="outline" size="sm">
            <ArrowLeft size={14} />
            Phase {prev.order} — {prev.title}
          </ButtonLink>
        ) : (
          <span />
        )}
        {next ? (
          <ButtonLink to={`/phases/${next.id}`} variant="outline" size="sm">
            Phase {next.order} — {next.title}
            <ArrowRight size={14} />
          </ButtonLink>
        ) : (
          <ButtonLink to="/roadmap" variant="outline" size="sm">
            <ListChecks size={14} />
            Back to roadmap
          </ButtonLink>
        )}
      </nav>
    </PageContainer>
  );
}

function NotFound() {
  return (
    <PageContainer>
      <EmptyState
        title="Phase not found"
        description="That phase does not exist. Pick one from the roadmap."
        action={
          <ButtonLink to="/roadmap">Open roadmap</ButtonLink>
        }
      />
    </PageContainer>
  );
}
