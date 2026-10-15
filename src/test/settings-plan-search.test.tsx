import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/utils";
import { getLesson, orderedLessonIds } from "@/content";
import { progressStore } from "@/services/progressStore";
import { buildStudyPlan } from "@/services/studyPlan";
import { buildSearchIndex, searchDocs, defaultSearchFilters } from "@/services/search";

describe("settings page", () => {
  it("switches the theme to light and persists it", async () => {
    const user = userEvent.setup();
    renderApp("/settings");
    await screen.findByRole("heading", { name: "Settings" });

    await user.click(screen.getByTestId("theme-light"));
    expect(progressStore.getSnapshot().preferences.theme).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("exports progress JSON and offers reset with confirmation", async () => {
    const user = userEvent.setup();
    const lesson = getLesson(orderedLessonIds[0])!;
    progressStore.setLessonCompleted(lesson.id, true);

    renderApp("/settings");
    await screen.findByRole("heading", { name: "Settings" });

    expect(screen.getByTestId("export-progress")).toBeInTheDocument();
    await user.click(screen.getByTestId("reset-progress"));
    await user.click(screen.getByTestId("confirm-reset"));
    expect(progressStore.getSnapshot().completedLessons[lesson.id]).toBeUndefined();
  });
});

describe("study plan service", () => {
  it("schedules remaining lessons inside the horizon", () => {
    const plan = buildStudyPlan(progressStore.getSnapshot());
    expect(plan.weeks.length).toBe(plan.horizonWeeks);
    expect(plan.remainingMinutes).toBeGreaterThan(0);
    expect(plan.notes.length).toBeGreaterThan(0);
    const scheduledItems = plan.weeks.flat().flatMap((day) => day.items);
    expect(scheduledItems.length).toBeGreaterThan(0);
    expect(scheduledItems.some((item) => item.type === "lesson")).toBe(true);
  });
});

describe("search service", () => {
  it("indexes lessons, projects, quizzes and resources", () => {
    const docs = buildSearchIndex();
    expect(docs.length).toBeGreaterThan(350);
    expect(docs.some((d) => d.type === "lesson")).toBe(true);
    expect(docs.some((d) => d.type === "project")).toBe(true);
    expect(docs.some((d) => d.type === "resource")).toBe(true);
    expect(docs.some((d) => d.type === "exercise")).toBe(true);
  });

  it("finds the event loop lesson by keyword", () => {
    const results = searchDocs("event loop", {
      ...defaultSearchFilters,
      completedIds: {},
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => /event.?loop/i.test(r.doc.title))).toBe(true);
  });

  it("respects phase filters", () => {
    const results = searchDocs("api", {
      ...defaultSearchFilters,
      phaseId: "phase-1",
      completedIds: {},
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.doc.phaseId === "phase-1" || r.doc.phaseId === null)).toBe(true);
  });
});
