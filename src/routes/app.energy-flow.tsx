import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sun, Wind, BatteryCharging, Plug, Factory, Flame, Building2 } from "lucide-react";
import { GlassCard, PageHeader, StatusPill } from "@/components/ui-kit";
import { inr, useLiveEnergy, type EnergySource } from "@/lib/energy";

export const Route = createFileRoute("/app/energy-flow")({
  head: () => ({
    meta: [
      { title: "Live Energy Flow — IntelliGrid AI" },
      {
        name: "description",
        content:
          "Animated real-time energy flow from solar, wind, battery, grid, captive plant and diesel into the factory.",
      },
      { property: "og:title", content: "Live Energy Flow — IntelliGrid AI" },
      {
        property: "og:description",
        content: "Watch megawatts move across the plant network in real time.",
      },
    ],
  }),
  component: EnergyFlow,
});

const icons = {
  solar: Sun,
  wind: Wind,
  battery: BatteryCharging,
  grid: Plug,
  captive: Building2,
  diesel: Flame,
} as const;

const colors = {
  solar: "var(--warn)",
  wind: "var(--cyan)",
  battery: "var(--chart-5)",
  grid: "var(--primary)",
  captive: "var(--chart-3)",
  diesel: "var(--destructive)",
} as const;

function toneFor(status: EnergySource["status"]) {
  if (status === "Optimal" || status === "Available") return "eco" as const;
  if (status === "Charging") return "cyan" as const;
  if (status === "Offline") return "destructive" as const;
  return "muted" as const;
}

function EnergyFlow() {
  const s = useLiveEnergy(2500);
  const total = s.sources.reduce((a, b) => a + b.mw, 0) || 1;

  return (
    <div>
      <PageHeader
        title="Live Energy Flow"
        subtitle="Source-to-load power routing with live losses, cost and carbon"
        right={<StatusPill status={`${s.demand.toFixed(0)} MW factory load`} tone="cyan" />}
      />

      <GlassCard className="grid-lines overflow-hidden">
        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="relative">
            <svg viewBox="0 0 640 420" className="w-full">
              <defs>
                <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--eco)" />
                </linearGradient>
              </defs>
              {s.sources.map((src, i) => {
                const y = 30 + i * 68;
                const w = Math.max(1.5, (src.mw / total) * 26);
                return (
                  <g key={src.key}>
                    <path
                      d={`M 150 ${y} C 300 ${y}, 340 210, 470 210`}
                      fill="none"
                      stroke="var(--border)"
                      strokeWidth={w}
                      strokeLinecap="round"
                      opacity={0.5}
                    />
                    <path
                      d={`M 150 ${y} C 300 ${y}, 340 210, 470 210`}
                      fill="none"
                      stroke={colors[src.key]}
                      strokeWidth={w}
                      strokeLinecap="round"
                      strokeDasharray="14 18"
                      style={{
                        animation: `dash-flow ${Math.max(1.2, 6 - src.mw / 45)}s linear infinite`,
                        opacity: src.mw > 1 ? 0.95 : 0.2,
                      }}
                    />
                    <text x="8" y={y + 4} fill="var(--muted-foreground)" fontSize="12">
                      {src.name}
                    </text>
                    <text x="8" y={y + 20} fill={colors[src.key]} fontSize="13" fontWeight="600">
                      {src.mw.toFixed(1)} MW
                    </text>
                  </g>
                );
              })}
              <motion.circle
                cx="470"
                cy="210"
                r="46"
                fill="var(--card)"
                stroke="url(#flowGrad)"
                strokeWidth="2"
                animate={{ r: [44, 48, 44] }}
                transition={{ duration: 2.4, repeat: Infinity }}
              />
              <text x="470" y="205" textAnchor="middle" fill="var(--foreground)" fontSize="13">
                FACTORY
              </text>
              <text x="470" y="224" textAnchor="middle" fill="var(--eco)" fontSize="14" fontWeight="700">
                {s.demand.toFixed(0)} MW
              </text>
            </svg>
            <Factory className="pointer-events-none absolute right-6 top-4 h-6 w-6 text-muted-foreground" />
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Dispatch order</p>
            {s.sources.map((src) => (
              <div key={src.key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{src.name}</span>
                <span className="font-mono tabular-nums" style={{ color: colors[src.key] }}>
                  {((src.mw / total) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {s.sources.map((src, i) => {
          const Icon = icons[src.key];
          return (
            <GlassCard key={src.key} delay={i * 0.05}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-xl"
                    style={{ background: `color-mix(in oklab, ${colors[src.key]} 18%, transparent)` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: colors[src.key] }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{src.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {src.mw.toFixed(1)} MW live output
                    </p>
                  </div>
                </div>
                <StatusPill status={src.status} tone={toneFor(src.status)} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Efficiency</p>
                  <p className="font-semibold">{src.efficiency.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">CO₂</p>
                  <p className="font-semibold">{(src.co2 * 60).toFixed(2)} t/h</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cost</p>
                  <p className="font-semibold">{inr(src.cost)}/kWh</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: colors[src.key] }}
                  animate={{ width: `${(src.mw / 250) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
