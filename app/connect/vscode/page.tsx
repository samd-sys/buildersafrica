"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Must match "<publisher>.<name>" from the extension's package.json.
// (We add the publisher field to the extension in the next step.)
const EXTENSION_ID = "buildersafrica.buildersafrica-activity-tracker";

type Phase =
  | "checking"
  | "invalid"
  | "signed-out"
  | "ready"
  | "working"
  | "done"
  | "error";

export default function ConnectVsCodePage() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [params, setParams] = useState<{
    state: string;
    challenge: string;
  } | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const state = sp.get("state") ?? "";
    const challenge = sp.get("challenge") ?? "";

    if (
      !/^[A-Za-z0-9_-]{16,128}$/.test(state) ||
      !/^[A-Za-z0-9_-]{43}$/.test(challenge)
    ) {
      setPhase("invalid");
      return;
    }

    setParams({ state, challenge });

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setPhase("signed-out");
        return;
      }

      setEmail(session.user.email ?? null);
      setPhase("ready");
    })();
  }, []);

  const buildVsCodeUrl = (c: string, state: string) =>
    `vscode://${EXTENSION_ID}/auth-callback?code=${encodeURIComponent(
      c
    )}&state=${encodeURIComponent(state)}`;

  const handleApprove = async () => {
    if (!params) return;
    setPhase("working");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setPhase("signed-out");
        return;
      }

      const res = await fetch("/api/vscode/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ challenge: params.challenge }),
      });

      if (!res.ok) {
        setMessage("Could not create a connection code. Please try again.");
        setPhase("error");
        return;
      }

      const data: { code: string } = await res.json();
      setCode(data.code);
      setPhase("done");

      // Hand the code back to VS Code.
      window.location.href = buildVsCodeUrl(data.code, params.state);
    } catch {
      setMessage("Something went wrong. Please try again.");
      setPhase("error");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl sm:p-8">
        <h1 className="text-2xl font-bold">
          Connect <span className="text-[#00AFEF]">VS Code</span>
        </h1>

        {phase === "checking" && (
          <p className="mt-4 text-sm text-muted">Checking your session…</p>
        )}

        {phase === "invalid" && (
          <p className="mt-4 text-sm text-red-400">
            This connection link is invalid. Please start again from the
            BuildersAfrica Activity Tracker in VS Code.
          </p>
        )}

        {phase === "signed-out" && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted">
              You need to sign in to BuildersAfrica first. After signing in,
              go back to VS Code and click Connect again.
            </p>
            <Link
              href="/login"
              className="block w-full rounded-lg bg-[#00AFEF] px-4 py-3 text-center text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Sign in
            </Link>
          </div>
        )}

        {(phase === "ready" || phase === "working") && (
          <div className="mt-4 space-y-5">
            <p className="text-sm text-muted">
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {email ?? "your account"}
              </span>
            </p>

            <div className="rounded-lg border border-border bg-surface-secondary p-4 text-sm text-muted">
              <p className="mb-2 font-medium text-foreground">
                Allow the BuildersAfrica Activity Tracker extension to:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>See the list of projects you own or are a member of</li>
              </ul>
              <p className="mt-3">
                It never receives your password, messages or source code. You
                can disconnect at any time from VS Code.
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                href="/"
                className="flex-1 rounded-lg border border-border px-4 py-3 text-center text-sm text-muted hover:text-foreground"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={() => void handleApprove()}
                disabled={phase === "working"}
                className="flex-1 rounded-lg bg-[#00AFEF] px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
              >
                {phase === "working" ? "Connecting…" : "Connect"}
              </button>
            </div>
          </div>
        )}

        {phase === "done" && params && code && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted">
              Approved. Your browser should now ask to open VS Code. If
              nothing happens, use the button below.
            </p>

            <a
              href={buildVsCodeUrl(code, params.state)}
              className="block w-full rounded-lg bg-[#00AFEF] px-4 py-3 text-center text-sm font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Open VS Code
            </a>

            <div className="rounded-lg border border-border bg-surface-secondary p-3">
              <p className="mb-1 text-xs text-muted">
                Backup one-time code (valid for 5 minutes):
              </p>
              <code className="block break-all text-xs text-foreground">
                {code}
              </code>
            </div>
          </div>
        )}

        {phase === "error" && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-red-400">{message}</p>
            <button
              type="button"
              onClick={() => setPhase("ready")}
              className="w-full rounded-lg border border-border px-4 py-3 text-sm text-muted hover:text-foreground"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}