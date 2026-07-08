"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* The Ascent — the dashboard's signature. The validation pipeline drawn as a
   swisstopo cross-section: each stage is a camp on the route, every contact a
   waypoint dot at its current altitude. Hover a dot to see who it is; click to
   open them in Contacts. Click a stage to open the board. */

export type AscentStage = {
  id: string;
  label: string;
  contacts: { id: string; name: string; company: string | null }[];
};

const W = 1000;
const H = 300;
const AXIS_Y = 258;
const MAX_DOTS = 10;

type Tip = { x: number; y: number; title: string; sub: string };

export function AscentChart({ stages }: { stages: AscentStage[] }) {
  const router = useRouter();
  const [tip, setTip] = useState<Tip | null>(null);
  const n = stages.length;
  const total = stages.reduce((sum, s) => sum + s.contacts.length, 0);

  // Camp geometry: even spread, linear climb from low left to summit right.
  const px = (i: number) => 80 + (i * (W - 160)) / Math.max(1, n - 1);
  const py = (i: number) => 228 - (i * 170) / Math.max(1, n - 1);
  const pts = stages.map((_, i) => [px(i), py(i)] as const);

  const terrain = `0,246 ${pts.map(([x, y]) => `${x},${y}`).join(" ")} ${W},${
    py(n - 1) - 16
  }`;
  const glacier = `M0,246 ${pts.map(([x, y]) => `L${x},${y}`).join(" ")} L${W},${
    py(n - 1) - 16
  } L${W},${H} L0,${H} Z`;

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="min-w-[640px] motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
          role="img"
          aria-label={`Validation route: ${total} contacts across ${n} stages`}
        >
          {/* glacier body */}
          <path d={glacier} fill="#33688c" opacity="0.07" />
          {/* elevation grid */}
          {[40, 92, 144, 196, 248].map((y) => (
            <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="var(--border)" strokeWidth="1" />
          ))}
          {/* terrain + route */}
          <polyline points={terrain} stroke="var(--foreground)" strokeWidth="1.5" fill="none" />
          <polyline
            points={pts.map(([x, y]) => `${x},${y}`).join(" ")}
            stroke="var(--signal)"
            strokeWidth="2"
            fill="none"
          />

          {stages.map((stage, i) => {
            const [x, y] = pts[i];
            const summit = i === n - 1;
            const shown = stage.contacts.slice(0, MAX_DOTS);
            const extra = stage.contacts.length - shown.length;
            return (
              <g key={stage.id}>
                {/* contact waypoints stacked above the camp */}
                {shown.map((c, j) => {
                  const cy = y - 18 - j * 14;
                  return (
                    <circle
                      key={c.id}
                      cx={x}
                      cy={cy}
                      r="5"
                      fill="var(--background)"
                      stroke="var(--foreground)"
                      strokeWidth="1.5"
                      className="cursor-pointer transition-[fill] duration-150 hover:fill-[var(--signal)]"
                      tabIndex={0}
                      role="link"
                      aria-label={`${c.name} — open in contacts`}
                      onMouseEnter={() =>
                        setTip({ x, y: cy, title: c.name, sub: c.company ?? stage.label })
                      }
                      onMouseLeave={() => setTip(null)}
                      onFocus={() =>
                        setTip({ x, y: cy, title: c.name, sub: c.company ?? stage.label })
                      }
                      onBlur={() => setTip(null)}
                      onClick={() => router.push(`/contacts?q=${encodeURIComponent(c.name)}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          router.push(`/contacts?q=${encodeURIComponent(c.name)}`);
                      }}
                    />
                  );
                })}
                {extra > 0 && (
                  <text
                    x={x}
                    y={y - 18 - MAX_DOTS * 14}
                    textAnchor="middle"
                    className="fill-muted-foreground font-mono"
                    fontSize="10"
                  >
                    +{extra}
                  </text>
                )}

                {/* the camp itself */}
                <circle
                  cx={x}
                  cy={y}
                  r={summit ? 6 : 4.5}
                  fill={
                    summit
                      ? "var(--signal)"
                      : stage.contacts.length > 0
                        ? "var(--foreground)"
                        : "var(--background)"
                  }
                  stroke={stage.contacts.length > 0 || summit ? "none" : "var(--input)"}
                  strokeWidth="1.5"
                />
                {/* stage label + count: click through to the board */}
                <g
                  className="cursor-pointer"
                  role="link"
                  aria-label={`${stage.label}: ${stage.contacts.length} contacts — open board`}
                  onClick={() => router.push("/board")}
                >
                  <text
                    x={x}
                    y={AXIS_Y + 18}
                    textAnchor="middle"
                    className="font-mono uppercase"
                    fontSize="10"
                    letterSpacing="1.2"
                    style={{ fill: summit ? "var(--signal)" : "var(--foreground)" }}
                  >
                    {stage.label}
                  </text>
                  <text
                    x={x}
                    y={AXIS_Y + 34}
                    textAnchor="middle"
                    className="fill-muted-foreground font-mono"
                    fontSize="11"
                  >
                    {stage.contacts.length}
                  </text>
                </g>
              </g>
            );
          })}

          {/* base rule */}
          <line x1="0" y1={AXIS_Y} x2={W} y2={AXIS_Y} stroke="var(--foreground)" strokeWidth="1.5" />
        </svg>
      </div>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full border border-foreground bg-background px-2.5 py-1.5"
          style={{ left: `${(tip.x / W) * 100}%`, top: `${(tip.y / H) * 100}%` }}
          role="status"
        >
          <p className="text-[12px] leading-tight font-semibold whitespace-nowrap">{tip.title}</p>
          <p className="type-legend mt-0.5 whitespace-nowrap text-muted-foreground">{tip.sub}</p>
        </div>
      )}

      {total === 0 && (
        <p className="absolute inset-x-0 top-6 text-center text-[13px] text-muted-foreground">
          No contacts on the route yet. Add your first from the sidebar.
        </p>
      )}
    </div>
  );
}
