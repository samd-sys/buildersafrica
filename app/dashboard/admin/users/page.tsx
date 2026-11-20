
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  Users,
  UserPlus,
  Globe2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  MapPin,
  Briefcase,
  ExternalLink,
  X,
  AlertCircle,
  UserRound,
  CalendarDays,
  Filter,
  Activity,
  Clock3,
  FileCheck2,
  FolderKanban,
  UsersRound,
  CalendarClock,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

// =====================================================
// TYPES
// =====================================================

type RegisteredUser = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  professional_title: string | null;
  country: string | null;
  skills: string[] | null;
  avatar_url: string | null;
  created_at: string | null;
  total_count: number;
};

type UserStats = {
  total_users: number;
  users_last_7_days: number;
  users_last_30_days: number;
  countries_count: number;
};

type UserActivity = {
  projects_created: number;
  projects_joined: number;
  activity_records: number;
  total_active_ms: number;
  files_saved: number;
  total_sessions: number;
  last_active: string | null;
};


// =====================================================
// CONSTANTS
// =====================================================

const PAGE_SIZE = 20;

const EMPTY_STATS: UserStats = {
  total_users: 0,
  users_last_7_days: 0,
  users_last_30_days: 0,
  countries_count: 0,
};

// =====================================================
// HELPERS
// =====================================================

function formatDate(date: string | null) {
  if (!date) return "Unknown";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value: number) {
  return (value ?? 0).toLocaleString();
}

function getInitials(name: string | null) {
  if (!name) return "U";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatActiveTime(milliseconds: number) {
  const safeMilliseconds = Math.max(0, Number(milliseconds) || 0);
  const hours = Math.floor(safeMilliseconds / 3_600_000);
  const minutes = Math.floor((safeMilliseconds % 3_600_000) / 60_000);

  if (hours === 0 && minutes === 0) {
    return safeMilliseconds > 0 ? "Less than 1 min" : "0 min";
  }

  if (hours === 0) return `${minutes} min`;
  return `${hours}h ${minutes}m`;
}

function formatLastActive(date: string | null) {
  if (!date) return "No recorded activity";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Unavailable";

  return parsedDate.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =====================================================
// SKELETONS
// =====================================================

function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="h-3 w-28 animate-pulse rounded bg-surface-secondary" />
      <div className="mt-4 h-8 w-20 animate-pulse rounded bg-surface-secondary" />
      <div className="mt-3 h-3 w-32 animate-pulse rounded bg-surface-secondary" />
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-surface-secondary" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-36 max-w-full animate-pulse rounded bg-surface-secondary" />
            <div className="h-3 w-52 max-w-full animate-pulse rounded bg-surface-secondary" />
          </div>

          <div className="hidden h-3 w-24 animate-pulse rounded bg-surface-secondary sm:block" />
          <div className="hidden h-3 w-20 animate-pulse rounded bg-surface-secondary md:block" />
        </div>
      ))}
    </div>
  );
}

// =====================================================
// AVATAR
// =====================================================

