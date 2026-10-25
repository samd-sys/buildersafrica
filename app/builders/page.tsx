"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Builder } from "./types/builder";
import { parseSearchQuery } from "./lib/searchQuery";
import OnlineStatusBar from "./components/OnlineStatusBar";
import AISearchBar from "./components/AISearchBar";
import FindTeamMemberButton from "./components/FindTeamMemberButton";
import BuilderCard from "./components/BuilderCard";
import BuilderDrawer from "./components/BuilderDrawer";
import { Users } from "lucide-react";

export default function Builders() {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBuilder, setSelectedBuilder] = useState<Builder | null>(null);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Sidebar animation
  useEffect(() => {
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };
    window.addEventListener("sidebarHover", handleSidebarHover as EventListener);
    return () =>
      window.removeEventListener("sidebarHover", handleSidebarHover as EventListener);
  }, []);

  const loadBuilders = useCallback(async (rawQuery = "") => {
    setIsSearching(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Parse the natural language query into structured filters
    const { country, keywords } = parseSearchQuery(rawQuery);

    let query = supabase
      .from("profiles")
      .select("*")
      .neq("user_id", user?.id ?? "");

    // Country filter — case-insensitive
    if (country) {
      query = query.ilike("country", `%${country}%`);
    }

    // Keyword filter — match against skills, title, and bio
    if (keywords.length > 0) {
      const orClauses = keywords
        .map(
          (kw) =>
            `skills.ilike.%${kw}%,professional_title.ilike.%${kw}%,bio.ilike.%${kw}%`
        )
        .join(",");
      query = query.or(orClauses);
    }

    const { data, error } = await query;

    if (error) console.error(error);
    setBuilders(data || []);
    setIsSearching(false);
  }, []);

  // Load all builders on mount
  useEffect(() => {
    loadBuilders();
  }, [loadBuilders]);

  const handleSearch = () => loadBuilders(searchInput);

  const handleFindTeamMember = () => {
    // Stub for the advanced matching experience — point this at your
    // matching page or open a modal when you build that feature.
    loadBuilders(searchInput);
  };

  return (
<div
  className={`mt-3 min-h-[calc(100dvh-1.5rem)] w-full min-w-0 max-w-full rounded-xl border border-[#1F1F23] bg-[#09090B] text-white sm:mt-4 sm:rounded-2xl md:mt-6 md:h-[calc(100dvh-1.5rem)] md:overflow-hidden ${
    isSidebarHovered ? "md:ml-1" : "md:-ml-14"
  }`}
  style={{
    transition: "margin 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
  }}
>
      
        <div className="mx-auto w-full max-w-none space-y-4 px-3 py-4 sm:px-5 sm:py-6 md:px-6 md:py-8">
        {/* Header card — online status and CTA */}
        <div className="rounded-xl border border-[#1F1F23] bg-[#0F0F11] p-3 sm:p-4">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <OnlineStatusBar count={builders.length} />

    <div className="w-full sm:w-auto">
      <FindTeamMemberButton onClick={handleFindTeamMember} />
    </div>
  </div>
</div>

        <div className="flex justify-center">
          <div className="w-full max-w-3xl">
            <AISearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={handleSearch}
              isSearching={isSearching}
            />
          </div>
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users size={14} />
            <span>
              {isSearching
                ? "Searching..."
                : `${builders.length} builder${builders.length !== 1 ? "s" : ""} found`}
            </span>
          </div>
        </div>

        {/* Grid */}
        {builders.length === 0 && !isSearching ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <Users size={40} className="text-gray-700" />
            <p className="text-lg font-semibold text-white">No builders found</p>
            <p className="text-sm text-gray-500">
              Try a different search query or clear the search to see all builders.
            </p>
            <button
              onClick={() => {
                setSearchInput("");
                loadBuilders();
              }}
              className="mt-2 rounded-full border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {builders.map((builder) => (
              <BuilderCard
                key={builder.user_id}
                builder={builder}
                onOpenProfile={setSelectedBuilder}
              />
            ))}
          </div>
        )}
      </div>

      {/* Slide-in profile drawer */}
      <BuilderDrawer
        builder={selectedBuilder}
        onClose={() => setSelectedBuilder(null)}
      />
    </div>
  );
}