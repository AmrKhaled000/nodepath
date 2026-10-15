import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { STORAGE_KEYS } from "@/services/storage";
import "./index.css";

// Apply the saved theme before the first paint to avoid a flash of the wrong palette.
try {
  const raw = localStorage.getItem(STORAGE_KEYS.progress);
  const theme = raw ? (JSON.parse(raw) as { preferences?: { theme?: string } })?.preferences?.theme : null;
  document.documentElement.dataset.theme = theme === "light" ? "light" : "dark";
} catch {
  document.documentElement.dataset.theme = "dark";
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element #root not found");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
