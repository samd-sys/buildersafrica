
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TeamWorkspaceSidebar from "../components/TeamWorkspaceSidebar";
import {
  Plus,
  Search,
  CalendarDays,
  UserRound,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Circle,
  Clock3,
  AlertCircle,
  Flag,
  Target,
  Milestone as MilestoneIcon,
} from "lucide-react";

// =========================================
// TYPES
// =========================================

type MilestoneStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "delayed";

type Milestone = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: MilestoneStatus;
  start_date: string | null;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type Assignee = {
  user_id: string;
  full_name: string;
  avatar_url: string;
  role: string;
};

type MilestoneForm = {
  title: string;
  description: string;
  status: MilestoneStatus;
  start_date: string;
  due_date: string;
  assigned_to: string;
};

const STATUSES: {
  key: MilestoneStatus;
  label: string;
  color: string;
  background: string;
  icon: typeof Circle;
}[] = [
  {
    key: "planned",
    label: "Planned",
    color: "text-muted",
    background: "bg-gray-500/10",
    icon: Circle,
  },
  {
    key: "in_progress",
    label: "In Progress",
    color: "text-blue-500",
    background: "bg-blue-500/10",
    icon: Clock3,
  },
  {
    key: "completed",
    label: "Completed",
    color: "text-emerald-500",
    background: "bg-emerald-500/10",
    icon: CheckCircle2,
  },
  {
    key: "delayed",
    label: "Delayed",
    color: "text-red-500",
    background: "bg-red-500/10",
    icon: AlertCircle,
  },
];

const EMPTY_FORM: MilestoneForm = {
  title: "",
  description: "",
  status: "planned",
  start_date: "",
  due_date: "",
  assigned_to: "",
};

// =========================================
// HELPERS
// =========================================

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function getStatus(status: MilestoneStatus) {
  return STATUSES.find((item) => item.key === status) || STATUSES[0];
}

function getMilestoneDate(milestone: Milestone) {
  return (
    milestone.start_date ||
    milestone.due_date ||
    milestone.created_at.slice(0, 10)
  );
}

function getMonthLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    undefined,
    {
      month: "long",
      year: "numeric",
    }
  );
}

// =========================================
// MAIN PAGE
// =========================================

