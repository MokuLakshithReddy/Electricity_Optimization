import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileText, Leaf, IndianRupee, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard, Metric, PageHeader, StatusPill } from "@/components/ui-kit";
import { inr } from "@/lib/energy";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "Energy Reports — IntelliGrid AI" },
      {
        name: "description",
        content:
          "Daily, weekly and monthly energy, cost, carbon and renewable performance reports with PDF export.",
      },
      { property: "og:title", content: "Energy Reports — IntelliGrid AI" },
      {
        property: "og:description",
        content: "Board-ready energy and sustainability reporting.",
      },
    ],
  }),
  component: Reports,
});

const periods = ["Daily", "Weekly", "Monthly"] as const;

const usage = {
  Daily: Array.from({ length: 12 }, (_, i) => ({
    t: `${i * 2}:00`,
    solar: 40 + Math.round(Math.max(0, Math.sin((i - 3) / 3.5) * 180)),
    wind: 40 + Math.round(Math.abs(Math.cos(i / 2)) * 70),
    grid: 120 + Math.round(Math.abs(Math.sin(i / 2.4)) * 110),
    captive: 110 + (i % 3) * 12,
  })),
  Weekly: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((t, i) => ({
    t,
    solar: 1400 + i * 60,
    wind: 900 + ((i * 137) % 300),
    grid: 2600 - i * 40,
    captive: 2200 + ((i * 91) % 200),
  })),
  Monthly: Array.from({ length: 12 }, (_, i) => ({
    t: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    solar: 38000 + ((i * 2100) % 12000),
    wind: 24000 + ((i * 1700) % 9000),
    grid: 70000 - i * 900,
    captive: 61000 + ((i * 1300) % 7000),
  })),
};

const costTrend = Array.from({ length: 12 }, (_, i) => ({
  t: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
  cost: 42 - i * 0.9 + ((i * 7) % 5),
  savings: 3.2 + i * 0.42,
}));

function Reports() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("Weekly");

  return (
    <div>
      <PageHeader
        title="Reports & Compliance"
        subtitle="Energy, cost and carbon performance across the plant"
        right={
          <div className="flex items-center gap-2">
            <div className="flex gap-1 rounded-xl border border-border/70 bg-muted/40 p-1">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
                    period === p
                      ? "bg-brand-gradient text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              onClick={() => toast.success(`${period} report queued for PDF export`)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Download className="h-4 w-4" /> Export PDF
            </button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Energy consumed" value="11,482" unit="MWh" icon={<Zap className="h-4 w-4" />} delay={0.02} />
        <Metric label="Electricity cost" value={inr(78400000)} tone="warn" icon={<IndianRupee className="h-4 w-4" />} delay={0.05} />
        <Metric label="Carbon emissions" value="4,318" unit="tCO₂" tone="cyan" icon={<Leaf className="h-4 w-4" />} delay={0.08} />
        <Metric label="Verified savings" value={inr(12400000)} tone="eco" icon={<FileText className="h-4 w-4" />} delay={0.11} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <GlassCard className="xl:col-span-2" delay={0.14}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Source-wise consumption</h2>
              <p className="text-xs text-muted-foreground">{period} energy mix (MWh)</p>
            </div>
            <StatusPill status="Renewable share 34.8%" tone="eco" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={usage[period]}>
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
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="solar" stackId="a" fill="var(--chart-4)" name="Solar" />
              <Bar dataKey="wind" stackId="a" fill="var(--chart-2)" name="Wind" />
              <Bar dataKey="captive" stackId="a" fill="var(--chart-3)" name="Captive" />
              <Bar dataKey="grid" stackId="a" fill="var(--chart-1)" radius={[6, 6, 0, 0]} name="Grid" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.18}>
          <h2 className="text-base font-semibold">Cost & savings trend</h2>
          <p className="text-xs text-muted-foreground">₹ crore per month</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costTrend}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="t" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Line type="monotone" dataKey="cost" stroke="var(--chart-1)" strokeWidth={2} dot={false} name="Cost" />
              <Line type="monotone" dataKey="savings" stroke="var(--eco)" strokeWidth={2} dot={false} name="Savings" />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard className="mt-4 overflow-x-auto" delay={0.22}>
        <h2 className="mb-3 text-base font-semibold">{period} report ledger</h2>
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="pb-3">Period</th>
              <th className="pb-3">Energy (MWh)</th>
              <th className="pb-3">Cost</th>
              <th className="pb-3">CO₂ (t)</th>
              <th className="pb-3">Renewable</th>
              <th className="pb-3">Savings</th>
            </tr>
          </thead>
          <tbody>
            {["W-31", "W-32", "W-33", "W-34", "W-35"].map((w, i) => (
              <tr key={w} className="border-t border-border/50">
                <td className="py-3 font-medium">{w}</td>
                <td className="py-3 tabular-nums">{(11200 + i * 180).toLocaleString("en-IN")}</td>
                <td className="py-3 tabular-nums">{inr(76000000 + i * 900000)}</td>
                <td className="py-3 tabular-nums">{(4280 + i * 42).toLocaleString("en-IN")}</td>
                <td className="py-3 tabular-nums text-eco">{(31.2 + i * 0.9).toFixed(1)}%</td>
                <td className="py-3 tabular-nums text-cyan">{inr(11200000 + i * 420000)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
