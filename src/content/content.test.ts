import { describe, expect, it } from "vitest";
import {
  allLessons,
  allModules,
  allProjects,
  allQuizzes,
  getLesson,
  getModule,
  getPhase,
  getProject,
  getQuiz,
  orderedLessonIds,
  phases,
} from "@/content";
import type { QuizQuestion, Resource } from "@/types";

function allResources(): Resource[] {
  const list: Resource[] = [];
  for (const lesson of allLessons) list.push(...lesson.resources);
  for (const project of allProjects) list.push(...project.referenceLinks);
  return list;
}

describe("curriculum shape", () => {
  it("has exactly 3 phases, 18 modules, 317 lessons, 18 quizzes and 20 projects", () => {
    expect(phases).toHaveLength(3);
    expect(allModules).toHaveLength(18);
    expect(allLessons).toHaveLength(317);
    expect(allQuizzes).toHaveLength(18);
    expect(allProjects).toHaveLength(20);
    expect(orderedLessonIds).toHaveLength(317);
  });

  it("orders phases 1..3 and keeps every module inside a real phase", () => {
    expect(phases.map((p) => p.order)).toEqual([1, 2, 3]);
    for (const mod of allModules) {
      expect(getPhase(mod.phaseId), `module ${mod.id}`).toBeDefined();
      expect(phases.some((p) => p.id === mod.phaseId)).toBe(true);
    }
  });

  it("keeps every lesson inside a real module of the same phase", () => {
    for (const lesson of allLessons) {
      const mod = getModule(lesson.moduleId);
      expect(mod, `lesson ${lesson.id} → module ${lesson.moduleId}`).toBeDefined();
      expect(mod!.lessonIds).toContain(lesson.id);
      expect(mod!.phaseId).toBe(lesson.phaseId);
    }
  });

  it("exposes unique ids and slugs everywhere", () => {
    const lessonIds = new Set<string>();
    const lessonSlugs = new Set<string>();
    for (const lesson of allLessons) {
      expect(lessonIds.has(lesson.id), `duplicate lesson id ${lesson.id}`).toBe(false);
      expect(lessonSlugs.has(lesson.slug), `duplicate lesson slug ${lesson.slug}`).toBe(false);
      lessonIds.add(lesson.id);
      lessonSlugs.add(lesson.slug);
    }

    const projectSlugs = new Set<string>();
    for (const project of allProjects) {
      expect(projectSlugs.has(project.slug), `duplicate project slug ${project.slug}`).toBe(false);
      projectSlugs.add(project.slug);
    }

    expect(new Set(allModules.map((m) => m.id)).size).toBe(allModules.length);
    expect(new Set(allQuizzes.map((q) => q.id)).size).toBe(allQuizzes.length);
    expect(new Set(allProjects.map((p) => p.id)).size).toBe(allProjects.length);
  });

  it("resolves every prerequisite and related topic", () => {
    for (const lesson of allLessons) {
      for (const id of lesson.prerequisites) {
        expect(getLesson(id), `${lesson.id} prerequisite ${id}`).toBeDefined();
      }
      for (const id of lesson.relatedTopics) {
        expect(getLesson(id), `${lesson.id} related ${id}`).toBeDefined();
      }
      expect(lesson.prerequisites).not.toContain(lesson.id);
      expect(lesson.relatedTopics).not.toContain(lesson.id);
    }
  });

  it("resolves every lesson→project and project→lesson link", () => {
    for (const lesson of allLessons) {
      for (const id of lesson.projectIds) {
        expect(getProject(id), `${lesson.id} project ${id}`).toBeDefined();
      }
    }
    for (const project of allProjects) {
      for (const id of project.relatedLessonIds ?? []) {
        expect(getLesson(id), `${project.id} lesson ${id}`).toBeDefined();
      }
      for (const link of project.referenceLinks) {
        expect(link.title.length).toBeGreaterThan(0);
      }
    }
  });

  it("gives every module a quiz wired to that module", () => {
    for (const mod of allModules) {
      expect(mod.quizId, `module ${mod.id} missing quiz`).toBeDefined();
      const quiz = getQuiz(mod.quizId!);
      expect(quiz, `quiz ${mod.quizId}`).toBeDefined();
      expect(quiz!.moduleId).toBe(mod.id);
    }
  });
});

