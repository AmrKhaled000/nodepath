import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/utils";
import { allModules, getLesson, orderedLessonIds } from "@/content";

describe("app navigation", () => {
  it("renders the dashboard at /", async () => {
    renderApp("/");
    expect(
      await screen.findByRole("heading", { name: /good (morning|afternoon|evening)/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Continue learning").length).toBeGreaterThan(0);
    expect(screen.getByText("Phase progress")).toBeInTheDocument();
  });

  it("navigates to the roadmap from the sidebar", async () => {
    const user = userEvent.setup();
    renderApp("/");
    await screen.findByRole("heading", { name: /good/i });
    const roadmapLinks = await screen.findAllByRole("link", { name: /interactive roadmap/i });
    await user.click(roadmapLinks[0]);
    expect(await screen.findByRole("heading", { name: "Learning roadmap" })).toBeInTheDocument();
  });

  it("deep-links to a phase page", async () => {
    renderApp("/phases/phase-2");
    expect(await screen.findByRole("heading", { name: /phase 2/i })).toBeInTheDocument();
    expect(screen.getAllByTestId(/module-card-p2-m1/).length).toBeGreaterThan(0);
  });

  it("deep-links to a lesson page with all core sections", async () => {
    const lesson = getLesson(orderedLessonIds[0])!;
    renderApp(`/lessons/${lesson.slug}`);
    expect(await screen.findByRole("heading", { name: lesson.title })).toBeInTheDocument();
    expect(screen.getAllByText("Learning objectives").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Simple explanation").length).toBeGreaterThan(0);
    expect(screen.getByTestId("mark-complete")).toBeInTheDocument();
    expect(screen.getAllByTestId("resource-card").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("exercise-card").length).toBeGreaterThan(0);
  });

  it("shows the 404 page for unknown routes", async () => {
    renderApp("/nope/not-here");
    expect(await screen.findByText("404 — page not found")).toBeInTheDocument();
  });

  it("lists phase modules on the phase page", async () => {
    renderApp("/phases/phase-1");
    await screen.findByRole("heading", { name: /phase 1/i });
    for (const mod of allModules.filter((m) => m.phaseId === "phase-1")) {
      expect(screen.getByTestId(`module-card-${mod.id}`)).toBeInTheDocument();
    }
  });
});
