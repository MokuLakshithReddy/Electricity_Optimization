import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Battery, Calculator, Scale, Sun, Wind, Check } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard, Metric, PageHeader, StatusPill } from "@/components/ui-kit";
import { ConfidenceRing } from "@/components/ExplainableCard";
import { inr } from "@/lib/energy";
import { computeRoi, strategies } from "@/lib/intel";

import { StrategyComparison } from "@/components/strategy/StrategyComparison";

export const Route = createFileRoute("/app/scenarios")({
  head: () => ({
    meta: [
      { title: "Scenario Comparison & ROI — IntelliGrid AI" },
      {
        name: "description",
        content:
          "Compare current, cost-optimized, carbon-optimized and balanced dispatch strategies, and model ROI for solar, battery and wind investments.",
      },
      { property: "og:title", content: "Scenario Comparison & ROI — IntelliGrid AI" },
      {
        property: "og:description",
        content: "Investment-grade strategy comparison and payback modelling.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Scenarios,
});

const toneColor: Record<string, string> = {
  muted: "var(--muted-foreground)",
  eco: "var(--eco)",
  cyan: "var(--cyan)",
  primary: "var(--primary)",
};

function Scenarios() {
  const [selected, setSelected] = useState("balanced");
  const [solarMw, setSolarMw] = useState(80);
  const [batteryMwh, setBatteryMwh] = useState(200);
  const [windMw, setWindMw] = useState(40);

  const roi = useMemo(
    () => computeRoi({ solarMw, batteryMwh, windMw }),
    [solarMw, batteryMwh, windMw],
  );

  const radar = ["Cost", "Carbon", "Renewable", "Reliability", "Payback"].map((axis) => {
    const row: Record<string, string | number> = { axis };
    strategies.forEach((s) => {
      row[s.name] =
        axis === "Cost"
          ? Math.round(((1284 - s.cost) / 1284) * 100 + 50)
          : axis === "Carbon"
            ? Math.round(((512 - s.co2) / 512) * 100 + 50)
            : axis === "Renewable"
              ? s.renewable
              : axis === "Reliability"
                ? Math.round((s.reliability - 96) * 40)
                : s.confidence - 10;
    });
    return row;
  });

  const sliders = [
    {
      label: "Solar panels",
      unit: "MW",
      value: solarMw,
      set: setSolarMw,
      max: 300,
      step: 10,
      icon: Sun,
      color: "var(--warn)",
    },
    {
      label: "Battery storage",
      unit: "MWh",
      value: batteryMwh,
      set: setBatteryMwh,
      max: 800,
      step: 20,
      icon: Battery,
      color: "var(--chart-5)",
    },
    {
      label: "Wind capacity",
      unit: "MW",
      value: windMw,
      set: setWindMw,
      max: 200,
      step: 5,
      icon: Wind,
      color: "var(--cyan)",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scenario Comparison & ROI"
        subtitle="Strategy trade-offs and investment modelling for the energy portfolio"
        right={<StatusPill status="Model refreshed hourly" tone="cyan" />}
      />

      <StrategyComparison />

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <GlassCard delay={0.1}>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Multi-objective comparison</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Normalised score per objective (higher is better)
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radar} outerRadius={100}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="axis"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              />
              {strategies.map((s) => (
                <Radar
                  key={s.key}
                  dataKey={s.name}
                  stroke={toneColor[s.tone]}
                  fill={toneColor[s.tone]}
                  fillOpacity={selected === s.key ? 0.28 : 0.05}
                  strokeWidth={selected === s.key ? 2 : 1}
                />
              ))}
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.14}>
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-cyan" />
            <h2 className="text-sm font-semibold">ROI calculator</h2>
          </div>
          <div className="mt-4 space-y-5">
            {sliders.map((sl) => (
              <div key={sl.label}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <sl.icon className="h-3.5 w-3.5" style={{ color: sl.color }} /> {sl.label}
                  </span>
                  <span className="font-mono">
                    {sl.value} {sl.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={sl.max}
                  step={sl.step}
                  value={sl.value}
                  onChange={(e) => sl.set(Number(e.target.value))}
                  className="w-full accent-[var(--cyan)]"
                />
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Metric label="Capex" value={`₹${(roi.capex / 1e7).toFixed(1)} Cr`} tone="primary" />
            <Metric
              label="Annual net savings"
              value={`₹${(roi.annualSavings / 1e7).toFixed(2)} Cr`}
              tone="eco"
              delay={0.04}
            />
            <Metric
              label="Payback"
              value={roi.payback ? roi.payback.toFixed(1) : "—"}
              unit="yrs"
              tone="cyan"
              delay={0.08}
            />
            <Metric
              label="25-yr NPV"
              value={`₹${(roi.npv / 1e7).toFixed(1)} Cr`}
              tone={roi.npv > 0 ? "eco" : "destructive"}
              delay={0.12}
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-muted/40 p-2.5">
              <p className="text-muted-foreground">IRR</p>
              <p className="font-semibold">{roi.irr.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-2.5">
              <p className="text-muted-foreground">LCOE</p>
              <p className="font-semibold">₹{roi.lcoe.toFixed(2)}/kWh</p>
            </div>
            <div className="rounded-xl bg-muted/40 p-2.5">
              <p className="text-muted-foreground">CO₂ avoided</p>
              <p className="font-semibold">{roi.carbonPerYear.toFixed(0)} kt/yr</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={roi.series}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`₹${v} Cr`, "Cumulative cash flow"]}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="cash"
                stroke="var(--eco)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  );
}
