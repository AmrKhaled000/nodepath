import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/utils";
import { getLesson, orderedLessonIds } from "@/content";
import { progressStore } from "@/services/progressStore";
import { STORAGE_KEYS, readJson } from "@/services/storage";
import type { UserProgress } from "@/types";

describe("lesson progress tracking", () => {
  it("marks a lesson complete and persists it", async () => {
    const user = userEvent.setup();
    const lesson = getLesson(orderedLessonIds[0])!;

    renderApp(`/lessons/${lesson.slug}`);
    await screen.findByRole("heading", { name: lesson.title }, { timeout: 5000 });

    expect(progressStore.getSnapshot().completedLessons[lesson.id]).toBeUndefined();
    await user.click(screen.getByTestId("mark-complete"));

    const stored = readJson<UserProgress>(STORAGE_KEYS.progress);
    expect(stored?.completedLessons[lesson.id]).toBeTruthy();
    expect(screen.getAllByText("Completed").length).toBeGreaterThan(0);
  });

  it("reflects completion on the dashboard after a reload", async () => {
    const user = userEvent.setup();
    const lesson = getLesson(orderedLessonIds[0])!;

    renderApp(`/lessons/${lesson.slug}`);
    await screen.findByRole("heading", { name: lesson.title });
    await user.click(screen.getByTestId("mark-complete"));

    // Simulate a full reload: fresh router reading the same localStorage.
    renderApp("/");
    expect(await screen.findByText("1 of 317 lessons")).toBeInTheDocument();
  });

  it("saves lesson notes with a debounce", async () => {
    const user = userEvent.setup();
    const lesson = getLesson(orderedLessonIds[1])!;

    renderApp(`/lessons/${lesson.slug}`);
    await screen.findByRole("heading", { name: lesson.title });

    const notes = screen.getByLabelText("Lesson notes");
    await user.type(notes, "remember the event loop phases");

    await waitFor(
      () => {
        expect(progressStore.getSnapshot().notes[lesson.id]).toContain("event loop phases");
      },
      { timeout: 3000 },
    );
  });

  it("toggles bookmarks from the lesson header", async () => {
    const user = userEvent.setup();
    const lesson = getLesson(orderedLessonIds[2])!;

    renderApp(`/lessons/${lesson.slug}`);
    await screen.findByRole("heading", { name: lesson.title });

    await user.click(screen.getByLabelText("Bookmark this lesson"));
    expect(progressStore.getSnapshot().bookmarks).toContain(lesson.id);
    expect(screen.getByLabelText("Remove bookmark")).toBeInTheDocument();
  });
});
