import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Battery,
  Boxes,
  Factory,
  Fuel,
  Sun,
  Zap,
  TriangleAlert,
  Activity,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GlassCard, Metric, PageHeader, StatusPill } from "@/components/ui-kit";
import { inr } from "@/lib/energy";
import { runDigitalTwinSimulation, SimulatorInputs } from "@/lib/digitalTwinSimulator";

export const Route = createFileRoute("/app/digital-twin")({
  head: () => ({
    meta: [
      { title: "Digital Twin Simulator — IntelliGrid AI" },
      {
        name: "description",
        content:
          "Physics-informed 24h chronological simulation of solar expansion, battery sizing, grid outage, fuel price shocks and production growth.",
      },
      { property: "og:title", content: "Digital Twin Simulator — IntelliGrid AI" },
      {
        property: "og:description",
        content:
          "What-if physical and financial scenario modelling for industrial energy investments.",
      },
    ],
  }),
  component: DigitalTwin,
});

const sliders = [
  {
    key: "solar",
    label: "Additional solar capacity",
    unit: "MW",
    min: 0,
    max: 250,
    step: 10,
    icon: Sun,
  },
  {
    key: "battery",
    label: "Additional battery size",
    unit: "MWh",
    min: 0,
    max: 500,
    step: 20,
    icon: Battery,
  },
  { key: "fuel", label: "Fuel price change", unit: "%", min: -30, max: 80, step: 5, icon: Fuel },
  {
    key: "production",
    label: "Production increase",
    unit: "%",
    min: 0,
    max: 60,
    step: 5,
    icon: Factory,
  },
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
  const [showChronologicalSchedule, setShowChronologicalSchedule] = useState(true);

  // Run the 24-hour physical and financial dispatch simulation
  const sim = useMemo(() => {
    return runDigitalTwinSimulation({
      additionalSolarMW: vals.solar,
      additionalBatteryMWh: vals.battery,
      fuelPriceChangePct: vals.fuel,
      productionIncreasePct: vals.production,
      gridOutage: gridFail,
    });
  }, [vals, gridFail]);

  const bars = [
    {
      name: "Baseline",
      cost: Number((sim.baselineAnnualCostCr / 10).toFixed(2)),
      co2: Number((sim.baselineCO2AnnualTonnes / 1000).toFixed(0)),
    },
    {
      name: "Simulated",
      cost: Number((sim.simulatedAnnualCostCr / 10).toFixed(2)),
      co2: Number((sim.simulatedCO2AnnualTonnes / 1000).toFixed(0)),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Digital Twin Simulator"
        subtitle="Physics-informed 24h chronological dispatch & financial investment simulation"
        right={
          <StatusPill
            status={
              gridFail
                ? "Simulating Grid Outage (Islanded)"
                : "Physics Model Synced · 89% Round-Trip"
            }
            tone={gridFail ? "warn" : "eco"}
          />
        }
      />

      {/* Real-World Safety Demarcation Banner */}
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Digital Twin Simulation Sandbox
              </span>
              <span className="bg-amber-500/20 text-amber-900 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                PHYSICAL EQUIPMENT ACTUATION PERMANENTLY DISABLED
              </span>
            </div>
            <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
              All telemetry, battery kinetics, and dispatch outputs in this digital twin represent
              synthetic simulation models for pre-commissioning development. Equipment actuation is
              permanently disabled and locked out until site-specific telemetry, protection relays
              (IEEE 1547 / IEC 61850), hardwired trapped-key interlocks, and operational safety
              procedures have been independently validated.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        {/* Controls Card */}
        <GlassCard delay={0.05}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Scenario Parameters</h2>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-full">
              24-Hour Time-Series
            </span>
          </div>

          <div className="mt-5 space-y-6">
            {sliders.map((s) => (
              <div key={s.key}>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <s.icon className="h-3.5 w-3.5" /> {s.label}
                  </span>
                  <span className="font-mono text-foreground font-bold">
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
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors cursor-pointer ${
                gridFail
                  ? "border-destructive/40 bg-destructive/15 text-destructive font-bold"
                  : "border-border/70 bg-muted/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <TriangleAlert className="h-4 w-4" /> Simulate Grid Incomer Failure
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md font-mono">
                {gridFail ? "ISLANDED" : "OFF"}
              </span>
            </button>

            {/* Model Physical Assumptions Legend */}
            <div className="rounded-xl border border-border/50 bg-muted/20 p-3 text-[11px] space-y-1.5 text-muted-foreground">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-500" /> Physical Simulation
                Constraints:
              </p>
              <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                <span>• BESS Round-trip: 89.0%</span>
                <span>• Max C-Rate: 0.5C</span>
                <span>• Cell Degradation: ~{sim.batteryCycleDegradationPctPerYear}%/yr</span>
                <span>• LCOS: ₹{sim.lcosPerKWh}/kWh</span>
                <span>• Captive Min Load: 30 MW</span>
                <span>• Peak ToD: ₹11.80/kWh</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Results Metrics & Charts */}
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Net Annual Savings"
              value={`₹${sim.annualSavingsCr}`}
              unit="Cr/yr"
              tone="eco"
              delay={0.06}
            />
            <Metric
              label="Simple Payback (ROI)"
              value={sim.simplePaybackYears > 0 ? `${sim.simplePaybackYears}` : "—"}
              unit={`yrs (NPV ₹${sim.npvCr} Cr)`}
              delay={0.09}
            />
            <Metric
              label="CO₂ Avoided"
              value={`${(sim.annualCO2AvoidedTonnes / 1000).toFixed(1)}k`}
              unit="tCO₂/yr"
              tone="cyan"
              delay={0.12}
            />
            <Metric
              label="Power Availability"
              value={sim.powerAvailabilityPct.toFixed(2)}
              unit="%"
              tone={sim.powerAvailabilityPct > 99.5 ? "eco" : "warn"}
              delay={0.15}
            />
          </div>

          {/* Chronological 24-Hour Physical Dispatch Chart */}
          <GlassCard delay={0.18}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  Chronological 24-Hour Dispatch & BESS State-of-Charge
                </h2>
                <p className="text-xs text-muted-foreground">
                  Physical hourly dispatch accounting for solar diurnal cycle, ToD tariffs, and
                  battery efficiency losses
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowChronologicalSchedule(!showChronologicalSchedule)}
                  className="text-xs font-semibold px-3 py-1 rounded-lg border border-border bg-muted/40 hover:bg-muted cursor-pointer"
                >
                  {showChronologicalSchedule ? "Hide Dispatch" : "Show Dispatch"}
                </button>
              </div>
            </div>

            {showChronologicalSchedule && (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={sim.hourlySchedule}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="solarArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="windArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284C7" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#0284C7" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="gridArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6B7280" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#6B7280" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="timeLabel"
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                    />
                    <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 11,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area
                      type="monotone"
                      dataKey="solarMW"
                      name="Solar PV (MW)"
                      stroke="#F59E0B"
                      fill="url(#solarArea)"
                    />
                    <Area
                      type="monotone"
                      dataKey="windMW"
                      name="Wind Farm (MW)"
                      stroke="#0284C7"
                      fill="url(#windArea)"
                    />
                    <Area
                      type="monotone"
                      dataKey="gridMW"
                      name="Grid Import (MW)"
                      stroke="#6B7280"
                      fill="url(#gridArea)"
                    />
                    <Line
                      type="monotone"
                      dataKey="demandMW"
                      name="Factory Demand (MW)"
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="batterySOC"
                      name="BESS SoC (%)"
                      stroke="#10B981"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>

          {/* Baseline vs Simulated Cost and Emissions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard delay={0.2}>
              <h2 className="text-sm font-semibold">Annualized Financial Comparison</h2>
              <p className="text-xs text-muted-foreground">
                Baseline vs Simulated Operating Cost (₹ Crore/year)
              </p>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">Baseline Energy Cost (unmanaged):</span>
                  <span className="font-mono font-bold text-foreground">
                    ₹{sim.baselineAnnualCostCr} Cr
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">Simulated Optimized Energy Cost:</span>
                  <span className="font-mono font-bold text-emerald-600">
                    ₹{sim.simulatedAnnualCostCr} Cr
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">
                    Estimated Capital Expenditure (CAPEX):
                  </span>
                  <span className="font-mono font-bold text-foreground">₹{sim.capexCr} Cr</span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 font-bold">
                  <span>Net 15-Year NPV (@ 10% WACC):</span>
                  <span className="font-mono text-sm">₹{sim.npvCr} Cr</span>
                </div>
              </div>
            </GlassCard>

            <GlassCard delay={0.22}>
              <h2 className="text-sm font-semibold">Reliability & Emissions Balance</h2>
              <p className="text-xs text-muted-foreground">
                Loss of load expectation and carbon footprint
              </p>
              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">Power System Availability:</span>
                  <span
                    className={`font-mono font-bold ${sim.powerAvailabilityPct > 99.5 ? "text-emerald-600" : "text-amber-600"}`}
                  >
                    {sim.powerAvailabilityPct}%
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">Annual Unserved Energy Shortfall:</span>
                  <span className="font-mono font-bold text-foreground">
                    {sim.unservedEnergyMWhAnnual} MWh
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">BESS Annual Capacity Fade Rate:</span>
                  <span className="font-mono font-bold text-foreground">
                    ~{sim.batteryCycleDegradationPctPerYear}% / year
                  </span>
                </div>
                <div className="flex justify-between items-center text-cyan font-bold">
                  <span>CO₂ Avoided Annually:</span>
                  <span className="font-mono text-sm">
                    {sim.annualCO2AvoidedTonnes.toLocaleString("en-IN")} tonnes
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
