"use client";

import PageShell from "@/components/activity/PageShell";
import GitHubConnectionCard from "@/components/github/GitHubConnectionCard";

export default function GitHubConnectionPage() {
  return (
    <PageShell
      title="GitHub"
      description="Connect your GitHub account so development activity can be attributed to you."
    >
      <GitHubConnectionCard />
    </PageShell>
  );
}