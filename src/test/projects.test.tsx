import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/utils";
import { allProjects, getProject } from "@/content";
import { progressStore } from "@/services/progressStore";

const project = getProject("p1-calculator")!;

describe("project library", () => {
  it("lists projects with filters", async () => {
    renderApp("/projects");
    expect(await screen.findByRole("heading", { name: "Project library" })).toBeInTheDocument();
    expect(screen.getAllByTestId("project-card").length).toBe(allProjects.length);

    const user = userEvent.setup();
    const phaseSelect = screen.getByLabelText("Filter by phase");
    await user.selectOptions(phaseSelect, "phase-3");
    const cards = screen.getAllByTestId("project-card");
    expect(cards.length).toBe(allProjects.filter((p) => p.phaseId === "phase-3").length);
    expect(cards.length).toBeLessThan(allProjects.length);
  });

  it("shows milestones, endpoints and checklists on a project page", async () => {
    renderApp(`/projects/${project.slug}`);
    expect(await screen.findByRole("heading", { name: project.title })).toBeInTheDocument();
    expect(screen.getByText("Milestones & checklist")).toBeInTheDocument();
    expect(screen.getByText("Acceptance criteria")).toBeInTheDocument();
    expect(screen.getByText("Suggested structure")).toBeInTheDocument();
    expect(screen.getAllByTestId("task-0-0").length).toBe(1);
  });

  it("persists checklist ticks and marks the project complete", async () => {
    const user = userEvent.setup();
    renderApp(`/projects/${project.slug}`);
    await screen.findByRole("heading", { name: project.title });

    await user.click(screen.getByTestId("task-0-0").querySelector("input")!);
    expect(progressStore.getSnapshot().projectChecklist[project.id]?.["0-0"]).toBe(true);

    await user.click(screen.getByTestId("project-mark-complete"));
    expect(progressStore.getSnapshot().completedProjects[project.id]).toBeTruthy();
    // All previously known checklist keys are completed when the project is marked done.
    const checklist = progressStore.getSnapshot().projectChecklist[project.id] ?? {};
    expect(checklist["0-0"]).toBe(true);
  });

  it("renders API endpoints with method badges when present", async () => {
    const apiProject = getProject("p2-task-api")!;
    renderApp(`/projects/${apiProject.slug}`);
    await screen.findByRole("heading", { name: apiProject.title });
    const rows = screen.getAllByTestId("endpoint-row");
    expect(rows.length).toBeGreaterThan(0);
    expect(within(rows[0]).getByText(/GET|POST|PUT|PATCH|DELETE/)).toBeInTheDocument();
  });
});
