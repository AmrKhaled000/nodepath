import type { Lesson, Module, Phase, Project, Quiz, PhaseId } from "@/types";
import { phases } from "./phases";
import { moduleContents } from "./lessons";
import { projects } from "./projects";

export interface ModuleContent {
  meta: {
    id: string;
    slug: string;
    title: string;
    description: string;
    /** Module files declare this as a plain string for authoring convenience. */
    phaseId: string;
    order: number;
  };
  lessons: Lesson[];
  quiz?: Quiz;
}

function assembleModules(): { modules: Module[]; lessons: Lesson[]; quizzes: Quiz[] } {
  const modules: Module[] = [];
  const lessons: Lesson[] = [];
  const quizzes: Quiz[] = [];

  for (const content of moduleContents) {
    const sorted = [...content.lessons].sort((a, b) => a.order - b.order);
    lessons.push(...sorted);
    if (content.quiz) quizzes.push(content.quiz);
    modules.push({
      id: content.meta.id,
      slug: content.meta.slug,
      title: content.meta.title,
      description: content.meta.description,
      order: content.meta.order,
      phaseId: content.meta.phaseId as PhaseId,
      lessonIds: sorted.map((l) => l.id),
      ...(content.quiz ? { quizId: content.quiz.id } : {}),
    });
  }

  modules.sort((a, b) => {
    const phaseDiff = phaseOrder(a.phaseId) - phaseOrder(b.phaseId);
    return phaseDiff !== 0 ? phaseDiff : a.order - b.order;
  });

  return { modules, lessons, quizzes };
}

function phaseOrder(phaseId: string): number {
  return phases.find((p) => p.id === phaseId)?.order ?? 99;
}

const assembled = assembleModules();

export { phases, projects };
export const allModules: Module[] = assembled.modules;
export const allLessons: Lesson[] = assembled.lessons;
export const allQuizzes: Quiz[] = assembled.quizzes;
export const allProjects: Project[] = projects;

const lessonMap = new Map(allLessons.map((l) => [l.id, l]));
const lessonBySlugMap = new Map(allLessons.map((l) => [l.slug, l]));
const moduleMap = new Map(allModules.map((m) => [m.id, m]));
const projectMap = new Map(allProjects.map((p) => [p.id, p]));
const quizMap = new Map(allQuizzes.map((q) => [q.id, q]));
const phaseMap = new Map<string, Phase>(phases.map((p) => [p.id, p]));

export function getLesson(id: string): Lesson | undefined {
  return lessonMap.get(id);
}

export function getLessonBySlug(slug: string): Lesson | undefined {
  return lessonBySlugMap.get(slug);
}

export function getModule(id: string): Module | undefined {
  return moduleMap.get(id);
}

export function getProject(id: string): Project | undefined {
  return projectMap.get(id);
}

export function getProjectBySlug(slug: string): Project | undefined {
  return allProjects.find((p) => p.slug === slug);
}

export function getQuiz(id: string): Quiz | undefined {
  return quizMap.get(id);
}

export function getPhase(id: string): Phase | undefined {
  return phaseMap.get(id);
}

export function getModulesForPhase(phaseId: string): Module[] {
  return allModules.filter((m) => m.phaseId === phaseId);
}

export function getLessonsForModule(moduleId: string): Lesson[] {
  const mod = getModule(moduleId);
  if (!mod) return [];
  return mod.lessonIds
    .map((id) => lessonMap.get(id))
    .filter((l): l is Lesson => Boolean(l));
}

export function getProjectsForPhase(phaseId: string): Project[] {
  return allProjects.filter((p) => p.phaseId === phaseId);
}

export function getQuizzesForModule(moduleId: string): Quiz | undefined {
  const mod = getModule(moduleId);
  return mod?.quizId ? quizMap.get(mod.quizId) : undefined;
}

/** Global learning order across all three phases. */
export const orderedLessonIds: string[] = allModules.flatMap((m) => m.lessonIds);

export const lessonIndexInOrder = new Map(orderedLessonIds.map((id, i) => [id, i]));

export function getNextLessonId(currentId: string | null): string | null {
  if (!currentId) return orderedLessonIds[0] ?? null;
  const idx = lessonIndexInOrder.get(currentId);
  if (idx === undefined) return orderedLessonIds[0] ?? null;
  return orderedLessonIds[idx + 1] ?? null;
}

export function getRelatedLessons(lesson: Lesson): Lesson[] {
  const ids = new Set([...lesson.prerequisites, ...lesson.relatedTopics]);
  return [...ids]
    .map((id) => lessonMap.get(id))
    .filter((l): l is Lesson => Boolean(l));
}
