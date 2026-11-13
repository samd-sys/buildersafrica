
"use client";

import { useMemo, useState } from "react";
import type { DayPoint } from "@/lib/activity/types";
import { formatDuration } from "@/lib/activity/format";

type Metric = "activeTime" | "filesSaved" | "sessions";
type Period = 7 | 30;

function formatDayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
  });
}

export default function ActivityComboChart({
  series,
}: {
  series: DayPoint[];
}) {
  const [metric, setMetric] = useState<Metric>("activeTime");
  const [period, setPeriod] = useState<Period>(30);

  const chartData = useMemo(
    () =>
      series.slice(-period).map((day) => ({
        ...day,
        value:
          metric === "activeTime"
            ? day.activeMs
            : metric === "filesSaved"
              ? day.filesSaved
              : day.sessions,
      })),
    [series, metric, period]
  );

  const maxValue = Math.max(1, ...chartData.map((day) => day.value));

  function getNiceMaximum(value: number) {
    const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    const normalized = value / magnitude;

    const step =
      normalized <= 1 ? 1 :
      normalized <= 2 ? 2 :
      normalized <= 5 ? 5 : 10;

    return step * magnitude;
  }

  const yMaximum = getNiceMaximum(maxValue);
  const yStep = yMaximum / 4;

  const chartWidth = 720;
  const chartHeight = 300;
  const left = 65;
  const right = 20;
  const top = 20;
  const bottom = 45;

  const plotWidth = chartWidth - left - right;
  const plotHeight = chartHeight - top - bottom;

  const getX = (index: number) =>
    left +
    (chartData.length <= 1
      ? plotWidth / 2
      : (index / (chartData.length - 1)) * plotWidth);

  const getY = (value: number) =>
    top + plotHeight - (value / yMaximum) * plotHeight;

  const barWidth = Math.max(
    4,
    Math.min(24, (plotWidth / Math.max(chartData.length, 1)) * 0.55)
  );

  const linePath = chartData
    .map(
      (day, index) =>
        `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(day.value)}`
    )
    .join(" ");

  const formatValue = (value: number) => {
    if (metric === "activeTime") {
      return formatDuration(value);
    }

    return Math.round(value).toLocaleString();
  };

  const metricOptions: { label: string; value: Metric }[] = [
    { label: "Active Time", value: "activeTime" },
    { label: "Files Saved", value: "filesSaved" },
    { label: "Sessions", value: "sessions" },
  ];

  const selectedMetric =
    metricOptions.find((item) => item.value === metric)?.label ?? "Activity";

  return (
    <div className="w-full space-y-5">
      {/* Metric and period controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {metricOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMetric(option.value)}
              aria-pressed={metric === option.value}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                metric === option.value
                  ? "bg-[#00AFEF]/50 text-slate-950"
                  : "border border-border text-muted-foreground hover:border-[#00AFEF]/50 hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {([7, 30] as Period[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              aria-pressed={period === value}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                period === value
                  ? "bg-[#00AFEF]/50 text-slate-950"
                  : "text-muted-foreground hover:bg-[#00AFEF]/50 hover:text-foreground"
              }`}
            >
              {value} days
            </button>
          ))}
        </div>
      </div>

      {/* Combined bar and line chart */}
      {chartData.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No activity data available.
        </p>
      ) : (
        <div className="w-full">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-auto w-full overflow-visible"
            role="img"
            aria-label={`Combined bar and line chart showing daily ${selectedMetric.toLowerCase()}`}
          >
            {/* Y-axis grid lines and labels */}
            {Array.from({ length: 5 }, (_, index) => {
              const value = yStep * (4 - index);
              const y = getY(value);

              return (
                <g key={index}>
                  <line
                    x1={left}
                    y1={y}
                    x2={chartWidth - right}
                    y2={y}
                    stroke="currentColor"
                    opacity="0.12"
                    strokeDasharray="4 5"
                  />

                  <text
                    x={left - 10}
                    y={y + 4}
                    textAnchor="end"
                    fill="currentColor"
                    opacity="0.65"
                    fontSize="11"
                  >
                    {formatValue(value)}
                  </text>
                </g>
              );
            })}

            {/* Bars */}
            {chartData.map((day, index) => {
              const x = getX(index);
              const y = getY(day.value);
              const height = top + plotHeight - y;

              return (
                <rect
                  key={day.date}
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={Math.max(height, 0)}
                  rx="3"
                  fill="#00AFEF"
                  opacity="0.65"
                >
                  <title>
                    {day.date}: {formatValue(day.value)}
                  </title>
                </rect>
              );
            })}

            {/* Line uses exactly the same values as the bars */}
            <path
              d={linePath}
              fill="none"
              stroke="#12d2ec"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points on the line */}
            {chartData.map((day, index) => (
              <circle
                key={day.date}
                cx={getX(index)}
                cy={getY(day.value)}
                r="3.5"
                fill="#22D3EE"
                stroke="var(--background)"
                strokeWidth="1"
              >
                <title>
                  {day.date}: {formatValue(day.value)}
                </title>
              </circle>
            ))}

            {/* Date labels */}
            {chartData.map((day, index) => {
              const interval = Math.max(
                1,
                Math.ceil(chartData.length / 7)
              );

              if (
                index % interval !== 0 &&
                index !== chartData.length - 1
              ) {
                return null;
              }

              return (
                <text
                  key={day.date}
                  x={getX(index)}
                  y={chartHeight - 12}
                  textAnchor="middle"
                  fill="currentColor"
                  opacity="0.65"
                  fontSize="11"
                >
                  {formatDayLabel(day.date)}
                </text>
              );
            })}
          </svg>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#00AFEF]" />
          {selectedMetric} (bars)
        </div>

        <div className="flex items-center gap-2">
          <span className="h-[3px] w-5 rounded-full bg-[#22D3EE]" />
          {selectedMetric} (line)
        </div>
      </div>
    </div>
  );
}
