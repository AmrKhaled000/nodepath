import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookmarkCheck,
  Check,
  Copy,
  Download,
  FileJson,
  Languages,
  Moon,
  NotebookPen,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { PageContainer, PageHeader, Section } from "@/components/layout/Page";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Overlay";
import { Textarea } from "@/components/ui/Form";
import { exportState, progressStore, useProgress } from "@/services/progressStore";
import { allLessons, getLesson } from "@/content";
import { STORAGE_KEYS } from "@/services/storage";
import { cn } from "@/utils/cn";

export function SettingsPage() {
  const progress = useProgress();
  const prefs = progress.preferences;
  const [confirmReset, setConfirmReset] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const bookmarkedLessons = progress.bookmarks
    .map((id) => getLesson(id))
    .filter((l): l is NonNullable<typeof l> => Boolean(l));
  const notedLessons = allLessons.filter((l) => (progress.notes[l.id] ?? "").trim() !== "");

  function downloadExport(): void {
    const blob = new Blob([exportState()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nodepath-progress.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyExport(): Promise<void> {
    try {
      await navigator.clipboard.writeText(exportState());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function importFromText(): void {
    try {
      const parsed = JSON.parse(importText) as unknown;
      progressStore.importState(parsed);
      setImportText("");
      setImportError(null);
    } catch {
      setImportError("That is not valid JSON. Paste the contents of an exported progress file.");
    }
  }

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", to: "/" }, { label: "Settings" }]}
        title="Settings"
        description="Appearance, study preferences, and your local data. Everything stays in this browser."
        actions={
          <ButtonLink to="/study-plan" variant="outline" size="sm">
            Study plan
          </ButtonLink>
        }
      />

      <Section title="Appearance" description="Dark mode is the default.">
        <Card>
          <CardBody className="flex flex-wrap gap-3">
            <ThemeChoice
              active={prefs.theme === "dark"}
              onClick={() => progressStore.setPreferences({ theme: "dark" })}
              icon={<Moon size={16} />}
              label="Dark"
            />
            <ThemeChoice
              active={prefs.theme === "light"}
              onClick={() => progressStore.setPreferences({ theme: "light" })}
              icon={<Sun size={16} />}
              label="Light"
            />
          </CardBody>
        </Card>
      </Section>

      <Section
        title="Study preferences"
        description="Used by search filters, resource suggestions, and the study plan."
      >
        <Card>
          <CardHeader
            title={
              <span className="flex items-center gap-2">
                <Languages size={15} className="text-accent" />
                Resource language
              </span>
            }
            description="Prefer Arabic-language material where it exists."
            action={
              <Badge tone={prefs.preferArabicResources ? "accent" : "neutral"}>
                {prefs.preferArabicResources ? "Arabic first" : "English first"}
              </Badge>
            }
          />
          <CardBody className="flex flex-wrap gap-2">
            <Button
              variant={prefs.language === "en" ? "primary" : "outline"}
              aria-pressed={prefs.language === "en"}
              onClick={() =>
                progressStore.setPreferences({ language: "en", preferArabicResources: false })
              }
            >
              {prefs.language === "en" ? <Check size={14} /> : null}
              English
            </Button>
            <Button
              variant={prefs.language === "ar" ? "primary" : "outline"}
              aria-pressed={prefs.language === "ar"}
              onClick={() =>
                progressStore.setPreferences({ language: "ar", preferArabicResources: true })
              }
            >
              {prefs.language === "ar" ? <Check size={14} /> : null}
              العربية
            </Button>
          </CardBody>
        </Card>
      </Section>

      <Section title="Your content" description="Bookmarks and notes saved in this browser.">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <BookmarkCheck size={15} className="text-accent" />
                  Bookmarks
                </span>
              }
              action={<Badge tone="neutral">{bookmarkedLessons.length}</Badge>}
            />
            <CardBody>
              {bookmarkedLessons.length === 0 ? (
                <p className="text-[13px] text-text-muted">
                  No bookmarks yet — use the bookmark button on any lesson.
                </p>
              ) : (
                <ul className="space-y-1">
                  {bookmarkedLessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        to={`/lessons/${lesson.slug}`}
                        className="block rounded-md px-2 py-1.5 text-[13px] text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                      >
                        {lesson.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  <NotebookPen size={15} className="text-accent" />
                  Notes
                </span>
              }
              action={<Badge tone="neutral">{notedLessons.length}</Badge>}
            />
            <CardBody>
              {notedLessons.length === 0 ? (
                <p className="text-[13px] text-text-muted">
                  No notes yet — every lesson has a notes box at the bottom.
                </p>
              ) : (
                <ul className="space-y-1">
                  {notedLessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        to={`/lessons/${lesson.slug}`}
                        className="block truncate rounded-md px-2 py-1.5 text-[13px] text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                      >
                        {lesson.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </Section>

      <Section
        title="Data"
        description={`Stored under “${STORAGE_KEYS.progress}” in localStorage.`}
      >
        <Card>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadExport} data-testid="export-progress">
                <Download size={15} />
                Export JSON
              </Button>
              <Button variant="outline" onClick={copyExport}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copied" : "Copy to clipboard"}
              </Button>
              <Button variant="danger" onClick={() => setConfirmReset(true)} data-testid="reset-progress">
                <Trash2 size={15} />
                Reset all progress
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-surface-2 p-3.5">
              <p className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold text-text">
                <Upload size={14} className="text-accent" />
                Import progress
              </p>
              <p className="mb-2 text-[12.5px] text-text-muted">
                Paste an exported JSON file below to restore your lessons, quizzes, and checklists.
              </p>
              <Textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={4}
                placeholder='{"version":1, ...}'
                aria-label="Import progress JSON"
              />
              {importError ? (
                <p className="mt-1.5 text-[12.5px] text-danger">{importError}</p>
              ) : null}
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" disabled={!importText.trim()} onClick={importFromText}>
                  <FileJson size={14} />
                  Import
                </Button>
                <label className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-text-muted">
                  <input
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setImportText(await file.text());
                    }}
                  />
                  or choose a file
                </label>
              </div>
            </div>
          </CardBody>
        </Card>
      </Section>

      <Section title="Shortcuts" description="Available anywhere in the app.">
        <Card>
          <CardBody className="grid gap-2 sm:grid-cols-2">
            <Shortcut keys="Ctrl / Cmd + K" label="Open search palette" />
            <Shortcut keys="/" label="Quick search" />
            <Shortcut keys="g then r" label="Go to roadmap" />
            <Shortcut keys="Esc" label="Close panels & dialogs" />
          </CardBody>
        </Card>
      </Section>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset all progress?">
        <div className="space-y-4">
          <p className="text-[13.5px] leading-6 text-text-muted">
            This clears every completed lesson, project, quiz result, bookmark, note, and study
            session stored in this browser. It cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              data-testid="confirm-reset"
              onClick={() => {
                progressStore.reset();
                setConfirmReset(false);
              }}
            >
              <RotateCcw size={15} />
              Reset everything
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}

function ThemeChoice({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      data-testid={`theme-${label.toLowerCase()}`}
      className={cn(
        "flex min-w-[120px] flex-col items-center gap-1.5 rounded-lg border px-4 py-3 text-[13px] font-medium transition-colors",
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-border bg-surface-2 text-text-muted hover:border-border-strong",
      )}
    >
      {icon}
      {label}
      {active ? <Check size={13} /> : <span className="h-[13px]" />}
    </button>
  );
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2">
      <span className="text-[13px] text-text-muted">{label}</span>
      <kbd className="rounded border border-border-strong bg-surface px-1.5 py-0.5 font-mono text-[11.5px] text-text">
        {keys}
      </kbd>
    </div>
  );
}
