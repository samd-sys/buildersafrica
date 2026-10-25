export type ProjectData = {
  title: string;
  description: string;
  category: string;
  problemStatement: string;
  targetAudience: string[];
  location: string;
  stage: string;
  teamNeeds: string[];
  techStack: string[];
  logoUrl: string;
  vision: string;
};

export const EMPTY_PROJECT: ProjectData = {
  title: "",
  description: "",
  category: "",
  problemStatement: "",
  targetAudience: [],
  location: "",
  stage: "",
  teamNeeds: [],
  techStack: [],
  logoUrl: "",
  vision: "",
};

export const CATEGORIES = [
  { label: "SaaS", },
  { label: "AI", },
  { label: "Marketplace", },
  { label: "Mobile App",},
  { label: "Website", },
  { label: "FinTech", },
  { label: "EdTech", },
  { label: "HealthTech", },
  { label: "Developer Tool", },
  { label: "E-commerce", },
  { label: "Social Platform", },
  { label: "Other", },
];

export const AUDIENCE_OPTIONS = [
  "Students",
  "Businesses",
  "Developers",
  "Startups",
  "Freelancers",
  "Government",
  "NGOs",
  "Creators",
  "General Public",
];

export const STAGE_OPTIONS = [
  { label: "Idea",  description: "Just a concept in my head" },
  { label: "Planning", description: "Mapping out the details" },
  { label: "Design",  description: "Working on the UI/UX" },
  { label: "Development",  description: "Building the product" },
  { label: "Testing",  description: "Validating with users" },
  { label: "Live",  description: "Already launched" },
];

export const TEAM_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "AI Engineer",
  "Product Manager",
  "Marketing Expert",
  "Business Advisor",
  "Investor",
  "QA Tester",
  "DevOps Engineer",
  "Data Scientist",
];

export const TECH_SUGGESTIONS = [
  "React", "Next.js", "Vue.js", "Angular", "Svelte",
  "Node.js", "Python", "Django", "FastAPI", "Go",
  "PostgreSQL", "MySQL", "MongoDB", "Supabase", "Firebase",
  "TypeScript", "JavaScript", "Flutter", "React Native",
  "AWS", "GCP", "Azure", "Docker", "Kubernetes",
  "TailwindCSS", "GraphQL", "REST API", "OpenAI",
];