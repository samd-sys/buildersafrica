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
      className={`px-4 mt-6 -ml-10 min-h-149 w-280 rounded-2xl border border-[#1F1F23] overflow-hidden bg-[#09090B] text-white transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-16" : "ml-0"
      }`}
      style={{
        transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      
      <div className="mx-auto max-w-8xl px-4 py-10 space-y-2">

        {/* Header card — online status and CTA */}
        <div className="-mx-8 -mt-10 rounded-2xl border border-[#1F1F23] bg-[#0F0F11] py-2">
          <div className="flex items-center justify-between px-4">
            <OnlineStatusBar count={builders.length} />
            <FindTeamMemberButton onClick={handleFindTeamMember} />
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