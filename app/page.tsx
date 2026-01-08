"use client";

import { useEffect, useState } from "react";

type Tag = "support" | "neutral" | "distract";

type Thought = {
  id: string;
  text: string;
  tag: Tag;
  angle: number;
  radius: number;
  createdAt: number;
};

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

export default function Home() {
  // ✅ Always start with server-safe defaults (prevents hydration mismatch)
  const [anchor, setAnchor] = useState("Finish my hackday project");
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState<Tag>("support");
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [whisper, setWhisper] = useState<string | null>(null);

  // ✅ Hydration gate: only render the app after mount
  const [mounted, setMounted] = useState(false);

useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setMounted(true);

  const s = loadState();
  if (s) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnchor(s.anchor || "Finish my hackday project");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThoughts(Array.isArray(s.thoughts) ? s.thoughts : []);
  }
}, []);


  // Autosave (external sync)
  useEffect(() => {
    if (!mounted) return;
    saveState(anchor, thoughts);
  }, [anchor, thoughts, mounted]);

  // Drift distract thoughts outward slowly
  useEffect(() => {
    if (!mounted) return;
    const t = setInterval(() => {
      setThoughts((prev) =>
        prev.map((th) => {
          if (th.tag !== "distract") return th;
          return { ...th, radius: Math.min(th.radius + 0.6, 360) };
        })
      );
    }, 50);
    return () => clearInterval(t);
  }, [mounted]);

  const addThought = (textRaw?: string, tagOverride?: Tag) => {
    const text = (textRaw ?? draft).trim();
    const usedTag = tagOverride ?? tag;
    if (!text) return;

    const angle = Math.random() * Math.PI * 2;
    const baseR = TAG_RADIUS[usedTag] + (Math.random() * 14 - 7);

    const th: Thought = {
      id: crypto.randomUUID(),
      text,
      tag: usedTag,
      angle,
      radius: baseR,
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
      window.setTimeout(() => setWhisper(null), 1100);
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

  // While not mounted, render a stable minimal shell (prevents mismatch)
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
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Focus Compass</h1>
          <p className="text-zinc-400">
            Wander freely. Keep what matters visible.
          </p>
        </header>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-sm text-zinc-400 mb-2">Anchor</div>
            <input
              className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-600"
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
              placeholder="What matters right now?"
            />
            <div className="text-xs text-zinc-500 mt-2">
              One anchor only. That’s the point.
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-sm text-zinc-400 mb-2">Add a thought</div>
            <input
              className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800 px-3 py-2 outline-none focus:border-zinc-600"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder='e.g., "Check Instagram"'
              onKeyDown={(e) => {
                if (e.key === "Enter") addThought();
              }}
            />

            <div className="mt-3 flex gap-2 flex-wrap items-center">
              {(["support", "neutral", "distract"] as Tag[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t)}
                  title={TAG_LABEL[t]}
                  className={
                    "rounded-xl px-3 py-2 text-sm border transition " +
                    (tag === t
                      ? "bg-zinc-100 text-zinc-950 border-zinc-100"
                      : "bg-zinc-950/30 border-zinc-800 text-zinc-200 hover:border-zinc-600")
                  }
                >
                  <TagIcon t={t} />
                </button>
              ))}

              <button
                onClick={() => addThought()}
                className="rounded-xl px-3 py-2 text-sm border border-emerald-400/60 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15"
              >
                Add
              </button>

              <button
                onClick={loadDemo}
                className="rounded-xl px-3 py-2 text-sm border border-zinc-700 bg-zinc-950/30 text-zinc-200 hover:border-zinc-500"
              >
                Demo data
              </button>

              <button
                onClick={resetAll}
                className="rounded-xl px-3 py-2 text-sm border border-zinc-700 bg-zinc-950/30 text-zinc-200 hover:border-zinc-500"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <div className="text-sm text-zinc-400 mb-2">Judge demo</div>
            <ol className="text-sm text-zinc-300 list-decimal pl-5 space-y-1">
              <li>Click “Demo data”.</li>
              <li>Point at drift + fade + whisper.</li>
              <li>Refresh: it still persists.</li>
              <li>Reset: it clears.</li>
            </ol>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="text-sm text-zinc-400 mb-3">Compass</div>
            <Compass anchor={anchor} thoughts={thoughts} whisper={whisper} />
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-zinc-400">Thoughts</div>
              <button
                onClick={() => setThoughts([])}
                className="text-xs text-zinc-400 hover:text-zinc-200"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
              {thoughts.length === 0 ? (
                <div className="text-sm text-zinc-500">
                  Add thoughts to see them organize around the anchor.
                </div>
              ) : (
                thoughts.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-3"
                  >
                    <div className="text-sm">{t.text}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      {TAG_LABEL[t.tag]}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Compass({
  anchor,
  thoughts,
  whisper,
}: {
  anchor: string;
  thoughts: Thought[];
  whisper: string | null;
}) {
  const W = 680;
  const H = 420;
  const cx = W / 2;
  const cy = H / 2;

  const rings = [
    { r: 90, label: "Support" },
    { r: 170, label: "Neutral" },
    { r: 260, label: "Distract" },
  ];

  return (
    <div className="relative">
      <div className="w-full overflow-x-auto">
        <div
          style={{ width: W, height: H }}
          className="relative rounded-2xl bg-gradient-to-b from-zinc-950/40 to-zinc-950/10 border border-zinc-800 overflow-hidden"
        >
          {rings.map((ring) => (
            <div
              key={ring.r}
              style={{
                width: ring.r * 2,
                height: ring.r * 2,
                left: cx - ring.r,
                top: cy - ring.r,
              }}
              className="absolute rounded-full border border-zinc-800/70"
            />
          ))}

          <div
            style={{ left: cx - 110, top: cy - 45, width: 220 }}
            className="absolute"
          >
            <div className="rounded-2xl bg-zinc-100 text-zinc-950 px-4 py-3 shadow-lg shadow-zinc-950/40 text-center">
              <div className="text-xs font-semibold opacity-70">ANCHOR</div>
              <div className="text-sm font-semibold leading-snug">
                {anchor || "—"}
              </div>
            </div>
          </div>

          {thoughts.map((t) => {
            const x = cx + Math.cos(t.angle) * t.radius;
            const y = cy + Math.sin(t.angle) * t.radius;

            const opacity =
              t.tag === "distract"
                ? Math.max(0.35, 1 - (t.radius - 240) / 240)
                : 1;

            const tone =
              t.tag === "support"
                ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-100"
                : t.tag === "neutral"
                ? "border-amber-300/40 bg-amber-400/10 text-amber-100"
                : "border-rose-400/40 bg-rose-500/10 text-rose-100";

            return (
              <div
                key={t.id}
                style={{ left: x - 95, top: y - 18, width: 190, opacity }}
                className={
                  "absolute rounded-xl border px-3 py-2 text-xs backdrop-blur " +
                  tone
                }
              >
                {t.text}
              </div>
            );
          })}

          {whisper && (
            <div className="absolute left-1/2 top-6 -translate-x-1/2">
              <div className="rounded-full border border-zinc-700 bg-zinc-950/70 px-4 py-2 text-sm text-zinc-200">
                {whisper}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-zinc-500 flex gap-3 flex-wrap">
        <span>● anchor</span>
        <span>✅ close</span>
        <span>⚠️ float</span>
        <span>❌ drift + fade</span>
      </div>
    </div>
  );
}
