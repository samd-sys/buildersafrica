import type { MyGithubData, ProjectGithubData } from "@/lib/activity/github";
import type { MyActivityData, ProjectActivityData } from "@/lib/activity/types";
import { computePersonalFacts, computeProjectFacts } from "./facts";
import { insightsFromPersonalFacts, insightsFromProjectFacts } from "./rules";
import type { Insight } from "./types";

export function projectInsights(
  activity: ProjectActivityData,
  github: ProjectGithubData | null,
  todayKey: string,
  todayUtc: string
): Insight[] {
  return insightsFromProjectFacts(computeProjectFacts(activity, github, todayKey, todayUtc));
}

export function personalInsights(mine: MyActivityData, github: MyGithubData | null): Insight[] {
  return insightsFromPersonalFacts(computePersonalFacts(mine, github));
}

export type { Insight } from "./types";