
"use client";

import { useMemo, useState } from "react";
import { formatDayLabel, formatDuration } from "@/lib/activity/format";
import type { DayPoint } from "@/lib/activity/types";

type Metric = "active" | "files" | "sessions";
type Range = 7 | 30;

const METRICS: {
  id: Metric;
  label: string;
  totalLabel: string;
}[] = [
  { id: "active", label: "Active Time", totalLabel: "Total active time" },
  { id: "files", label: "Files Saved", totalLabel: "Total files saved" },
  { id: "sessions", label: "Sessions", totalLabel: "Total sessions" },
];

function formatCount(value: number): string {
  return new Intl.NumberFormat().format(Math.round(value));
}

function formatMetricValue(metric: Metric, value: number): string {
  if (metric === "active") return formatDuration(value);
  return formatCount(value);
}

function getValue(point: DayPoint, metric: Metric): number {
  if (metric === "active") return point.activeMs;
  if (metric === "files") return point.filesSaved;
  return point.sessions;
}

function getNiceMaximum(value: number): number {
  if (value <= 0) return 1;

  const roughStep = value / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;

  const niceStep =
    normalized <= 1 ? 1 :
    normalized <= 2 ? 2 :
    normalized <= 5 ? 5 : 10;

  return Math.ceil(value / (niceStep * magnitude)) * niceStep * magnitude;
}

export default function ActivityLineChart({
  series,
}: {
  series: DayPoint[];
}) {
  const [range, setRange] = useState<Range>(7);
  const [metric, setMetric] = useState<Metric>("active");

  const days = useMemo(() => series.slice(-range), [series, range]);

  const values = useMemo(
    () => days.map((point) => getValue(point, metric)),
    [days, metric]
  );

  const total = values.reduce((sum, value) => sum + value, 0);
  const maximum = getNiceMaximum(Math.max(0, ...values) * 1.15);

  const width = 720;
  const height = 280;
  const left = 76;
  const right = 20;
  const top = 20;
  const bottom = 48;

  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const xPosition = (index: number) =>
    days.length <= 1
      ? left + plotWidth / 2
      : left + (index / (days.length - 1)) * plotWidth;

  const yPosition = (value: number) =>
    top + plotHeight - (value / maximum) * plotHeight;

  const points = values.map((value, index) => ({
    x: xPosition(index),
    y: yPosition(value),
    value,
    date: days[index].date,
  }));

  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    )
    .join(" ");

  const metricColor = "#00AFEF";

  const labelIndexes =
    days.length <= 7
      ? days.map((_, index) => index)
      : [0, 7, 14, 21, days.length - 1].filter(
          (value, index, array) =>
            value < days.length && array.indexOf(value) === index
        );

  const activeMetric = METRICS.find((item) => item.id === metric)!;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-bold text-foreground">
            {formatMetricValue(metric, total)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {activeMetric.totalLabel} · Last {range} days
          </p>
        </div>

        <div
          className="inline-flex rounded-lg border border-border bg-surface-secondary p-1"
          aria-label="Chart date range"
        >
          {([7, 30] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              aria-pressed={range === value}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                range === value
                  ? "bg-[#00AFEF] text-slate-950"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {value} Days
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Chart metric">
        {METRICS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMetric(item.id)}
            aria-pressed={metric === item.id}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              metric === item.id
                ? "border-[#00AFEF]/40 bg-[#00AFEF]/10 text-[#00AFEF]"
                : "border-border text-muted hover:border-[#00AFEF]/40 hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {days.length === 0 || total === 0 ? (
        <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted">
            No {metric === "active" ? "active time" : metric === "files" ? "files saved" : "sessions"} recorded in the last {range} days.
          </p>
        </div>
      ) : (
        <div className="w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full overflow-visible"
            role="img"
            aria-label={`${activeMetric.label} over the last ${range} days`}
          >
            {Array.from({ length: 5 }, (_, index) => {
              const value = (maximum / 4) * index;
              const y = yPosition(value);

              return (
                <g key={index}>
                  <line
                    x1={left}
                    y1={y}
                    x2={width - right}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity="0.12"
                    strokeDasharray="4 5"
                  />
                  <text
                    x={left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="currentColor"
                    opacity="0.6"
                    fontSize="11"
                  >
                    {metric === "active"
                      ? formatDuration(value)
                      : formatCount(value)}
                  </text>
                </g>
              );
            })}

            {labelIndexes.map((index) => (
              <text
                key={days[index].date}
                x={xPosition(index)}
                y={height - 12}
                textAnchor="middle"
                fill="currentColor"
                opacity="0.65"
                fontSize="11"
              >
                {formatDayLabel(days[index].date)}
              </text>
            ))}

            <path
              d={path}
              fill="none"
              stroke={metricColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point) => (
              <circle
                key={point.date}
                cx={point.x}
                cy={point.y}
                r="4"
                fill={metricColor}
                stroke="var(--chart-background, var(--surface))"
                strokeWidth="2"
              >
                <title>
                  {formatDayLabel(point.date)}:{" "}
                  {formatMetricValue(metric, point.value)}
                </title>
              </circle>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
