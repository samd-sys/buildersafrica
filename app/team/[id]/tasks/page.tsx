
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
  ListTodo,
  ArrowLeft,
} from "lucide-react";

type TaskStatus = "todo" | "in_progress" | "in_review" | "completed";
type TaskPriority = "low" | "medium" | "high" | "urgent";

type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

type Assignee = {
  user_id: string;
  full_name: string;
  avatar_url: string;
  role: string;
};

type TaskForm = {
  title: string;
  description: string;
  priority: TaskPriority;
  assigned_to: string;
  due_date: string;
};

const STATUSES: {
  key: TaskStatus;
  label: string;
  color: string;
  icon: typeof Circle;
}[] = [
  {
    key: "todo",
    label: "To Do",
    color: "text-muted",
    icon: Circle,
  },
  {
    key: "in_progress",
    label: "In Progress",
    color: "text-blue-500",
    icon: Clock3,
  },
  {
    key: "in_review",
    label: "In Review",
    color: "text-amber-500",
    icon: AlertCircle,
  },
  {
    key: "completed",
    label: "Completed",
    color: "text-emerald-500",
    icon: CheckCircle2,
  },
];

// The order here controls which stage a task can move to.
const STATUS_ORDER: TaskStatus[] = [
  "todo",
  "in_progress",
  "in_review",
  "completed",
];

