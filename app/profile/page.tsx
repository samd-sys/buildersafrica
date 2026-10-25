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
    // Sensible default matching the original mock: Africa visible by default.
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
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((v): v is string => typeof v === "string");
        }
      } catch {
        // not valid JSON — fall through to comma-splitting below
      }
    }

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      // Postgres array literal, e.g. "{africa,asia}"
      return trimmed
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim())
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
  const [regions, setRegions] = useState<Regions>(regionsFromList(null));
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  // Sidebar animation (driven by the app's global shell sidebar elsewhere)
  useEffect(() => {
    const handleSidebarHover = (event: CustomEvent) => {
      setIsSidebarHovered(event.detail.isHovered);
    };

    window.addEventListener(
      "sidebarHover",
      handleSidebarHover as EventListener
    );

    return () => {
      window.removeEventListener(
        "sidebarHover",
        handleSidebarHover as EventListener
      );
    };
  }, []);

  // Load the logged-in user's profile
  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setName(data.full_name || "");
      setBio(data.bio || "");
      setSkills(data.skills || []);
      setGithub(data.github_url || "");
      setCountry(data.country || "");
      setProfessionalTitle(data.professional_title || "");
      setLinkedin(data.linkedin_url || "");
      setWebsite(data.website_url || "");
      setAvatarUrl(data.avatar_url || "");
      setIsPublic(data.is_public ?? true);
      setRegions(regionsFromList(data.visible_regions));
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Save profile
  const saveProfile = async () => {
    setIsSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      setIsSaving(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert([
      {
        user_id: user.id,
        full_name: name,
        bio,
        skills: skills,
        github_url: github,
        country,
        professional_title: professionalTitle,
        linkedin_url: linkedin,
        website_url: website,
        avatar_url: avatarUrl,
        is_public: isPublic,
        visible_regions: regionsToList(regions),
      },
    ]);

    setIsSaving(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Profile saved successfully!");
    }
  };

  // Log out
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // Avatar upload -> Supabase Storage, then store the public URL on the profile
  const handleAvatarUpload = async (file: File) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      return;
    }

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}-${Date.now()}.${fileExt}`;

    // NOTE: change "avatars" below if your Supabase Storage bucket
    // for profile pictures has a different name.
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert(uploadError.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    setAvatarUrl(publicUrl);

    // Tell the navbar to swap its Profile icon for the new photo right
    // away, without needing a full page reload.
    window.dispatchEvent(
      new CustomEvent("avatarUpdated", { detail: { avatarUrl: publicUrl } })
    );
  };

  return (
    <div
      className={`h-screen overflow-hidden bg-[#09090B] p-10 flex flex-col transition-all duration-500 ease-in-out ${
        isSidebarHovered ? "ml-16" : "ml-0"
      }`}
      style={{
        transform: isSidebarHovered ? "scale(1.005)" : "scale(1)",
        filter: isSidebarHovered ? "brightness(0.98)" : "brightness(1)",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Page Header — fixed, never scrolls */}
      <div className="flex-1 min-h-0">
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
  );
}