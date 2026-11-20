
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TeamWorkspaceSidebar from "../components/TeamWorkspaceSidebar";
import {
  CalendarDays,
  Clock3,
  Users,
  UserRound,
  CheckCircle2,
  Circle,
  Moon,
  Save,
  X,
  Loader2,
  AlertCircle,
  Pencil,
  Search,
} from "lucide-react";

type AvailabilityStatus = "available" | "busy" | "away";

type TeamMember = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  isFounder: boolean;
};

type Availability = {
  id: string;
  project_id: string;
  user_id: string;
  status: AvailabilityStatus;
  available_days: number[];
  start_time: string;
  end_time: string;
  timezone: string;
  note: string | null;
  updated_at: string;
};

type AvailabilityForm = {
  status: AvailabilityStatus;
  available_days: number[];
  start_time: string;
  end_time: string;
  note: string;
};

const DAYS = [
  { id: 1, label: "Monday", short: "Mon" },
  { id: 2, label: "Tuesday", short: "Tue" },
  { id: 3, label: "Wednesday", short: "Wed" },
  { id: 4, label: "Thursday", short: "Thu" },
  { id: 5, label: "Friday", short: "Fri" },
  { id: 6, label: "Saturday", short: "Sat" },
  { id: 7, label: "Sunday", short: "Sun" },
];

const DEFAULT_FORM: AvailabilityForm = {
  status: "available",
  available_days: [1, 2, 3, 4, 5],
  start_time: "09:00",
  end_time: "17:00",
  note: "",
};

const STATUS_STYLES: Record<AvailabilityStatus, string> = {
  available:
    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  busy: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  away: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: "Available",
  busy: "Busy",
  away: "Away",
};

