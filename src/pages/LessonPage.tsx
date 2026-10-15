import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle2,
  Clock,
  FolderKanban,
  Lightbulb,
  ListChecks,
  NotebookPen,
  Puzzle,
  Sparkles,
  Target,
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
import { Textarea } from "@/components/ui/Form";
import {
  ExerciseCard,
  LessonNavRow,
  BulletList,
  ResourceSection,
} from "@/components/lesson/LessonBlocks";
import {
  allProjects,
  getLesson,
  getLessonBySlug,
  getLessonsForModule,
  getModule,
  getPhase,
  getNextLessonId,
  getQuizzesForModule,
} from "@/content";
import { useProgress, progressStore } from "@/services/progressStore";
import { cn } from "@/utils/cn";

export function LessonPage() {
  const { slug } = useParams();
  const progress = useProgress();
  const lesson = slug ? getLessonBySlug(slug) : undefined;

  const module = lesson ? getModule(lesson.moduleId) : undefined;
  const phase = lesson ? getPhase(lesson.phaseId) : undefined;
  const moduleLessons = useMemo(
    () => (module ? getLessonsForModule(module.id) : []),
    [module],
  );
  const completed = lesson ? Boolean(progress.completedLessons[lesson.id]) : false;
  const bookmarked = lesson ? progress.bookmarks.includes(lesson.id) : false;
  const quiz = module ? getQuizzesForModule(module.id) : undefined;

  const [noteDraft, setNoteDraft] = useState("");
  const noteLoadedFor = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const lessonIndex = lesson ? moduleLessons.findIndex((l) => l.id === lesson.id) : -1;
  const prevLesson = lessonIndex > 0 ? moduleLessons[lessonIndex - 1] : undefined;
  const nextGlobalId = lesson ? getNextLessonId(lesson.id) : null;
  const nextLesson = nextGlobalId
    ? moduleLessons.find((l) => l.id === nextGlobalId) ?? getLesson(nextGlobalId)
    : undefined;
  const moduleCompleted = moduleLessons.filter((l) => progress.completedLessons[l.id]).length;
  const modulePercent =
    moduleLessons.length === 0 ? 0 : Math.round((moduleCompleted / moduleLessons.length) * 100);

  useEffect(() => {
    if (lesson) progressStore.setCurrentLesson(lesson.id);
    noteLoadedFor.current = null;
  }, [lesson]);

  useEffect(() => {
    if (!lesson) return;
    if (noteLoadedFor.current === lesson.id) return;
    setNoteDraft(progress.notes[lesson.id] ?? "");
    noteLoadedFor.current = lesson.id;
  }, [lesson, progress.notes]);

  useEffect(() => {
    if (!lesson || noteLoadedFor.current !== lesson.id) return;
    const value = noteDraft;
    const timer = window.setTimeout(() => {
      if ((progress.notes[lesson.id] ?? "") !== value) progressStore.setNote(lesson.id, value);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [noteDraft, lesson, progress.notes]);

  // Auto mark-complete when the end of the lesson is reached.
  useEffect(() => {
    if (!lesson || completed) return;
    const target = sentinelRef.current;
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          progressStore.setLessonCompleted(lesson.id, true);
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [lesson, completed]);

  if (!lesson || !module || !phase) {
    return (
      <PageContainer>
        <EmptyState
          title="Lesson not found"
          description="This lesson does not exist. Check the roadmap for the full list."
          action={<ButtonLink to="/roadmap">Open roadmap</ButtonLink>}
        />
      </PageContainer>
    );
  }

  const projectLinks = lesson.projectIds
    .map((id) => allProjects.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const related = lesson.relatedTopics
    .map((id) => getLesson(id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));

  const sections: { id: string; label: string; icon: React.ReactNode }[] = [
    { id: "objectives", label: "Learning objectives", icon: <Target size={13} /> },
    { id: "explanation", label: "Simple explanation", icon: <Sparkles size={13} /> },
    { id: "details", label: "Detailed content", icon: <ListChecks size={13} /> },
    { id: "how-it-works", label: "How it works", icon: <ListChecks size={13} /> },
    ...(lesson.codeExamples.length ? [{ id: "code", label: "Code examples", icon: <ListChecks size={13} /> }] : []),
    ...(lesson.commonMistakes.length ? [{ id: "mistakes", label: "Common mistakes", icon: <AlertTriangle size={13} /> }] : []),
    ...(lesson.bestPractices.length ? [{ id: "practices", label: "Best practices", icon: <Check size={13} /> }] : []),
    ...(lesson.realWorldUseCases.length ? [{ id: "use-cases", label: "Real-world use cases", icon: <FolderKanban size={13} /> }] : []),
    ...(lesson.exercises.length ? [{ id: "exercises", label: "Exercises", icon: <Lightbulb size={13} /> }] : []),
    ...(projectLinks.length ? [{ id: "projects", label: "Apply to a project", icon: <FolderKanban size={13} /> }] : []),
    ...(lesson.resources.length ? [{ id: "resources", label: "Resources", icon: <Award size={13} /> }] : []),
    ...(quiz ? [{ id: "quiz", label: "Module quiz", icon: <Puzzle size={13} /> }] : []),
    ...(related.length ? [{ id: "related", label: "Related topics", icon: <Sparkles size={13} /> }] : []),
    { id: "notes", label: "My notes", icon: <NotebookPen size={13} /> },
  ];

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: "Roadmap", to: "/roadmap" },
          { label: `Phase ${phase.order}`, to: `/phases/${phase.id}` },
          { label: module.title },
          { label: lesson.title },
        ]}
        title={lesson.title}
        description={lesson.description}
        meta={[
          <LevelBadge key="phase" phaseId={lesson.phaseId} />,
          <DifficultyBadge key="diff" difficulty={lesson.difficulty} />,
          <Badge key="time" tone="neutral">
            <Clock size={11} className="mr-1 inline" />
            {lesson.estimatedMinutes} min
          </Badge>,
          <Badge key="module" tone="neutral">
            {module.title}
          </Badge>,
          completed ? (
            <Badge key="done" tone="success">
              <Check size={11} className="mr-1 inline" />
              Completed
            </Badge>
          ) : null,
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              aria-pressed={bookmarked}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark this lesson"}
              onClick={() => progressStore.toggleBookmark(lesson.id)}
            >
              {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
            <Button
              variant={completed ? "secondary" : "primary"}
              aria-pressed={completed}
              data-testid="mark-complete"
              onClick={() => progressStore.setLessonCompleted(lesson.id, !completed)}
            >
              {completed ? <CheckCircle2 size={15} /> : <Check size={15} />}
              {completed ? "Completed" : "Mark complete"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardBody className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[12.5px] text-text-faint">
                  Lesson {lessonIndex + 1} of {moduleLessons.length} in this module
                </p>
                <div className="mt-2 w-full min-w-[220px]">
                  <ProgressBar value={modulePercent} />
                </div>
              </div>
              <ProgressRing value={modulePercent} size={46} strokeWidth={4} />
            </CardBody>
          </Card>

          <section id="objectives" className="scroll-mt-24">
            <SectionTitle icon={<Target size={16} className="text-accent" />}>
              Learning objectives
            </SectionTitle>
            <Card>
              <CardBody>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {lesson.learningObjectives.map((objective) => (
                    <li
                      key={objective}
                      className="flex items-start gap-2.5 text-[13.5px] leading-6 text-text-muted"
                    >
                      <CheckCircle2 size={15} className="mt-1 shrink-0 text-accent" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </section>

          <section id="explanation" className="scroll-mt-24">
            <SectionTitle icon={<Sparkles size={16} className="text-accent" />}>
              Simple explanation
            </SectionTitle>
            <Callout tone="info">{lesson.simpleExplanation}</Callout>
          </section>

          <section id="details" className="scroll-mt-24">
            <SectionTitle icon={<ListChecks size={16} className="text-accent" />}>
              Detailed content
            </SectionTitle>
            <Card>
              <CardBody>
                <Markdown>{lesson.detailedContent}</Markdown>
              </CardBody>
            </Card>
          </section>

          <section id="how-it-works" className="scroll-mt-24">
            <SectionTitle icon={<ListChecks size={16} className="text-accent" />}>
              How it works under the hood
            </SectionTitle>
            <Card>
              <CardBody>
                <Markdown>{lesson.howItWorks}</Markdown>
              </CardBody>
            </Card>
          </section>

          {lesson.codeExamples.length ? (
            <section id="code" className="scroll-mt-24">
              <SectionTitle icon={<CodeIcon />}>Code examples</SectionTitle>
              <div className="space-y-4">
                {lesson.codeExamples.map((example) => (
                  <Card key={example.title}>
                    <CardHeader title={example.title} description={example.description} />
                    <CardBody>
                      <CodeBlock code={example.code} language={example.language} />
                    </CardBody>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {lesson.commonMistakes.length ? (
            <section id="mistakes" className="scroll-mt-24">
              <SectionTitle icon={<AlertTriangle size={16} className="text-danger" />}>
                Common mistakes
              </SectionTitle>
              <Callout tone="danger" title="Watch out for these">
                <BulletList items={lesson.commonMistakes} tone="danger" />
              </Callout>
            </section>
          ) : null}

          {lesson.bestPractices.length ? (
            <section id="practices" className="scroll-mt-24">
              <SectionTitle icon={<Check size={16} className="text-success" />}>
                Best practices
              </SectionTitle>
              <Callout tone="success" title="Do it this way">
                <BulletList items={lesson.bestPractices} tone="success" />
              </Callout>
            </section>
          ) : null}

          {lesson.realWorldUseCases.length ? (
            <section id="use-cases" className="scroll-mt-24">
              <SectionTitle icon={<FolderKanban size={16} className="text-accent" />}>
                Real-world use cases
              </SectionTitle>
              <Card>
                <CardBody>
                  <BulletList items={lesson.realWorldUseCases} tone="info" />
                </CardBody>
              </Card>
            </section>
          ) : null}

          {lesson.exercises.length ? (
            <section id="exercises" className="scroll-mt-24">
              <SectionTitle icon={<Lightbulb size={16} className="text-accent" />}>
                Interactive exercises
              </SectionTitle>
              <div className="space-y-4">
                {lesson.exercises.map((exercise, i) => (
                  <ExerciseCard key={exercise.id} exercise={exercise} index={i} />
                ))}
              </div>
            </section>
          ) : null}

          {projectLinks.length ? (
            <section id="projects" className="scroll-mt-24">
              <SectionTitle icon={<FolderKanban size={16} className="text-accent" />}>
                Apply it to a project
              </SectionTitle>
              <div className="grid gap-3 md:grid-cols-2">
                {projectLinks.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.slug}`}
                    className="rounded-lg border border-border bg-surface-2 p-3.5 transition-colors hover:border-accent/60"
                  >
                    <p className="text-[13.5px] font-semibold text-text">{project.title}</p>
                    <p className="mt-1 line-clamp-2 text-[12.5px] leading-5 text-text-muted">
                      {project.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {lesson.resources.length ? (
            <section id="resources" className="scroll-mt-24">
              <SectionTitle icon={<Award size={16} className="text-accent" />}>
                Resources
              </SectionTitle>
              <ResourceSection resources={lesson.resources} />
            </section>
          ) : null}

          {quiz ? (
            <section id="quiz" className="scroll-mt-24">
              <SectionTitle icon={<Puzzle size={16} className="text-accent" />}>
                Check your knowledge
              </SectionTitle>
              <Card>
                <CardBody className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[14.5px] font-semibold text-text">{quiz.title}</p>
                    <p className="mt-1 text-[13px] text-text-muted">
                      {quiz.questions.length} questions for “{module.title}”.
                    </p>
                  </div>
                  <ButtonLink to={`/quizzes/${quiz.id}`}>
                    Start quiz
                    <ArrowRight size={15} />
                  </ButtonLink>
                </CardBody>
              </Card>
            </section>
          ) : null}

          {related.length ? (
            <section id="related" className="scroll-mt-24">
              <SectionTitle icon={<Sparkles size={16} className="text-accent" />}>
                Related topics
              </SectionTitle>
              <div className="flex flex-wrap gap-2">
                {related.map((rel) => (
                  <Link
                    key={rel.id}
                    to={`/lessons/${rel.slug}`}
                    className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-text-muted transition-colors hover:border-accent/60 hover:text-text"
                  >
                    {rel.title}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section id="notes" className="scroll-mt-24">
            <SectionTitle icon={<NotebookPen size={16} className="text-accent" />}>
              My notes
            </SectionTitle>
            <Card>
              <CardBody>
                <Textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={5}
                  placeholder="Write your notes for this lesson — saved automatically in this browser."
                  aria-label="Lesson notes"
                />
                <p className="mt-2 text-[11.5px] text-text-faint">Autosaved locally.</p>
              </CardBody>
            </Card>
          </section>

          <div ref={sentinelRef} className="h-px" aria-hidden />

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-2 p-4">
            <CheckCircle2 size={18} className={completed ? "text-success" : "text-text-faint"} />
            <p className="min-w-0 flex-1 text-[13.5px] text-text-muted">
              {completed
                ? "Nice — this lesson is marked complete."
                : "Finished reading? Mark this lesson complete to update your roadmap."}
            </p>
            <Button
              variant={completed ? "outline" : "primary"}
              onClick={() => progressStore.setLessonCompleted(lesson.id, !completed)}
              data-testid="mark-complete-footer"
            >
              {completed ? "Undo" : "Mark complete"}
            </Button>
          </div>

          <nav className="flex items-center gap-3 border-t border-border pt-5">
            {prevLesson ? (
              <LessonNavRow
                to={`/lessons/${prevLesson.slug}`}
                direction="prev"
                label="Previous"
                title={prevLesson.title}
                minutes={prevLesson.estimatedMinutes}
              />
            ) : (
              <span className="flex-1" />
            )}
            {nextLesson ? (
              <LessonNavRow
                to={`/lessons/${nextLesson.slug}`}
                direction="next"
                label="Next lesson"
                title={nextLesson.title}
                minutes={nextLesson.estimatedMinutes}
              />
            ) : (
              <LessonNavRow
                to="/roadmap"
                direction="next"
                label="Finish"
                title="Back to roadmap"
              />
            )}
          </nav>
        </div>

        {/* Sticky sidebar */}
        <aside className="hidden xl:block">
          <div className="sticky top-4 space-y-4">
            <Card>
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12.5px] font-semibold uppercase tracking-wide text-text-faint">
                    On this lesson
                  </p>
                  <ProgressRing value={completed ? 100 : 0} size={34} strokeWidth={3} />
                </div>
                <nav className="space-y-0.5">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] text-text-muted transition-colors hover:bg-surface-2 hover:text-text",
                      )}
                    >
                      <span className="text-text-faint">{section.icon}</span>
                      {section.label}
                    </a>
                  ))}
                </nav>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="space-y-2.5">
                <p className="text-[12.5px] font-semibold uppercase tracking-wide text-text-faint">
                  Module progress
                </p>
                <ProgressBar value={modulePercent} />
                <p className="text-[12px] tabular-nums text-text-faint">
                  {moduleCompleted}/{moduleLessons.length} lessons
                </p>
                <Button
                  className="w-full"
                  variant={completed ? "outline" : "primary"}
                  onClick={() => progressStore.setLessonCompleted(lesson.id, !completed)}
                >
                  {completed ? "Undo completion" : "Mark complete"}
                </Button>
              </CardBody>
            </Card>

            {quiz ? (
              <Card>
                <CardBody className="space-y-2">
                  <p className="flex items-center gap-2 text-[13px] font-semibold text-text">
                    <Puzzle size={14} className="text-accent" />
                    Module quiz
                  </p>
                  <p className="text-[12.5px] text-text-muted">
                    {quiz.questions.length} questions · best score saved
                  </p>
                  <ButtonLink to={`/quizzes/${quiz.id}`} variant="outline" size="sm" className="w-full">
                    Take quiz
                  </ButtonLink>
                </CardBody>
              </Card>
            ) : null}
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 flex items-center gap-2 text-[16px] font-semibold text-text">
      {icon}
      {children}
    </h2>
  );
}

function CodeIcon() {
  return (
    <span className="flex h-4 w-4 items-center justify-center text-[11px] font-bold text-accent">
      {"</>"}
    </span>
  );
}
