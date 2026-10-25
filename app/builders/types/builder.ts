export type Builder = {
  user_id: string;
  full_name: string;
  bio: string;
  skills: string[];
  github_url: string;
  linkedin_url: string;
  website_url: string;
  avatar_url: string;
  country: string;
  professional_title: string;
  created_at: string;
};

export type ConnectionStatus = "none" | "pending" | "accepted" | "declined";