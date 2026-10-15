import { Link, useNavigate } from "react-router-dom";
import { Menu, Moon, Search, Settings, Sun, Map as MapIcon } from "lucide-react";
import { useProgress } from "@/services/progressStore";
import { computeDashboardStats } from "@/services/progressStats";
import { ProgressRing } from "@/components/ui/Progress";
import { cn } from "@/utils/cn";

export interface TopbarProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export function Topbar({ onMenuClick, onSearchClick }: TopbarProps) {
  const progress = useProgress();
  const navigate = useNavigate();
  const stats = computeDashboardStats(progress);
  const isDark = progress.preferences.theme === "dark";

  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    // stored via preference patch
    window.dispatchEvent(new CustomEvent("nodepath:theme", { detail: next }));
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-bg/85 px-3 backdrop-blur-md sm:px-5">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation"
        className="rounded-md p-2 text-text-muted hover:bg-surface-2 hover:text-text lg:hidden"
      >
        <Menu size={18} />
      </button>

      <button
        type="button"
        onClick={onSearchClick}
        className="group flex h-9 min-w-0 flex-1 items-center gap-2.5 rounded-lg border border-border bg-surface-2 px-3 text-left text-[13px] text-text-faint transition-colors hover:border-border-strong sm:max-w-md"
        aria-label="Open search (Ctrl+K)"
      >
        <Search size={15} className="shrink-0" />
        <span className="truncate">Search lessons, projects, resources…</span>
        <kbd className="ml-auto hidden shrink-0 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10.5px] text-text-faint sm:inline-block">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
        <Link
          to="/roadmap"
          title="Interactive roadmap"
          className="hidden h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text transition-colors sm:flex"
        >
          <MapIcon size={17} />
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          title={isDark ? "Light mode" : "Dark mode"}
          className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <Link
          to="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text transition-colors"
          aria-label="Settings"
        >
          <Settings size={17} />
        </Link>

        <button
          type="button"
          onClick={() => navigate("/")}
          title={`${stats.completedLessons}/${stats.totalLessons} lessons completed`}
          className="flex items-center gap-2 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-3 transition-colors hover:border-border-strong"
        >
          <ProgressRing value={stats.overallPercent} size={28} strokeWidth={3.5} label="Overall progress" />
          <span className="hidden text-[12px] font-medium tabular-nums text-text-muted sm:inline">
            {stats.completedLessons}/{stats.totalLessons}
          </span>
        </button>
      </div>
    </header>
  );
}

export function MobileOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-30 bg-black/55 transition-opacity lg:hidden",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={onClose}
      aria-hidden={!open}
    />
  );
}
