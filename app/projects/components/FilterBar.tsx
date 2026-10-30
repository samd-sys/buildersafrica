
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuWidth = Math.min(240, window.innerWidth - 24);
      const left = Math.max(
        12,
        Math.min(rect.left, window.innerWidth - menuWidth - 12)
      );

      setPosition({
        top: rect.bottom + 8,
        left,
      });
    };

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const portal = document.getElementById("filter-dropdown-portal");

      if (
        ref.current?.contains(target) ||
        portal?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    updatePosition();

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl border px-3 py-2 text-xs font-medium transition-all sm:px-5 md:px-9 ${
          isActive
            ? "border-[#00AFEF]/40 bg-[#00AFEF]/10 text-[#00AFEF]"
            : "border-border bg-surface text-muted hover:border-[#00AFEF]/40 hover:text-foreground"
        }`}
      >
        {label}
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            id="filter-dropdown-portal"
            style={{
              position: "fixed",
              top: position.top,
              left: position.left,
              width: "max-content",
              maxWidth: "calc(100vw - 24px)",
              zIndex: 9999,
            }}
            className="overflow-hidden rounded-xl border border-border bg-surface text-foreground shadow-2xl"
          >
            {children(() => setOpen(false))}
          </div>,
          document.body
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
            type="button"
            onClick={() => {
              onSelect(isSelected ? "" : opt);
              close();
            }}
            className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs transition-colors ${
              isSelected
                ? "bg-[#00AFEF]/10 text-[#00AFEF]"
                : "text-muted hover:bg-surface-secondary hover:text-foreground"
            }`}
          >
            {emoji && <span>{emoji}</span>}
            {opt}
            {isSelected && (
              <span className="ml-auto text-[#00AFEF]">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main FilterBar ──────────────────────────────────────────────────────────
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

  // Debounce location filtering by 400ms.
  const handleLocationChange = (value: string) => {
    setLocationInput(value);

    if (locationRef.current) {
      clearTimeout(locationRef.current);
    }

    locationRef.current = setTimeout(() => {
      set("location", value);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (locationRef.current) {
        clearTimeout(locationRef.current);
      }
    };
  }, []);

  // Keep the location input synchronized with external filter resets.
  useEffect(() => {
    setLocationInput(filters.location);
  }, [filters.location]);

  const activeCount = Object.values(filters).filter(Boolean).length;

  const activeChips: {
    key: keyof ActiveFilters;
    label: string;
    value: string;
  }[] = [];

  if (filters.category) {
    activeChips.push({
      key: "category",
      label: "Category",
      value: filters.category,
    });
  }

  if (filters.location) {
    activeChips.push({
      key: "location",
      label: "Location",
      value: filters.location,
    });
  }

  if (filters.openPosition) {
    activeChips.push({
      key: "openPosition",
      label: "Role",
      value: filters.openPosition,
    });
  }

  if (filters.stage) {
    activeChips.push({
      key: "stage",
      label: "Stage",
      value: `${STAGE_META[filters.stage]?.emoji ?? ""} ${filters.stage}`,
    });
  }

  return (
    <div className="w-full min-w-0 space-y-3">
      {/* One horizontal row; only the filter controls scroll on mobile. */}
      <div className="flex w-full min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex shrink-0 items-center gap-1.5 pr-1 text-xs text-gray-500">
            <SlidersHorizontal size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Filter by</span>
          </div>

          {/* Category */}
          <Dropdown
            label="Category"
            isActive={!!filters.category}
          >
            {(close) => (
              <OptionList
                options={CATEGORY_OPTIONS}
                selected={filters.category}
                onSelect={(value) => set("category", value)}
                close={close}
              />
            )}
          </Dropdown>

          {/* Location */}
          <Dropdown
            label="Location"
            isActive={!!filters.location}
          >
            {(close) => (
              <div className="w-[220px] space-y-2 p-3">
                <input
                  autoFocus
                  type="text"
                  value={locationInput}
                  onChange={(event) =>
                    handleLocationChange(event.target.value)
                  }
                  placeholder="Type your preferred location"
                  className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-xs text-foreground outline-none transition-colors placeholder:text-muted focus:border-[#00AFEF]"
                />

                {locationInput && (
                  <button
                    type="button"
                    onClick={() => {
                      if (locationRef.current) {
                        clearTimeout(locationRef.current);
                      }

                      setLocationInput("");
                      set("location", "");
                      close();
                    }}
                    className="text-[11px] text-gray-500 transition-colors hover:text-red-400"
                  >
                    Clear location
                  </button>
                )}
              </div>
            )}
          </Dropdown>

          {/* Open Positions */}
          <Dropdown
            label="Open Positions"
            isActive={!!filters.openPosition}
          >
            {(close) => (
              <OptionList
                options={OPEN_POSITION_OPTIONS}
                selected={filters.openPosition}
                onSelect={(value) => set("openPosition", value)}
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
                onSelect={(value) => set("stage", value)}
                close={close}
                stageEmojis
              />
            )}
          </Dropdown>
        </div>

        {/* Sort remains visible while the filters scroll. */}
        <div className="relative ml-auto shrink-0">
          <select
            value={activeSort}
            onChange={(event) => onSortChange(event.target.value)}
            aria-label="Sort projects"
            className="w-[100px] appearance-none rounded-xl border border-border bg-surface py-2 pl-3 pr-6 text-xs font-medium text-foreground outline-none transition-colors hover:border-[#00AFEF]/40 sm:w-auto sm:pl-4 sm:pr-8"
          >
            {SORT_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-surface text-foreground"
              >
                {option.label}
              </option>
            ))}
          </select>

          <ChevronDown
            size={12}
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
          />
        </div>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-600">Active:</span>

          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="flex items-center gap-1.5 rounded-full border border-border bg-surface-secondary px-3 py-1 text-[11px] font-medium text-foreground"
            >
              <span className="text-[10px] text-gray-500">
                {chip.label}:
              </span>

              {chip.value}

              <button
                type="button"
                aria-label={`Remove ${chip.label} filter`}
                onClick={() => {
                  if (chip.key === "location" && locationRef.current) {
                    clearTimeout(locationRef.current);
                  }

                  set(chip.key, "");

                  if (chip.key === "location") {
                    setLocationInput("");
                  }
                }}
                className="ml-0.5 text-[#00AFEF]/60 transition-colors hover:text-red-400"
              >
                <X size={13} />
              </button>
            </span>
          ))}

          {activeCount > 1 && (
            <button
              type="button"
              onClick={() => {
                if (locationRef.current) {
                  clearTimeout(locationRef.current);
                }

                onFiltersChange({
                  category: "",
                  location: "",
                  openPosition: "",
                  stage: "",
                });

                setLocationInput("");
              }}
              className="ml-1 text-[11px] text-gray-500 transition-colors hover:text-red-400"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
