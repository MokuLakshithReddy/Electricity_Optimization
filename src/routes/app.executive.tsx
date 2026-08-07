import { createFileRoute } from "@tanstack/react-router";
import { Activity, Gauge as GaugeIcon, Leaf, TrendingUp, Wrench, IndianRupee } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard, Gauge, Metric, PageHeader, StatusPill } from "@/components/ui-kit";
import { ExplainableCard } from "@/components/ExplainableCard";
import { inr, useLiveEnergy } from "@/lib/energy";
import { smartRecommendations } from "@/lib/intel";

export const Route = createFileRoute("/app/executive")({
  head: () => ({
    meta: [
      { title: "Executive Dashboard — IntelliGrid AI" },
      {
        name: "description",
        content:
          "Board-level view of energy savings, renewable share, equipment health, efficiency and the top AI recommendations.",
      },
      { property: "og:title", content: "Executive Dashboard — IntelliGrid AI" },
      {
        property: "og:description",
        content: "Fortune 500 grade energy performance summary for leadership teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Executive,
});

const savingsSeries = Array.from({ length: 30 }, (_, i) => ({
  t: `D${i + 1}`,
  savings: Math.round(120 + i * 6 + Math.sin(i / 2) * 34),
  target: 200,
}));

function Executive() {
  const s = useLiveEnergy(4000);
  const top = [...smartRecommendations].sort((a, b) => b.savings - a.savings).slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Executive Dashboard"
        subtitle="Enterprise energy performance — Jamshedpur Works, live"
        right={<StatusPill status="All systems nominal" tone="eco" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Today's savings"
          value={inr(Math.round(s.savingsToday))}
          tone="eco"
          icon={<IndianRupee className="h-4 w-4" />}
          hint="vs rule-based dispatch baseline"
        />
        <Metric
          label="Monthly savings"
          value={`₹${(4.82).toFixed(2)} Cr`}
          tone="primary"
          icon={<TrendingUp className="h-4 w-4" />}
          hint="118% of month-to-date target"
          delay={0.04}
        />
        <Metric
          label="Renewable share"
          value={s.renewablePct.toFixed(1)}
          unit="%"
          tone="cyan"
          icon={<Leaf className="h-4 w-4" />}
          hint="FY target 45%"
          delay={0.08}
        />
        <Metric
          label="Equipment health"
          value={s.batteryHealth.toFixed(1)}
          unit="%"
          tone="eco"
          icon={<Wrench className="h-4 w-4" />}
          hint="2 assets flagged for service"
          delay={0.12}
        />
        <Metric
          label="Energy efficiency"
          value={s.systemHealth.toFixed(1)}
          unit="%"
          tone="cyan"
          icon={<Activity className="h-4 w-4" />}
          hint="Specific energy 5.42 GJ/tcs"
          delay={0.16}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_320px]">
        <GlassCard delay={0.1}>
          <h2 className="text-sm font-semibold">Savings trajectory (30 days)</h2>
          <p className="text-xs text-muted-foreground">₹ lakh per day vs board target</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={savingsSeries}>
              <defs>
                <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--eco)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--eco)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="savings"
                stroke="var(--eco)"
                fill="url(#savGrad)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="target"
                stroke="var(--muted-foreground)"
                strokeDasharray="6 6"
                fill="none"
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.14}>
          <div className="flex items-center gap-2">
            <GaugeIcon className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Operational scorecard</h2>
          </div>
          <div className="mt-2 flex justify-center">
            <Gauge value={s.systemHealth} label="Overall performance" />
          </div>
          <div className="mt-2 space-y-2 text-xs">
            {[
              ["Power availability", "99.97%"],
              ["Peak demand compliance", "100%"],
              ["Diesel run hours (MTD)", "12.4 h"],
              ["Unplanned trips (MTD)", "0"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono">{v}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mt-4">
        <h2 className="mb-3 text-sm font-semibold">Top AI recommendations</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {top.map((rec, i) => (
            <ExplainableCard key={rec.id} rec={rec} delay={i * 0.06} />
          ))}
        </div>
      </div>
    </div>
  );
}
