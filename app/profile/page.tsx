
"use client";

import ProfileEditor from "./components/ProfileEditor";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Regions, REGION_KEYS, RegionKey } from "./types/profile";

function regionsFromList(list: unknown): Regions {
  const base = REGION_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: false }),
    {} as Regions
  );

  const normalized = normalizeToStringArray(list);

  if (normalized.length === 0) {
    return { ...base, africa: true };
  }

  normalized.forEach((key) => {
    if (REGION_KEYS.includes(key as RegionKey)) {
      base[key as RegionKey] = true;
    }
  });

  return base;
}

function normalizeToStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === "string");
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed === "") return [];

    if (trimmed.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(trimmed);

        if (Array.isArray(parsed)) {
          return parsed.filter(
            (v): v is string => typeof v === "string"
          );
        }
      } catch {
        // Continue with other supported formats.
      }
    }

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return trimmed
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^"|"$/g, ""))
        .filter(Boolean);
    }

    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}

function regionsToList(regions: Regions): string[] {
  return REGION_KEYS.filter((key) => regions[key]);
}

export default function Profile() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [github, setGithub] = useState("");
  const [country, setCountry] = useState("");
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [regions, setRegions] = useState<Regions>(
    regionsFromList(null)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Keep the existing application sidebar hover behavior.
  useEffect(() => {
    const handleSidebarHover = (event: Event) => {
      const customEvent = event as CustomEvent<{
        isHovered: boolean;
      }>;

      setIsSidebarHovered(Boolean(customEvent.detail?.isHovered));
    };

    window.addEventListener("sidebarHover", handleSidebarHover);

    return () => {
      window.removeEventListener(
        "sidebarHover",
        handleSidebarHover
      );
    };
  }, []);

  // Load the logged-in user's profile.
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Unable to get authenticated user:", authError);
        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Error loading profile:", error);
        return;
      }

      if (data) {
        setName(data.full_name || "");
        setBio(data.bio || "");
        setSkills(normalizeToStringArray(data.skills));
        setGithub(data.github_url || "");
        setCountry(data.country || "");
        setProfessionalTitle(data.professional_title || "");
        setLinkedin(data.linkedin_url || "");
        setWebsite(data.website_url || "");
        setAvatarUrl(data.avatar_url || "");
        setIsPublic(data.is_public ?? true);
        setRegions(regionsFromList(data.visible_regions));
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Save profile using your existing database columns.
  const saveProfile = async () => {
    setIsSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        alert("You must be logged in.");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .upsert(
          [
            {
              user_id: user.id,
              full_name: name,
              bio,
              skills,
              github_url: github,
              country,
              professional_title: professionalTitle,
              linkedin_url: linkedin,
              website_url: website,
              avatar_url: avatarUrl,
              is_public: isPublic,
              visible_regions: regionsToList(regions),
            },
          ],
          { onConflict: "user_id" }
        );

      if (error) {
        alert(error.message);
        return;
      }

      alert("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("An unexpected error occurred while saving your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // Log out.
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      alert("Unable to log out. Please try again.");
      return;
    }

    router.push("/");
  };

  // Upload avatar to Supabase Storage.
  const handleAvatarUpload = async (file: File) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      alert("You must be logged in.");
      return;
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${user.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    setAvatarUrl(publicUrl);

    window.dispatchEvent(
      new CustomEvent("avatarUpdated", {
        detail: { avatarUrl: publicUrl },
      })
    );
  };

  return (
    <main
      className={`mt-3 flex h-[calc(100dvh-1.5rem)] min-h-0 w-full min-w-0 max-w-full flex-col overflow-hidden rounded-xl border border-white/20 bg-[#09090B] text-white sm:mt-4 sm:rounded-2xl md:mt-6 ${
        isSidebarHovered ? "md:ml-1" : "md:-ml-14"
      }`}
      style={{
        transition: "margin 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* The page and editor remain fixed to the available height. */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="mx-auto h-full min-h-0 w-full max-w-7xl px-2 py-2 sm:px-4 sm:py-4 md:px-5 lg:px-6">
          <ProfileEditor
            profile={{
              name,
              bio,
              skills,
              professionalTitle,
              github,
              country,
              linkedin,
              website,
              avatarUrl,
              isPublic,
              regions,
            }}
            setters={{
              setName,
              setBio,
              setSkills,
              setGithub,
              setCountry,
              setProfessionalTitle,
              setLinkedin,
              setWebsite,
              setAvatarUrl,
              setIsPublic,
              setRegions,
            }}
            onSave={saveProfile}
            onLogout={handleLogout}
            onAvatarFileSelected={handleAvatarUpload}
            isSaving={isSaving}
          />
        </div>
      </div>
    </main>
  );
}
