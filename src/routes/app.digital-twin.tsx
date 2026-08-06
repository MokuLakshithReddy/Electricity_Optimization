import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Battery, Boxes, Factory, Fuel, Sun, Zap, TriangleAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassCard, Metric, PageHeader, StatusPill } from "@/components/ui-kit";
import { inr } from "@/lib/energy";

export const Route = createFileRoute("/app/digital-twin")({
  head: () => ({
    meta: [
      { title: "Digital Twin Simulator — IntelliGrid AI" },
      {
        name: "description",
        content:
          "Simulate solar expansion, battery sizing, grid failure, fuel price shocks and production growth with ROI and carbon impact.",
      },
      { property: "og:title", content: "Digital Twin Simulator — IntelliGrid AI" },
      {
        property: "og:description",
        content: "What-if scenario modelling for industrial energy investments.",
      },
    ],
  }),
  component: DigitalTwin,
});

const sliders = [
  { key: "solar", label: "Additional solar capacity", unit: "MW", min: 0, max: 250, step: 10, icon: Sun },
  { key: "battery", label: "Additional battery size", unit: "MWh", min: 0, max: 500, step: 20, icon: Battery },
  { key: "fuel", label: "Fuel price change", unit: "%", min: -30, max: 80, step: 5, icon: Fuel },
  { key: "production", label: "Production increase", unit: "%", min: 0, max: 60, step: 5, icon: Factory },
] as const;

type Key = (typeof sliders)[number]["key"];

function DigitalTwin() {
  const [vals, setVals] = useState<Record<Key, number>>({
    solar: 80,
    battery: 160,
    fuel: 10,
    production: 15,
  });
  const [gridFail, setGridFail] = useState(false);

  const result = useMemo(() => {
    const solarSave = vals.solar * 4.1e5;
    const batterySave = vals.battery * 1.9e5;
    const fuelCost = vals.fuel * 2.6e5;
    const prodCost = vals.production * 4.4e5;
    const savings = Math.max(0, solarSave + batterySave - fuelCost - prodCost * 0.35);
    const capex = vals.solar * 3.4e6 + vals.battery * 1.9e6 + 1;
    const roi = capex > 1 ? capex / Math.max(savings, 1) : 0;
    const carbon = vals.solar * 1.42 + vals.battery * 0.42 - vals.production * 3.1;
    const availability = gridFail
      ? Math.min(99.2, 88 + vals.battery / 26 + vals.solar / 60)
      : Math.min(99.99, 97.8 + vals.battery / 240);
    return { savings, roi, carbon, availability, capex };
  }, [vals, gridFail]);

  const decision = {
    demand: 500,
    solar: 180,
    wind: 60,
    battery: 80,
  };
  const actions = [
    { label: "Use Solar", detail: "Dispatch 180 MW PV first — lowest marginal cost", tone: "eco" as const },
    { label: "Use Wind", detail: "Absorb 60 MW wind, zero curtailment", tone: "cyan" as const },
    { label: "Charge Battery", detail: "Bank 40 MW surplus for the 18:00 peak", tone: "cyan" as const },
    { label: "Avoid Diesel", detail: "Gensets held at standby — ₹18.4/kWh avoided", tone: "warn" as const },
  ];

  const bars = [
    { name: "Baseline", cost: 4.62, co2: 512 },
    { name: "Simulated", cost: Math.max(2.4, 4.62 - result.savings / 3.2e7), co2: Math.max(180, 512 - result.carbon) },
  ];

  return (
    <div>
      <PageHeader
        title="Digital Twin Simulator"
        subtitle="Model capital and operating scenarios against the live plant twin"
        right={<StatusPill status="Twin synced 12s ago" tone="eco" />}
      />

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <GlassCard delay={0.05}>
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Scenario inputs</h2>
          </div>
          <div className="mt-5 space-y-6">
            {sliders.map((s) => (
              <div key={s.key}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <s.icon className="h-3.5 w-3.5" /> {s.label}
                  </span>
                  <span className="font-mono text-foreground">
                    {vals[s.key]}
                    {s.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={vals[s.key]}
                  onChange={(e) => setVals((v) => ({ ...v, [s.key]: Number(e.target.value) }))}
                  className="w-full accent-[var(--cyan)]"
                />
              </div>
            ))}
            <button
              onClick={() => setGridFail((v) => !v)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                gridFail
                  ? "border-destructive/40 bg-destructive/15 text-destructive"
                  : "border-border/70 bg-muted/40 text-muted-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4" /> Simulate grid failure
              </span>
              <span className="text-xs">{gridFail ? "ACTIVE" : "OFF"}</span>
            </button>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Projected savings" value={inr(Math.round(result.savings))} unit="/yr" tone="eco" delay={0.06} />
            <Metric label="Payback (ROI)" value={result.roi ? `${result.roi.toFixed(1)}` : "—"} unit="yrs" delay={0.09} />
            <Metric label="Carbon reduction" value={`${result.carbon.toFixed(0)}`} unit="t/yr" tone="cyan" delay={0.12} />
            <Metric
              label="Power availability"
              value={result.availability.toFixed(2)}
              unit="%"
              tone={result.availability > 99 ? "eco" : "warn"}
              delay={0.15}
            />
          </div>

          <GlassCard delay={0.18}>
            <h2 className="text-sm font-semibold">Baseline vs simulated</h2>
            <p className="text-xs text-muted-foreground">Blended ₹/kWh and annual ktCO₂</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bars}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="cost" name="₹/kWh" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="co2" name="ktCO₂" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="mt-4" delay={0.22}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan" />
            <h2 className="text-sm font-semibold">AI decision simulator</h2>
          </div>
          <StatusPill status="Reliability score 96.4" tone="eco" />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Scenario</p>
            {[
              ["Demand", `${decision.demand} MW`],
              ["Solar", `${decision.solar} MW`],
              ["Wind", `${decision.wind} MW`],
              ["Battery", `${decision.battery}%`],
              ["Grid", "Available"],
              ["Captive", "Available"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono">{v}</span>
              </div>
            ))}
          </div>

          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {actions.map((a, i) => (
                <motion.div
                  key={a.label}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="rounded-xl border border-border/60 bg-muted/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{a.label}</p>
                    <StatusPill status="Recommended" tone={a.tone} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-eco/10 p-3">
                <p className="text-xs text-muted-foreground">Money saved</p>
                <p className="font-display text-xl font-semibold text-eco">{inr(1840000)}</p>
              </div>
              <div className="rounded-xl bg-cyan/10 p-3">
                <p className="text-xs text-muted-foreground">CO₂ saved</p>
                <p className="font-display text-xl font-semibold text-cyan">86.4 t</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-3">
                <p className="text-xs text-muted-foreground">Reliability score</p>
                <p className="font-display text-xl font-semibold text-primary">96.4%</p>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
