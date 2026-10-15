import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/utils";
import { getQuiz } from "@/content";
import { progressStore } from "@/services/progressStore";

const quiz = getQuiz("quiz-p1-m1")!;

describe("module quizzes", () => {
  it("shows the intro screen with stats before starting", async () => {
    renderApp(`/quizzes/${quiz.id}`);
    expect(await screen.findByRole("heading", { name: quiz.title })).toBeInTheDocument();
    expect(screen.getByText(`${quiz.questions.length} questions`)).toBeInTheDocument();
    expect(screen.getByTestId("start-quiz")).toBeInTheDocument();
  });

  it("runs the full flow: answer every question, submit, and save the result", async () => {
    const user = userEvent.setup();
    renderApp(`/quizzes/${quiz.id}`);
    await screen.findByRole("heading", { name: quiz.title });
    await user.click(screen.getByTestId("start-quiz"));

    for (let i = 0; i < quiz.questions.length; i += 1) {
      await screen.findByTestId("quiz-question");
      const option = screen.queryByTestId("option-0");
      if (option) {
        await user.click(option);
      } else {
        const input = screen.getByTestId("short-answer-input");
        await user.clear(input);
        await user.type(input, "event loop");
      }

      if (i < quiz.questions.length - 1) {
        await user.click(screen.getByTestId("next-question"));
      }
    }

    await user.click(screen.getByTestId("submit-quiz"));

    expect(await screen.findByText(/Quiz passed|Almost there/)).toBeInTheDocument();
    const result = progressStore.getSnapshot().quizResults[quiz.id];
    expect(result).toBeDefined();
    expect(result!.attempts).toBe(1);
    expect(result!.total).toBe(quiz.questions.length);
    expect(result!.score + result!.wrongIds.length).toBe(quiz.questions.length);
  });

  it("keeps the previous attempt count across retries", async () => {
    progressStore.saveQuizResult({
      quizId: quiz.id,
      score: 3,
      total: quiz.questions.length,
      correctIds: [],
      wrongIds: [],
    });
    expect(progressStore.getSnapshot().quizResults[quiz.id].attempts).toBe(1);

    renderApp(`/quizzes/${quiz.id}`);
    expect(await screen.findByText(/Last attempt: 3\//)).toBeInTheDocument();
    expect(screen.getByText("Attempts so far")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});
