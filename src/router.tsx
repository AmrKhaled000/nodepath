import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";

const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const RoadmapPage = lazy(() =>
  import("@/pages/RoadmapPage").then((m) => ({ default: m.RoadmapPage })),
);
const PhasePage = lazy(() => import("@/pages/PhasePage").then((m) => ({ default: m.PhasePage })));
const LessonPage = lazy(() =>
  import("@/pages/LessonPage").then((m) => ({ default: m.LessonPage })),
);
const ProjectsPage = lazy(() =>
  import("@/pages/ProjectsPage").then((m) => ({ default: m.ProjectsPage })),
);
const ProjectDetailsPage = lazy(() =>
  import("@/pages/ProjectDetailsPage").then((m) => ({ default: m.ProjectDetailsPage })),
);
const QuizPage = lazy(() => import("@/pages/QuizPage").then((m) => ({ default: m.QuizPage })));
const ResourcesPage = lazy(() =>
  import("@/pages/ResourcesPage").then((m) => ({ default: m.ResourcesPage })),
);
const StudyPlanPage = lazy(() =>
  import("@/pages/StudyPlanPage").then((m) => ({ default: m.StudyPlanPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const SearchPage = lazy(() =>
  import("@/pages/SearchPage").then((m) => ({ default: m.SearchPage })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/SearchPage").then((m) => ({ default: m.NotFoundPage })),
);

export function createAppRouter() {
  // BASE_URL is "/" locally and "/nodepath/" on GitHub Pages.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");
  return createBrowserRouter(
    [
      {
        path: "/",
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "roadmap", element: <RoadmapPage /> },
          { path: "phases/:phaseId", element: <PhasePage /> },
          { path: "lessons/:slug", element: <LessonPage /> },
          { path: "projects", element: <ProjectsPage /> },
          { path: "projects/:slug", element: <ProjectDetailsPage /> },
          { path: "quizzes/:quizId", element: <QuizPage /> },
          { path: "resources", element: <ResourcesPage /> },
          { path: "study-plan", element: <StudyPlanPage /> },
          { path: "search", element: <SearchPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
    { basename },
  );
}
