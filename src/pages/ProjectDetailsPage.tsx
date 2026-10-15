import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  EyeOff,
  Lightbulb,
  ListChecks,
  Puzzle,
  Rocket,
  Server,
  Target,
  TestTube,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, DifficultyBadge, LevelBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { Callout } from "@/components/ui/Overlay";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Markdown } from "@/components/ui/Markdown";
import { EmptyState } from "@/components/ui/States";
import { BulletList, ResourceCard } from "@/components/lesson/LessonBlocks";
import { getLesson, getPhase, getProjectBySlug, phases } from "@/content";
import { useProgress, progressStore } from "@/services/progressStore";
import { cn } from "@/utils/cn";

const methodTone: Record<string, string> = {
  GET: "border-info/40 bg-info-soft text-info",
  POST: "border-success/40 bg-success-soft text-success",
  PUT: "border-warning/40 bg-warning-soft text-warning",
  PATCH: "border-warning/40 bg-warning-soft text-warning",
  DELETE: "border-danger/40 bg-danger-soft text-danger",
};

export function ProjectDetailsPage() {
  const { slug } = useParams();
  const progress = useProgress();
  const project = slug ? getProjectBySlug(slug) : undefined;
  const [showSolution, setShowSolution] = useState(false);
  const [openHints, setOpenHints] = useState(false);

  if (!project) {
    return (
      <PageContainer>
        <EmptyState
          title="Project not found"
          description="That project does not exist in the library."
          action={<ButtonLink to="/projects">Back to projects</ButtonLink>}
        />
      </PageContainer>
    );
  }

  const phase = getPhase(project.phaseId);
  const done = Boolean(progress.completedProjects[project.id]);
  const checklist = progress.projectChecklist[project.id] ?? {};
  const totalTasks = project.milestones.reduce((sum, m) => sum + m.tasks.length, 0);
  const checkedTasks = Object.values(checklist).filter(Boolean).length;
  const percent = totalTasks === 0 ? (done ? 100 : 0) : Math.round((checkedTasks / totalTasks) * 100);
  const relatedLessons = (project.relatedLessonIds ?? [])
    .map((id) => getLesson(id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: "Projects", to: "/projects" },
          ...(phase ? [{ label: `Phase ${phase.order}`, to: `/phases/${phase.id}` }] : []),
          { label: project.title },
        ]}
        title={project.title}
        description={project.description}
        meta={[
          <LevelBadge key="phase" phaseId={project.phaseId} />,
          <DifficultyBadge key="diff" difficulty={project.difficulty} />,
          <Badge key="hours" tone="neutral">
            <Clock size={11} className="mr-1 inline" />
            ~{project.estimatedHours}h
          </Badge>,
          <Badge key="original" tone={project.original ? "accent" : "info"}>
            {project.original ? "Platform project" : "Reference project"}
          </Badge>,
        ]}
        actions={
          <div className="flex gap-2">
            {phases.find((p) => p.id === project.phaseId) ? (
              <ButtonLink to={`/phases/${project.phaseId}`} variant="outline" size="sm">
                Open phase
              </ButtonLink>
            ) : null}
            <Button
              variant={done ? "secondary" : "primary"}
              aria-pressed={done}
              data-testid="project-mark-complete"
              onClick={() => progressStore.setProjectCompleted(project.id, !done)}
            >
              {done ? <CheckCircle2 size={15} /> : <Check size={15} />}
              {done ? "Completed" : "Mark complete"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardBody className="flex flex-wrap items-center gap-3">
              <div className="min-w-[220px] flex-1">
                <div className="mb-2 flex items-center justify-between text-[12.5px] text-text-muted">
                  <span>Milestone progress</span>
                  <span className="tabular-nums font-semibold text-text">
                    {checkedTasks}/{totalTasks} tasks · {percent}%
                  </span>
                </div>
                <ProgressBar value={percent} />
              </div>
              <ProgressRing value={percent} size={50} strokeWidth={4} />
            </CardBody>
          </Card>

          <Section icon={<Target size={16} className="text-accent" />} title="Learning objectives">
            <Card>
              <CardBody>
                <BulletList items={project.learningObjectives} tone="info" />
              </CardBody>
            </Card>
          </Section>

          {project.requiredKnowledge.length > 0 ? (
            <Section icon={<BookOpen size={16} className="text-accent" />} title="Required knowledge">
              <Card>
                <CardBody>
                  <div className="flex flex-wrap gap-2">
                    {project.requiredKnowledge.map((item, i) => {
                      const lesson = relatedLessons[i];
                      return lesson ? (
                        <Link
                          key={item}
                          to={`/lessons/${lesson.slug}`}
                          className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-text-muted transition-colors hover:border-accent/60 hover:text-text"
                        >
                          {item}
                        </Link>
                      ) : (
                        <span
                          key={item}
                          className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-text-muted"
                        >
                          {item}
                        </span>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </Section>
          ) : null}

          <Section icon={<Rocket size={16} className="text-accent" />} title="User stories">
            <Card>
              <CardBody>
                <BulletList items={project.userStories} tone="info" />
              </CardBody>
            </Card>
          </Section>

          <Section icon={<ListChecks size={16} className="text-accent" />} title="Functional requirements">
            <Card>
              <CardBody>
                <BulletList items={project.functionalRequirements} tone="success" />
              </CardBody>
            </Card>
          </Section>

          <Section icon={<CheckCircle2 size={16} className="text-accent" />} title="Milestones & checklist">
            <div className="space-y-4">
              {project.milestones.map((milestone, mi) => (
                <Card key={milestone.title}>
                  <CardHeader
                    title={milestone.title}
                    description={`${milestone.tasks.length} tasks`}
                  />
                  <CardBody className="space-y-1.5">
                    {milestone.tasks.map((task, ti) => {
                      const key = `${mi}-${ti}`;
                      const checked = Boolean(checklist[key]);
                      return (
                        <label
                          key={key}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-surface-2",
                          )}
                          data-testid={`task-${key}`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              progressStore.setChecklistItem(project.id, key, e.target.checked)
                            }
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
                          />
                          <span
                            className={cn(
                              "text-[13.5px] leading-6",
                              checked ? "text-text-faint line-through" : "text-text-muted",
                            )}
                          >
                            {task}
                          </span>
                        </label>
                      );
                    })}
                  </CardBody>
                </Card>
              ))}
            </div>
          </Section>

          <Section icon={<Server size={16} className="text-accent" />} title="Suggested structure">
            <CodeBlock code={project.suggestedStructure} language="text" title="Folder structure" />
          </Section>

          {project.dataModel ? (
            <Section icon={<ListChecks size={16} className="text-accent" />} title="Data model">
              <Card>
                <CardBody>
                  <Markdown>{project.dataModel}</Markdown>
                </CardBody>
              </Card>
            </Section>
          ) : null}

          {project.endpoints?.length ? (
            <Section icon={<Server size={16} className="text-accent" />} title="API endpoints">
              <Card>
                <CardBody className="space-y-2">
                  {project.endpoints.map((endpoint) => (
                    <div
                      key={`${endpoint.method}-${endpoint.path}`}
                      className="flex flex-wrap items-center gap-2.5 rounded-md border border-border bg-surface-2 px-3 py-2"
                      data-testid="endpoint-row"
                    >
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold",
                          methodTone[endpoint.method],
                        )}
                      >
                        {endpoint.method}
                      </span>
                      <code className="min-w-0 break-all font-mono text-[12.5px] text-text">
                        {endpoint.path}
                      </code>
                      <span className="text-[12.5px] text-text-muted">{endpoint.description}</span>
                      {endpoint.auth ? (
                        <Badge tone="neutral" className="ml-auto">
                          auth: {endpoint.auth}
                        </Badge>
                      ) : null}
                    </div>
                  ))}
                </CardBody>
              </Card>
            </Section>
          ) : null}

          {project.ioExamples?.length ? (
            <Section icon={<ListChecks size={16} className="text-accent" />} title="Input / output examples">
              <div className="grid gap-4 md:grid-cols-2">
                {project.ioExamples.map((example) => (
                  <Card key={example.title}>
                    <CardHeader title={example.title} />
                    <CardBody className="space-y-3">
                      <div>
                        <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-text-faint">
                          Input
                        </p>
                        <CodeBlock code={example.input} language={example.language ?? "json"} />
                      </div>
                      <div>
                        <p className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-text-faint">
                          Output
                        </p>
                        <CodeBlock code={example.output} language={example.language ?? "json"} />
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </Section>
          ) : null}

          <Section icon={<Check size={16} className="text-success" />} title="Acceptance criteria">
            <Card>
              <CardBody>
                <BulletList items={project.acceptanceCriteria} tone="success" />
              </CardBody>
            </Card>
          </Section>

          <Section icon={<TestTube size={16} className="text-accent" />} title="Tests to write">
            <Card>
              <CardBody>
                <BulletList items={project.tests} tone="info" />
              </CardBody>
            </Card>
          </Section>

          <Section icon={<Lightbulb size={16} className="text-warning" />} title="Hints">
            <Card>
              <CardBody className="space-y-3">
                <Button variant="outline" size="sm" onClick={() => setOpenHints((v) => !v)}>
                  <Lightbulb size={14} />
                  {openHints ? "Hide hints" : `Show hints (${project.hints.length})`}
                  <ChevronDown
                    size={14}
                    className={cn("transition-transform", openHints && "rotate-180")}
                  />
                </Button>
                {openHints ? <BulletList items={project.hints} tone="warning" /> : null}
              </CardBody>
            </Card>
          </Section>

          {project.optionalSolution ? (
            <Section icon={<Eye size={16} className="text-accent" />} title="Optional solution walkthrough">
              <Card>
                <CardBody className="space-y-3">
                  <Callout tone="warning" title="Reveal only after you have tried">
                    A reference walkthrough lives here so you can compare approaches after your own attempt.
                  </Callout>
                  <Button variant="outline" size="sm" onClick={() => setShowSolution((v) => !v)}>
                    {showSolution ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showSolution ? "Hide solution" : "Reveal solution"}
                  </Button>
                  {showSolution ? <Markdown>{project.optionalSolution}</Markdown> : null}
                </CardBody>
              </Card>
            </Section>
          ) : null}

          <Section icon={<Puzzle size={16} className="text-accent" />} title="Bonus challenges">
            <Card>
              <CardBody>
                <BulletList items={project.bonusChallenges} tone="info" />
              </CardBody>
            </Card>
          </Section>

          {project.commonMistakes?.length ? (
            <Section icon={<Lightbulb size={16} className="text-danger" />} title="Common mistakes">
              <Card>
                <CardBody>
                  <BulletList items={project.commonMistakes} tone="danger" />
                </CardBody>
              </Card>
            </Section>
          ) : null}

          {project.referenceLinks.length > 0 ? (
            <Section icon={<BookOpen size={16} className="text-accent" />} title="Reference links">
              <div className="grid gap-2.5 md:grid-cols-2">
                {project.referenceLinks.map((resource) => (
                  <ResourceCard key={`${resource.url}-${resource.title}`} resource={resource} />
                ))}
              </div>
            </Section>
          ) : null}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-4 space-y-4">
            <Card>
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12.5px] font-semibold uppercase tracking-wide text-text-faint">
                    Progress
                  </p>
                  <ProgressRing value={percent} size={38} strokeWidth={4} />
                </div>
                <ProgressBar value={percent} />
                <p className="text-[12px] tabular-nums text-text-faint">
                  {checkedTasks} of {totalTasks} tasks checked
                </p>
                <Button
                  className="w-full"
                  variant={done ? "outline" : "primary"}
                  onClick={() => progressStore.setProjectCompleted(project.id, !done)}
                >
                  {done ? "Undo completion" : "Mark project complete"}
                </Button>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-2">
                <p className="text-[12.5px] font-semibold uppercase tracking-wide text-text-faint">
                  Technologies
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
                    <Badge key={tech} tone="neutral">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardBody>
            </Card>

            {relatedLessons.length > 0 ? (
              <Card>
                <CardBody className="space-y-2">
                  <p className="text-[12.5px] font-semibold uppercase tracking-wide text-text-faint">
                    Related lessons
                  </p>
                  <div className="space-y-1">
                    {relatedLessons.map((lesson) => (
                      <Link
                        key={lesson.id}
                        to={`/lessons/${lesson.slug}`}
                        className="block rounded-md px-2 py-1.5 text-[13px] text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                      >
                        {lesson.title}
                      </Link>
                    ))}
                  </div>
                </CardBody>
              </Card>
            ) : null}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}

function Section({
  icon,
  title,
  children,
  id,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-2.5 flex items-center gap-2 text-[16px] font-semibold text-text">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
