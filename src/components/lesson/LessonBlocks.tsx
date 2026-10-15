import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Lightbulb,
  PlayCircle,
  Search,
  Wrench,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge, DifficultyBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CodeBlock } from "@/components/ui/CodeBlock";
import type { Exercise, Resource } from "@/types";
import { cn } from "@/utils/cn";

const typeIcon: Record<Resource["resourceType"], React.ReactNode> = {
  "official-docs": <BookOpen size={14} />,
  video: <PlayCircle size={14} />,
  article: <FileText size={14} />,
  tutorial: <FileText size={14} />,
  reference: <BookOpen size={14} />,
  tool: <Wrench size={14} />,
  search: <Search size={14} />,
};

const typeLabel: Record<Resource["resourceType"], string> = {
  "official-docs": "Official docs",
  video: "Video lesson",
  article: "Article",
  tutorial: "Tutorial",
  reference: "Reference",
  tool: "Tool",
  search: "Search",
};

export function ResourceCard({ resource }: { resource: Resource }) {
  const verified = resource.verificationStatus === "verified";
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface-2 p-3 transition-colors hover:border-accent/60"
      data-testid="resource-card"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-3 text-text-muted group-hover:bg-accent-soft group-hover:text-accent">
        {typeIcon[resource.resourceType]}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-semibold text-text group-hover:text-accent">
            {resource.title}
          </span>
          <ExternalLink size={12} className="shrink-0 text-text-faint" />
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-text-faint">
          <span>{resource.provider}</span>
          <span>·</span>
          <span>{typeLabel[resource.resourceType]}</span>
          {resource.estimatedDuration ? (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock size={11} /> {resource.estimatedDuration}
              </span>
            </>
          ) : null}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge tone={verified ? "success" : "info"}>
            {verified ? "Verified link" : "Search link"}
          </Badge>
          <Badge tone="neutral">{resource.language === "ar" ? "Arabic" : "English"}</Badge>
          {resource.cost === "paid" ? <Badge tone="warning">Paid</Badge> : null}
        </span>
        <span className="mt-1.5 block text-[12.5px] leading-5 text-text-muted">
          {resource.description}
        </span>
      </span>
    </a>
  );
}

export function ExerciseCard({ exercise, index }: { exercise: Exercise; index: number }) {
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <Card data-testid="exercise-card">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-[12px] font-bold text-accent">
              {index + 1}
            </span>
            {exercise.title}
          </span>
        }
        action={
          <div className="flex items-center gap-1.5">
            <DifficultyBadge difficulty={exercise.difficulty} />
            {exercise.estimatedMinutes ? (
              <Badge tone="neutral">{exercise.estimatedMinutes} min</Badge>
            ) : null}
          </div>
        }
      />
      <CardBody className="space-y-3">
        <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-text-muted">
          {exercise.prompt}
        </p>

        {exercise.hints?.length ? (
          <div>
            <Button variant="ghost" size="sm" onClick={() => setShowHints((v) => !v)}>
              <Lightbulb size={14} />
              {showHints ? "Hide hints" : `Hints (${exercise.hints.length})`}
              <ChevronDown size={14} className={cn("transition-transform", showHints && "rotate-180")} />
            </Button>
            {showHints ? (
              <ul className="mt-1.5 space-y-1.5 border-l-2 border-warning/40 pl-3">
                {exercise.hints.map((hint) => (
                  <li key={hint} className="text-[13px] leading-6 text-text-muted">
                    {hint}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {exercise.solution ? (
          <div>
            <Button variant="outline" size="sm" onClick={() => setShowSolution((v) => !v)}>
              {showSolution ? <EyeOff size={14} /> : <Eye size={14} />}
              {showSolution ? "Hide solution" : "Reveal solution"}
            </Button>
            {showSolution ? (
              <div className="mt-2">
                <CodeBlock code={exercise.solution} language={exercise.solutionLanguage ?? "javascript"} />
              </div>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

export function ResourceSection({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) return null;
  const docs = resources.filter((r) => r.resourceType === "official-docs" || r.resourceType === "reference");
  const videos = resources.filter((r) => r.resourceType === "video");
  const others = resources.filter((r) => !docs.includes(r) && !videos.includes(r));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {docs.length > 0 ? (
        <div className="space-y-2.5">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-faint">
            Official documentation
          </h3>
          {docs.map((r) => (
            <ResourceCard key={`${r.url}-${r.title}`} resource={r} />
          ))}
        </div>
      ) : null}
      {videos.length > 0 ? (
        <div className="space-y-2.5">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-faint">
            Video lessons
          </h3>
          {videos.map((r) => (
            <ResourceCard key={`${r.url}-${r.title}`} resource={r} />
          ))}
        </div>
      ) : null}
      {others.length > 0 ? (
        <div className="space-y-2.5 md:col-span-2">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide text-text-faint">
            Articles & more
          </h3>
          <div className="grid gap-2.5 md:grid-cols-2">
            {others.map((r) => (
              <ResourceCard key={`${r.url}-${r.title}`} resource={r} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function BulletList({
  items,
  tone,
}: {
  items: string[];
  tone?: "success" | "danger" | "warning" | "info";
}) {
  if (items.length === 0) return null;
  const dot: Record<string, string> = {
    success: "bg-success",
    danger: "bg-danger",
    warning: "bg-warning",
    info: "bg-info",
  };
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[13.5px] leading-6 text-text-muted">
          <span className={cn("mt-2 h-1.5 w-1.5 shrink-0 rounded-full", dot[tone ?? "info"])} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LessonNavRow({
  to,
  direction,
  label,
  title,
  minutes,
}: {
  to: string;
  direction: "prev" | "next";
  label: string;
  title: string;
  minutes?: number;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex flex-1 items-center gap-3 rounded-lg border border-border bg-surface-2 p-3 transition-colors hover:border-accent/60",
        direction === "prev" ? "text-left" : "flex-row-reverse text-right",
      )}
      data-testid={`lesson-nav-${direction}`}
    >
      <ChevronRight
        size={16}
        className={cn(
          "shrink-0 text-text-faint transition-transform",
          direction === "next" ? "rotate-180" : "",
          "group-hover:text-accent",
        )}
      />
      <span className="min-w-0">
        <span className="block text-[11.5px] uppercase tracking-wide text-text-faint">{label}</span>
        <span className="block truncate text-[13.5px] font-medium text-text group-hover:text-accent">
          {title}
        </span>
        {minutes ? (
          <span className="block text-[11.5px] text-text-faint">{minutes} min</span>
        ) : null}
      </span>
    </Link>
  );
}
