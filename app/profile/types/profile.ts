import { Dispatch, SetStateAction } from "react";

export type RegionKey =
  | "africa"
  | "asia"
  | "australia"
  | "europe"
  | "northAmerica"
  | "southAmerica";

export type Regions = Record<RegionKey, boolean>;

export const REGION_KEYS: RegionKey[] = [
  "africa",
  "asia",
  "australia",
  "europe",
  "northAmerica",
  "southAmerica",
];

export type ProfileData = {
  name: string;
  bio: string;
  skills: string[];
  github: string;
  country: string;
  professionalTitle: string;
  linkedin: string;
  website: string;
  avatarUrl: string;
  isPublic: boolean;
  regions: Regions;
};

export type ProfileSetters = {
  setName: (value: string) => void;
  setBio: (value: string) => void;
  setSkills: Dispatch<SetStateAction<string[]>>;
  setGithub: (value: string) => void;
  setCountry: (value: string) => void;
  setProfessionalTitle: (value: string) => void;
  setLinkedin: (value: string) => void;
  setWebsite: (value: string) => void;
  setAvatarUrl: (value: string) => void;
  setIsPublic: (value: boolean) => void;
  setRegions: Dispatch<SetStateAction<Regions>>;
};