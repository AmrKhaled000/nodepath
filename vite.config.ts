import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";

export default defineConfig({
  // Served from GitHub Pages at /nodepath/ — change this if you rename the repo.
  base: "/nodepath/",
  plugins: [
    react(),
    tailwindcss(),
    {
      // GitHub Pages serves 404.html for unknown paths; a copy of index.html
      // lets the client-side router handle deep links like /nodepath/lessons/....
      name: "spa-404-fallback",
      closeBundle() {
        const dist = path.resolve(__dirname, "dist");
        const index = path.join(dist, "index.html");
        if (fs.existsSync(index)) {
          fs.copyFileSync(index, path.join(dist, "404.html"));
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          const posix = id.replaceAll("\\", "/");
          if (posix.includes("/src/content/")) return "content";
          if (posix.includes("/node_modules/highlight.js/")) return "highlight";
          if (
            posix.includes("/node_modules/react-markdown/") ||
            posix.includes("/node_modules/remark-gfm/") ||
            posix.includes("/node_modules/micromark/") ||
            posix.includes("/node_modules/mdast-")
          ) {
            return "markdown";
          }
          if (posix.includes("/node_modules/@xyflow/")) return "flow";
          if (
            posix.includes("/node_modules/react-router") ||
            posix.includes("/node_modules/react-dom/") ||
            posix.includes("/node_modules/react/") ||
            posix.includes("/node_modules/scheduler/")
          ) {
            return "react";
          }
          return undefined;
        },
      },
    },
  },
});
