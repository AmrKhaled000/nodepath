import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  ListChecks,
  Rocket,
  RefreshCw,
} from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Overlay";
import { EmptyState } from "@/components/ui/States";
import { Input, Select } from "@/components/ui/Form";
import { buildStudyPlan, type PlanDay } from "@/services/studyPlan";
import { useProgress, progressStore } from "@/services/progressStore";
import { formatMinutes } from "@/utils/dates";
import { cn } from "@/utils/cn";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const kindMeta: Record<PlanDay["kind"], { label: string; className: string }> = {
  study: { label: "Study day", className: "border-accent/40 bg-accent-soft/40" },
  project: { label: "Project day", className: "border-success/40 bg-success-soft/40" },
  revision: { label: "Revision day", className: "border-info/40 bg-info-soft/40" },
  rest: { label: "Rest day", className: "border-border bg-surface-2" },
};

export function StudyPlanPage() {
  const progress = useProgress();
  const [weekOffset, setWeekOffset] = useState(0);

  const plan = useMemo(() => buildStudyPlan(progress), [progress]);
  const totalWeeks = plan.weeks.length;
  const week = plan.weeks[Math.min(weekOffset, totalWeeks - 1)];

  const weekMinutes = week?.reduce((sum, day) => sum + day.minutes, 0) ?? 0;
  const weekStudyDays = week?.filter((day) => day.items.length > 0).length ?? 0;

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: "Dashboard", to: "/" }, { label: "Study plan" }]}
        title="Personal study plan"
        description="A weekly schedule generated from your availability, skill level, and everything you have not completed yet. Change any setting below and the plan recalculates instantly."
        meta={[
          <Badge key="horizon" tone="neutral">
            {plan.horizonWeeks}-week horizon
          </Badge>,
          <Badge key="daily" tone="accent">
            <Clock size={11} className="mr-1 inline" />
            {plan.dailyMinutes} min/day
          </Badge>,
          <Badge key="days" tone="neutral">
            {plan.studyDays.length} days/week
          </Badge>,
        ]}
        actions={
          <ButtonLink to="/settings" variant="outline" size="sm">
            <RefreshCw size={13} />
            Study preferences
          </ButtonLink>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="Remaining workload" value={formatMinutes(plan.remainingMinutes)} sub="Lessons + projects + revision" />
        <SummaryCard
          label="Scheduled in horizon"
          value={formatMinutes(plan.scheduledMinutes)}
          sub={plan.overflowMinutes > 0 ? `${formatMinutes(plan.overflowMinutes)} overflow` : "Everything fits"}
          tone={plan.overflowMinutes > 0 ? "warning" : "success"}
        />
        <SummaryCard label="Project time reserved" value={formatMinutes(plan.projectMinutes)} sub="Interleaved project sessions" />
        <SummaryCard label="Daily target" value={`${plan.dailyMinutes} min`} sub={`${plan.studyDays.length} study days per week`} />
      </div>

      <div className="mb-6 space-y-2.5">
        {plan.notes.map((note) => (
          <Callout
            key={note}
            tone={note.startsWith("At ") ? "warning" : "info"}
          >
            {note}
          </Callout>
        ))}
      </div>

      <PreferencesCard />

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-text">
              <CalendarDays size={17} className="text-accent" />
              Week {weekOffset + 1} of {totalWeeks}
            </h2>
            <p className="mt-0.5 text-[13px] text-text-muted">
              {weekStudyDays} study day{weekStudyDays === 1 ? "" : "s"} · {formatMinutes(weekMinutes)} planned
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={weekOffset === 0}
              onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
              aria-label="Previous week"
            >
              <ChevronLeft size={15} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={weekOffset >= totalWeeks - 1}
              onClick={() => setWeekOffset((w) => Math.min(totalWeeks - 1, w + 1))}
              aria-label="Next week"
            >
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>

        {week ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7" data-testid="plan-week">
            {week.map((day) => {
              const meta = kindMeta[day.kind];
              const isToday = day.date === new Date().toISOString().slice(0, 10);
              return (
                <Card
                  key={day.date}
                  className={cn("min-h-[150px]", meta.className, isToday && "ring-2 ring-accent")}
                  data-testid="plan-day"
                >
                  <CardBody className="space-y-2 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[12.5px] font-semibold text-text">
                        {WEEKDAYS[day.weekday]}{" "}
                        <span className="font-normal text-text-faint">{day.date.slice(5)}</span>
                      </p>
                      {day.minutes > 0 ? (
                        <Badge tone="neutral">{day.minutes}m</Badge>
                      ) : (
                        <Coffee size={13} className="text-text-faint" />
                      )}
                    </div>
                    <p className="text-[11px] uppercase tracking-wide text-text-faint">{meta.label}</p>
                    {day.items.length === 0 ? (
                      <p className="text-[12.5px] text-text-faint">No session planned.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {day.items.map((item, i) => (
                          <li key={`${item.id}-${i}`}>
                            <ButtonLink
                              to={item.path}
                              variant="ghost"
                              size="sm"
                              className="h-auto w-full justify-start px-1.5 py-1 text-left"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-[12.5px] font-medium text-text">
                                  {item.type === "project" ? (
                                    <Rocket size={11} className="mr-1 inline text-success" />
                                  ) : item.type === "revision" ? (
                                    <ListChecks size={11} className="mr-1 inline text-info" />
                                  ) : null}
                                  {item.title}
                                </span>
                                <span className="block text-[11px] text-text-faint">
                                  {item.minutes} min
                                </span>
                              </span>
                            </ButtonLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No week data" description="Adjust your availability to generate a plan." />
        )}
      </section>
    </PageContainer>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "success" | "warning";
}) {
  return (
    <Card className="p-4">
      <p className="text-[12px] font-medium text-text-faint">{label}</p>
      <p
        className={cn(
          "mt-1 text-[19px] font-bold tabular-nums",
          tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-text",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[11.5px] text-text-muted">{sub}</p>
    </Card>
  );
}

function PreferencesCard() {
  const progress = useProgress();
  const prefs = progress.preferences;
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const toggleDay = (day: number): void => {
    const next = prefs.studyDays.includes(day)
      ? prefs.studyDays.filter((d) => d !== day)
      : [...prefs.studyDays, day].sort((a, b) => a - b);
    progressStore.setPreferences({ studyDays: next.length > 0 ? next : prefs.studyDays });
  };

  return (
    <Card>
      <CardHeader
        title="Availability settings"
        description="These values drive the plan above — saved to your profile automatically."
      />
      <CardBody className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Daily study minutes"
          type="number"
          min={15}
          max={600}
          step={15}
          value={prefs.dailyStudyMinutes}
          onChange={(e) =>
            progressStore.setPreferences({
              dailyStudyMinutes: Math.max(15, Math.min(600, Number(e.target.value) || 15)),
            })
          }
        />

        <Input
          label="Target weeks"
          type="number"
          min={1}
          max={104}
          value={prefs.targetWeeks}
          onChange={(e) =>
            progressStore.setPreferences({
              targetWeeks: Math.max(1, Math.min(104, Number(e.target.value) || 1)),
            })
          }
        />

        <Select
          label="Skill level"
          value={prefs.skillLevel}
          onChange={(e) =>
            progressStore.setPreferences({
              skillLevel: e.target.value as typeof prefs.skillLevel,
            })
          }
        >
          <option value="new">Completely new to backend</option>
          <option value="some-js">Some JavaScript experience</option>
          <option value="beginner-backend">Beginner backend developer</option>
          <option value="intermediate">Intermediate developer</option>
        </Select>

        <div className="sm:col-span-3">
          <span className="mb-1.5 block text-[13px] font-medium text-text-muted">Study days</span>
          <div className="flex flex-wrap gap-1.5">
            {dayLabels.map((label, index) => {
              const active = prefs.studyDays.includes(index);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(index)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    active
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border bg-surface-2 text-text-muted hover:border-border-strong",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
