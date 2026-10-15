import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, BookOpen, Link2, PlayCircle, Search, ShieldCheck } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Form";
import { EmptyState } from "@/components/ui/States";
import { ResourceCard } from "@/components/lesson/LessonBlocks";
import { allLessons, allProjects } from "@/content";
import type { Resource, ResourceType } from "@/types";
import { cn } from "@/utils/cn";

interface SourcedResource {
  resource: Resource;
  key: string;
  fromTitle?: string;
  fromPath?: string;
}

const typeOptions: { value: ResourceType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "official-docs", label: "Official docs" },
  { value: "video", label: "Video lessons" },
  { value: "article", label: "Articles" },
  { value: "tutorial", label: "Tutorials" },
  { value: "reference", label: "References" },
  { value: "tool", label: "Tools" },
  { value: "search", label: "Search links" },
];

export function ResourcesPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ResourceType | "all">("all");
  const [language, setLanguage] = useState<"all" | "en" | "ar">("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const all = useMemo<SourcedResource[]>(() => {
    const list: SourcedResource[] = [];
    const seen = new Set<string>();
    for (const lesson of allLessons) {
      for (const resource of lesson.resources) {
        const key = `${resource.url}|${resource.title}`;
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ resource, key, fromTitle: lesson.title, fromPath: `/lessons/${lesson.slug}` });
      }
    }
    for (const project of allProjects) {
      for (const resource of project.referenceLinks) {
        const key = `${resource.url}|${resource.title}`;
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ resource, key, fromTitle: project.title, fromPath: `/projects/${project.slug}` });
      }
    }
    return list;
  }, []);

  const filtered = all.filter((entry) => {
    const r = entry.resource;
    if (type !== "all" && r.resourceType !== type) return false;
    if (language !== "all" && r.language !== language) return false;
    if (verifiedOnly && r.verificationStatus !== "verified") return false;
    if (query) {
      const haystack = `${r.title} ${r.provider} ${r.description} ${entry.fromTitle ?? ""}`.toLowerCase();
      if (!haystack.includes(query.trim().toLowerCase())) return false;
    }
    return true;
  });

  const stats = useMemo(() => {
    const videos = all.filter((e) => e.resource.resourceType === "video").length;
    const docs = all.filter(
      (e) => e.resource.resourceType === "official-docs" || e.resource.resourceType === "reference",
    ).length;
    const verified = all.filter((e) => e.resource.verificationStatus === "verified").length;
    return { total: all.length, videos, docs, verified };
  }, [all]);

  const reset = () => {
    setQuery("");
    setType("all");
    setLanguage("all");
    setVerifiedOnly(false);
  };

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", to: "/" }, { label: "Resources" }]}
        title="Resource library"
        description="Every external link used across the curriculum in one place. Video links point to verified YouTube search results when a specific upload could not be confirmed — nothing is fabricated."
        meta={[
          <Badge key="total" tone="neutral">
            {stats.total} resources
          </Badge>,
          <Badge key="docs" tone="accent">
            <BookOpen size={11} className="mr-1 inline" />
            {stats.docs} docs
          </Badge>,
          <Badge key="videos" tone="info">
            <PlayCircle size={11} className="mr-1 inline" />
            {stats.videos} videos
          </Badge>,
          <Badge key="verified" tone="success">
            <ShieldCheck size={11} className="mr-1 inline" />
            {stats.verified} verified
          </Badge>,
        ]}
      />

      <Card className="mb-5">
        <CardBody className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, providers, topics…"
              aria-label="Search resources"
              className="pl-8"
            />
          </div>
          <select
            aria-label="Filter resources by type"
            value={type}
            onChange={(e) => setType(e.target.value as ResourceType | "all")}
            className="h-9 rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter resources by language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as "all" | "en" | "ar")}
            className="h-9 rounded-md border border-border bg-surface-2 px-2 text-[13px] text-text"
          >
            <option value="all">Any language</option>
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-2 px-3 py-2 text-[12.5px] text-text-muted hover:border-border-strong">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="accent-[var(--accent)]"
            />
            <BadgeCheck size={13} />
            Verified links only
          </label>
        </CardBody>
      </Card>

      <p className="mb-3 text-[13px] text-text-muted" data-testid="resource-count">
        {filtered.length} resource{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title="No resources match"
          description="Loosen a filter or search for another topic."
          action={
            <button type="button" className="text-[13px] text-accent underline" onClick={reset}>
              Reset filters
            </button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2" data-testid="resource-list">
          {filtered.map((entry) => (
            <div key={entry.key} className="space-y-1.5">
              <ResourceCard resource={entry.resource} />
              {entry.fromPath ? (
                <Link
                  to={entry.fromPath}
                  className={cn(
                    "inline-flex items-center gap-1.5 pl-1 text-[11.5px] text-text-faint hover:text-accent animated-underline",
                  )}
                >
                  <Link2 size={11} />
                  from “{entry.fromTitle}”
                </Link>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
