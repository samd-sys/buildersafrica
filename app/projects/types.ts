export type Project = {
  id: string;
  title: string;
  description: string;
  category: string;
  stage: string;
  location: string;
  logo_url: string;
  tech_stack: string[];
  team_needs: string[];
  problem_statement: string;
  vision: string;
  target_audience: string[];
  visibility: string;
  created_at: string;
  user_id: string;
  founderName: string;
  founderAvatar: string;
  likes: number;
  followers: number;
  rating: number;
  isLiked?: boolean;
  isFollowing?: boolean;
  isBookmarked?: boolean;
};

export type ActiveFilters = {
  category: string;
  location: string;
  openPosition: string;
  stage: string;
};

export const EMPTY_FILTERS: ActiveFilters = {
  category: "",
  location: "",
  openPosition: "",
  stage: "",
};

export const STAGE_META: Record<string, { emoji: string; label: string; color: string }> = {
  Idea:        { emoji: "", label: "Idea",        color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  Planning:    { emoji: "", label: "Planning",    color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
  Design:      { emoji: "", label: "Design",      color: "text-pink-400 bg-pink-400/10 border-pink-400/20" },
  Development: { emoji: "", label: "Development", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  Testing:     { emoji: "", label: "Testing",     color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
  Live:        { emoji: "", label: "Live",        color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
};

export const CATEGORY_OPTIONS = [
  "SaaS", "AI", "Marketplace", "Mobile App", "Website",
  "FinTech", "EdTech", "HealthTech", "Developer Tool",
  "E-commerce", "Social Platform", "Other",
];

export const OPEN_POSITION_OPTIONS = [
  "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "UI/UX Designer", "AI Engineer", "Product Manager",
  "Marketing Expert", "Business Advisor", "Investor",
  "QA Tester", "DevOps Engineer", "Data Scientist",
];

export const STAGE_OPTIONS = Object.keys(STAGE_META);

export const SORT_OPTIONS = [
  { label: "Newest",           value: "newest" },
  { label: "Trending",         value: "trending" },
  { label: "Most Liked",       value: "liked" },
  { label: "Most Viewed",      value: "viewed" },
  { label: "Recently Updated", value: "updated" },
];