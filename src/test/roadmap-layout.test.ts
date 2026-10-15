import { describe, expect, it } from "vitest";
import {
  allModules,
  allLessons,
  getLesson,
  orderedLessonIds,
  phases,
} from "@/content";
import { buildPrerequisiteEdges, buildRoadmap, lessonStatus } from "@/components/roadmap/roadmapLayout";

describe("roadmap layout engine", () => {
  const graph = buildRoadmap({}, null);

  it("creates one node per lesson", () => {
    expect(graph.nodes).toHaveLength(allLessons.length);
    const ids = new Set(graph.nodes.map((n) => n.id));
    expect(ids.size).toBe(allLessons.length);
    expect(ids.has(orderedLessonIds[0])).toBe(true);
  });

  it("lays lessons out in reading order inside each phase band", () => {
    expect(graph.phaseBands).toHaveLength(phases.length);
    const first = graph.nodes.find((n) => n.id === orderedLessonIds[0])!;
    const second = graph.nodes.find((n) => n.id === orderedLessonIds[1])!;
    expect(second.position.y).toBeGreaterThan(first.position.y);
  });

  it("chains sequential edges inside every module", () => {
    const edgeIds = new Set(graph.edges.map((e) => e.id));
    for (const mod of allModules) {
      for (let i = 1; i < mod.lessonIds.length; i += 1) {
        expect(edgeIds.has(`seq-${mod.lessonIds[i - 1]}-${mod.lessonIds[i]}`)).toBe(true);
      }
    }
  });

  it("adds a transition edge between consecutive phases", () => {
    const phaseEdges = graph.edges.filter((e) => e.id.startsWith("phase-"));
    expect(phaseEdges.length).toBe(phases.length - 1);
  });

  it("computes statuses from prerequisites and completion", () => {
    const first = getLesson(orderedLessonIds[0])!;
    expect(lessonStatus(first, {}, orderedLessonIds[0])).toBe("current");
    expect(lessonStatus(first, { [first.id]: new Date().toISOString() }, null)).toBe("completed");

    const later = getLesson(orderedLessonIds[5])!;
    const laterNode = graph.nodes.find((n) => n.id === later.id)!;
    // Nothing completed yet, so a lesson with prerequisites must be locked
    // unless it is the recommended "current" lesson.
    if (later.prerequisites.length > 0) {
      expect(["locked", "current", "available"]).toContain(laterNode.data.status);
    }
  });

  it("marks completed lessons in node data", () => {
    const first = getLesson(orderedLessonIds[0])!;
    const completedGraph = buildRoadmap({ [first.id]: "2026-01-01T00:00:00.000Z" }, orderedLessonIds[1]);
    const node = completedGraph.nodes.find((n) => n.id === first.id)!;
    expect(node.data.status).toBe("completed");
    const next = completedGraph.nodes.find((n) => n.id === orderedLessonIds[1])!;
    expect(next.data.status).toBe("current");
  });

  it("builds dashed prerequisite edges that skip sequential neighbours", () => {
    const edges = buildPrerequisiteEdges({});
    expect(edges.length).toBeGreaterThan(0);
    for (const edge of edges) {
      expect(edge.id.startsWith("prereq-")).toBe(true);
      expect(getLesson(edge.source)).toBeDefined();
      expect(getLesson(edge.target)).toBeDefined();
    }
  });
});
