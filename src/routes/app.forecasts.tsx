import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CloudRain, Sun, Wind } from "lucide-react";
import { GlassCard, Metric, PageHeader, StatusPill } from "@/components/ui-kit";
import { demandSeries, renewableSeries } from "@/lib/energy";

export const Route = createFileRoute("/app/forecasts")({
  head: () => ({
    meta: [
      { title: "Demand & Renewable Forecasts — IntelliGrid AI" },
      {
        name: "description",
        content:
          "AI demand forecasts for 15 minutes to 24 hours plus solar, wind, cloud cover and weather predictions.",
      },
      { property: "og:title", content: "Demand & Renewable Forecasts — IntelliGrid AI" },
      {
        property: "og:description",
        content: "Predictive load and renewable generation curves for the plant.",
      },
    ],
  }),
  component: Forecasts,
});

const horizons = [
  { id: "15m", label: "15 minutes", points: 15, step: (i: number) => `+${i + 1}m` },
  { id: "1h", label: "1 hour", points: 12, step: (i: number) => `+${(i + 1) * 5}m` },
  { id: "6h", label: "6 hours", points: 24, step: (i: number) => `+${((i + 1) * 15) / 60}h` },
  { id: "24h", label: "24 hours", points: 24, step: (i: number) => `${String(i).padStart(2, "0")}:00` },
] as const;

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

function Forecasts() {
  const [h, setH] = useState<(typeof horizons)[number]["id"]>("6h");
  const active = horizons.find((x) => x.id === h)!;
  const data = useMemo(() => demandSeries(active.points, active.step), [active]);
  const ren = useMemo(() => renewableSeries(), []);
  const peak = Math.max(...data.map((d) => d.predicted));

  return (
    <div>
      <PageHeader
        title="Forecasting Engine"
        subtitle="Gradient-boosted load model · MAPE 2.4% over trailing 30 days"
        right={<StatusPill status="Model v4.2 · retrained 06:00" tone="cyan" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Predicted peak" value={`${peak}`} unit="MW" delay={0.02} />
        <Metric label="Forecast horizon" value={active.label} tone="cyan" delay={0.05} />
        <Metric label="Confidence band" value="±34" unit="MW" tone="eco" delay={0.08} />
        <Metric label="Ramp risk" value="Moderate" tone="warn" delay={0.11} />
      </div>

      <GlassCard className="mt-4" delay={0.15}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Demand forecast</h2>
            <p className="text-xs text-muted-foreground">Actual vs predicted load (MW)</p>
          </div>
          <div className="flex gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
            {horizons.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setH(opt.id)}
                className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  h === opt.id
                    ? "bg-brand-gradient text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
            <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} domain={[260, 740]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="url(#bandFill)"
              name="Confidence band"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="var(--cyan)"
              strokeWidth={2.4}
              dot={false}
              name="Actual"
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="var(--eco)"
              strokeWidth={2.4}
              strokeDasharray="6 5"
              dot={false}
              name="Predicted"
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2" delay={0.2}>
          <h2 className="text-base font-semibold">Renewable generation forecast</h2>
          <p className="text-xs text-muted-foreground">Next 24 hours · solar & wind (MW)</p>
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={ren}>
              <defs>
                <linearGradient id="solarFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--warn)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--warn)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="windFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="solar" stroke="var(--warn)" fill="url(#solarFill)" name="Solar" />
              <Area type="monotone" dataKey="wind" stroke="var(--cyan)" fill="url(#windFill)" name="Wind" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.24}>
          <h2 className="text-base font-semibold">Weather & cloud cover</h2>
          <p className="text-xs text-muted-foreground">Cloud cover % impacting PV yield</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ren}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="cloud" stroke="var(--chart-5)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-2.5">
              <Sun className="h-4 w-4 text-warn" /> Peak irradiance 912 W/m² at 12:40
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-2.5">
              <Wind className="h-4 w-4 text-cyan" /> Wind 8.4 m/s after 19:20
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-2.5">
              <CloudRain className="h-4 w-4 text-primary" /> Rain probability 62% at 14:15
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
