import type { Edge, Node } from "@xyflow/react";
import type { Lesson, PhaseId } from "@/types";
import { allModules, getLesson, phases } from "@/content";

export type LessonStatus = "completed" | "current" | "available" | "locked";

export interface LessonNodeData extends Record<string, unknown> {
  lessonId: string;
  title: string;
  minutes: number;
  difficulty: string;
  status: LessonStatus;
  moduleTitle: string;
  phaseOrder: number;
  tags: string[];
  dimmed?: boolean;
}

const NODE_W = 258;
const NODE_H = 92;
const COL_W = NODE_W + 64;
const ROW_H = NODE_H + 28;
const PHASE_GAP = 190;

export interface RoadmapGraph {
  nodes: Node<LessonNodeData>[];
  edges: Edge[];
  phaseBands: { phaseId: PhaseId; y: number; height: number; color: string; title: string }[];
}

export function lessonStatus(
  lesson: Lesson,
  completed: Record<string, unknown>,
  currentId: string | null,
): LessonStatus {
  if (completed[lesson.id]) return "completed";
  const allPrereqsDone = lesson.prerequisites.every((id) => completed[id]);
  if (currentId === lesson.id) return "current";
  if (!allPrereqsDone) return "locked";
  return "available";
}

export function buildRoadmap(
  completed: Record<string, unknown>,
  currentLessonId: string | null,
): RoadmapGraph {
  const nodes: Node<LessonNodeData>[] = [];
  const edges: Edge[] = [];
  const phaseBands: RoadmapGraph["phaseBands"] = [];

  let yCursor = 0;

  for (const phase of phases) {
    const modules = allModules.filter((m) => m.phaseId === phase.id);
    let phaseHeight = 0;

    modules.forEach((mod, moduleIndexInPhase) => {
      const lessons = mod.lessonIds
        .map((id) => getLesson(id))
        .filter((l): l is Lesson => Boolean(l));
      const x = 40 + moduleIndexInPhase * COL_W;
      const phaseY = yCursor + 70;

      lessons.forEach((lesson, rowIndex) => {
        const y = phaseY + rowIndex * ROW_H;
        phaseHeight = Math.max(phaseHeight, y - yCursor + NODE_H);
        nodes.push({
          id: lesson.id,
          type: "lesson",
          position: { x, y },
          data: {
            lessonId: lesson.id,
            title: lesson.title,
            minutes: lesson.estimatedMinutes,
            difficulty: lesson.difficulty,
            status: lessonStatus(lesson, completed, currentLessonId),
            moduleTitle: mod.title,
            phaseOrder: phase.order,
            tags: lesson.tags.slice(0, 3),
          },
          width: NODE_W,
          height: NODE_H,
        });

        // sequential edge inside the module
        const prev = lessons[rowIndex - 1];
        if (prev) {
          edges.push({
            id: `seq-${prev.id}-${lesson.id}`,
            source: prev.id,
            target: lesson.id,
            type: "smoothstep",
          });
        }
      });
    });

    // link the first lesson of this phase to the last lesson of the previous phase
    if (phase.order > 1) {
      const firstMod = modules[0];
      const firstLessonId = firstMod?.lessonIds[0];
      const prevPhaseModules = allModules.filter((m) => {
        const prev = phases.find((p) => p.order === phase.order - 1);
        return prev && m.phaseId === prev.id;
      });
      const lastModule = prevPhaseModules[prevPhaseModules.length - 1];
      const lastLessonId = lastModule?.lessonIds[lastModule.lessonIds.length - 1];
      if (firstLessonId && lastLessonId) {
        edges.push({
          id: `phase-${lastLessonId}-${firstLessonId}`,
          source: lastLessonId,
          target: firstLessonId,
          type: "smoothstep",
          style: { stroke: phase.accent, strokeWidth: 2.5 },
        });
      }
    }

    phaseBands.push({
      phaseId: phase.id,
      y: yCursor,
      height: Math.max(phaseHeight + 40, 260),
      color: phase.accent,
      title: `Phase ${phase.order} — ${phase.title}`,
    });

    yCursor += Math.max(phaseHeight + 40, 260) + PHASE_GAP;
  }

  return { nodes, edges, phaseBands };
}

/** Prerequisite edges (optional layer). */
export function buildPrerequisiteEdges(completed: Record<string, unknown>): Edge[] {
  const edges: Edge[] = [];
  for (const module of allModules) {
    for (const id of module.lessonIds) {
      const lesson = getLesson(id);
      if (!lesson) continue;
      for (const prereq of lesson.prerequisites) {
        if (!getLesson(prereq)) continue;
        const isSequential =
          module.lessonIds.indexOf(prereq) === module.lessonIds.indexOf(id) - 1;
        if (isSequential) continue;
        edges.push({
          id: `prereq-${prereq}-${id}`,
          source: prereq,
          target: id,
          type: "default",
          animated: !completed[id] && Boolean(completed[prereq]),
          style: { stroke: "var(--border-strong)", strokeDasharray: "5 4", opacity: 0.7 },
        });
      }
    }
  }
  return edges;
}

export const statusLabel: Record<LessonStatus, string> = {
  completed: "Completed",
  current: "Continue here",
  available: "Ready to start",
  locked: "Locked — finish prerequisites first",
};
