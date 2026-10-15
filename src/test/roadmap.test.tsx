import { describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/utils";
import { getLesson, orderedLessonIds } from "@/content";
import { progressStore } from "@/services/progressStore";

// jsdom is forced to a narrow viewport in vitest.setup.ts, so the roadmap
// renders its accessible list view. The graph engine itself is covered by
// src/test/roadmap-layout.test.ts.

describe("interactive roadmap (list view)", () => {
  it("renders the roadmap with lesson rows", async () => {
    renderApp("/roadmap");
    expect(await screen.findByRole("heading", { name: "Learning roadmap" })).toBeInTheDocument();
    const first = getLesson(orderedLessonIds[0])!;
    expect(await screen.findByTestId(`roadmap-row-${first.id}`)).toBeInTheDocument();
  });

  it("filters rows with the topic filter", async () => {
    const user = userEvent.setup();
    renderApp("/roadmap");
    await screen.findByRole("heading", { name: "Learning roadmap" });

    const target = getLesson(orderedLessonIds[0])!;
    expect(await screen.findByTestId(`roadmap-row-${target.id}`)).toBeInTheDocument();

    await user.type(screen.getByLabelText("Filter roadmap topics"), target.title);
    expect(await screen.findByTestId(`roadmap-row-${target.id}`)).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Filter roadmap topics"));
    await user.type(screen.getByLabelText("Filter roadmap topics"), "zzzz-no-such-topic");
    await waitForRowCount(0);
  });

  it("opens a lesson detail panel from a row", async () => {
    const user = userEvent.setup();
    renderApp("/roadmap");
    await screen.findByRole("heading", { name: "Learning roadmap" });

    const lesson = getLesson(orderedLessonIds[3])!;
    await user.click(await screen.findByTestId(`roadmap-row-${lesson.id}`));
    const panel = await screen.findByTestId("roadmap-detail");
    expect(panel).toHaveTextContent(lesson.title);
  });

  it("marks a lesson complete from the detail panel", async () => {
    const user = userEvent.setup();
    renderApp("/roadmap");
    await screen.findByRole("heading", { name: "Learning roadmap" });

    const lesson = getLesson(orderedLessonIds[0])!;
    await user.click(await screen.findByTestId(`roadmap-row-${lesson.id}`));
    const panel = await screen.findByTestId("roadmap-detail");

    await user.click(within(panel).getByRole("button", { name: "Mark complete" }));
    expect(progressStore.getSnapshot().completedLessons[lesson.id]).toBeTruthy();
    expect(within(panel).getByRole("button", { name: "Mark as not done" })).toBeInTheDocument();
  });
});

async function waitForRowCount(expected: number): Promise<void> {
  await waitFor(() => {
    expect(screen.queryAllByTestId(/^roadmap-row-/).length).toBe(expected);
  });
}