function UserAvatar({
  user,
  size = "normal",
}: {
  user: RegisteredUser;
  size?: "normal" | "large";
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const dimensions =
    size === "large" ? "h-16 w-16 text-lg" : "h-11 w-11 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#00AFEF]/10 font-semibold text-[#00AFEF] ${dimensions}`}
    >
      {user.avatar_url && !imageFailed ? (
        <img
          src={user.avatar_url}
          alt={user.full_name || "User avatar"}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        getInitials(user.full_name)
      )}
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-[#00AFEF]/30">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted">{label}</p>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00AFEF]/10">
          <Icon size={17} className="text-[#00AFEF]" />
        </div>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight">
        {formatNumber(value)}
      </p>

      <p className="mt-1 text-xs text-muted">{description}</p>
    </div>
  );
}

// =====================================================
// USER DETAILS MODAL
// =====================================================

function UserDetailsModal({
  user,
  onClose,
}: {
  user: RegisteredUser;
  onClose: () => void;
}) {
  const [activity, setActivity] = useState<UserActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    async function loadUserActivity() {
      setActivityLoading(true);
      setActivityError("");
      setActivity(null);

      const { data, error } = await supabase.rpc("admin_get_user_activity", {
        p_user_id: user.user_id,
      });

      if (cancelled) return;

      if (error) {
        console.error("User activity loading error:", error);
        setActivityError(error.message || "Unable to load user activity.");
        setActivityLoading(false);
        return;
      }

      const result = Array.isArray(data) ? data[0] : data;

      setActivity({
        projects_created: Number(result?.projects_created ?? 0),
        projects_joined: Number(result?.projects_joined ?? 0),
        activity_records: Number(result?.activity_records ?? 0),
        total_active_ms: Number(result?.total_active_ms ?? 0),
        files_saved: Number(result?.files_saved ?? 0),
        total_sessions: Number(result?.total_sessions ?? 0),
        last_active: result?.last_active ?? null,
      });
      setActivityLoading(false);
    }

    loadUserActivity();
    return () => {
      cancelled = true;
    };
  }, [user.user_id]);

  const activityMetrics = [
    {
      label: "Projects created",
      value: activity?.projects_created ?? 0,
      icon: FolderKanban,
      description: "Projects owned by this user",
    },
    {
      label: "Projects joined",
      value: activity?.projects_joined ?? 0,
      icon: UsersRound,
      description: "Active team memberships",
    },
    {
      label: "Activity records",
      value: activity?.activity_records ?? 0,
      icon: Activity,
      description: "Recorded developer activity entries",
    },
    {
      label: "Sessions",
      value: activity?.total_sessions ?? 0,
      icon: Clock3,
      description: "Tracked development sessions",
    },
    {
      label: "Files saved",
      value: activity?.files_saved ?? 0,
      icon: FileCheck2,
      description: "Files saved during tracked activity",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 id="user-details-title" className="font-semibold">User Profile</h2>
            <p className="mt-1 text-xs text-muted">
              Profile information and platform activity
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close user details"
            className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex flex-col items-center text-center">
            <UserAvatar user={user} size="large" />
            <h3 className="mt-3 text-lg font-semibold">
              {user.full_name || "Unnamed user"}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {user.professional_title || "No professional title"}
            </p>
            <span className="mt-3 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
              Registered
            </span>
          </div>

          <div className="mt-6 space-y-4">
            <DetailRow icon={Mail} label="Email address" value={user.email || "Unavailable"} />
            <DetailRow icon={MapPin} label="Country" value={user.country || "Not provided"} />
            <DetailRow icon={Briefcase} label="Professional title" value={user.professional_title || "Not provided"} />
            <DetailRow icon={CalendarDays} label="Registration date" value={formatDate(user.created_at)} />
          </div>

          <div className="mt-7 border-t border-border pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold">Projects & Activity</h4>
                <p className="mt-1 text-xs text-muted">
                  Contribution and development activity recorded on the platform.
                </p>
              </div>
              <Activity size={18} className="text-[#00AFEF]" />
            </div>

            {activityLoading ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="rounded-xl border border-border bg-surface-secondary p-4">
                    <div className="h-3 w-28 animate-pulse rounded bg-border" />
                    <div className="mt-3 h-7 w-16 animate-pulse rounded bg-border" />
                    <div className="mt-2 h-3 w-36 max-w-full animate-pulse rounded bg-border" />
                  </div>
                ))}
              </div>
            ) : activityError ? (
              <div role="alert" className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                <div className="flex items-start gap-2 text-sm text-red-500">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Unable to load activity statistics</p>
                    <p className="mt-1 break-words text-xs">{activityError}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {activityMetrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div key={metric.label} className="rounded-xl border border-border bg-surface-secondary p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-medium text-muted">{metric.label}</p>
                          <Icon size={16} className="text-[#00AFEF]" />
                        </div>
                        <p className="mt-2 text-2xl font-bold tracking-tight">
                          {formatNumber(metric.value)}
                        </p>
                        <p className="mt-1 text-[11px] text-muted">{metric.description}</p>
                      </div>
                    );
                  })}

                  <div className="rounded-xl border border-border bg-surface-secondary p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-muted">Total active time</p>
                      <Clock3 size={16} className="text-[#00AFEF]" />
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight">
                      {formatActiveTime(activity?.total_active_ms ?? 0)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      Combined tracked development time
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-border bg-surface-secondary p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00AFEF]/10">
                      <CalendarClock size={17} className="text-[#00AFEF]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted">Last recorded activity</p>
                      <p className="mt-1 text-sm font-semibold">
                        {formatLastActive(activity?.last_active ?? null)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <h4 className="text-sm font-semibold">Skills</h4>
            {user.skills && user.skills.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="rounded-lg border border-border bg-surface-secondary px-3 py-1.5 text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">No skills listed.</p>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-surface-secondary p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">User ID</p>
            <p className="mt-1 break-all font-mono text-xs text-foreground">{user.user_id}</p>
          </div>
        </div>

        <div className="flex justify-end border-t border-border p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#00AFEF] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
        <Icon size={16} className="text-[#00AFEF]" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function RegisteredUsersPage() {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [countries, setCountries] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [country, setCountry] = useState("");

  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const [selectedUser, setSelectedUser] =
    useState<RegisteredUser | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

  // ---------------------------------------------------
  // FETCH STATISTICS
  // ---------------------------------------------------

  const loadStats = useCallback(async () => {
    const { data, error } = await supabase.rpc(
      "admin_registered_user_stats"
    );

    if (error) {
      console.error("User statistics error:", error);
      throw error;
    }

    const result = data?.[0] as UserStats | undefined;

    if (result) {
      setStats({
        total_users: Number(result.total_users ?? 0),
        users_last_7_days: Number(result.users_last_7_days ?? 0),
        users_last_30_days: Number(result.users_last_30_days ?? 0),
        countries_count: Number(result.countries_count ?? 0),
      });
    }
  }, []);

  // ---------------------------------------------------
  // FETCH USER DIRECTORY 
  // ---------------------------------------------------

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase.rpc(
      "admin_list_registered_users",
      {
        p_search: appliedSearch || null,
        p_country: country || null,
        p_page: page,
        p_page_size: PAGE_SIZE,
      }
    );

    if (error) {
      console.error("Registered users error:", error);
      throw error;
    }

    const records = (data ?? []) as RegisteredUser[];

    setUsers(records);

    setTotalUsers(
      records.length > 0
        ? Number(records[0].total_count)
        : 0
    );
  }, [appliedSearch, country, page]);

  // ---------------------------------------------------
  // FETCH COUNTRY FILTER OPTIONS
  // ---------------------------------------------------

  const loadCountries = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("country")
      .not("country", "is", null);

    if (error) {
      console.error("Country list error:", error);
      return;
    }

    const uniqueCountries = Array.from(
      new Set(
        (data ?? [])
          .map((item) => item.country?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ).sort((a, b) => a.localeCompare(b));

    setCountries(uniqueCountries);
  }, []);

  // ---------------------------------------------------
  // LOAD ALL PAGE DATA
  // ---------------------------------------------------

  const loadData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      try {
        await Promise.all([
          loadStats(),
          loadUsers(),
          loadCountries(),
        ]);
      } catch (err) {
        console.error("Registered users loading failed:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load registered users. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadStats, loadUsers, loadCountries]
  );

  // Initial load and changes to search/filter/page.
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------
  // SEARCH DEBOUNCE 
  // ---------------------------------------------------

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setAppliedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  // ---------------------------------------------------
  // REALTIME PROFILE UPDATES
  // ---------------------------------------------------

  useEffect(() => {
    const channel = supabase
      .channel("admin-registered-users")
      .on(
        "postgres_changes",
        {
          event: "*", 
          schema: "public",
          table: "profiles",
        },
        () => {
          loadData(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // ---------------------------------------------------
  // PAGINATION // 
  // ---------------------------------- -----------------

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index
    );
  }, [page, totalPages]);

  const showingFrom =
    totalUsers === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const showingTo = Math.min(
    page * PAGE_SIZE,
    totalUsers
  );

  // ---------------------------------------------------
  // RENDER 
  // ---------------------------------------------------

  return (
    <div className="space-y-7">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold">
            Registered Users
          </h2>

          <p className="mt-1 text-sm text-muted">
            Monitor and manage everyone registered on BuildersAfrica.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing || loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-secondary disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500"
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" />

          <div className="min-w-0 flex-1">
            <p className="font-medium">
              Unable to load user information
            </p>

            <p className="mt-1 break-words text-xs">
              {error}
            </p>

            <button
              type="button"
              onClick={() => loadData(true)}
              className="mt-2 font-semibold underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* STATISTICS */}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatSkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Users"
            value={stats.total_users}
            description="Registered platform accounts"
            icon={Users}
          />

          <StatCard
            label="New This Week"
            value={stats.users_last_7_days}
            description="Registrations in the last 7 days"
            icon={UserPlus}
          />

          <StatCard
            label="New This Month"
            value={stats.users_last_30_days}
            description="Registrations in the last 30 days"
            icon={CalendarDays}
          />

          <StatCard
            label="Countries"
            value={stats.countries_count}
            description="Countries represented in profiles"
            icon={Globe2}
          />
        </div>
      )}

      {/* USER DIRECTORY */}

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* SECTION HEADER */}

        <div className="flex flex-col justify-between gap-3 border-b border-border p-5 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-semibold">User Directory</h3>

            <p className="mt-1 text-xs text-muted">
              View registered members and their profile information.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2">
            <Users size={15} className="text-[#00AFEF]" />
            <span className="text-xs font-medium">
              {formatNumber(totalUsers)} users
            </span>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}

        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or profession..."
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-[#00AFEF]"
            />
          </div>

          <div className="relative sm:w-56">
            <Filter
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />

            <select
              value={country}
              onChange={(event) => {
                setCountry(event.target.value);
                setPage(1);
              }}
              className="w-full appearance-none rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[#00AFEF]"
            >
              <option value="">All countries</option>

              {countries.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE*/}

        {loading ? (
          <UsersSkeleton />
        ) : users.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-secondary">
              <UserRound size={25} className="text-muted" />
            </div>

            <h4 className="mt-4 font-semibold">
              No users found
            </h4>

            <p className="mt-1 text-sm text-muted">
              {search || country
                ? "Try changing your search or filters."
                : "Registered users will appear here."}
            </p>

            {(search || country) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setAppliedSearch("");
                  setCountry("");
                  setPage(1);
                }}
                className="mt-4 text-sm font-semibold text-[#00AFEF] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-surface-secondary/70">
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Professional Title</th>
                    <th className="px-5 py-3">Country</th>
                    <th className="px-5 py-3">Skills</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr
                      key={user.user_id}
                      className="transition-colors hover:bg-surface-secondary/50"
                    >
                      {/* USER */}

                      <td className="px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <UserAvatar user={user} />

                          <div className="min-w-0">
                            <p className="max-w-[190px] truncate text-sm font-semibold">
                              {user.full_name || "Unnamed user"}
                            </p>

                            <p className="mt-1 max-w-[190px] truncate text-xs text-muted">
                              {user.email || "Email unavailable"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* PROFESSIONAL TITLE */}

                      <td className="px-5 py-4">
                        <span className="text-sm text-foreground">
                          {user.professional_title || "Not provided"}
                        </span>
                      </td>

                      {/* COUNTRY */}

                      <td className="px-5 py-4">
                        <span className="text-sm text-foreground">
                          {user.country || "Not provided"}
                        </span>
                      </td>

                      {/* SKILLS */}

                      <td className="px-5 py-4">
                        <div className="flex max-w-[180px] flex-wrap gap-1.5">
                          {user.skills && user.skills.length > 0 ? (
                            <>
                              {user.skills.slice(0, 2).map((skill, index) => (
                                <span
                                  key={`${skill}-${index}`}
                                  className="rounded-md bg-surface-secondary px-2 py-1 text-[10px] font-medium"
                                >
                                  {skill}
                                </span>
                              ))}

                              {user.skills.length > 2 && (
                                <span className="rounded-md bg-[#00AFEF]/10 px-2 py-1 text-[10px] font-medium text-[#00AFEF]">
                                  +{user.skills.length - 2}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted">
                              Not listed
                            </span>
                          )}
                        </div>
                      </td>

                      {/* JOINED */}

                      <td className="whitespace-nowrap px-5 py-4 text-xs text-muted">
                        {formatDate(user.created_at)}
                      </td>

                      {/* ACTION */}

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:border-[#00AFEF]/40 hover:text-[#00AFEF]"
                        >
                          View
                          <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}

            <div className="flex flex-col justify-between gap-4 border-t border-border px-5 py-4 sm:flex-row sm:items-center">
              <p className="text-xs text-muted">
                Showing{" "}
                <span className="font-semibold text-foreground">
                  {showingFrom}-{showingTo}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground">
                  {formatNumber(totalUsers)}
                </span>{" "}
                users
              </p>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                  aria-label="Previous page"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNumbers.map((number) => (
                  <button
                    type="button"
                    key={number}
                    onClick={() => setPage(number)}
                    aria-current={page === number ? "page" : undefined}
                    className={`h-9 min-w-9 rounded-lg px-2 text-xs font-semibold transition-colors ${
                      page === number
                        ? "bg-[#00AFEF] text-white"
                        : "border border-border hover:bg-surface-secondary"
                    }`}
                  >
                    {number}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                  aria-label="Next page"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* USER DETAILS */}

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* FOOTER */}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <p>BuildersAfrica Administration</p>

        <p className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Profile updates monitored through Realtime
        </p>
      </div>
    </div>
  );
}

