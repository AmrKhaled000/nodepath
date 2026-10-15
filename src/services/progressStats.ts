import type { DashboardStats, Lesson, UserProgress } from "@/types";
import {
  allLessons,
  allModules,
  allProjects,
  getLesson,
  getModule,
  getPhase,
  getProject,
  orderedLessonIds,
  phases,
} from "@/content";
import { computeStreak, formatMinutes } from "@/utils/dates";

export function isLessonCompleted(progress: UserProgress, lessonId: string): boolean {
  return Boolean(progress.completedLessons[lessonId]);
}

export function moduleProgress(progress: UserProgress, moduleId: string): {
  total: number;
  completed: number;
  percent: number;
} {
  const mod = getModule(moduleId);
  if (!mod) return { total: 0, completed: 0, percent: 0 };
  const completed = mod.lessonIds.filter((id) => progress.completedLessons[id]).length;
  return { total: mod.lessonIds.length, completed, percent: percent(completed, mod.lessonIds.length) };
}

export function phaseProgress(progress: UserProgress, phaseId: string): {
  total: number;
  completed: number;
  percent: number;
} {
  const ids = allModules.filter((m) => m.phaseId === phaseId).flatMap((m) => m.lessonIds);
  const completed = ids.filter((id) => progress.completedLessons[id]).length;
  return { total: ids.length, completed, percent: percent(completed, ids.length) };
}

function percent(done: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

/**
 * The next incomplete lesson in the global learning order.
 * Starts from the saved position when it is still incomplete.
 */
export function getNextIncompleteLessonId(progress: UserProgress): string | null {
  const start = progress.currentLessonId;
  if (start && !progress.completedLessons[start]) {
    const idx = orderedLessonIds.indexOf(start);
    if (idx >= 0) {
      const nextAfter = orderedLessonIds.slice(idx + 1).find((id) => !progress.completedLessons[id]);
      if (nextAfter) return nextAfter;
      // current one is the last incomplete — stay on it
      return start;
    }
  }
  return orderedLessonIds.find((id) => !progress.completedLessons[id]) ?? null;
}

function recentItems(progress: UserProgress): DashboardStats["recentlyStudied"] {
  const items: DashboardStats["recentlyStudied"] = [];
  for (const [id, completedAt] of Object.entries(progress.completedLessons)) {
    const lesson = getLesson(id);
    if (lesson) items.push({ id, title: lesson.title, type: "lesson", completedAt });
  }
  for (const [id, completedAt] of Object.entries(progress.completedProjects)) {
    const project = getProject(id);
    if (project) items.push({ id, title: project.title, type: "project", completedAt });
  }
  items.sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
  return items.slice(0, 6);
}

function streakDates(progress: UserProgress): string[] {
  const dates = new Set<string>();
  for (const iso of Object.values(progress.completedLessons)) dates.add(iso.slice(0, 10));
  for (const iso of Object.values(progress.completedProjects)) dates.add(iso.slice(0, 10));
  for (const result of Object.values(progress.quizResults)) dates.add(result.completedAt.slice(0, 10));
  for (const session of progress.studySessions) dates.add(session.date);
  return [...dates];
}

export function recommendedProjectId(progress: UserProgress): string | null {
  const open = allProjects
    .filter((p) => !progress.completedProjects[p.id])
    .sort((a, b) => {
      const pa = phases.find((x) => x.id === a.phaseId)?.order ?? 9;
      const pb = phases.find((x) => x.id === b.phaseId)?.order ?? 9;
      return pa !== pb ? pa - pb : a.estimatedHours - b.estimatedHours;
    });
  if (open.length === 0) return null;
  const knowledgeReady = open.find((p) => {
    const required = allLessons.filter((l) => (p.requiredKnowledge ?? []).includes(l.id));
    if (required.length === 0) return true;
    const known = required.filter((l) => progress.completedLessons[l.id]).length;
    return known / required.length >= 0.7;
  });
  return (knowledgeReady ?? open[0]).id;
}

export function computeDashboardStats(progress: UserProgress): DashboardStats {
  const totalLessons = orderedLessonIds.length;
  const completedLessons = orderedLessonIds.filter((id) => progress.completedLessons[id]).length;
  const remainingLessons = totalLessons - completedLessons;

  const phaseStats = phases.map((phase) => {
    const stats = phaseProgress(progress, phase.id);
    return { phaseId: phase.id, total: stats.total, completed: stats.completed, percent: stats.percent };
  });

  const nextId = getNextIncompleteLessonId(progress);
  const nextLesson = nextId ? getLesson(nextId) : undefined;

  const currentPhaseId =
    nextLesson?.phaseId ??
    phaseStats.find((p) => p.completed < p.total)?.phaseId ??
    null;

  const currentPhase = currentPhaseId ? getPhase(currentPhaseId) : undefined;

  const remainingMinutes = orderedLessonIds
    .map((id) => getLesson(id))
    .filter((l): l is Lesson => l !== undefined && !progress.completedLessons[l.id])
    .reduce((sum, l) => sum + l.estimatedMinutes, 0);

  const quizValues = Object.values(progress.quizResults);
  const averageQuizScore =
    quizValues.length === 0
      ? null
      : Math.round(
          (quizValues.reduce((sum, r) => sum + (r.total === 0 ? 0 : r.score / r.total), 0) /
            quizValues.length) *
            100,
        );

  return {
    totalLessons,
    completedLessons,
    remainingLessons,
    overallPercent: percent(completedLessons, totalLessons),
    phaseStats,
    currentPhaseId,
    currentPhaseTitle: currentPhase?.title ?? null,
    nextLessonId: nextId,
    nextLessonTitle: nextLesson?.title ?? null,
    recentlyStudied: recentItems(progress),
    streakDays: computeStreak(streakDates(progress)),
    totalStudyMinutes:
      progress.studySessions.reduce((sum, s) => sum + s.minutes, 0) +
      orderedLessonIds
        .filter((id) => progress.completedLessons[id])
        .reduce((sum, id) => sum + (getLesson(id)?.estimatedMinutes ?? 0), 0),
    estimatedRemainingMinutes: remainingMinutes,
    recommendedProjectId: recommendedProjectId(progress),
    completedProjects: Object.keys(progress.completedProjects).length,
    totalProjects: allProjects.length,
    averageQuizScore: averageQuizScore,
  };
}

export { percent, formatMinutes };
