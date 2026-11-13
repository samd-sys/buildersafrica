
import { addDays } from "./dates";
import type { DayPoint, WindowTotals } from "./types";

export interface DailyRowLike {
  activity_date: string;
  active_ms: number | string;
  files_saved: number | string;
  session_count?: number | string;
}

export function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function fillDailySeries(
  rows: readonly DailyRowLike[],
  todayKey: string,
  days = 30
): DayPoint[] {
  const byDate = new Map<
    string,
    {
      activeMs: number;
      filesSaved: number;
      sessions: number;
    }
  >();

  for (const row of rows) {
    const entry = byDate.get(row.activity_date) ?? {
      activeMs: 0,
      filesSaved: 0,
      sessions: 0,
    };

    entry.activeMs += num(row.active_ms);
    entry.filesSaved += num(row.files_saved);
    entry.sessions += num(row.session_count);

    byDate.set(row.activity_date, entry);
  }

  const series: DayPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(todayKey, -i);
    const entry = byDate.get(date);

    series.push({
      date,
      activeMs: entry?.activeMs ?? 0,
      filesSaved: entry?.filesSaved ?? 0,
      sessions: entry?.sessions ?? 0,
    });
  }

  return series;
}

export function windowTotals(
  series: readonly DayPoint[]
): WindowTotals {
  const last7 = series.slice(-7);
  const prev7 = series.slice(-14, -7);

  const sum = (points: readonly DayPoint[]) =>
    points.reduce((total, point) => total + point.activeMs, 0);

  return {
    last7Ms: sum(last7),
    prev7Ms: sum(prev7),
    last30Ms: sum(series),
    activeDays30: series.filter((point) => point.activeMs > 0).length,
    filesSaved30: series.reduce(
      (total, point) => total + point.filesSaved,
      0
    ),
  };
}