const PRIORITIES: {
  value: TaskPriority;
  label: string;
}[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const EMPTY_FORM: TaskForm = {
  title: "",
  description: "",
  priority: "medium",
  assigned_to: "",
  due_date: "",
};

function getPriorityStyle(priority: TaskPriority) {
  switch (priority) {
    case "urgent":
      return "bg-red-500/10 text-red-500";
    case "high":
      return "bg-orange-500/10 text-orange-500";
    case "medium":
      return "bg-blue-500/10 text-blue-500";
    default:
      return "bg-gray-500/10 text-muted";
  }
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getPreviousStatus(status: TaskStatus): TaskStatus | null {
  const currentIndex = STATUS_ORDER.indexOf(status);

  return currentIndex > 0
    ? STATUS_ORDER[currentIndex - 1]
    : null;
}

function getNextStatus(status: TaskStatus): TaskStatus | null {
  const currentIndex = STATUS_ORDER.indexOf(status);

  return currentIndex < STATUS_ORDER.length - 1
    ? STATUS_ORDER[currentIndex + 1]
    : null;
}

function getStatusLabel(status: TaskStatus) {
  return STATUSES.find((item) => item.key === status)?.label || status;
}

export default function TaskManagementPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [projectTitle, setProjectTitle] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskForm>(EMPTY_FORM);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  // =========================================
  // LOAD PROJECT, MEMBERS AND TASKS
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
        const { data: project, error: projectError } = await supabase
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

        // Check whether the user is an active team member
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
        const { data: teamData, error: teamError } = await supabase
          .from("team_members")
          .select("user_id, role")
          .eq("project_id", projectId)
          .eq("status", "active");

        if (teamError) throw teamError;

        const memberIds = (teamData || []).map(
          (member) => member.user_id
        );

        // Include founder as an assignable person
        const userIds = Array.from(
          new Set([project.user_id, ...memberIds])
        );

        const { data: profiles, error: profileError } = await supabase
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

        // Load tasks
        const { data: taskData, error: taskError } = await supabase
          .from("project_tasks")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false });

        if (taskError) throw taskError;

        if (!isMounted) return;

        setTasks((taskData || []) as Task[]);
      } catch (err) {
        console.error("Task management loading error:", err);

        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load project tasks."
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
  // FILTER TASKS
  // =========================================

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(search.toLowerCase()) ||
        (task.description || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === "all" ||
        task.priority === priorityFilter;

      const matchesAssignee =
        assigneeFilter === "all" ||
        task.assigned_to === assigneeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesAssignee
      );
    });
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    assigneeFilter,
  ]);

  const completedCount = tasks.filter(
    (task) => task.status === "completed"
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "in_progress"
  ).length;

  const pendingCount = tasks.filter(
    (task) => task.status !== "completed"
  ).length;

  // =========================================
  // OPEN CREATE / EDIT MODAL
  // =========================================

  const openCreateModal = () => {
    setEditingTask(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);

    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      assigned_to: task.assigned_to || "",
      due_date: task.due_date || "",
    });

    setError("");
    setModalOpen(true);
  };

  // =========================================
  // CREATE OR UPDATE TASK
  // =========================================

  const handleSaveTask = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    setSaving(true);
    setError("");

    const taskData = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      assigned_to: form.assigned_to || null,
      due_date: form.due_date || null,
    };

    try {
      if (editingTask) {
        const { data, error: updateError } = await supabase
          .from("project_tasks")
          .update(taskData)
          .eq("id", editingTask.id)
          .select()
          .single();

        if (updateError) throw updateError;

        setTasks((previous) =>
          previous.map((task) =>
            task.id === editingTask.id ? (data as Task) : task
          )
        );
      } else {
        const { data, error: insertError } = await supabase
          .from("project_tasks")
          .insert({
            ...taskData,
            project_id: projectId,
            created_by: currentUserId,
            status: "todo",
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setTasks((previous) => [data as Task, ...previous]);
      }

      setModalOpen(false);
      setEditingTask(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error("Task save error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save task."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // MOVE TASK BETWEEN ADJACENT STAGES
  // =========================================

  const handleStatusChange = async (
    task: Task,
    newStatus: TaskStatus
  ) => {
    // Prevent moving more than one task at a time.
    if (movingTaskId) return;

    const currentIndex = STATUS_ORDER.indexOf(task.status);
    const newIndex = STATUS_ORDER.indexOf(newStatus);

    // A task can only move one stage forward or backward.
    if (Math.abs(currentIndex - newIndex) !== 1) {
      setError("Tasks can only move to the next or previous stage.");
      return;
    }

    setMovingTaskId(task.id);
    setError("");

    try {
      const { data, error: updateError } = await supabase
        .from("project_tasks")
        .update({ status: newStatus })
        .eq("id", task.id)
        // Make sure the task has not already been moved elsewhere.
        .eq("status", task.status)
        .select()
        .maybeSingle();

      if (updateError) throw updateError;

      if (!data) {
        throw new Error(
          "This task has already changed stage. Please refresh the page."
        );
      }

      setTasks((previous) =>
        previous.map((item) =>
          item.id === task.id ? (data as Task) : item
        )
      );
    } catch (err) {
      console.error("Task status update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to move task."
      );
    } finally {
      setMovingTaskId(null);
    }
  };

  // =========================================
  // SELECT A TASK FROM THE PREVIOUS STAGE
  // =========================================

  const handleMoveTaskFromPreviousStage = (
    destinationStatus: TaskStatus,
    taskId: string
  ) => {
    if (!taskId) return;

    const selectedTask = tasks.find(
      (task) => task.id === taskId
    );

    if (!selectedTask) {
      setError("The selected task could not be found.");
      return;
    }

    handleStatusChange(selectedTask, destinationStatus);
  };

  // =========================================
  // MOVE TASK BACK ONE STAGE
  // =========================================

  const handleMoveTaskBack = (task: Task) => {
    const previousStatus = getPreviousStatus(task.status);

    if (!previousStatus) return;

    handleStatusChange(task, previousStatus);
  };

  // =========================================
  // DELETE TASK
  // =========================================

  const handleDeleteTask = async (task: Task) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from("project_tasks")
      .delete()
      .eq("id", task.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setTasks((previous) =>
      previous.filter((item) => item.id !== task.id)
    );
  };

  const getAssignee = (userId: string | null) => {
    return assignees.find(
      (assignee) => assignee.user_id === userId
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
                className="h-64 rounded-2xl bg-surface-secondary"
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

          {/* Workspace Sidebar */}
          <TeamWorkspaceSidebar
            projectId={projectId}
            activePage="tasks"
          />

          {/* Main Content */}
          <main className="min-w-0 flex-1 space-y-6">

            {/* Header */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="mb-1 text-sm text-muted">
                  {projectTitle} / Project Management
                </p>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Task Management
                </h1>

                <p className="mt-2 text-sm text-muted">
                  Organize work, assign responsibilities and track project progress.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#009bd4]"
              >
                <Plus size={18} />
                Create Task
              </button>
            </div>

            {/* Error message */}
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

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                {
                  label: "Total Tasks",
                  value: tasks.length,
                  icon: ListTodo,
                  color: "text-[#00AFEF]",
                },
                {
                  label: "To Be Completed",
                  value: pendingCount,
                  icon: Clock3,
                  color: "text-amber-500",
                },
                {
                  label: "In Progress",
                  value: inProgressCount,
                  icon: AlertCircle,
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

            {/* Progress */}
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Overall Progress</h2>
                  <p className="mt-1 text-xs text-muted">
                    Completed tasks across this project
                  </p>
                </div>

                <span className="text-lg font-bold text-[#00AFEF]">
                  {tasks.length
                    ? Math.round((completedCount / tasks.length) * 100)
                    : 0}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-surface-secondary">
                <div
                  className="h-full rounded-full bg-[#00AFEF] transition-all"
                  style={{
                    width: `${
                      tasks.length
                        ? (completedCount / tasks.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Filters */}
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
                  placeholder="Search tasks..."
                  className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[#00AFEF]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:w-auto">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
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
                  value={priorityFilter}
                  onChange={(event) => setPriorityFilter(event.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[#00AFEF]"
                >
                  <option value="all">All priorities</option>
                  {PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>

                <select
                  value={assigneeFilter}
                  onChange={(event) => setAssigneeFilter(event.target.value)}
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

            {/* Kanban Board */}
            <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {STATUSES.map((status, statusIndex) => {
                const Icon = status.icon;

                const columnTasks = filteredTasks.filter(
                  (task) => task.status === status.key
                );

                // Tasks available to move into this column must
                // belong to the immediately preceding stage.
                const previousStatus =
                  statusIndex > 0
                    ? STATUSES[statusIndex - 1]
                    : null;

                const availableTasks = previousStatus
                  ? tasks.filter(
                      (task) => task.status === previousStatus.key
                    )
                  : [];

                return (
                  <section
                    key={status.key}
                    className="min-w-0 rounded-2xl border border-border bg-surface p-3 sm:p-4"
                  >
                    {/* Column Header */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon size={17} className={status.color} />

                        <h2 className="text-sm font-semibold">
                          {status.label}
                        </h2>

                        <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-muted">
                          {columnTasks.length}
                        </span>
                      </div>
                    </div>

                    {/* Move task from previous stage */}
                    {previousStatus && (
                      <div className="mb-4 rounded-xl border border-[#00AFEF]/20 bg-[#00AFEF]/5 p-3">
                        <label
                          htmlFor={`move-task-${status.key}`}
                          className="mb-2 block text-xs font-semibold text-[#00AFEF]"
                        >
                          Move from {previousStatus.label}
                        </label>

                        <select
                          id={`move-task-${status.key}`}
                          value=""
                          disabled={
                            availableTasks.length === 0 ||
                            movingTaskId !== null
                          }
                          onChange={(event) =>
                            handleMoveTaskFromPreviousStage(
                              status.key,
                              event.target.value
                            )
                          }
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs outline-none transition-colors focus:border-[#00AFEF] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">
                            {movingTaskId
                              ? "Moving task..."
                              : availableTasks.length > 0
                              ? "Select a task to move..."
                              : `No tasks in ${previousStatus.label}`}
                          </option>

                          {availableTasks.map((task) => (
                            <option key={task.id} value={task.id}>
                              {task.title}
                            </option>
                          ))}
                        </select>

                        <p className="mt-2 text-[11px] text-muted">
                          Only tasks in {previousStatus.label} can move here.
                        </p>
                      </div>
                    )}

                    {/* Tasks */}
                    <div className="space-y-3">
                      {columnTasks.map((task) => {
                        const assignee = getAssignee(task.assigned_to);
                        const taskPreviousStatus = getPreviousStatus(
                          task.status
                        );

                        const isMoving = movingTaskId === task.id;

                        return (
                          <article
                            key={task.id}
                            className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-[#00AFEF]/40"
                          >
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <span
                                className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${getPriorityStyle(
                                  task.priority
                                )}`}
                              >
                                {task.priority}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(task)}
                                  title="Edit task"
                                  className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-secondary hover:text-[#00AFEF]"
                                >
                                  <Pencil size={15} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task)}
                                  title="Delete task"
                                  className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>

                            <h3 className="text-sm font-semibold leading-5">
                              {task.title}
                            </h3>

                            {task.description && (
                              <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">
                                {task.description}
                              </p>
                            )}

                            <div className="mt-4 border-t border-border pt-3">
                              <div className="mb-3 flex items-center gap-2 text-xs text-muted">
                                <UserRound size={14} />

                                <span className="truncate">
                                  {assignee?.full_name || "Unassigned"}
                                </span>
                              </div>

                              {task.due_date && (
                                <div className="mb-3 flex items-center gap-2 text-xs text-muted">
                                  <CalendarDays size={14} />
                                  <span>
                                    Due {formatDate(task.due_date)}
                                  </span>
                                </div>
                              )}

                              {/* Move back one stage */}
                              {taskPreviousStatus && (
                                <button
                                  type="button"
                                  disabled={movingTaskId !== null}
                                  onClick={() => handleMoveTaskBack(task)}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-[#00AFEF] hover:text-[#00AFEF] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <ArrowLeft size={14} />

                                  {isMoving
                                    ? "Moving..."
                                    : `Move back to ${getStatusLabel(
                                        taskPreviousStatus
                                      )}`}
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}

                      {columnTasks.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center">
                          <p className="text-xs text-muted">
                            No tasks here
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Add task shortcut */}
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-xs font-medium text-muted transition-colors hover:border-[#00AFEF] hover:text-[#00AFEF]"
                    >
                      <Plus size={15} />
                      Add task
                    </button>
                  </section>
                );
              })}
            </div>

            {tasks.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00AFEF]/10 text-[#00AFEF]">
                  <ListTodo size={25} />
                </div>

                <h3 className="mt-4 font-semibold">
                  No tasks created yet
                </h3>

                <p className="mt-2 text-sm text-muted">
                  Start organizing your project by creating your first task.
                </p>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#009bd4]"
                >
                  <Plus size={17} />
                  Create your first task
                </button>
              </div>
            )}

            {tasks.length > 0 && filteredTasks.length === 0 && (
              <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
                No tasks match your current search or filters.
              </div>
            )}
          </main>
        </div>
      </div>

      {/* =========================================
          CREATE / EDIT TASK MODAL
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
                  {editingTask ? "Edit Task" : "Create New Task"}
                </h2>

                <p className="mt-1 text-sm text-muted">
                  Add task details and assign responsibility.
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

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Task Title <span className="text-red-500">*</span>
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
                  placeholder="e.g. Design the landing page"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[#00AFEF]"
                />
              </div>

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
                  placeholder="Describe what needs to be done..."
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-[#00AFEF]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Priority
                  </label>

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        priority: event.target.value as TaskPriority,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-[#00AFEF]"
                  >
                    {PRIORITIES.map((priority) => (
                      <option
                        key={priority.value}
                        value={priority.value}
                      >
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Due Date
                  </label>

                  <input
                    type="date"
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
                  You can assign this task to the project founder or any active team member.
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

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
                    : editingTask
                    ? "Save Changes"
                    : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
