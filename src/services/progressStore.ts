import { useSyncExternalStore } from "react";
import type { QuizResult, UserPreferences, UserProgress } from "@/types";
import { STORAGE_KEYS, readJson, writeJson } from "./storage";

export const defaultPreferences: UserPreferences = {
  theme: "dark",
  language: "en",
  dailyStudyMinutes: 90,
  targetWeeks: 24,
  skillLevel: "new",
  studyDays: [1, 2, 3, 4, 5],
  preferArabicResources: false,
};

function defaultProgress(): UserProgress {
  return {
    version: 1,
    completedLessons: {},
    completedProjects: {},
    projectChecklist: {},
    quizResults: {},
    bookmarks: [],
    notes: {},
    studySessions: [],
    preferences: { ...defaultPreferences },
    currentLessonId: null,
    updatedAt: new Date().toISOString(),
  };
}

function migrate(raw: unknown): UserProgress {
  const fallback = defaultProgress();
  if (!raw || typeof raw !== "object") return fallback;
  const data = raw as Partial<UserProgress>;
  if (data.version !== 1) return fallback;
  return {
    ...fallback,
    ...data,
    completedLessons: data.completedLessons ?? {},
    completedProjects: data.completedProjects ?? {},
    projectChecklist: data.projectChecklist ?? {},
    quizResults: data.quizResults ?? {},
    bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
    notes: data.notes ?? {},
    studySessions: Array.isArray(data.studySessions) ? data.studySessions : [],
    preferences: { ...fallback.preferences, ...(data.preferences ?? {}) },
    updatedAt: data.updatedAt ?? fallback.updatedAt,
  };
}

function loadState(): UserProgress {
  const raw = readJson<unknown>(STORAGE_KEYS.progress);
  return migrate(raw);
}

let state: UserProgress = loadState();
const listeners = new Set<() => void>();

function commit(next: UserProgress): void {
  state = { ...next, updatedAt: new Date().toISOString() };
  writeJson(STORAGE_KEYS.progress, state);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): UserProgress {
  return state;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function withSession(next: UserProgress, minutes: number, note?: string): UserProgress {
  const date = today();
  const sessions = [...next.studySessions];
  const existing = sessions.findIndex((s) => s.date === date);
  if (existing >= 0) {
    sessions[existing] = {
      ...sessions[existing],
      minutes: sessions[existing].minutes + minutes,
      ...(note ? { note } : sessions[existing].note ? { note: sessions[existing].note } : {}),
    };
  } else {
    sessions.push(note ? { date, minutes, note } : { date, minutes });
  }
  return { ...next, studySessions: sessions };
}

export const progressStore = {
  subscribe,
  getSnapshot,

  reset(): void {
    commit(defaultProgress());
  },

  setLessonCompleted(lessonId: string, completed: boolean): void {
    const completedLessons = { ...state.completedLessons };
    if (completed) {
      completedLessons[lessonId] = new Date().toISOString();
    } else {
      delete completedLessons[lessonId];
    }
    commit({ ...state, completedLessons, currentLessonId: lessonId });
  },

  toggleLesson(lessonId: string): void {
    progressStore.setLessonCompleted(lessonId, !state.completedLessons[lessonId]);
  },

  setCurrentLesson(lessonId: string | null): void {
    if (state.currentLessonId === lessonId) return;
    commit({ ...state, currentLessonId: lessonId });
  },

  setProjectCompleted(projectId: string, completed: boolean): void {
    const completedProjects = { ...state.completedProjects };
    if (completed) {
      completedProjects[projectId] = new Date().toISOString();
      const checklist = { ...(state.projectChecklist[projectId] ?? {}) };
      const project = state.projectChecklist[projectId];
      if (project) {
        for (const key of Object.keys(checklist)) checklist[key] = true;
      }
      commit({ ...state, completedProjects, projectChecklist: { ...state.projectChecklist, [projectId]: checklist } });
      return;
    }
    delete completedProjects[projectId];
    commit({ ...state, completedProjects });
  },

  toggleProject(projectId: string): void {
    progressStore.setProjectCompleted(projectId, !state.completedProjects[projectId]);
  },

  setChecklistItem(projectId: string, taskKey: string, checked: boolean): void {
    const existing = state.projectChecklist[projectId] ?? {};
    const next = { ...existing, [taskKey]: checked };
    if (!checked) delete next[taskKey];
    commit({ ...state, projectChecklist: { ...state.projectChecklist, [projectId]: next } });
  },

  saveQuizResult(result: Omit<QuizResult, "attempts" | "completedAt">): void {
    const previous = state.quizResults[result.quizId];
    const next: QuizResult = {
      ...result,
      attempts: (previous?.attempts ?? 0) + 1,
      completedAt: new Date().toISOString(),
    };
    commit({ ...state, quizResults: { ...state.quizResults, [result.quizId]: next } });
  },

  toggleBookmark(id: string): void {
    const bookmarks = state.bookmarks.includes(id)
      ? state.bookmarks.filter((b) => b !== id)
      : [...state.bookmarks, id];
    commit({ ...state, bookmarks });
  },

  setNote(lessonId: string, note: string): void {
    const notes = { ...state.notes };
    if (note.trim() === "") delete notes[lessonId];
    else notes[lessonId] = note;
    commit({ ...state, notes });
  },

  addStudySession(minutes: number, note?: string): void {
    commit(withSession(state, minutes, note));
  },

  setPreferences(patch: Partial<UserPreferences>): void {
    commit({ ...state, preferences: { ...state.preferences, ...patch } });
  },

  /** Test/dev helper: replace whole state (used by import). */
  importState(raw: unknown): void {
    commit(migrate(raw));
  },
};

export function useProgress(): UserProgress {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function exportState(): string {
  return JSON.stringify(getSnapshot(), null, 2);
}
