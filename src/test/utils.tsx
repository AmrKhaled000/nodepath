import { render } from "@testing-library/react";
import { RouterProvider } from "react-router-dom";
import { createAppRouter } from "@/router";

export function renderApp(path = "/") {
  window.history.pushState({}, "", path);
  return render(<RouterProvider router={createAppRouter()} />);
}
