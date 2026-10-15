import type { SkillLevel, UserPreferences, UserProgress } from "@/types";
import { allLessons, allProjects, getLesson, getModule, getPhase, phases } from "@/content";
import { addDays, formatMinutes, startOfWeek } from "@/utils/dates";
import { getNextIncompleteLessonId } from "./progressStats";

export interface PlanDay {
  date: string;
  /** 0 = Sunday */
  weekday: number;
  minutes: number;
  items: PlanItem[];
  kind: "study" | "project" | "revision" | "rest";
}

export interface PlanItem {
  type: "lesson" | "project" | "revision" | "quiz";
  id: string;
  title: string;
  minutes: number;
  path: string;
  done: boolean;
}

export interface StudyPlan {
  generatedAt: string;
  horizonWeeks: number;
  dailyMinutes: number;
  studyDays: number[];
  /** Remaining workload at generation time. */
  remainingMinutes: number;
  projectMinutes: number;
  /** Minutes actually scheduled across the horizon. */
  scheduledMinutes: number;
  /** Unscheduled overflow past the horizon (honesty: plan may need more time). */
  overflowMinutes: number;
  weeks: PlanDay[][];
  notes: string[];
}

const levelFactor: Record<SkillLevel, number> = {
  new: 1,
  "some-js": 0.9,
  "beginner-backend": 0.78,
  intermediate: 0.65,
};

