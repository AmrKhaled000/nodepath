import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileText, FolderKanban, HelpCircle, Layers, Puzzle, Search, SlidersHorizontal, Video, BookOpen } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge, DifficultyBadge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import {
  buildSearchIndex,
  defaultSearchFilters,
  searchDocs,
  type SearchDoc,
  type SearchDocType,
  type SearchFilters,
} from "@/services/search";
import { phases } from "@/content";
import { useProgress } from "@/services/progressStore";

const typeMeta: Record<SearchDocType, { label: string; icon: React.ReactNode }> = {
  lesson: { label: "Lesson", icon: <BookOpen size={13} /> },
  module: { label: "Module", icon: <Layers size={13} /> },
  project: { label: "Project", icon: <FolderKanban size={13} /> },
  quiz: { label: "Quiz", icon: <Puzzle size={13} /> },
  resource: { label: "Resource", icon: <Video size={13} /> },
  exercise: { label: "Exercise", icon: <FileText size={13} /> },
};

export function SearchPage() {
  const progress = useProgress();
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get("q") ?? "");

  const query = params.get("q") ?? "";
  const type = (params.get("type") ?? "all") as SearchDocType | "all";
  const language = (params.get("language") ?? "all") as "all" | "en" | "ar";
  const phaseId = (params.get("phase") ?? "all") as SearchFilters["phaseId"];
  const difficulty = (params.get("difficulty") ?? "all") as SearchFilters["difficulty"];
  const status = (params.get("status") ?? "all") as SearchFilters["status"];

  useEffect(() => {
    setInput(query);
  }, [query]);

  const filters: SearchFilters = useMemo(
    () => ({
      ...defaultSearchFilters,
      type,
      language,
      phaseId,
      difficulty,
      status,
      completedIds: {
        ...progress.completedLessons,
        ...progress.completedProjects,
        ...progress.quizResults,
      },
    }),
    [type, language, phaseId, difficulty, status, progress],
  );

  const results = useMemo(() => {
    if (query.trim()) return searchDocs(query, filters, 100);
    return buildSearchIndex()
      .filter((doc) => passesQuiet(doc, filters))
      .slice(0, 80)
      .map((doc) => ({ doc, score: 0 }));
  }, [query, filters]);

  function updateParam(key: string, value: string): void {
    const next = new URLSearchParams(params);
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  const activeFilterCount = [type, language, phaseId, difficulty, status].filter(
    (v) => v !== "all",
  ).length;

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", to: "/" }, { label: "Search" }]}
        title="Search everything"
        description="Full-text search across 317 lessons, 18 quizzes, 20 projects, exercises, and every curated resource."
        actions={
          activeFilterCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setParams(query ? new URLSearchParams({ q: query }) : new URLSearchParams())}
            >
              <SlidersHorizontal size={13} />
              Clear {activeFilterCount} filter{activeFilterCount === 1 ? "" : "s"}
            </Button>
          ) : null
        }
      />

      <Card className="mb-4">
        <CardBody className="space-y-3">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
            <Input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") updateParam("q", input.trim());
              }}
              placeholder="Search: streams, middleware, JWT, event loop…"
              aria-label="Search query"
              className="pl-9 text-[15px]"
              data-testid="search-input"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Type"
              value={type}
              onChange={(v) => updateParam("type", v)}
              options={[
                { value: "all", label: "All types" },
                ...(Object.keys(typeMeta) as SearchDocType[]).map((t) => ({
                  value: t,
                  label: typeMeta[t].label,
                })),
              ]}
            />
            <FilterSelect
              label="Phase"
              value={phaseId}
              onChange={(v) => updateParam("phase", v)}
              options={[
                { value: "all", label: "All phases" },
                ...phases.map((p) => ({ value: p.id, label: `Phase ${p.order}` })),
              ]}
            />
            <FilterSelect
              label="Difficulty"
              value={difficulty}
              onChange={(v) => updateParam("difficulty", v)}
              options={[
                { value: "all", label: "Any difficulty" },
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ]}
            />
            <FilterSelect
              label="Language"
              value={language}
              onChange={(v) => updateParam("language", v)}
              options={[
                { value: "all", label: "Any language" },
                { value: "en", label: "English" },
                { value: "ar", label: "Arabic" },
              ]}
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={(v) => updateParam("status", v)}
              options={[
                { value: "all", label: "Any status" },
                { value: "incomplete", label: "Not completed" },
                { value: "completed", label: "Completed" },
              ]}
            />
          </div>
        </CardBody>
      </Card>

      <p className="mb-3 text-[13px] text-text-muted" data-testid="search-count">
        {results.length} result{results.length === 1 ? "" : "s"}
        {query ? ` for “${query}”` : " (showing a sample of all content)"}
      </p>

      {results.length === 0 ? (
        <EmptyState
          icon={<Search size={26} />}
          title="No matches"
          description="Try different keywords, or clear the filters."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setInput("");
                setParams(new URLSearchParams());
              }}
            >
              Reset search
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2" data-testid="search-results">
          {results.map(({ doc }) => (
            <li key={doc.id}>
              <SearchRow doc={doc} />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}

function SearchRow({ doc }: { doc: SearchDoc }) {
  const meta = typeMeta[doc.type];
  return (
    <Link
      to={doc.path}
      className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3.5 transition-colors hover:border-accent/60"
      data-testid="search-result"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-3 text-text-muted">
        {meta.icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold text-text">{doc.title}</span>
          <Badge tone="neutral">{meta.label}</Badge>
          {doc.difficulty ? <DifficultyBadge difficulty={doc.difficulty} /> : null}
          {doc.language ? (
            <Badge tone="info">{doc.language === "ar" ? "Arabic" : "English"}</Badge>
          ) : null}
        </span>
        <span className="mt-0.5 block line-clamp-2 text-[13px] leading-5 text-text-muted">
          {doc.description}
        </span>
        {doc.parentTitle ? (
          <span className="mt-1 block text-[11.5px] text-text-faint">{doc.parentTitle}</span>
        ) : null}
      </span>
    </Link>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-[12.5px] text-text-muted">
      <span className="text-text-faint">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text focus-visible:outline-2 focus-visible:outline-accent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function passesQuiet(doc: SearchDoc, filters: SearchFilters): boolean {
  if (filters.type !== "all" && doc.type !== filters.type) return false;
  if (filters.phaseId !== "all" && doc.phaseId !== filters.phaseId) return false;
  if (filters.difficulty !== "all" && doc.difficulty !== filters.difficulty) return false;
  if (filters.language !== "all" && doc.language !== filters.language) return false;
  if (filters.status !== "all") {
    const done = Boolean(filters.completedIds[doc.parentId ?? doc.id.replace(/^[a-z]+:/, "")]);
    if (filters.status === "completed" && !done) return false;
    if (filters.status === "incomplete" && done) return false;
  }
  return true;
}

export function NotFoundPage() {
  return (
    <PageContainer>
      <EmptyState
        icon={<HelpCircle size={28} />}
        title="404 — page not found"
        description="That page does not exist. The roadmap is the best place to reorient."
        action={
          <div className="flex gap-2">
            <Link to="/">
              <Button>Dashboard</Button>
            </Link>
            <Link to="/roadmap">
              <Button variant="outline">Roadmap</Button>
            </Link>
          </div>
        }
      />
    </PageContainer>
  );
}