// Team schedule skeleton
function AvailabilitySkeleton() {
  return (
    <div className="divide-y divide-border animate-pulse">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="p-5 flex flex-col xl:flex-row xl:items-center gap-5"
        >
          {/* Member information */}
          <div className="flex items-center gap-3 xl:w-64 shrink-0">
            <div className="w-11 h-11 rounded-full bg-muted/20" />

            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-32 rounded bg-muted/20" />
              <div className="h-3 w-20 rounded bg-muted/20" />
            </div>
          </div>

          {/* Status */}
          <div className="xl:w-32 shrink-0">
            <div className="h-7 w-24 rounded-full bg-muted/20" />
          </div>

          {/* Schedule */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="h-3 w-24 rounded bg-muted/20" />

              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div
                    key={day}
                    className="h-6 w-9 rounded-md bg-muted/20"
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="h-3 w-24 rounded bg-muted/20" />
              <div className="h-4 w-36 rounded bg-muted/20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TeamAvailabilityPage() {
  const params = useParams();
  const router = useRouter();

  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [projectName, setProjectName] = useState("Team Workspace");
  const [currentUserId, setCurrentUserId] = useState("");

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AvailabilityForm>(DEFAULT_FORM);

  const currentAvailability = availability.find(
    (item) => item.user_id === currentUserId
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      // Load project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, title, user_id")
        .eq("id", projectId)
        .single();

      if (projectError || !project) {
        router.push("/projects");
        return;
      }

      setProjectName(project.title);

      const isFounder = project.user_id === user.id;

      // Verify active team membership
      const { data: membership } = await supabase
        .from("team_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!isFounder && !membership) {
        router.push("/projects");
        return;
      }

      // Load active team members
      const { data: teamMembers, error: membersError } = await supabase
        .from("team_members")
        .select("user_id, role")
        .eq("project_id", projectId)
        .eq("status", "active");

      if (membersError) throw membersError;

      const memberIds = [
        ...new Set([
          project.user_id,
          ...(teamMembers || []).map((member) => member.user_id),
        ]),
      ];

      // Load member profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", memberIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(
        (profiles || []).map((profile) => [profile.user_id, profile])
      );

      const formattedMembers: TeamMember[] = memberIds.map((id) => {
        const profile = profileMap.get(id);

        const teamMember = teamMembers?.find(
          (member) => member.user_id === id
        );

        return {
          user_id: id,
          full_name: profile?.full_name || "Team Member",
          avatar_url: profile?.avatar_url || null,
          role:
            id === project.user_id
              ? "Project Founder"
              : teamMember?.role || "Team Member",
          isFounder: id === project.user_id,
        };
      });

      setMembers(formattedMembers);

      // Load availability records
      const { data: availabilityData, error: availabilityError } =
        await supabase
          .from("project_member_availability")
          .select("*")
          .eq("project_id", projectId);

      if (availabilityError) throw availabilityError;

      setAvailability(availabilityData || []);
    } catch (err: unknown) {
      console.error("Availability loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load team availability."
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, router]);

  useEffect(() => {
    if (projectId) loadData();
  }, [projectId, loadData]);

  // Open availability editor
  const openEditor = () => {
    const existing = currentAvailability;

    setForm(
      existing
        ? {
            status: existing.status,
            available_days: existing.available_days || [],
            start_time: existing.start_time?.slice(0, 5) || "09:00",
            end_time: existing.end_time?.slice(0, 5) || "17:00",
            note: existing.note || "",
          }
        : DEFAULT_FORM
    );

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  // Toggle working days
  const toggleDay = (dayId: number) => {
    setForm((previous) => ({
      ...previous,
      available_days: previous.available_days.includes(dayId)
        ? previous.available_days.filter((day) => day !== dayId)
        : [...previous.available_days, dayId].sort((a, b) => a - b),
    }));
  };

  // Save availability
  const handleSave = async () => {
    if (!form.available_days.length) {
      setError("Select at least one available day.");
      return;
    }

    if (form.start_time >= form.end_time) {
      setError("End time must be later than start time.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const { error: saveError } = await supabase
        .from("project_member_availability")
        .upsert(
          {
            project_id: projectId,
            user_id: currentUserId,
            status: form.status,
            available_days: form.available_days,
            start_time: form.start_time,
            end_time: form.end_time,
            timezone: "Africa/Nairobi",
            note: form.note.trim() || null,
          },
          {
            onConflict: "project_id,user_id",
          }
        );

      if (saveError) throw saveError;

      setShowModal(false);
      setSuccess("Your availability has been updated.");

      await loadData();
    } catch (err: unknown) {
      console.error("Availability save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your availability."
      );
    } finally {
      setSaving(false);
    }
  };

  // Filter team members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const record = availability.find(
        (item) => item.user_id === member.user_id
      );

      const memberStatus = record?.status || "available";

      const matchesSearch = member.full_name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || memberStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [members, availability, search, statusFilter]);

  const getAvailability = (userId: string) => {
    return availability.find((item) => item.user_id === userId);
  };

  // Format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Format working days
  const getDaysLabel = (days: number[]) => {
    if (days.length === 7) return "Every day";

    if (
      days.length === 5 &&
      [1, 2, 3, 4, 5].every((day) => days.includes(day))
    ) {
      return "Monday – Friday";
    }

    return DAYS.filter((day) => days.includes(day.id))
      .map((day) => day.short)
      .join(", ");
  };

  // Statistics
  const availableCount = members.filter(
    (member) =>
      (getAvailability(member.user_id)?.status || "available") ===
      "available"
  ).length;

  const busyCount = members.filter(
    (member) => getAvailability(member.user_id)?.status === "busy"
  ).length;

  const awayCount = members.filter(
    (member) => getAvailability(member.user_id)?.status === "away"
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00AFEF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <TeamWorkspaceSidebar
            projectId={projectId}
            activePage="availability"
          />

          <main className="flex-1 min-w-0 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-muted mb-1">{projectName}</p>

                <h1 className="text-2xl sm:text-3xl font-bold">
                  Team Availability
                </h1>

                <p className="text-sm text-muted mt-2">
                  View your team's schedules and coordinate working hours.
                </p>
              </div>

              <button
                onClick={openEditor}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#00AFEF] hover:bg-[#009bd5] text-white text-sm font-semibold transition-colors"
              >
                <Pencil size={17} />
                Update My Availability
              </button>
            </div>

            {/* Messages */}
            {error && !showModal && (
              <div className="flex items-center gap-2 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-sm">
                <CheckCircle2 size={18} />
                {success}
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">Available</p>
                    <h2 className="text-3xl font-bold mt-2">
                      {availableCount}
                    </h2>
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="text-emerald-500" size={22} />
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">Busy</p>
                    <h2 className="text-3xl font-bold mt-2">{busyCount}</h2>
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Clock3 className="text-amber-500" size={22} />
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted">Away</p>
                    <h2 className="text-3xl font-bold mt-2">{awayCount}</h2>
                  </div>

                  <div className="w-11 h-11 rounded-xl bg-gray-500/10 flex items-center justify-center">
                    <Moon className="text-gray-500" size={22} />
                  </div>
                </div>
              </div>
            </div>

            {/* My availability */}
            <section className="bg-surface border border-border rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <UserRound size={19} className="text-[#00AFEF]" />
                    <h2 className="font-semibold text-lg">My Availability</h2>
                  </div>

                  <p className="text-sm text-muted mt-1">
                    Your current project working schedule.
                  </p>
                </div>

                <button
                  onClick={openEditor}
                  className="text-sm font-medium text-[#00AFEF] hover:underline"
                >
                  Edit schedule
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <p className="text-xs text-muted mb-2">Current status</p>

                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${
                      STATUS_STYLES[currentAvailability?.status || "available"]
                    }`}
                  >
                    <Circle size={9} fill="currentColor" />
                    {STATUS_LABELS[currentAvailability?.status || "available"]}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-muted mb-2">Working days</p>

                  <p className="text-sm font-medium">
                    {getDaysLabel(
                      currentAvailability?.available_days || [1, 2, 3, 4, 5]
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted mb-2">Working hours</p>

                  <p className="text-sm font-medium">
                    {formatTime(currentAvailability?.start_time || "09:00")} –{" "}
                    {formatTime(currentAvailability?.end_time || "17:00")}
                  </p>
                </div>
              </div>

              {currentAvailability?.note && (
                <div className="mt-5 p-3 rounded-xl bg-background border border-border">
                  <p className="text-xs text-muted mb-1">Availability note</p>
                  <p className="text-sm">{currentAvailability.note}</p>
                </div>
              )}
            </section>

            {/* Team schedule */}
            <section className="bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-border">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users size={20} className="text-[#00AFEF]" />
                      <h2 className="text-lg font-semibold">
                        Team Schedule
                      </h2>
                    </div>

                    <p className="text-sm text-muted mt-1">
                      View the availability of your project members.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                      />

                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search members..."
                        className="w-full sm:w-52 pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-[#00AFEF]"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm outline-none focus:border-[#00AFEF]"
                    >
                      <option value="all">All statuses</option>
                      <option value="available">Available</option>
                      <option value="busy">Busy</option>
                      <option value="away">Away</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <AvailabilitySkeleton />
              ) : (
                <div className="divide-y divide-border">
                  {filteredMembers.length === 0 ? (
                    <div className="p-10 text-center">
                      <Users
                        size={32}
                        className="mx-auto text-muted mb-3"
                      />
                      <p className="font-medium">No team members found</p>
                      <p className="text-sm text-muted mt-1">
                        Try changing your search or status filter.
                      </p>
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const record = getAvailability(member.user_id);
                      const memberStatus = record?.status || "available";
                      const memberDays =
                        record?.available_days || [1, 2, 3, 4, 5];
                      const startTime = record?.start_time || "09:00";
                      const endTime = record?.end_time || "17:00";

                      return (
                        <div
                          key={member.user_id}
                          className="p-5 flex flex-col xl:flex-row xl:items-center gap-5"
                        >
                          {/* Member information */}
                          <div className="flex items-center gap-3 xl:w-64 shrink-0">
                            {member.avatar_url ? (
                              <img
                                src={member.avatar_url}
                                alt={member.full_name}
                                className="w-11 h-11 rounded-full object-cover border border-border"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-[#00AFEF]/10 flex items-center justify-center text-[#00AFEF] font-semibold">
                                {member.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="font-semibold truncate">
                                {member.full_name}

                                {member.user_id === currentUserId && (
                                  <span className="text-xs text-[#00AFEF] ml-2">
                                    You
                                  </span>
                                )}
                              </p>

                              <p className="text-xs text-muted mt-1">
                                {member.role}
                              </p>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="xl:w-32 shrink-0">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${STATUS_STYLES[memberStatus]}`}
                            >
                              <Circle size={8} fill="currentColor" />
                              {STATUS_LABELS[memberStatus]}
                            </span>
                          </div>

                          {/* Schedule */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted mb-1">
                                Available days
                              </p>

                              <div className="flex flex-wrap gap-1.5">
                                {DAYS.map((day) => (
                                  <span
                                    key={day.id}
                                    className={`text-[11px] px-2 py-1 rounded-md ${
                                      memberDays.includes(day.id)
                                        ? "bg-[#00AFEF]/10 text-[#00AFEF] font-semibold"
                                        : "bg-background text-muted border border-border"
                                    }`}
                                  >
                                    {day.short}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <p className="text-xs text-muted mb-1">
                                Working hours
                              </p>

                              <div className="flex items-center gap-2 text-sm">
                                <Clock3 size={15} className="text-muted" />
                                {formatTime(startTime)} – {formatTime(endTime)}
                              </div>
                            </div>
                          </div>

                          {/* Member note */}
                          {record?.note && (
                            <div className="xl:max-w-48">
                              <p className="text-xs text-muted mb-1">Note</p>
                              <p className="text-sm text-muted line-clamp-2">
                                {record.note}
                              </p>
                            </div>
                          )}

                          {/* Edit own availability */}
                          {member.user_id === currentUserId && (
                            <button
                              onClick={openEditor}
                              title="Edit your availability"
                              className="p-2.5 rounded-xl border border-border hover:border-[#00AFEF] hover:text-[#00AFEF] transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              <div className="p-4 border-t border-border text-xs text-muted flex items-center gap-2">
                <CalendarDays size={15} />
                All schedules use East Africa Time (EAT).
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Edit availability modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-surface border border-border rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-lg font-bold">Update Availability</h2>
                <p className="text-sm text-muted mt-1">
                  Set your working schedule for this project.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-background text-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  <AlertCircle size={17} />
                  {error}
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Availability Status
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    ["available", "busy", "away"] as AvailabilityStatus[]
                  ).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, status }))
                      }
                      className={`px-3 py-3 rounded-xl border text-sm font-medium transition-colors ${
                        form.status === status
                          ? STATUS_STYLES[status]
                          : "border-border bg-background text-muted hover:border-[#00AFEF]"
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Working days */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Working Days
                </label>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {DAYS.map((day) => {
                    const selected = form.available_days.includes(day.id);

                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`py-3 rounded-xl border text-xs font-semibold transition-colors ${
                          selected
                            ? "bg-[#00AFEF]/10 border-[#00AFEF] text-[#00AFEF]"
                            : "bg-background border-border text-muted hover:border-[#00AFEF]"
                        }`}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Working hours */}
              <div>
                <label className="block text-sm font-semibold mb-3">
                  Working Hours
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted mb-2 block">
                      Start Time
                    </label>

                    <input
                      type="time"
                      value={form.start_time}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          start_time: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-[#00AFEF]"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted mb-2 block">
                      End Time
                    </label>

                    <input
                      type="time"
                      value={form.end_time}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          end_time: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-[#00AFEF]"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted mt-2">
                  Timezone: East Africa Time (EAT).
                </p>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Availability Note
                  <span className="text-muted font-normal ml-1">
                    (Optional)
                  </span>
                </label>

                <textarea
                  rows={3}
                  maxLength={250}
                  value={form.note}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  placeholder="E.g. Available after classes or only during evenings..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-[#00AFEF] resize-none"
                />

                <p className="text-xs text-muted text-right mt-1">
                  {form.note.length}/250
                </p>
              </div>
            </div>

            {/* Modal actions */}
            <div className="p-5 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-5 py-3 rounded-xl border border-border text-sm font-medium hover:bg-background transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#00AFEF] hover:bg-[#009bd5] text-white text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {saving ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}

                {saving ? "Saving..." : "Save Availability"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}