export default function ProjectRoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [projectTitle, setProjectTitle] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] =
    useState<Milestone | null>(null);

  const [form, setForm] = useState<MilestoneForm>(EMPTY_FORM);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  // =========================================
  // LOAD PROJECT, MEMBERS AND MILESTONES
  // =========================================

  useEffect(() => {
    if (!projectId) return;

    let isMounted = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push("/login");
          return;
        }

        if (!isMounted) return;

        setCurrentUserId(user.id);

        // Load project
        const { data: project, error: projectError } =
          await supabase
            .from("projects")
            .select("id, title, user_id")
            .eq("id", projectId)
            .single();

        if (projectError || !project) {
          throw new Error("Project could not be found.");
        }

        if (!isMounted) return;

        setProjectTitle(project.title);

        const isFounder = project.user_id === user.id;

        // Verify active team membership
        if (!isFounder) {
          const { data: membership, error: membershipError } =
            await supabase
              .from("team_members")
              .select("id")
              .eq("project_id", projectId)
              .eq("user_id", user.id)
              .eq("status", "active")
              .maybeSingle();

          if (membershipError || !membership) {
            router.push("/projects");
            return;
          }
        }

        if (!isMounted) return;

        // Load active team members
        const { data: teamData, error: teamError } =
          await supabase
            .from("team_members")
            .select("user_id, role")
            .eq("project_id", projectId)
            .eq("status", "active");

        if (teamError) throw teamError;

        const memberIds = (teamData || []).map(
          (member) => member.user_id
        );

        // Include founder
        const userIds = Array.from(
          new Set([project.user_id, ...memberIds])
        );

        // Load profiles
        const { data: profiles, error: profileError } =
          await supabase
            .from("profiles")
            .select("user_id, full_name, avatar_url")
            .in("user_id", userIds);

        if (profileError) throw profileError;

        if (!isMounted) return;

        const profileMap = new Map(
          (profiles || []).map((profile) => [
            profile.user_id,
            profile,
          ])
        );

        const loadedAssignees: Assignee[] = userIds.map((id) => {
          const profile = profileMap.get(id);

          const teamMember = (teamData || []).find(
            (member) => member.user_id === id
          );

          return {
            user_id: id,
            full_name: profile?.full_name || "Unnamed Builder",
            avatar_url: profile?.avatar_url || "",
            role:
              id === project.user_id
                ? "Project Founder"
                : teamMember?.role || "Collaborator",
          };
        });

        setAssignees(loadedAssignees);

        // Load roadmap milestones
        const { data: milestoneData, error: milestoneError } =
          await supabase
            .from("project_milestones")
            .select("*")
            .eq("project_id", projectId)
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: true });

        if (milestoneError) throw milestoneError;

        if (!isMounted) return;

        setMilestones((milestoneData || []) as Milestone[]);
      } catch (err) {
        console.error("Project roadmap loading error:", err);

        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load project roadmap."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [projectId, router]);

  // =========================================
  // FILTER AND SORT MILESTONES
  // =========================================

  const filteredMilestones = useMemo(() => {
    return milestones
      .filter((milestone) => {
        const matchesSearch =
          milestone.title
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (milestone.description || "")
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesStatus =
          statusFilter === "all" ||
          milestone.status === statusFilter;

        const matchesAssignee =
          assigneeFilter === "all" ||
          milestone.assigned_to === assigneeFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesAssignee
        );
      })
      .sort((a, b) => {
        const dateA = getMilestoneDate(a);
        const dateB = getMilestoneDate(b);

        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }

        return a.sort_order - b.sort_order;
      });
  }, [
    milestones,
    search,
    statusFilter,
    assigneeFilter,
  ]);

  // =========================================
  // STATISTICS
  // =========================================

  const completedCount = milestones.filter(
    (item) => item.status === "completed"
  ).length;

  const plannedCount = milestones.filter(
    (item) => item.status === "planned"
  ).length;

  const inProgressCount = milestones.filter(
    (item) => item.status === "in_progress"
  ).length;

  const delayedCount = milestones.filter(
    (item) => item.status === "delayed"
  ).length;

  const progress = milestones.length
    ? Math.round((completedCount / milestones.length) * 100)
    : 0;

  // =========================================
  // ASSIGNEE HELPER
  // =========================================

  const getAssignee = (userId: string | null) => {
    return assignees.find(
      (assignee) => assignee.user_id === userId
    );
  };

  // =========================================
  // OPEN CREATE / EDIT MODAL
  // =========================================

  const openCreateModal = () => {
    setEditingMilestone(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (milestone: Milestone) => {
    setEditingMilestone(milestone);

    setForm({
      title: milestone.title,
      description: milestone.description || "",
      status: milestone.status,
      start_date: milestone.start_date || "",
      due_date: milestone.due_date || "",
      assigned_to: milestone.assigned_to || "",
    });

    setError("");
    setModalOpen(true);
  };

  // =========================================
  // CREATE OR UPDATE MILESTONE
  // =========================================

  const handleSaveMilestone = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Please enter a milestone title.");
      return;
    }

    if (
      form.start_date &&
      form.due_date &&
      form.start_date > form.due_date
    ) {
      setError("The due date cannot be before the start date.");
      return;
    }

    setSaving(true);
    setError("");

    const milestoneData = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      assigned_to: form.assigned_to || null,
    };

    try {
      if (editingMilestone) {
        const { data, error: updateError } = await supabase
          .from("project_milestones")
          .update(milestoneData)
          .eq("id", editingMilestone.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setMilestones((previous) =>
          previous.map((item) =>
            item.id === editingMilestone.id
              ? (data as Milestone)
              : item
          )
        );
      } else {
        const nextSortOrder =
          milestones.length > 0
            ? Math.max(
                ...milestones.map((item) => item.sort_order)
              ) + 1
            : 0;

        const { data, error: insertError } = await supabase
          .from("project_milestones")
          .insert({
            ...milestoneData,
            project_id: projectId,
            created_by: currentUserId,
            sort_order: nextSortOrder,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setMilestones((previous) => [
          ...previous,
          data as Milestone,
        ]);
      }

      setModalOpen(false);
      setEditingMilestone(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error("Milestone save error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save milestone."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // UPDATE MILESTONE STATUS
  // =========================================

  const handleStatusChange = async (
    milestone: Milestone,
    newStatus: MilestoneStatus
  ) => {
    if (milestone.status === newStatus) return;

    setError("");

    const { data, error: updateError } = await supabase
      .from("project_milestones")
      .update({ status: newStatus })
      .eq("id", milestone.id)
      .select()
      .single();

    if (updateError) {
      console.error("Milestone status update error:", updateError);
      setError(updateError.message);
      return;
    }

    setMilestones((previous) =>
      previous.map((item) =>
        item.id === milestone.id ? (data as Milestone) : item
      )
    );
  };

  // =========================================
  // DELETE MILESTONE
  // =========================================

  const handleDeleteMilestone = async (
    milestone: Milestone
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${milestone.title}"?`
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("project_milestones")
      .delete()
      .eq("id", milestone.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMilestones((previous) =>
      previous.filter((item) => item.id !== milestone.id)
    );
  };

  // =========================================
  // LOADING SCREEN
  // =========================================

  if (loading) {
    return (
      <div className="mx-auto max-w-[1500px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-56 rounded-lg bg-surface-secondary" />
          <div className="h-28 rounded-2xl bg-surface-secondary" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-28 rounded-2xl bg-surface-secondary"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // MAIN PAGE
  // =========================================

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

          {/* WORKSPACE SIDEBAR */}

          <TeamWorkspaceSidebar
            projectId={projectId}
            activePage="roadmap"
          />

          {/* MAIN CONTENT */}

          <main className="min-w-0 flex-1 space-y-6">

            {/* HEADER */}

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="mb-1 text-sm text-muted">
                  {projectTitle} / Project Management
                </p>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Project Roadmap
                </h1>

                <p className="mt-2 text-sm text-muted">
                  Plan milestones, assign responsibilities and track
                  your project's progress.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#009bd4]"
              >
                <Plus size={18} />
                Add Milestone
              </button>
            </div>

            {/* ERROR MESSAGE */}

            {error && (
              <div className="flex items-start justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {/* STATISTICS */}

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Total Milestones",
                  value: milestones.length,
                  icon: MilestoneIcon,
                  color: "text-[#00AFEF]",
                },
                {
                  label: "Planned",
                  value: plannedCount,
                  icon: Circle,
                  color: "text-muted",
                },
                {
                  label: "In Progress",
                  value: inProgressCount,
                  icon: Clock3,
                  color: "text-blue-500",
                },
                {
                  label: "Completed",
                  value: completedCount,
                  icon: CheckCircle2,
                  color: "text-emerald-500",
                },
              ].map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-border bg-surface p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted sm:text-sm">
                        {stat.label}
                      </p>

                      <Icon size={19} className={stat.color} />
                    </div>

                    <p className="mt-3 text-2xl font-bold">
                      {stat.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* OVERALL PROGRESS */}

            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">
                    Roadmap Progress
                  </h2>

                  <p className="mt-1 text-xs text-muted">
                    Percentage of completed milestones
                  </p>
                </div>

                <span className="text-lg font-bold text-[#00AFEF]">
                  {progress}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                <div
                  className="h-full rounded-full bg-[#00AFEF] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>
                  {completedCount} of {milestones.length} milestones completed
                </span>

                {delayedCount > 0 && (
                  <span className="font-medium text-red-500">
                    {delayedCount} delayed
                  </span>
                )}
              </div>
            </div>

            {/* FILTERS */}

            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search milestones..."
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#00AFEF]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-auto">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#00AFEF]"
                >
                  <option value="all">All statuses</option>

                  {STATUSES.map((status) => (
                    <option key={status.key} value={status.key}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <select
                  value={assigneeFilter}
                  onChange={(event) =>
                    setAssigneeFilter(event.target.value)
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#00AFEF]"
                >
                  <option value="all">All members</option>

                  {assignees.map((assignee) => (
                    <option
                      key={assignee.user_id}
                      value={assignee.user_id}
                    >
                      {assignee.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ROADMAP TIMELINE */}

            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
              <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold">
                    Milestone Timeline
                  </h2>

                  <p className="mt-1 text-xs text-muted">
                    Your project's key milestones in chronological order.
                  </p>
                </div>

                <span className="text-xs text-muted">
                  {filteredMilestones.length} milestones
                </span>
              </div>

              {filteredMilestones.length > 0 ? (
                <div className="space-y-8">
                  {filteredMilestones.map((milestone, index) => {
                    const status = getStatus(milestone.status);
                    const Icon = status.icon;
                    const assignee = getAssignee(
                      milestone.assigned_to
                    );

                    const currentMonth = getMonthLabel(
                      getMilestoneDate(milestone)
                    );

                    const previousMonth =
                      index > 0
                        ? getMonthLabel(
                            getMilestoneDate(
                              filteredMilestones[index - 1]
                            )
                          )
                        : null;

                    const showMonth = currentMonth !== previousMonth;

                    return (
                      <div key={milestone.id}>
                        {showMonth && (
                          <div className="mb-5 flex items-center gap-3">
                            <div className="rounded-lg bg-[#00AFEF]/10 p-2 text-[#00AFEF]">
                              <CalendarDays size={17} />
                            </div>

                            <h3 className="text-sm font-semibold">
                              {currentMonth}
                            </h3>

                            <div className="h-px flex-1 bg-border" />
                          </div>
                        )}

                        <div className="relative flex gap-3 sm:gap-5">
                          {/* TIMELINE LINE */}

                          <div className="flex w-7 shrink-0 flex-col items-center">
                            <div
                              className={`z-10 flex h-7 w-7 items-center justify-center rounded-full ${status.background} ${status.color}`}
                            >
                              <Icon size={15} />
                            </div>

                            {index !== filteredMilestones.length - 1 && (
                              <div className="mt-2 min-h-20 w-px flex-1 bg-border" />
                            )}
                          </div>

                          {/* MILESTONE CARD */}

                          <article className="mb-2 min-w-0 flex-1 rounded-xl border border-border bg-background p-4 transition-colors hover:border-[#00AFEF]/40 sm:p-5">
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                              <div className="min-w-0 flex-1">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${status.background} ${status.color}`}
                                  >
                                    {status.label}
                                  </span>

                                  <span className="text-[11px] text-muted">
                                    Milestone {index + 1}
                                  </span>
                                </div>

                                <h3 className="text-sm font-semibold sm:text-base">
                                  {milestone.title}
                                </h3>

                                {milestone.description && (
                                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted sm:text-sm">
                                    {milestone.description}
                                  </p>
                                )}
                              </div>

                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditModal(milestone)
                                  }
                                  title="Edit milestone"
                                  className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-secondary hover:text-[#00AFEF]"
                                >
                                  <Pencil size={15} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteMilestone(milestone)
                                  }
                                  title="Delete milestone"
                                  className="rounded-lg p-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            {/* MILESTONE DETAILS */}

                            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-4">
                              <div className="flex items-center gap-2 text-xs text-muted">
                                <UserRound size={14} />

                                <span>
                                  {assignee?.full_name || "Unassigned"}
                                </span>
                              </div>

                              {milestone.start_date && (
                                <div className="flex items-center gap-2 text-xs text-muted">
                                  <CalendarDays size={14} />

                                  <span>
                                    Starts {formatDate(milestone.start_date)}
                                  </span>
                                </div>
                              )}

                              {milestone.due_date && (
                                <div className="flex items-center gap-2 text-xs text-muted">
                                  <Flag size={14} />

                                  <span>
                                    Due {formatDate(milestone.due_date)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* STATUS UPDATE */}

                            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                              <span className="text-xs text-muted">
                                Update milestone status
                              </span>

                              <select
                                value={milestone.status}
                                onChange={(event) =>
                                  handleStatusChange(
                                    milestone,
                                    event.target.value as MilestoneStatus
                                  )
                                }
                                className="rounded-lg border border-border bg-surface px-3 py-2 text-xs outline-none transition-colors focus:border-[#00AFEF]"
                              >
                                {STATUSES.map((item) => (
                                  <option
                                    key={item.key}
                                    value={item.key}
                                  >
                                    {item.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </article>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00AFEF]/10 text-[#00AFEF]">
                    <Target size={25} />
                  </div>

                  <h3 className="mt-4 font-semibold">
                    {milestones.length === 0
                      ? "No milestones created yet"
                      : "No matching milestones"}
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                    {milestones.length === 0
                      ? "Start planning your project by creating your first milestone."
                      : "Try changing your search or filters to find milestones."}
                  </p>

                  {milestones.length === 0 && (
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#009bd4]"
                    >
                      <Plus size={17} />
                      Create First Milestone
                    </button>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* =========================================
          CREATE / EDIT MILESTONE MODAL
      ========================================= */}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-xl rounded-2xl border border-border bg-surface p-5 shadow-2xl sm:p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {editingMilestone
                    ? "Edit Milestone"
                    : "Create New Milestone"}
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Define an important goal or stage in your project.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
                aria-label="Close modal"
              >
                <X size={19} />
              </button>
            </div>

            <form
              onSubmit={handleSaveMilestone}
              className="space-y-4"
            >
              {/* TITLE */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Milestone Title{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  required
                  maxLength={150}
                  value={form.title}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Complete MVP Development"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[#00AFEF]"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Describe what this milestone should achieve..."
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[#00AFEF]"
                />
              </div>

              {/* STATUS */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      status: event.target.value as MilestoneStatus,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-[#00AFEF]"
                >
                  {STATUSES.map((status) => (
                    <option key={status.key} value={status.key}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* DATES */}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        start_date: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-[#00AFEF]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Due Date
                  </label>

                  <input
                    type="date"
                    min={form.start_date || undefined}
                    value={form.due_date}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        due_date: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-[#00AFEF]"
                  />
                </div>
              </div>

              {/* ASSIGNEE */}

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Assign To
                </label>

                <select
                  value={form.assigned_to}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      assigned_to: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-[#00AFEF]"
                >
                  <option value="">Unassigned</option>

                  {assignees.map((assignee) => (
                    <option
                      key={assignee.user_id}
                      value={assignee.user_id}
                    >
                      {assignee.full_name} — {assignee.role}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-muted">
                  Assign this milestone to the founder or an active
                  project team member.
                </p>
              </div>

              {/* MODAL ERROR */}

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-border px-5 py-3 text-sm font-medium transition-colors hover:bg-surface-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#009bd4] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingMilestone
                    ? "Save Changes"
                    : "Create Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
