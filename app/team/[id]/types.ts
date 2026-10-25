export type TeamMember = {
  id: string;
  user_id: string;
  project_id: string;
  role: string;
  status: string;
  joined_at: string;
  // Joined from profiles
  full_name: string;
  avatar_url: string;
  professional_title: string;
  country: string;
  bio: string;
  skills: string[];
  github_url: string;
  linkedin_url: string;
  website_url: string;
  email: string;
};

export type ProjectRole = {
  id: string;
  project_id: string;
  name: string;
  permissions: string[];
};

export type Project = {
  id: string;
  title: string;
  description: string;
  logo_url: string;
  user_id: string; // founder
};

export const DEFAULT_ROLES = [
  "Project Lead",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "AI Engineer",
  "Product Manager",
  "QA Engineer",
  "DevOps Engineer",
  "Data Scientist",
  "Marketing Expert",
  "Content Writer",
  "Business Advisor",
  "Collaborator",
];