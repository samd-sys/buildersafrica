"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import {
  ActiveFilters,
  CATEGORY_OPTIONS,
  OPEN_POSITION_OPTIONS,
  STAGE_META,
  STAGE_OPTIONS,
  SORT_OPTIONS,
} from "../types";

type Props = {
  filters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
  activeSort: string;
  onSortChange: (s: string) => void;
};

// ─── Generic dropdown wrapper ────────────────────────────────────────────────
function Dropdown({
  label,
  isActive,
  children,
}: {
  label: string;
  isActive: boolean;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-xl border px-9 py-2 text-xs font-medium transition-all ${
          isActive
            ? "border-white/30 bg-gray text-white"
            : "border-white/30 bg-[#121215] text-gray-400 hover:border-white/20 hover:text-white"
        }`}
      >
        {label}
        <ChevronDown
          size={12}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-2 min-w-[200px] rounded-xl border border-[#1F1F23] bg-[#0F0F11] shadow-2xl shadow-black/60 overflow-hidden">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

// ─── Option list inside a dropdown ───────────────────────────────────────────
function OptionList({
  options,
  selected,
  onSelect,
  close,
  stageEmojis = false,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  close: () => void;
  stageEmojis?: boolean;
}) {
  return (
    <div className="max-h-56 overflow-y-auto py-1">
      {options.map((opt) => {
        const isSelected = selected === opt;
        const emoji = stageEmojis ? STAGE_META[opt]?.emoji : null;
        return (
          <button
            key={opt}
            onClick={() => {
              onSelect(isSelected ? "" : opt);
              close();
            }}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors ${
              isSelected
                ? "bg-white/10 text-white"
                : "text-gray-400 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {emoji && <span>{emoji}</span>}
            {opt}
            {isSelected && <span className="ml-auto text-white">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main FilterBar ───────────────────────────────────────────────────────────
export default function FilterBar({
  filters,
  onFiltersChange,
  activeSort,
  onSortChange,
}: Props) {
  const [locationInput, setLocationInput] = useState(filters.location);
  const locationRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (key: keyof ActiveFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Debounce location input so filter applies 400ms after typing stops
  const handleLocationChange = (v: string) => {
    setLocationInput(v);
    if (locationRef.current) clearTimeout(locationRef.current);
    locationRef.current = setTimeout(() => set("location", v), 400);
  };

  const activeCount = Object.values(filters).filter(Boolean).length;

  // Build the active filter chips list for the strip below
  const activeChips: { key: keyof ActiveFilters; label: string; value: string }[] = [];
  if (filters.category)
    activeChips.push({ key: "category", label: "Category", value: filters.category });
  if (filters.location)
    activeChips.push({ key: "location", label: "Location", value: filters.location });
  if (filters.openPosition)
    activeChips.push({ key: "openPosition", label: "Role", value: filters.openPosition });
  if (filters.stage)
    activeChips.push({
      key: "stage",
      label: "Stage",
      value: `${STAGE_META[filters.stage]?.emoji ?? ""} ${filters.stage}`,
    });

  return (
    <div className="ml-40 space-y-3">
      {/* Filter dropdowns row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mr-1">
          <SlidersHorizontal size={13} />
          <span>Filter by</span>
        </div>

        {/* Category */}
        <Dropdown label="Category" isActive={!!filters.category}>
          {(close) => (
            <OptionList
              options={CATEGORY_OPTIONS}
              selected={filters.category}
              onSelect={(v) => set("category", v)}
              close={close}
            />
          )}
        </Dropdown>

        {/* Location */}
        <Dropdown label="Location" isActive={!!filters.location}>
          {(close) => (
            <div className="p-3 space-y-2">
              <input
                autoFocus
                type="text"
                value={locationInput}
                onChange={(e) => handleLocationChange(e.target.value)}
                placeholder="Type your preferred location"
                className="w-full rounded-lg border border-[#1F1F23] bg-[#121215] px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-colors"
              />
              {locationInput && (
                <button
                  onClick={() => {
                    setLocationInput("");
                    set("location", "");
                    close();
                  }}
                  className="text-[11px] text-gray-500 hover:text-red-400 transition-colors"
                >
                  Clear location
                </button>
              )}
            </div>
          )}
        </Dropdown>

        {/* Open Positions */}
        <Dropdown label="Open Positions" isActive={!!filters.openPosition}>
          {(close) => (
            <OptionList
              options={OPEN_POSITION_OPTIONS}
              selected={filters.openPosition}
              onSelect={(v) => set("openPosition", v)}
              close={close}
            />
          )}
        </Dropdown>

        {/* Stage */}
        <Dropdown label="Stage" isActive={!!filters.stage}>
          {(close) => (
            <OptionList
              options={STAGE_OPTIONS}
              selected={filters.stage}
              onSelect={(v) => set("stage", v)}
              close={close}
            />
          )}
        </Dropdown>

        {/* Sort — on the right */}
        <div className="ml-auto relative">
          <select
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="appearance-none rounded-xl border border-[#1F1F23] bg-[#121215] pl-4 pr-8 py-2 text-xs font-medium text-gray-300 outline-none cursor-pointer hover:border-white/10 transition-colors"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#121215]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500"
          />
        </div>
      </div>

      {/* Active filter chips strip — only shown when at least one filter is active */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-gray-600">Active:</span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="flex items-center gap-1.5 rounded-full border border-white/30 bg-gray px-3 py-1 text-[11px] font-medium text-white/70"
            >
              <span className="text-gray-500 text-[10px]">{chip.label}:</span>
              {chip.value}
              <button
                onClick={() => {
                  set(chip.key, "");
                  if (chip.key === "location") setLocationInput("");
                }}
                className="text-[#00AFEF]/60 hover:text-red-400 transition-colors ml-0.5"
              >
                <X size={13} />
              </button>
            </span>
          ))}

          {activeCount > 1 && (
            <button
              onClick={() => {
                onFiltersChange({ category: "", location: "", openPosition: "", stage: "" });
                setLocationInput("");
              }}
              className="text-[11px] text-gray-500 hover:text-red-400 transition-colors ml-1"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}