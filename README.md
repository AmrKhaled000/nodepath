# NodePath — Interactive Node.js Learning Platform

A complete, self-contained Node.js developer roadmap built with React 19, TypeScript, and Vite. The platform ships **317 lessons** across **3 phases** and **18 modules**, **20 portfolio projects**, **18 module quizzes**, an interactive roadmap, a study planner, and browser-persisted progress — no backend required.

## Quick start

```bash
npm install
npm run dev        # start the dev server (Vite)
npm run build      # typecheck + production build
npm run preview    # serve the production build
npm test           # run the full Vitest suite (54 tests)
npm run lint       # ESLint (flat config, typescript-eslint)
npm run typecheck  # tsc -b
```

## What's inside

| Area | Contents |
| --- | --- |
| Curriculum | 3 phases · 18 modules · 317 lessons · ~103 h estimated study time |
| Projects | 20 scaffolded projects with milestones, checklists, API endpoint specs, and solution code gated behind a reveal |
| Quizzes | 18 module quizzes (multiple-choice + short-answer), scored, retried, attempt history kept |
| Roadmap | React Flow graph view (drag, zoom, minimap, prerequisite edges) + accessible list view with status filters |
| Progress | Lesson completion, project checklists, quiz results, bookmarks, per-lesson notes, study streak — all in `localStorage` |
| Study plan | Week-by-week schedule generated from your availability, with a printable daily breakdown |
| Search | Global search across lessons, projects, quizzes, and resources, filterable by document type |
| Resources | Every external link used in the curriculum, deduplicated and filterable by type / language / verification |
| Settings | Theme (dark/light), data export/import as JSON, full progress reset |
| Extras | Command palette (⌘K / Ctrl-K or `/`), keyboard shortcut (`g` then `r` → roadmap), responsive mobile drawer sidebar, ScrollRestoration |

## Routes

| Path | Page |
| --- | --- |
| `/` | Dashboard — greeting, continue-learning card, phase progress, stats |
| `/roadmap` | Interactive roadmap (graph + list views, filters, detail panel) |
| `/phases/:phaseId` | Phase overview with module cards and progress |
| `/lessons/:slug` | Lesson page — objectives, explanation, code, exercises, resources, notes, quiz CTA |
| `/projects` | Project library with search and phase / difficulty / technology filters |
| `/projects/:slug` | Project detail — milestones, endpoints, checklists, reference links |
| `/quizzes/:quizId` | Quiz player — intro, one-question-at-a-time flow, results with per-question review |
| `/resources` | Resource library — deduplicated links with type / language / verified filters |
| `/study-plan` | Personalized week-by-week study schedule |
| `/search` | Global search with document-type filtering |
| `/settings` | Theme, export / import progress, reset |
| `*` | 404 page |

## Architecture

```
src/
  components/     layout (AppShell, Sidebar, Topbar, CommandPalette), UI primitives,
                  lesson blocks, roadmap (React Flow nodes + layout engine)
  content/        the entire curriculum as typed TS modules (lessons, quizzes, projects)
  pages/          one file per route
  services/       progressStore (localStorage-backed), search index, study plan builder
  test/           Vitest + Testing Library suites and helpers
```

- **Router** — `react-router-dom` v7 data router (`createBrowserRouter`) with lazy-loaded route elements and `ScrollRestoration`.
- **State** — a tiny external store (`progressStore`) with `useSyncExternalStore`; the `useProgress()` hook subscribes components without a global context.
- **Styling** — Tailwind CSS 4 with CSS-variable design tokens (`--bg`, `--accent`, …) and a `data-theme` attribute on `<html>`; dark mode is the default.
- **Code blocks** — `highlight.js` with a custom theme; lessons and quizzes are plain typed data, rendered through `react-markdown` + `remark-gfm` where needed.
- **Roadmap layout** — `buildRoadmap()` positions 317 nodes into phase bands with sequential + prerequisite edges; the same engine powers the graph, the list view, and the status legend.

## Content & link policy

- Every lesson includes: objectives, a simple explanation, a "how it works" walkthrough, code examples, common mistakes, best practices, use cases, exercises with hints, curated resources, and related-lesson links.
- **No fabricated URLs.** Official documentation links point to real `https://nodejs.org`, `https://expressjs.com`, `https://www.mongodb.com`, etc. pages. Video links use YouTube **search-result URLs** (`https://www.youtube.com/results?search_query=…`) marked `verificationStatus: "search-link"` when a specific upload could not be confirmed — nothing is guessed.
- `src/content/content.test.ts` enforces this at test time: all URLs must be `https`, `youtube.com/watch` and `youtu.be` links are forbidden, search-link URLs must match the expected shape, and no mojibake may appear in any string.

## Testing

```
npm test
```

| Suite | Tests | Covers |
| --- | --- | --- |
| `content.test.ts` | 16 | curriculum counts, id/slug uniqueness, prerequisite ordering, quiz integrity, resource-link policy |
| `navigation.test.tsx` | 6 | dashboard, sidebar navigation, deep links, 404 |
| `roadmap-layout.test.ts` | 7 | node/edge generation, phase bands, status computation |
| `roadmap.test.tsx` | 4 | list view, topic filter, detail panel, mark-complete |
| `progress.test.tsx` | 4 | lesson completion, dashboard stats after reload, notes debounce, bookmarks |
| `projects.test.tsx` | 4 | library filters, project detail, milestones, checklists |
| `quiz.test.tsx` | 3 | intro stats, full answer → submit → score flow, attempt counting |
| `search.test.tsx` | 4 | keyword search, type filter, empty state, resource filters |
| `settings-plan-search.test.tsx` | 6 | study-plan builder, search index, settings actions |

**54 / 54 passing.** The jsdom environment stubs `ResizeObserver` / `IntersectionObserver` / `matchMedia` and patches `Request` to strip React Router's `AbortSignal` (jsdom's signal fails undici's `instanceof` check). The viewport is pinned to 800 px so the roadmap renders its list view; the graph layout engine is covered directly by `roadmap-layout.test.ts`.

## Browser support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge). All progress lives in `localStorage` under a single versioned key — export from Settings to move it between machines.