export function buildStudyPlan(progress: UserProgress): StudyPlan {
  const prefs: UserPreferences = progress.preferences;
  const factor = levelFactor[prefs.skillLevel] ?? 1;

  const openLessons = allLessons
    .filter((l) => !progress.completedLessons[l.id])
    .sort((a, b) => {
      const pa = phases.find((p) => p.id === a.phaseId)?.order ?? 9;
      const pb = phases.find((p) => p.id === b.phaseId)?.order ?? 9;
      if (pa !== pb) return pa - pb;
      const ma = getModule(a.moduleId)?.order ?? 99;
      const mb = getModule(b.moduleId)?.order ?? 99;
      if (ma !== mb) return ma - mb;
      return a.order - b.order;
    })
    .map((l) => ({
      type: "lesson" as const,
      id: l.id,
      title: l.title,
      minutes: Math.max(8, Math.round(l.estimatedMinutes * factor)),
      path: `/lessons/${l.slug}`,
      done: false,
    }));

  const openProjects = allProjects
    .filter((p) => !progress.completedProjects[p.id])
    .sort((a, b) => a.estimatedHours - b.estimatedHours)
    .map((p) => ({
      type: "project" as const,
      id: p.id,
      title: p.title,
      minutes: Math.round(p.estimatedHours * 60 * (0.9 + factor * 0.3)),
      path: `/projects/${p.slug}`,
      done: false,
    }));

  const lessonsMinutes = openLessons.reduce((sum, l) => sum + l.minutes, 0);
  const projectMinutes = openProjects.reduce((sum, p) => sum + p.minutes, 0);
  const revisionMinutes = Math.round(lessonsMinutes * 0.08);
  const remainingMinutes = lessonsMinutes + projectMinutes + revisionMinutes;

  const weeksCount = Math.max(1, Math.min(104, prefs.targetWeeks));
  const studyDays = prefs.studyDays.length > 0 ? prefs.studyDays : [1, 3, 5];
  const dailyMinutes = Math.max(15, prefs.dailyStudyMinutes);

  const start = startOfWeek(new Date(), 1);
  const weeks: PlanDay[][] = [];
  const notes: string[] = [];

  // Queues: lessons are scheduled first; projects get explicit sessions interleaved
  const lessonQueue = [...openLessons];
  const projectQueue = [...openProjects];

  // Interleave a project session every Nth study day so projects are not deferred forever
  let studyDayIndex = 0;
  let scheduledMinutes = 0;

  for (let w = 0; w < weeksCount; w++) {
    const week: PlanDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      const iso = date.toISOString().slice(0, 10);
      const weekday = date.getDay();
      const isStudyDay = studyDays.includes(weekday);

      if (!isStudyDay) {
        week.push({ date: iso, weekday, minutes: 0, items: [], kind: "rest" });
        continue;
      }

      const items: PlanItem[] = [];
      let budget = dailyMinutes;
      studyDayIndex += 1;

      // revision slot: last study day of every week
      const lastStudyDay = [...studyDays].sort((a, b) => a - b).at(-1);
      const isLastStudyDayOfWeek = weekday === lastStudyDay;

      const wantProjectSession =
        projectQueue.length > 0 && (studyDayIndex % 4 === 0 || lessonQueue.length === 0);

      if (wantProjectSession) {
        const nextProject = projectQueue[0];
        const chunk = Math.min(nextProject.minutes, Math.max(budget, Math.round(dailyMinutes * 0.6)));
        items.push({ ...nextProject, minutes: chunk });
        budget -= chunk;
        scheduledMinutes += chunk;
        nextProject.minutes -= chunk;
        if (nextProject.minutes <= 0) projectQueue.shift();
      }

      while (budget > 5 && lessonQueue.length > 0) {
        const next = lessonQueue[0];
        const chunk = Math.min(next.minutes, budget);
        items.push({ ...next, minutes: chunk });
        budget -= chunk;
        scheduledMinutes += chunk;
        next.minutes -= chunk;
        if (next.minutes <= 0) lessonQueue.shift();
      }

      if (isLastStudyDayOfWeek && budget > 15) {
        items.push({
          type: "revision",
          id: `revision-w${w}`,
          title: "Revision: revisit one difficult topic and redo one exercise",
          minutes: Math.min(budget, 25),
          path: "/roadmap",
          done: false,
        });
        scheduledMinutes += Math.min(budget, 25);
      }

      if (items.length === 0) {
        week.push({ date: iso, weekday, minutes: 0, items: [], kind: "rest" });
      } else {
        week.push({
          date: iso,
          weekday,
          minutes: items.reduce((sum, i) => sum + i.minutes, 0),
          items,
          kind: items.some((i) => i.type === "project") ? "project" : "study",
        });
      }
    }
    weeks.push(week);
  }

  const overflowMinutes =
    lessonQueue.reduce((s, l) => s + l.minutes, 0) + projectQueue.reduce((s, p) => s + p.minutes, 0);

  const weeklyCapacity = dailyMinutes * studyDays.length * 7;
  const nextLessonId = getNextIncompleteLessonId(progress);
  const nextLesson = nextLessonId ? getLesson(nextLessonId) : undefined;

  if (overflowMinutes > 0) {
    notes.push(
      `At ${formatMinutes(dailyMinutes)} per study day, the remaining material does not fit in ${weeksCount} weeks. Increase weekly availability, reduce daily minutes targets, or extend the target period — the plan is an estimate, not a promise.`,
    );
  } else {
    notes.push(
      `The remaining curriculum fits inside ${weeksCount} weeks at your current availability, with room to spare.`,
    );
  }
  if (weeklyCapacity > 0 && remainingMinutes > 0) {
    const estimatedWeeks = Math.ceil(remainingMinutes / weeklyCapacity);
    notes.push(`Estimated time to finish everything: about ${estimatedWeeks} week${estimatedWeeks === 1 ? "" : "s"} at your current pace.`);
  }
  if (nextLesson) {
    notes.push(
      `Next lesson in order: “${nextLesson.title}” (${getPhase(nextLesson.phaseId)?.title ?? ""}).`,
    );
  }
  notes.push("Sessions you fall behind on can be rescheduled — recalculate after marking sessions complete.");

  return {
    generatedAt: new Date().toISOString(),
    horizonWeeks: weeksCount,
    dailyMinutes,
    studyDays,
    remainingMinutes,
    projectMinutes,
    scheduledMinutes,
    overflowMinutes,
    weeks,
    notes,
  };
}
