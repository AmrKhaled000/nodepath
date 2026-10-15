export type ThemePreference = "dark" | "light";

export type LanguagePreference = "en" | "ar";

export type SkillLevel = "new" | "some-js" | "beginner-backend" | "intermediate";

export interface QuizResult {
  quizId: string;
  score: number;
  total: number;
  correctIds: string[];
  wrongIds: string[];
  completedAt: string;
  attempts: number;
}

export interface StudySession {
  /** ISO date (yyyy-mm-dd). */
  date: string;
  minutes: number;
  note?: string;
}

export interface UserPreferences {
  theme: ThemePreference;
  language: LanguagePreference;
  dailyStudyMinutes: number;
  targetWeeks: number;
  skillLevel: SkillLevel;
  /** 0–6, 0 = Sunday. */
  studyDays: number[];
  /** Prefer Arabic-language resources in search/lesson filters. */
  preferArabicResources: boolean;
}

export interface ChecklistState {
  /** `${milestoneIndex}-${taskIndex}` -> completed */
  [taskKey: string]: boolean;
}

export interface UserProgress {
  version: 1;
  /** lessonId -> ISO timestamp completed */
  completedLessons: Record<string, string>;
  /** projectId -> ISO timestamp marked complete */
  completedProjects: Record<string, string>;
  /** projectId -> checklist */
  projectChecklist: Record<string, ChecklistState>;
  /** quizId -> latest result (+ attempts count) */
  quizResults: Record<string, QuizResult>;
  /** lesson or project ids */
  bookmarks: string[];
  /** lessonId -> markdown/plain notes */
  notes: Record<string, string>;
  studySessions: StudySession[];
  preferences: UserPreferences;
  /** The lesson the user should continue from. */
  currentLessonId: string | null;
  updatedAt: string;
}

export interface DashboardStats {
  totalLessons: number;
  completedLessons: number;
  remainingLessons: number;
  overallPercent: number;
  phaseStats: {
    phaseId: string;
    total: number;
    completed: number;
    percent: number;
  }[];
  currentPhaseId: string | null;
  currentPhaseTitle: string | null;
  nextLessonId: string | null;
  nextLessonTitle: string | null;
  recentlyStudied: { id: string; title: string; type: "lesson" | "project"; completedAt: string }[];
  streakDays: number;
  totalStudyMinutes: number;
  estimatedRemainingMinutes: number;
  recommendedProjectId: string | null;
  completedProjects: number;
  totalProjects: number;
  averageQuizScore: number | null;
}
