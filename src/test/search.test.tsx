import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "@/test/utils";

describe("search page", () => {
  it("returns results for a keyword query typed by the user", async () => {
    const user = userEvent.setup();
    renderApp("/search");
    const input = await screen.findByTestId("search-input", {}, { timeout: 5000 });

    await user.type(input, "event loop");
    await user.keyboard("{Enter}");

    expect(await screen.findByTestId("search-count")).toHaveTextContent(/\d+ results?/);
    const results = await screen.findAllByTestId("search-result", {}, { timeout: 5000 });
    expect(results.length).toBeGreaterThan(0);
  });

  it("filters results by document type via the URL", async () => {
    renderApp("/search?q=api&type=project");
    const results = await screen.findAllByTestId("search-result", {}, { timeout: 5000 });
    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(20);
    for (const result of results) {
      expect(result.getAttribute("href")).toContain("/projects/");
    }
  });

  it("shows an empty state for nonsense queries", async () => {
    renderApp("/search?q=zzzzqqqxyzzy");
    expect(await screen.findByText("No matches", {}, { timeout: 5000 })).toBeInTheDocument();
  });

  it("filters resources by type", async () => {
    const user = userEvent.setup();
    renderApp("/resources");
    expect(
      await screen.findByRole("heading", { name: "Resource library" }, { timeout: 30000 }),
    ).toBeInTheDocument();
    const total = screen.getByTestId("resource-count").textContent;

    await user.selectOptions(screen.getByLabelText("Filter resources by type"), "video");
    await waitFor(() => {
      expect(screen.getByTestId("resource-count").textContent).not.toBe(total);
    }, { timeout: 15000 });
    expect(screen.getAllByTestId("resource-card").length).toBeGreaterThan(0);
  });
});
