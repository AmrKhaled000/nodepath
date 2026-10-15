import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { ProgressBar, ProgressRing } from "@/components/ui/Progress";
import { Callout } from "@/components/ui/Overlay";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { EmptyState } from "@/components/ui/States";
import { Input } from "@/components/ui/Form";
import { getModule, getPhase, getQuiz } from "@/content";
import { useProgress, progressStore } from "@/services/progressStore";
import type { QuizQuestion } from "@/types";
import { cn } from "@/utils/cn";

type Phase = "intro" | "taking" | "results";

const PASS_PERCENT = 70;

export function QuizPage() {
  const { quizId } = useParams();
  const progress = useProgress();
  const quiz = quizId ? getQuiz(quizId) : undefined;

  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState<null | {
    correctIds: string[];
    wrongIds: string[];
    score: number;
  }>(null);
  const startedAt = useRef<number>(Date.now());

  const previous = quiz ? progress.quizResults[quiz.id] : undefined;

  const question: QuizQuestion | undefined = quiz?.questions[index];

  if (!quiz) {
    return (
      <PageContainer>
        <EmptyState
          title="Quiz not found"
          description="That quiz does not exist. Module quizzes are linked from every module."
          action={<ButtonLink to="/roadmap">Open roadmap</ButtonLink>}
        />
      </PageContainer>
    );
  }

  const module = getModule(quiz.moduleId);
  const phaseInfo = module ? getPhase(module.phaseId) : undefined;
  const total = quiz.questions.length;

  function gradeQuiz(): void {
    const correctIds: string[] = [];
    const wrongIds: string[] = [];
    for (const q of quiz!.questions) {
      const answer = (answers[q.id] ?? "").trim();
      let ok = false;
      if (q.options && typeof q.correctIndex === "number") {
        ok = answer !== "" && Number(answer) === q.correctIndex;
      } else if (q.acceptedKeywords?.length) {
        const normalized = answer.toLowerCase();
        ok = q.acceptedKeywords.some(
          (keyword) => keyword.trim().toLowerCase() !== "" && normalized.includes(keyword.trim().toLowerCase()),
        );
      }
      if (ok) correctIds.push(q.id);
      else wrongIds.push(q.id);
    }
    const score = correctIds.length;
    setGraded({ correctIds, wrongIds, score });
    progressStore.saveQuizResult({
      quizId: quiz!.id,
      score,
      total,
      correctIds,
      wrongIds,
    });
    setPhase("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goTo(nextIndex: number): void {
    setIndex(nextIndex);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function reset(): void {
    setAnswers({});
    setGraded(null);
    setIndex(0);
    setPhase("intro");
  }

  const answeredCount = quiz.questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length;

  if (phase === "intro") {
    return (
      <PageContainer className="max-w-3xl">
        <PageHeader
          breadcrumbs={[
            ...(phaseInfo ? [{ label: `Phase ${phaseInfo.order}`, to: `/phases/${phaseInfo.id}` }] : []),
            ...(module ? [{ label: module.title }] : []),
            { label: "Quiz" },
          ]}
          title={quiz.title}
          description={quiz.description}
          meta={[
            <Badge key="count" tone="neutral">
              {total} questions
            </Badge>,
            <Badge key="pass" tone="info">
              Pass mark {PASS_PERCENT}%
            </Badge>,
            previous ? (
              <Badge key="best" tone={previous.score / previous.total >= 0.7 ? "success" : "warning"}>
                Last attempt: {previous.score}/{previous.total}
              </Badge>
            ) : null,
          ]}
        />

        <Card>
          <CardBody className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoBox label="Questions" value={String(total)} />
              <InfoBox label="Attempts so far" value={String(previous?.attempts ?? 0)} />
              <InfoBox
                label="Best score"
                value={
                  previous ? `${Math.round((previous.score / previous.total) * 100)}%` : "—"
                }
              />
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-text-faint">
                Question types
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(quiz.questions.map((q) => q.type))].map((type) => (
                  <Badge key={type} tone="neutral" className="capitalize">
                    {type.replace("-", " ")}
                  </Badge>
                ))}
              </div>
            </div>

            <Callout tone="info" title="How it works">
              Answer every question, then submit to see your score with a full explanation for each
              answer. Your result is saved locally and counted toward your study progress.
            </Callout>

            <div className="flex flex-wrap gap-2">
              <Button
                size="lg"
                onClick={() => {
                  setPhase("taking");
                  setIndex(0);
                  startedAt.current = Date.now();
                }}
                data-testid="start-quiz"
              >
                {previous ? "Retry quiz" : "Start quiz"}
                <ArrowRight size={16} />
              </Button>
              {module ? (
                <ButtonLink to={`/phases/${phaseInfo?.id ?? "phase-1"}`} variant="outline" size="lg">
                  Back to module
                </ButtonLink>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </PageContainer>
    );
  }

  if (phase === "results" && graded) {
    const percent = Math.round((graded.score / total) * 100);
    const passed = percent >= PASS_PERCENT;
    const elapsed = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));

    return (
      <PageContainer className="max-w-4xl">
        <PageHeader
          breadcrumbs={[
            ...(module ? [{ label: module.title, to: `/phases/${phaseInfo?.id ?? ""}` }] : []),
            { label: "Results" },
          ]}
          title={passed ? "Quiz passed" : "Almost there"}
          description={
            passed
              ? "Great work — you cleared the pass mark for this module."
              : "Review the explanations below and try again when you are ready."
          }
        />

        <Card className="mb-6">
          <CardBody className="flex flex-wrap items-center justify-center gap-8 py-6">
            <ProgressRing
              value={percent}
              size={110}
              strokeWidth={8}
              label={`${percent}%`}
            />
            <div className="space-y-2 text-center sm:text-left">
              <p className="flex items-center justify-center gap-2 text-[15px] font-semibold text-text sm:justify-start">
                {passed ? (
                  <>
                    <Award size={17} className="text-success" /> Passed
                  </>
                ) : (
                  <>
                    <XCircle size={17} className="text-warning" /> Not passed yet
                  </>
                )}
              </p>
              <p className="text-[13.5px] text-text-muted">
                {graded.score} of {total} correct · {graded.wrongIds.length} to review
              </p>
              <p className="text-[13.5px] text-text-muted">
                Attempt #{previous?.attempts ?? 1} · about {elapsed} min
              </p>
              <div className="flex justify-center gap-2 pt-1 sm:justify-start">
                <Badge tone="success">{graded.correctIds.length} correct</Badge>
                <Badge tone="danger">{graded.wrongIds.length} incorrect</Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        <h2 className="mb-3 text-[16px] font-semibold text-text">Answer review</h2>
        <div className="mb-6 space-y-4">
          {quiz.questions.map((q, i) => {
            const isCorrect = graded.correctIds.includes(q.id);
            const given = answers[q.id] ?? "";
            const givenLabel =
              q.options && given !== "" && Number.isFinite(Number(given))
                ? q.options[Number(given)]
                : given || "No answer";
            const correctLabel =
              q.options && typeof q.correctIndex === "number"
                ? q.options[q.correctIndex]
                : q.acceptedKeywords?.join(" / ") ?? "";

            return (
              <Card key={q.id} className={isCorrect ? "border-success/40" : "border-danger/40"}>
                <CardHeader
                  title={
                    <span className="flex items-start gap-2">
                      <span className="mt-0.5">
                        {isCorrect ? (
                          <CheckCircle2 size={16} className="shrink-0 text-success" />
                        ) : (
                          <XCircle size={16} className="shrink-0 text-danger" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="text-text-faint">Q{i + 1}. </span>
                        {q.prompt}
                      </span>
                    </span>
                  }
                  action={
                    <Badge tone={isCorrect ? "success" : "danger"}>
                      {isCorrect ? "Correct" : "Incorrect"}
                    </Badge>
                  }
                />
                <CardBody className="space-y-3">
                  {q.code ? <CodeBlock code={q.code} language={q.language ?? "javascript"} /> : null}
                  <div className="space-y-1.5 text-[13.5px] leading-6">
                    <p className={isCorrect ? "text-success" : "text-danger"}>
                      Your answer: {givenLabel}
                    </p>
                    {!isCorrect && correctLabel ? (
                      <p className="text-text-muted">Correct answer: {correctLabel}</p>
                    ) : null}
                  </div>
                  {!isCorrect && q.optionExplanations && typeof q.correctIndex === "number" ? (
                    <p className="text-[13px] leading-6 text-text-muted">
                      {q.optionExplanations[q.correctIndex]}
                    </p>
                  ) : null}
                  <Callout tone={isCorrect ? "success" : "info"} title="Explanation">
                    {q.explanation}
                  </Callout>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="lg"
            onClick={() => {
              reset();
              setPhase("taking");
              startedAt.current = Date.now();
            }}
          >
            <RotateCcw size={16} />
            Try again
          </Button>
          {module ? (
            <ButtonLink to={`/phases/${phaseInfo?.id ?? "phase-1"}`} variant="outline" size="lg">
              <ArrowLeft size={16} />
              Back to module
            </ButtonLink>
          ) : null}
          <ButtonLink to="/roadmap" variant="ghost" size="lg">
            Roadmap
          </ButtonLink>
        </div>
      </PageContainer>
    );
  }

  // Taking phase
  const current = question!;
  const selected = answers[current.id] ?? "";
  const isLast = index === total - 1;
  const canSubmit = answeredCount === total;

  return (
    <PageContainer className="max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 flex items-center justify-between text-[12.5px] text-text-faint">
            <span>
              Question {index + 1} of {total}
            </span>
            <span className="tabular-nums">
              {answeredCount}/{total} answered
            </span>
          </p>
          <ProgressBar value={((index + 1) / total) * 100} />
        </div>
        <Badge tone="neutral" className="capitalize">
          {current.type.replace("-", " ")}
        </Badge>
      </div>

      <Card data-testid="quiz-question">
        <CardHeader title={`Q${index + 1}. ${current.prompt}`} />
        <CardBody className="space-y-4">
          {current.code ? <CodeBlock code={current.code} language={current.language ?? "javascript"} /> : null}

          {current.options ? (
            <div className="space-y-2" role="radiogroup" aria-label="Answer options">
              {current.options.map((option, optionIndex) => {
                const isSelected = selected === String(optionIndex);
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-testid={`option-${optionIndex}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: String(optionIndex) }))}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left text-[13.5px] leading-6 transition-colors",
                      isSelected
                        ? "border-accent bg-accent-soft text-text"
                        : "border-border bg-surface-2 text-text-muted hover:border-border-strong",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                        isSelected ? "border-accent bg-accent text-white" : "border-border-strong text-text-faint",
                      )}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="min-w-0 whitespace-pre-wrap">{option}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <label htmlFor="short-answer" className="mb-1.5 block text-[13px] font-medium text-text-muted">
                Your answer
              </label>
              <Input
                id="short-answer"
                value={selected}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))}
                placeholder="Type your answer…"
                autoComplete="off"
                data-testid="short-answer-input"
              />
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          <ArrowLeft size={15} />
          Previous
        </Button>

        {isLast ? (
          <Button
            disabled={!canSubmit}
            onClick={gradeQuiz}
            data-testid="submit-quiz"
            size="lg"
          >
            <Send size={15} />
            Submit answers
          </Button>
        ) : (
          <Button onClick={() => goTo(index + 1)} data-testid="next-question">
            Next
            <ArrowRight size={15} />
          </Button>
        )}
      </div>

      {!isLast && !canSubmit ? (
        <p className="mt-3 text-center text-[12.5px] text-text-faint">
          {total - answeredCount} question{total - answeredCount === 1 ? "" : "s"} still need an answer
          before you can submit.
        </p>
      ) : null}

      <div className="mt-6 border-t border-border pt-4 text-[12.5px] text-text-faint">
        <Link to="/" className="animated-underline text-accent">
          Save & exit
        </Link>{" "}
        — answers stay on this screen until you submit.
      </div>
    </PageContainer>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-center">
      <p className="text-[11.5px] uppercase tracking-wide text-text-faint">{label}</p>
      <p className="mt-0.5 text-[17px] font-bold tabular-nums text-text">{value}</p>
    </div>
  );
}
