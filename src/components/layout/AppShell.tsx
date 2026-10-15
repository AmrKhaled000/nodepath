import { Suspense, useEffect, useState } from "react";
import { Outlet, ScrollRestoration, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar, MobileOverlay } from "./Topbar";
import { CommandPalette } from "./CommandPalette";
import { SkeletonCard } from "@/components/ui/States";
import { PageContainer } from "@/components/layout/Page";
import { useProgress, progressStore } from "@/services/progressStore";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const progress = useProgress();
  const navigate = useNavigate();

  // Apply theme preference to <html data-theme>
  useEffect(() => {
    document.documentElement.dataset.theme = progress.preferences.theme;
  }, [progress.preferences.theme]);

  // Theme changes dispatched from the Topbar (before state commit) as fallback
  useEffect(() => {
    const onTheme = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "dark" || detail === "light") {
        document.documentElement.dataset.theme = detail;
        progressStore.setPreferences({ theme: detail });
      }
    };
    window.addEventListener("nodepath:theme", onTheme);
    return () => window.removeEventListener("nodepath:theme", onTheme);
  }, []);

  // Global search shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      } else if (e.key === "/" && !typing && !searchOpen) {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === "g" && !typing && !e.ctrlKey && !e.metaKey) {
        // "g" then "r" → roadmap
        const handler = (e2: KeyboardEvent) => {
          if (e2.key === "r") navigate("/roadmap");
          window.removeEventListener("keydown", handler);
        };
        window.addEventListener("keydown", handler, { once: true, capture: true });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, searchOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <MobileOverlay open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} onSearchClick={() => setSearchOpen(true)} />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <PageContainer>
                <SkeletonCard lines={4} />
                <SkeletonCard lines={3} />
              </PageContainer>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ScrollRestoration />
    </div>
  );
}
