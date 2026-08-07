import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BatteryCharging,
  CloudSun,
  Factory,
  Flame,
  Gauge as GaugeIcon,
  IndianRupee,
  Leaf,
  Plug,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard, Gauge, Metric, PageHeader, StatusPill } from "@/components/ui-kit";
import { alerts, inr, recommendations, useLiveEnergy } from "@/lib/energy";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "Control Dashboard — IntelliGrid AI" },
      {
        name: "description",
        content:
          "Live plant energy KPIs: demand, tariff, savings, CO₂, renewable share and asset health.",
      },
      { property: "og:title", content: "Control Dashboard — IntelliGrid AI" },
      {
        property: "og:description",
        content: "Real-time industrial energy KPIs and AI recommendations.",
      },
    ],
  }),
  component: Dashboard,
});

const costTrend = Array.from({ length: 14 }, (_, i) => ({
  t: `${i * 2}:00`,
  cost: 5 + Math.sin(i / 2) * 2.4 + (i > 8 ? 2.6 : 0),
  baseline: 7.4 + Math.sin(i / 2.4) * 1.2,
}));

const COLORS = ["var(--chart-2)", "var(--chart-3)", "var(--chart-1)", "var(--chart-4)", "var(--chart-5)", "var(--destructive)"];

function ChartTooltip() {
  return (
    <Tooltip
      contentStyle={{
        background: "var(--popover)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        fontSize: 12,
      }}
      labelStyle={{ color: "var(--muted-foreground)" }}
    />
  );
}

function Dashboard() {
  const s = useLiveEnergy();
  const mix = s.sources.map((src) => ({ name: src.name, value: Math.round(src.mw) }));

  return (
    <div>
      <PageHeader
        title="Energy Control Dashboard"
        subtitle="Jamshedpur Works · Live telemetry refreshed every 3 seconds"
        right={<StatusPill status={`System health ${s.systemHealth.toFixed(1)}%`} tone="cyan" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric
          label="Current Power Demand"
          value={s.demand.toFixed(0)}
          unit="MW"
          hint="Rolling mill + sinter plant + BOF"
          icon={<Activity className="h-4 w-4" />}
          delay={0.02}
        />
        <Metric
          label="Electricity Cost"
          value={`₹${s.price.toFixed(2)}`}
          unit="/kWh"
          tone="warn"
          hint="Blended landed tariff"
          icon={<IndianRupee className="h-4 w-4" />}
          delay={0.05}
        />
        <Metric
          label="Today's Savings"
          value={inr(Math.round(s.savingsToday))}
          tone="eco"
          hint="vs. unoptimised baseline"
          icon={<TrendingUp className="h-4 w-4" />}
          delay={0.08}
        />
        <Metric
          label="Today's CO₂ Emission"
          value={s.co2Today.toFixed(1)}
          unit="t"
          tone="cyan"
          hint="-12.4% week on week"
          icon={<Leaf className="h-4 w-4" />}
          delay={0.11}
        />
        <Metric
          label="Renewable Share"
          value={s.renewablePct.toFixed(1)}
          unit="%"
          tone="eco"
          hint="Solar + wind of total load"
          icon={<CloudSun className="h-4 w-4" />}
          delay={0.14}
        />
        <Metric
          label="Battery Health"
          value={s.batteryHealth.toFixed(1)}
          unit="%"
          hint={`SoC ${s.batterySoc.toFixed(0)}% · 320 MWh bank`}
          icon={<BatteryCharging className="h-4 w-4" />}
          delay={0.17}
        />
        <Metric
          label="Grid Status"
          value={s.gridStatus}
          tone={s.gridStatus === "Stable" ? "eco" : "warn"}
          hint="220 kV feeder A/B synchronised"
          icon={<Plug className="h-4 w-4" />}
          delay={0.2}
        />
        <Metric
          label="Diesel Status"
          value={s.dieselStatus}
          tone={s.dieselStatus === "Standby" ? "cyan" : "destructive"}
          hint="4 × 15 MW gensets ready"
          icon={<Flame className="h-4 w-4" />}
          delay={0.23}
        />
        <Metric
          label="System Health"
          value={s.systemHealth.toFixed(1)}
          unit="%"
          tone="eco"
          hint="1,284 sensors reporting"
          icon={<ShieldCheck className="h-4 w-4" />}
          delay={0.26}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2" delay={0.3}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Cost trend vs baseline</h2>
              <p className="text-xs text-muted-foreground">₹/kWh across the operating day</p>
            </div>
            <StatusPill status="18.6% below baseline" tone="eco" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={costTrend}>
              <defs>
                <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              {ChartTooltip()}
              <Area
                type="monotone"
                dataKey="cost"
                stroke="var(--chart-2)"
                fill="url(#costFill)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.34}>
          <h2 className="text-base font-semibold">Source contribution</h2>
          <p className="text-xs text-muted-foreground">Instantaneous MW by source</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={mix}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
                stroke="none"
              >
                {mix.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              {ChartTooltip()}
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
            {mix.map((m, i) => (
              <div key={m.name} className="flex items-center gap-2 text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                {m.name}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <GlassCard delay={0.38}>
          <h2 className="mb-2 text-base font-semibold">Battery & renewables</h2>
          <div className="grid grid-cols-2">
            <Gauge value={s.batterySoc} label="Battery SoC" color="var(--cyan)" />
            <Gauge value={s.renewablePct} label="Renewable %" color="var(--eco)" />
          </div>
        </GlassCard>

        <GlassCard delay={0.42}>
          <h2 className="text-base font-semibold">Carbon meter</h2>
          <p className="text-xs text-muted-foreground">Hourly tCO₂ intensity by source</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={s.sources.map((x) => ({ name: x.name.split(" ")[0], co2: +(x.co2 * 60).toFixed(2) }))}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              {ChartTooltip()}
              <Bar dataKey="co2" radius={[6, 6, 0, 0]} fill="var(--chart-3)" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.46}>
          <h2 className="text-base font-semibold">Real-time alerts</h2>
          <div className="mt-3 space-y-2">
            {alerts.slice(0, 4).map((a) => (
              <div key={a.id} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{a.title}</p>
                  <StatusPill
                    status={a.severity}
                    tone={
                      a.severity === "critical"
                        ? "destructive"
                        : a.severity === "warning"
                          ? "warn"
                          : "cyan"
                    }
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mt-4">
        <div className="mb-3 flex items-center gap-2">
          <GaugeIcon className="h-4 w-4 text-cyan" />
          <h2 className="text-base font-semibold">Explainable AI recommendations</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {smartRecommendations.slice(0, 5).map((rec, i) => (
            <ExplainableCard key={rec.id} rec={rec} delay={0.5 + i * 0.04} />
          ))}
          <GlassCard delay={0.7} className="flex items-center gap-4">
            <Factory className="h-9 w-9 text-primary" />
            <div>
              <p className="text-sm font-semibold">Load shifted today</p>
              <p className="text-xs text-muted-foreground">
                142 MWh moved out of peak tariff windows.
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-eco">
                <TrendingDown className="h-3.5 w-3.5" /> Peak demand charge down 9.2%
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="mt-4" delay={0.75}>
        <RecommendationTimeline compact />
      </GlassCard>

    </div>
  );
}
