import { createFileRoute } from "@tanstack/react-router";
import { Leaf, Factory, Gauge as GaugeIcon, TreePine, Award } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard, Gauge, Metric, PageHeader, StatusPill } from "@/components/ui-kit";
import { carbon } from "@/lib/intel";

export const Route = createFileRoute("/app/carbon")({
  head: () => ({
    meta: [
      { title: "Carbon & ESG Dashboard — IntelliGrid AI" },
      {
        name: "description",
        content:
          "Track daily and monthly CO₂, carbon avoided, renewable usage and the plant ESG score with Scope 1-3 breakdown.",
      },
      { property: "og:title", content: "Carbon & ESG Dashboard — IntelliGrid AI" },
      {
        property: "og:description",
        content: "Audit-ready decarbonisation reporting for industrial operations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Carbon,
});

const scopeColors = ["var(--warn)", "var(--primary)", "var(--cyan)"];

function Carbon() {
  return (
    <div>
      <PageHeader
        title="Carbon Dashboard"
        subtitle="Real-time emissions accounting, avoidance and ESG performance"
        right={<StatusPill status={`ESG grade ${carbon.esgGrade}`} tone="eco" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Today's CO₂"
          value={carbon.today.toFixed(1)}
          unit="t"
          tone="warn"
          icon={<Factory className="h-4 w-4" />}
          hint={`${(((carbon.todayBaseline - carbon.today) / carbon.todayBaseline) * 100).toFixed(1)}% below baseline`}
        />
        <Metric
          label="Monthly CO₂"
          value={carbon.monthly.toLocaleString("en-IN")}
          unit="t"
          tone="primary"
          icon={<Factory className="h-4 w-4" />}
          hint={`Baseline ${carbon.monthlyBaseline.toLocaleString("en-IN")} t`}
          delay={0.04}
        />
        <Metric
          label="Carbon saved today"
          value={carbon.savedToday.toFixed(1)}
          unit="t"
          tone="eco"
          icon={<Leaf className="h-4 w-4" />}
          hint={`${carbon.savedMonth.toLocaleString("en-IN")} t month-to-date`}
          delay={0.08}
        />
        <Metric
          label="Renewable usage"
          value={carbon.renewablePct.toFixed(1)}
          unit="%"
          tone="cyan"
          icon={<GaugeIcon className="h-4 w-4" />}
          hint="Solar + wind + stored renewables"
          delay={0.12}
        />
        <Metric
          label="ESG score"
          value={`${carbon.esgScore}`}
          unit="/100"
          tone="eco"
          icon={<Award className="h-4 w-4" />}
          hint={`Grade ${carbon.esgGrade} · BRSR aligned`}
          delay={0.16}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px]">
        <GlassCard delay={0.1}>
          <h2 className="text-sm font-semibold">Emitted vs avoided (12 months)</h2>
          <p className="text-xs text-muted-foreground">tCO₂ per month</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={carbon.monthlySeries}>
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
              <Bar dataKey="emitted" name="Emitted" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="avoided" name="Avoided" fill="var(--eco)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.14}>
          <h2 className="text-sm font-semibold">Emissions by scope</h2>
          <p className="text-xs text-muted-foreground">Today, tCO₂</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={carbon.scope}
                dataKey="value"
                nameKey="name"
                innerRadius={48}
                outerRadius={76}
                paddingAngle={3}
                stroke="none"
              >
                {carbon.scope.map((_, i) => (
                  <Cell key={i} fill={scopeColors[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 text-xs">
            {carbon.scope.map((sc, i) => (
              <div key={sc.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ background: scopeColors[i] }} />
                  {sc.name}
                </span>
                <span className="font-mono">{sc.value} t</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <GlassCard delay={0.18}>
          <h2 className="text-sm font-semibold">Renewable penetration</h2>
          <div className="mt-3 flex justify-center">
            <Gauge value={carbon.renewablePct} label="of total load" />
          </div>
        </GlassCard>

        <GlassCard delay={0.22}>
          <h2 className="text-sm font-semibold">ESG pillar breakdown</h2>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={carbon.esgPillars} outerRadius={80}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="name"
                tick={{ fill: "var(--muted-foreground)", fontSize: 9 }}
              />
              <Radar
                dataKey="score"
                stroke="var(--eco)"
                fill="var(--eco)"
                fillOpacity={0.28}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.26}>
          <h2 className="text-sm font-semibold">Impact equivalents</h2>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-xl bg-eco/10 p-3">
              <TreePine className="h-5 w-5 text-eco" />
              <div>
                <p className="font-display text-xl font-semibold text-eco">
                  {carbon.trees.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground">Tree-equivalents (annualised)</p>
              </div>
            </div>
            <div className="rounded-xl bg-cyan/10 p-3">
              <p className="font-display text-xl font-semibold text-cyan">
                {carbon.intensity.toFixed(3)} t/MWh
              </p>
              <p className="text-xs text-muted-foreground">
                Carbon intensity — baseline {carbon.intensityBaseline.toFixed(3)} t/MWh
              </p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3">
              <p className="font-display text-xl font-semibold text-primary">
                {carbon.savedMonth.toLocaleString("en-IN")} t
              </p>
              <p className="text-xs text-muted-foreground">Avoided this month vs FY24 baseline</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
