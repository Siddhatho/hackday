"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

/* ===================== TYPES ===================== */

type Tag = "support" | "neutral" | "distract";

type Thought = {
  id: string;
  text: string;
  tag: Tag;
  angle: number;
  radius: number;
  createdAt: number;
};

/* ===================== CONSTANTS ===================== */

const TAG_LABEL: Record<Tag, string> = {
  support: "✅ Supports",
  neutral: "⚠️ Neutral",
  distract: "❌ Distracts",
};

const TAG_RADIUS: Record<Tag, number> = {
  support: 90,
  neutral: 170,
  distract: 260,
};

const LS_KEY = "focus_compass_v1";

/* ===================== STORAGE ===================== */

function saveState(anchor: string, thoughts: Thought[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ anchor, thoughts }));
  } catch {}
}

function loadState(): { anchor: string; thoughts: Thought[] } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw
      ? (JSON.parse(raw) as { anchor: string; thoughts: Thought[] })
      : null;
  } catch {
    return null;
  }
}

function TagIcon({ t }: { t: Tag }) {
  return <span>{t === "support" ? "✅" : t === "neutral" ? "⚠️" : "❌"}</span>;
}

/* ===================== COMPONENT ===================== */

export default function FocusCompass() {
  const { user, logout } = useAuth();

  const [anchor, setAnchor] = useState("Finish my hackday project");
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState<Tag>("support");
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [whisper, setWhisper] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  /* ===== Mount + restore ===== */
  useEffect(() => {
    setMounted(true);
    const s = loadState();
    if (s) {
      setAnchor(s.anchor || "Finish my hackday project");
      setThoughts(Array.isArray(s.thoughts) ? s.thoughts : []);
    }
  }, []);

  /* ===== Autosave ===== */
  useEffect(() => {
    if (!mounted) return;
    saveState(anchor, thoughts);
  }, [anchor, thoughts, mounted]);

  /* ===== Drift animation ===== */
  useEffect(() => {
    if (!mounted) return;
    const t = setInterval(() => {
      setThoughts((prev) =>
        prev.map((th) =>
          th.tag === "distract"
            ? { ...th, radius: Math.min(th.radius + 0.6, 360) }
            : th
        )
      );
    }, 50);
    return () => clearInterval(t);
  }, [mounted]);

  /* ===================== ACTIONS ===================== */

  const addThought = (textRaw?: string, tagOverride?: Tag) => {
    const text = (textRaw ?? draft).trim();
    const usedTag = tagOverride ?? tag;
    if (!text) return;

    const th: Thought = {
      id: crypto.randomUUID(),
      text,
      tag: usedTag,
      angle: Math.random() * Math.PI * 2,
      radius: TAG_RADIUS[usedTag],
      createdAt: Date.now(),
    };

    setThoughts((p) => [th, ...p]);
    setDraft("");

    if (usedTag === "distract") {
      const lines = [
        "You chose this anyway.",
        "This didn’t serve your anchor.",
        "You noticed it. That’s the return.",
      ];
      setWhisper(lines[Math.floor(Math.random() * lines.length)]);
      setTimeout(() => setWhisper(null), 1100);
    }
  };

  const loadDemo = () => {
    setThoughts([]);
    addThought("Design UI flow", "support");
    addThought("Break problem into steps", "support");
    addThought("Refactor backend again", "neutral");
    addThought("Check Instagram", "distract");
  };

  const resetAll = () => {
    setAnchor("Finish my hackday project");
    setDraft("");
    setTag("support");
    setThoughts([]);
    setWhisper(null);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  };

  /* ===================== RENDER ===================== */

  if (!mounted) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-6 grid gap-6">

        {/* Header */}
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Focus Compass</h1>
            <p className="text-zinc-400">
              Wander freely. Keep what matters visible.
            </p>
            {user?.email && (
              <p className="text-xs text-zinc-500 mt-1">
                Signed in as {user.email}
              </p>
            )}
          </div>

          <button
            onClick={logout}
            className="rounded-xl px-3 py-2 text-sm border border-zinc-700 bg-zinc-950/30 text-zinc-200 hover:border-zinc-500"
          >
            Logout
          </button>
        </header>

        {/* Controls */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-sm text-zinc-400 mb-2">Anchor</div>
            <input
              className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800 px-3 py-2"
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-sm text-zinc-400 mb-2">Add a thought</div>
            <input
              className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800 px-3 py-2"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addThought()}
            />

            <div className="mt-3 flex gap-2 flex-wrap">
              {(["support", "neutral", "distract"] as Tag[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  className={`rounded-xl px-3 py-2 text-sm border ${
                    tag === t
                      ? "bg-zinc-100 text-zinc-950"
                      : "border-zinc-800 text-zinc-200"
                  }`}
                >
                  <TagIcon t={t} />
                </button>
              ))}

              <button
                onClick={() => addThought()}
                className="rounded-xl px-3 py-2 border"
              >
                Add
              </button>

              <button
                onClick={loadDemo}
                className="rounded-xl px-3 py-2 border"
              >
                Demo
              </button>

              <button
                onClick={resetAll}
                className="rounded-xl px-3 py-2 border"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* Compass */}
        <Compass anchor={anchor} thoughts={thoughts} whisper={whisper} />
      </div>
    </main>
  );
}

/* ===================== COMPASS ===================== */

function Compass({
  anchor,
  thoughts,
  whisper,
}: {
  anchor: string;
  thoughts: Thought[];
  whisper: string | null;
}) {
  const cx = 340;
  const cy = 210;

  return (
    <div className="relative border border-zinc-800 rounded-2xl p-4 mt-4">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black px-4 py-2 rounded-xl">
        {anchor}
      </div>

      {thoughts.map((t) => {
        const x = cx + Math.cos(t.angle) * t.radius;
        const y = cy + Math.sin(t.angle) * t.radius;
        const opacity =
          t.tag === "distract" ? Math.max(0.35, 1 - t.radius / 360) : 1;

        return (
          <div
            key={t.id}
            style={{ left: x, top: y, opacity }}
            className="absolute text-xs px-3 py-2 border rounded-xl"
          >
            {t.text}
          </div>
        );
      })}

      {whisper && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-sm opacity-80">
          {whisper}
        </div>
      )}
    </div>
  );
}
