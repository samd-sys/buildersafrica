export type Project = {
  id: string;
  title: string;
  description: string;
  logo_url: string;
  user_id: string;
  team_needs: string[] | string | null;
};

export type Position = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  is_open: boolean;
  created_at: string;
};

export type Application = {
  id: string;
  project_id: string;
  position_id: string;
  applicant_id: string;
  full_name: string;
  experience: string | null;
  skills: string[];
  portfolio_links: string[];
  motivation: string | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  // Joined
  position_title?: string;
  applicant_name?: string;
  applicant_avatar?: string;
  applicant_title?: string;
};

// Auto-generated description for a role when no custom one exists
export function defaultPositionDescription(role: string, projectTitle: string): string {
  return `We are looking for a ${role} to join the ${projectTitle} team. Apply if you have relevant experience and want to contribute to this project.`;
}

// Normalise team_needs from whatever shape Supabase returns
export function normTeamNeeds(val: string[] | string | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter(Boolean);
  const trimmed = val.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch { /* fall through */ }
  }
  return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
}