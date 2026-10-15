import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, CornerDownLeft, BookOpen, FolderKanban, HelpCircle, Library, Puzzle } from "lucide-react";
import { cn } from "@/utils/cn";
import { searchDocs, defaultSearchFilters, type SearchDocType, type SearchFilters } from "@/services/search";
import { useProgress } from "@/services/progressStore";
import { phases } from "@/content";
import { DifficultyBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Overlay";

const typeMeta: Record<SearchDocType, { label: string; icon: React.ReactNode }> = {
  lesson: { label: "Lesson", icon: <BookOpen size={14} /> },
  module: { label: "Module", icon: <Library size={14} /> },
  project: { label: "Project", icon: <FolderKanban size={14} /> },
  quiz: { label: "Quiz", icon: <HelpCircle size={14} /> },
  resource: { label: "Resource", icon: <Library size={14} /> },
  exercise: { label: "Exercise", icon: <Puzzle size={14} /> },
};

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const progress = useProgress();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    phaseId: defaultSearchFilters.phaseId,
    type: defaultSearchFilters.type,
    status: defaultSearchFilters.status,
    language: defaultSearchFilters.language,
  });
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const searchFilters: SearchFilters = useMemo(
    () => ({ ...filters, difficulty: "all", completedIds: progress.completedLessons }),
    [filters, progress.completedLessons],
  );

  const results = useMemo(
    () => searchDocs(query, searchFilters, 24),
    [query, searchFilters],
  );

  useEffect(() => setActive(0), [query, filters.phaseId, filters.type, filters.status]);

  function go(path: string) {
    onClose();
    navigate(path);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active].doc.path);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Search the platform" wide>
      <div className="space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search lessons, modules, projects, exercises, resources…"
            aria-label="Search"
            className="w-full rounded-lg border border-border bg-surface-2 py-2.5 pl-9 pr-9 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear query"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-text-faint hover:text-text"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filters.phaseId}
            onChange={(e) => setFilters((f) => ({ ...f, phaseId: e.target.value as typeof f.phaseId }))}
            aria-label="Filter by phase"
            className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-[12.5px] text-text focus:border-accent focus:outline-none"
          >
            <option value="all">All phases</option>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as typeof f.type }))}
            aria-label="Filter by type"
            className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-[12.5px] text-text focus:border-accent focus:outline-none"
          >
            <option value="all">All types</option>
            <option value="lesson">Lessons</option>
            <option value="module">Modules</option>
            <option value="project">Projects</option>
            <option value="quiz">Quizzes</option>
            <option value="exercise">Exercises</option>
            <option value="resource">Resources</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as typeof f.status }))}
            aria-label="Filter by completion"
            className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-[12.5px] text-text focus:border-accent focus:outline-none"
          >
            <option value="all">Any status</option>
            <option value="incomplete">Incomplete</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filters.language}
            onChange={(e) => setFilters((f) => ({ ...f, language: e.target.value as typeof f.language }))}
            aria-label="Filter by resource language"
            className="rounded-md border border-border bg-surface-2 px-2 py-1.5 text-[12.5px] text-text focus:border-accent focus:outline-none"
          >
            <option value="all">Any language</option>
            <option value="en">English resources</option>
            <option value="ar">Arabic resources</option>
          </select>
        </div>

        <div className="max-h-[52vh] overflow-y-auto -mx-1">
          {results.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm font-medium text-text">No matches found</p>
              <p className="mt-1 text-[13px] text-text-muted">
                Try a broader keyword, or clear one of the filters.
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5" role="listbox" aria-label="Search results">
              {results.map((r, index) => {
                const meta = typeMeta[r.doc.type];
                const done = Boolean(
                  progress.completedLessons[r.doc.parentId ?? ""] ||
                    progress.completedProjects[r.doc.parentId ?? ""],
                );
                return (
                  <li key={r.doc.id} role="option" aria-selected={index === active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => go(r.doc.path)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                        index === active ? "bg-accent-soft" : "hover:bg-surface-2",
                      )}
                    >
                      <span className={cn("shrink-0", index === active ? "text-accent" : "text-text-faint")}>
                        {meta.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[13.5px] font-medium text-text">{r.doc.title}</span>
                          {done ? <span className="text-[10.5px] text-success">done</span> : null}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-text-faint">
                          <span className="rounded bg-surface-3 px-1.5 py-px text-[10.5px] uppercase tracking-wide">
                            {meta.label}
                          </span>
                          {r.doc.difficulty ? <DifficultyBadge difficulty={r.doc.difficulty} /> : null}
                          <span className="truncate">{r.doc.description}</span>
                        </span>
                      </span>
                      {index === active ? (
                        <CornerDownLeft size={14} className="shrink-0 text-text-faint" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-[11.5px] text-text-faint">
          <span>
            <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px]">↑</kbd>{" "}
            <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px]">↓</kbd>{" "}
            navigate ·{" "}
            <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px]">Enter</kbd>{" "}
            open ·{" "}
            <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px]">Esc</kbd>{" "}
            close
          </span>
          <button
            type="button"
            className="animated-underline text-accent"
            onClick={() => {
              onClose();
              navigate("/search");
            }}
          >
            Open full search page
          </button>
        </div>
      </div>
    </Modal>
  );
}
