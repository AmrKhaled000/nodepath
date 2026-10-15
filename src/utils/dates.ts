export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function formatMinutes(total: number): string {
  if (total <= 0) return "0m";
  const hours = Math.floor(total / 60);
  const minutes = Math.round(total % 60);
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/** Days with at least one study activity, walking back from today. */
export function computeStreak(dates: string[]): number {
  const set = new Set(dates);
  if (set.size === 0) return 0;
  const cursor = new Date();
  // Streak is only "alive" if the user studied today or yesterday.
  const today = cursor.toISOString().slice(0, 10);
  cursor.setDate(cursor.getDate() - 1);
  const yesterday = cursor.toISOString().slice(0, 10);
  if (!set.has(today) && !set.has(yesterday)) return 0;

  let streak = 0;
  if (set.has(today)) {
    streak = 1;
    cursor.setDate(cursor.getDate() - 1);
  } else {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (!set.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfWeek(date: Date, weekStartsOn = 1): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
