export type PhaseId = "phase-1" | "phase-2" | "phase-3";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type ResourceLanguage = "en" | "ar";

export type ResourceType =
  | "official-docs"
  | "video"
  | "article"
  | "tutorial"
  | "reference"
  | "tool"
  | "search";

export type ResourceVerification = "verified" | "search-link";

export interface Resource {
  title: string;
  url: string;
  resourceType: ResourceType;
  language: ResourceLanguage;
  provider: string;
  /** Free-form duration label, e.g. "12 min", "1h 20m", "playlist (~6h)". */
  estimatedDuration?: string;
  description: string;
  /**
   * "verified" — a stable official/known URL (docs sites, known org pages).
   * "search-link" — a YouTube/Google search link, used whenever a specific
   * video URL could not be verified.
   */
  verificationStatus: ResourceVerification;
  cost?: "free" | "paid";
}

export interface CodeExample {
  title: string;
  /** Language used for syntax highlighting: js, ts, bash, json, http, yaml, sql, dockerfile. */
  language: string;
  code: string;
  /** Short annotated walkthrough of the snippet. */
  description?: string;
}

export interface Exercise {
  id: string;
  title: string;
  prompt: string;
  difficulty: Difficulty;
  estimatedMinutes?: number;
  hints?: string[];
  /** Optional revealable solution. Hidden by default in the UI. */
  solution?: string;
  solutionLanguage?: string;
}

export type QuizQuestionType =
  | "multiple-choice"
  | "code-output"
  | "find-bug"
  | "short-answer";

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  code?: string;
  language?: string;
  /** Options for multiple-choice and code-output questions. */
  options?: string[];
  /** Index of the correct option. Hidden until submission. */
  correctIndex?: number;
  /** Keyword list for short-answer grading (case-insensitive, any-match). */
  acceptedKeywords?: string[];
  explanation: string;
  /** Explanations shown after submission, parallel to `options`. */
  optionExplanations?: string[];
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  questions: QuizQuestion[];
}

export interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  phaseId: PhaseId;
  moduleId: string;
  /** Order inside the module. */
  order: number;
  difficulty: Difficulty;
  estimatedMinutes: number;
  tags: string[];
  /** Lesson ids that should be completed first. */
  prerequisites: string[];
  learningObjectives: string[];
  /** 2–4 sentence plain-language explanation shown at the top of the lesson. */
  simpleExplanation: string;
  /** Markdown body: detailed explanation of the concept. */
  detailedContent: string;
  /** Markdown: how the technology works under the hood. */
  howItWorks: string;
  codeExamples: CodeExample[];
  commonMistakes: string[];
  bestPractices: string[];
  realWorldUseCases: string[];
  resources: Resource[];
  exercises: Exercise[];
  projectIds: string[];
  /** Optional quiz covering this topic (usually the module quiz). */
  quizId?: string;
  relatedTopics: string[];
}

export interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  phaseId: PhaseId;
  order: number;
  lessonIds: string[];
  quizId?: string;
  projectIds?: string[];
}

export interface Phase {
  id: PhaseId;
  order: 1 | 2 | 3;
  title: string;
  subtitle: string;
  description: string;
  outcomes: string[];
  /** Tailwind-ready accent hex used by the roadmap and phase header. */
  accent: string;
  estimatedHoursRange: string;
}

export interface ProjectMilestone {
  title: string;
  tasks: string[];
}

export interface ProjectIoExample {
  title: string;
  input: string;
  output: string;
  language?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  phaseId: PhaseId;
  /** true = specification authored for this platform; false = external reference project. */
  original: boolean;
  technologies: string[];
  estimatedHours: number;
  requiredKnowledge: string[];
  learningObjectives: string[];
  userStories: string[];
  functionalRequirements: string[];
  milestones: ProjectMilestone[];
  /** Text folder tree shown in a code block. */
  suggestedStructure: string;
  /** Markdown data model / schema section (optional for simple projects). */
  dataModel?: string;
  endpoints?: ProjectEndpoint[];
  acceptanceCriteria: string[];
  tests: string[];
  hints: string[];
  /** Full or partial solution walkthrough, hidden by default in the UI. */
  optionalSolution?: string;
  bonusChallenges: string[];
  commonMistakes?: string[];
  ioExamples?: ProjectIoExample[];
  referenceLinks: Resource[];
  /** Related lesson ids used for the "required knowledge" links. */
  relatedLessonIds?: string[];
}

export interface ProjectEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth?: "public" | "user" | "admin";
}