describe("lesson content quality", () => {
  it("fills the required lesson fields", () => {
    for (const lesson of allLessons) {
      expect(lesson.title.trim().length, lesson.id).toBeGreaterThan(3);
      expect(lesson.description.trim().length, lesson.id).toBeGreaterThan(20);
      expect(lesson.simpleExplanation.trim().length, lesson.id).toBeGreaterThan(30);
      expect(lesson.detailedContent.trim().length, lesson.id).toBeGreaterThan(100);
      expect(lesson.howItWorks.trim().length, lesson.id).toBeGreaterThan(50);
      expect(lesson.learningObjectives.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(lesson.codeExamples.length, lesson.id).toBeGreaterThanOrEqual(1);
      expect(lesson.resources.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(lesson.exercises.length, lesson.id).toBeGreaterThanOrEqual(1);
      expect(lesson.commonMistakes.length, lesson.id).toBeGreaterThanOrEqual(1);
      expect(lesson.bestPractices.length, lesson.id).toBeGreaterThanOrEqual(1);
      expect(lesson.estimatedMinutes, lesson.id).toBeGreaterThan(0);
      expect(lesson.tags.length, lesson.id).toBeGreaterThanOrEqual(2);
      expect(lesson.prerequisites.every((id) => id !== undefined && id !== ""), lesson.id).toBe(true);
    }
  });

  it("keeps prerequisites strictly earlier in the learning order", () => {
    const position = new Map(orderedLessonIds.map((id, index) => [id, index]));
    for (const lesson of allLessons) {
      for (const prereq of lesson.prerequisites) {
        const prereqPos = position.get(prereq);
        const lessonPos = position.get(lesson.id);
        expect(prereqPos, `${lesson.id} → ${prereq}`).toBeDefined();
        expect(prereqPos!, `${lesson.id} → ${prereq} out of order`).toBeLessThan(lessonPos!);
      }
    }
  });

  it("labels exercises with solutions or hints", () => {
    for (const lesson of allLessons) {
      for (const exercise of lesson.exercises) {
        expect(exercise.prompt.trim().length, exercise.id).toBeGreaterThan(10);
        expect(
          (exercise.hints?.length ?? 0) > 0 || Boolean(exercise.solution),
          exercise.id,
        ).toBe(true);
      }
    }
  });
});

describe("quiz integrity", () => {
  function assertQuestion(question: QuizQuestion, quizId: string): void {
    expect(question.explanation.trim().length, `${quizId}/${question.id}`).toBeGreaterThan(10);
    if (question.type === "multiple-choice" || question.type === "code-output" || question.type === "find-bug") {
      expect(question.options?.length ?? 0, `${quizId}/${question.id}`).toBeGreaterThanOrEqual(2);
      expect(question.correctIndex, `${quizId}/${question.id}`).toBeGreaterThanOrEqual(0);
      expect(question.correctIndex!, `${quizId}/${question.id}`).toBeLessThan(question.options!.length);
    }
    if (question.type === "short-answer") {
      expect(question.acceptedKeywords?.length ?? 0, `${quizId}/${question.id}`).toBeGreaterThanOrEqual(1);
    }
  }

  it("gives every quiz enough well-formed questions", () => {
    for (const quiz of allQuizzes) {
      expect(quiz.questions.length, quiz.id).toBeGreaterThanOrEqual(5);
      expect(quiz.title.length, quiz.id).toBeGreaterThan(3);
      expect(quiz.description.length, quiz.id).toBeGreaterThan(10);
      for (const question of quiz.questions) assertQuestion(question, quiz.id);
      const ids = quiz.questions.map((q) => q.id);
      expect(new Set(ids).size, `${quiz.id} duplicate question ids`).toBe(ids.length);
    }
  });
});

describe("project content quality", () => {
  it("fills the required project fields", () => {
    for (const project of allProjects) {
      expect(project.title.trim().length, project.id).toBeGreaterThan(3);
      expect(project.description.trim().length, project.id).toBeGreaterThan(30);
      expect(project.technologies.length, project.id).toBeGreaterThanOrEqual(3);
      expect(project.estimatedHours, project.id).toBeGreaterThan(0);
      expect(project.milestones.length, project.id).toBeGreaterThanOrEqual(3);
      expect(project.milestones.every((m) => m.tasks.length >= 2), project.id).toBe(true);
      expect(project.acceptanceCriteria.length, project.id).toBeGreaterThanOrEqual(3);
      expect(project.tests.length, project.id).toBeGreaterThanOrEqual(2);
      expect(project.hints.length, project.id).toBeGreaterThanOrEqual(2);
      expect(project.userStories.length, project.id).toBeGreaterThanOrEqual(3);
      expect(project.functionalRequirements.length, project.id).toBeGreaterThanOrEqual(3);
      expect(project.suggestedStructure.trim().length, project.id).toBeGreaterThan(20);
      expect(project.referenceLinks.length, project.id).toBeGreaterThanOrEqual(1);
      expect(getPhase(project.phaseId), project.id).toBeDefined();
    }
  });

  it("assigns a unique checklist key to every milestone task", () => {
    for (const project of allProjects) {
      const keys = project.milestones.flatMap((_, mi) =>
        project.milestones[mi].tasks.map((__, ti) => `${mi}-${ti}`),
      );
      expect(new Set(keys).size, project.id).toBe(
        project.milestones.reduce((sum, m) => sum + m.tasks.length, 0),
      );
    }
  });
});

describe("resource link safety", () => {
  const resources = allResources();

  it("uses only https URLs", () => {
    expect(resources.length).toBeGreaterThan(500);
    for (const resource of resources) {
      expect(resource.url.startsWith("https://"), resource.url).toBe(true);
      expect(resource.url.includes(" "), resource.url).toBe(false);
      expect(resource.title.trim().length).toBeGreaterThan(0);
      expect(resource.description.trim().length).toBeGreaterThan(5);
    }
  });

  it("never links a specific YouTube video ID (search links only)", () => {
    for (const resource of resources) {
      expect(resource.url, resource.url).not.toMatch(/youtube\.com\/watch\?v=/);
      expect(resource.url, resource.url).not.toMatch(/youtu\.be\//);
    }
    for (const resource of resources) {
      if (resource.verificationStatus === "search-link") {
        expect(
          /youtube\.com\/results\?search_query=|google\.com\/search\?|bing\.com\/search\?/.test(
            resource.url,
          ),
          `${resource.title} → ${resource.url}`,
        ).toBe(true);
      }
      if (resource.resourceType === "video" && !resource.url.includes("/@")) {
        expect(resource.url, resource.url).toContain("youtube.com/results?search_query=");
      }
    }
  });

  it("has no mojibake or replacement characters in the catalogue", () => {
    const blob = JSON.stringify({
      lessons: allLessons,
      projects: allProjects,
      quizzes: allQuizzes,
      modules: allModules,
      phases,
    });
    expect(blob).not.toContain("â€");
    expect(blob).not.toContain("�");
    expect(blob).not.toContain("Â");
  });
});
