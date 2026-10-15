import type { Difficulty, Lesson, PhaseId, Project, Resource } from "@/types";
import {
  allLessons,
  allModules,
  allProjects,
  allQuizzes,
  getPhase,
} from "@/content";

export type SearchDocType = "lesson" | "module" | "project" | "quiz" | "resource" | "exercise";

export interface SearchDoc {
  id: string;
  type: SearchDocType;
  title: string;
  description: string;
  /** Route path for the result. */
  path: string;
  phaseId: PhaseId | null;
  difficulty: Difficulty | null;
  tags: string[];
  /** Resource language when the doc is a resource. */
  language?: "en" | "ar";
  parentId?: string;
  parentTitle?: string;
}

export interface SearchFilters {
  phaseId: PhaseId | "all";
  difficulty: Difficulty | "all";
  type: SearchDocType | "all";
  language: "all" | "en" | "ar";
  status: "all" | "completed" | "incomplete";
  /** lesson/project/quiz ids the user completed (for status filtering). */
  completedIds: Record<string, unknown>;
}

export const defaultSearchFilters: Omit<SearchFilters, "completedIds"> = {
  phaseId: "all",
  difficulty: "all",
  type: "all",
  language: "all",
  status: "all",
};

let cache: SearchDoc[] | null = null;

export function buildSearchIndex(): SearchDoc[] {
  if (cache) return cache;
  const docs: SearchDoc[] = [];

  for (const lesson of allLessons) {
    docs.push({
      id: `lesson:${lesson.id}`,
      type: "lesson",
      title: lesson.title,
      description: lesson.description,
      path: `/lessons/${lesson.slug}`,
      phaseId: lesson.phaseId,
      difficulty: lesson.difficulty,
      tags: lesson.tags,
      parentId: lesson.moduleId,
      parentTitle: allModules.find((m) => m.id === lesson.moduleId)?.title,
    });
    for (const ex of lesson.exercises) {
      docs.push({
        id: `exercise:${lesson.id}:${ex.id}`,
        type: "exercise",
        title: ex.title,
        description: ex.prompt,
        path: `/lessons/${lesson.slug}#exercises`,
        phaseId: lesson.phaseId,
        difficulty: ex.difficulty,
        tags: lesson.tags,
        parentId: lesson.id,
        parentTitle: lesson.title,
      });
    }
    for (const res of lesson.resources) {
      docs.push({
        id: `resource:${lesson.id}:${res.url}`,
        type: "resource",
        title: res.title,
        description: res.description,
        path: `/lessons/${lesson.slug}#resources`,
        phaseId: lesson.phaseId,
        difficulty: null,
        tags: [res.resourceType, res.provider],
        language: res.language,
        parentId: lesson.id,
        parentTitle: lesson.title,
      });
    }
  }

  for (const mod of allModules) {
    docs.push({
      id: `module:${mod.id}`,
      type: "module",
      title: mod.title,
      description: mod.description,
      path: `/phases/${mod.phaseId}#${mod.id}`,
      phaseId: mod.phaseId,
      difficulty: null,
      tags: [],
    });
  }

  for (const project of allProjects) {
    docs.push({
      id: `project:${project.id}`,
      type: "project",
      title: project.title,
      description: project.description,
      path: `/projects/${project.slug}`,
      phaseId: project.phaseId,
      difficulty: project.difficulty,
      tags: project.technologies,
    });
  }

  for (const quiz of allQuizzes) {
    const mod = allModules.find((m) => m.quizId === quiz.id);
    docs.push({
      id: `quiz:${quiz.id}`,
      type: "quiz",
      title: quiz.title,
      description: quiz.description,
      path: `/quizzes/${quiz.id}`,
      phaseId: mod?.phaseId ?? null,
      difficulty: null,
      tags: ["quiz"],
      parentId: mod?.id,
      parentTitle: mod?.title,
    });
  }

  cache = docs;
  return docs;
}

function tokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,./:]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function scoreDoc(doc: SearchDoc, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 1;
  const title = doc.title.toLowerCase();
  const description = doc.description.toLowerCase();
  const tags = doc.tags.join(" ").toLowerCase();
  const parent = (doc.parentTitle ?? "").toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    if (title === token) score += 12;
    else if (title.startsWith(token)) score += 8;
    else if (title.includes(token)) score += 6;
    if (tags.includes(token)) score += 4;
    if (description.includes(token)) score += 3;
    if (parent.includes(token)) score += 2;
    if (score === 0) return 0; // every token must match somewhere
  }
  return score;
}

function passesFilters(doc: SearchDoc, filters: SearchFilters): boolean {
  if (filters.phaseId !== "all" && doc.phaseId !== filters.phaseId) return false;
  if (filters.difficulty !== "all" && doc.difficulty !== filters.difficulty) return false;
  if (filters.type !== "all" && doc.type !== filters.type) return false;
  if (filters.language !== "all" && doc.language !== filters.language) return false;
  if (filters.status !== "all") {
    const targetId = doc.parentId ?? doc.id.split(":").slice(1).join(":");
    const completed = Boolean(filters.completedIds[targetId]);
    if (filters.status === "completed" && !completed) return false;
    if (filters.status === "incomplete" && completed) return false;
  }
  return true;
}

export interface SearchResult {
  doc: SearchDoc;
  score: number;
}

export function searchDocs(
  query: string,
  filters: SearchFilters,
  limit = 60,
): SearchResult[] {
  const docs = buildSearchIndex();
  const queryTokens = tokens(query);
  const results: SearchResult[] = [];

  for (const doc of docs) {
    if (!passesFilters(doc, filters)) continue;
    const score = scoreDoc(doc, queryTokens);
    if (score > 0) results.push({ doc, score });
  }

  results.sort((a, b) => b.score - a.score || a.doc.title.localeCompare(b.doc.title));
  return results.slice(0, limit);
}

/** Lesson detail payload used by the palette to show quick facts. */
export function describeLesson(lesson: Lesson): string {
  const phase = getPhase(lesson.phaseId);
  return `${phase?.title ?? ""} · ${lesson.estimatedMinutes} min · ${lesson.difficulty}`;
}

export function describeProject(project: Project): string {
  return `${project.technologies.slice(0, 4).join(", ")} · ~${project.estimatedHours}h`;
}

export function resourceMatchesLanguage(resource: Resource, language: "en" | "ar"): boolean {
  return resource.language === language;
}
