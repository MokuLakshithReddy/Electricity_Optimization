import { useState, useEffect, useCallback, useRef } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import {
  Zap,
  Sun,
  Wind,
  BatteryCharging,
  Network,
  Factory,
  Flame,
  TrendingUp,
  Brain,
  Radio,
  AlertTriangle,
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { generateForecast, ForecastPoint, ForecastSummary, ForecastHorizonId } from "@/data/forecastData";
import { useEnergyState } from "@/context/EnergyContext";
import { cn } from "@/lib/utils";

interface ForecastChartProps {
  onSimulateClick?: () => void;
}

// ─────── Types ───────
interface EnergyMixAtPoint {
  time: string;
  solar: number;
  wind: number;
  battery: number;
  grid: number;
  captive: number;
  generator: number;
  total: number;
  demand: number;
  carbonIntensity: number;
  costPerKwh: number;
}

interface WhatIfScenario {
  id: string;
  label: string;
  description: string;
  demandMod?: number;
  solarMod?: number;
  windMod?: number;
  batteryMod?: number;
  gridAvailable?: boolean;
}

const WHAT_IF_SCENARIOS: WhatIfScenario[] = [
  { id: "solar-drop", label: "Solar drops 30%", description: "Cloud cover reduces solar output", solarMod: 0.7 },
  { id: "wind-none", label: "Wind unavailable", description: "Wind turbines offline (maintenance)", windMod: 0 },
  { id: "battery-fail", label: "Battery fails", description: "BESS trips, no storage buffer", batteryMod: 0 },
  { id: "grid-out", label: "Grid unavailable", description: "132kV feeder trip, island mode", gridAvailable: false },
  { id: "demand-up", label: "Demand +20%", description: "Blast furnace ramp + new loads", demandMod: 1.2 },
  { id: "generator-none", label: "Generator unavailable", description: "DG scheduled maintenance", solarMod: 1 },
];

// ─────── Deterministic energy mix generator ───────
function getEnergyMixAtIndex(
  idx: number,
  demand: number,
  energyState: { solarMW: number; windMW: number; batteryMW: number; gridMW: number; captiveMW: number; generatorMW: number }
): EnergyMixAtPoint {
  const solarFactor = Math.max(0, 1 - (idx / 12) * 0.3 + Math.sin(idx * 0.6) * 0.15);
  const windFactor = 0.9 + Math.sin(idx * 0.3) * 0.15;

  const solar = Math.round(energyState.solarMW * solarFactor);
  const wind = Math.round(energyState.windMW * windFactor);
  const battery = Math.round(energyState.batteryMW * (0.8 + Math.sin(idx * 0.5) * 0.2));
  const captive = Math.round(energyState.captiveMW * 0.95);
  const generator = Math.round(energyState.generatorMW * 0.1);
  const gridCalc = Math.max(0, demand - solar - wind - battery - captive - generator);
  const grid = Math.min(gridCalc, energyState.gridMW * 1.5);
  const total = solar + wind + battery + grid + captive + generator;
  const carbonIntensity = Math.round(310 + idx * 8 + Math.sin(idx * 0.4) * 20);
  const costPerKwh = Number((8.42 - idx * 0.12 + Math.sin(idx * 0.3) * 0.3).toFixed(2));

  return { time: "", solar, wind, battery, grid, captive, generator, total, demand, carbonIntensity, costPerKwh };
}

// ─────── Custom Tooltip ───────
function ForecastTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload as (ForecastPoint & { _energyMix?: EnergyMixAtPoint });
  if (!p) return null;
  const mix = p._energyMix;

  return (
    <div className="pointer-events-none w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl text-xs overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-[#0F2417] text-white px-4 py-2.5 flex items-center justify-between">
        <span className="font-bold text-base text-white">{p.t}</span>
        <span className="text-[10px] font-medium text-emerald-300 uppercase tracking-wider">Prototype Telemetry</span>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Demand Values */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-xl bg-blue-50 border border-blue-100">
            <div className="text-[10px] text-blue-600 font-semibold uppercase">Actual Demand</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {p.actual != null ? `${p.actual} MW` : "—"}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="text-[10px] text-emerald-700 font-semibold uppercase">Predicted</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{p.predicted} MW</div>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-center">
          <div className="text-[10px] text-slate-500 font-semibold uppercase">Confidence Band</div>
          <div className="text-sm font-semibold text-slate-900 mt-0.5">±{Math.round(p.upper - p.predicted)} MW</div>
        </div>

        {/* Energy Mix */}
        {mix && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Energy Mix</div>
            {[
              { label: "Solar", val: mix.solar, icon: Sun, color: "text-amber-500" },
              { label: "Wind", val: mix.wind, icon: Wind, color: "text-cyan-500" },
              { label: "Battery", val: mix.battery, icon: BatteryCharging, color: "text-emerald-600" },
              { label: "Grid", val: mix.grid, icon: Network, color: "text-blue-600" },
            ].map(({ label, val, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className={`flex items-center gap-1 ${color} font-medium`}>
                  <Icon className="w-3 h-3" />
                  {label}
                </span>
                <span className="font-mono font-semibold text-slate-900">{val} MW</span>
              </div>
            ))}
          </div>
        )}

        {/* Carbon + Cost */}
        {mix && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div>
              <div className="text-[10px] text-slate-500 font-semibold">Carbon Intensity</div>
              <div className="text-xs font-bold text-slate-800">{mix.carbonIntensity} gCO₂/kWh</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 font-semibold">Est. Cost</div>
              <div className="text-xs font-bold text-slate-800">₹{mix.costPerKwh}/kWh</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────── Peak Marker label (inline SVG g, passed via render function) ───────
function PeakLabel({ viewBox, peakMW }: { viewBox?: { x?: number | undefined; y?: number | undefined } | undefined; peakMW: number }) {
  const x = viewBox?.x ?? 0;
  const y = viewBox?.y ?? 0;
  return (
    <g>
      <circle cx={x} cy={y} r={7} fill="#FF4500" fillOpacity={0.15} stroke="#FF4500" strokeWidth={1.5} />
      <circle cx={x} cy={y} r={3.5} fill="#FF4500" />
      <rect x={x - 42} y={y - 44} width={84} height={32} rx={6} fill="#1A1A2E" fillOpacity={0.92} />
      <text x={x} y={y - 30} textAnchor="middle" fontSize={8} fill="#FF6B4A" fontWeight="700" fontFamily="monospace">
        AI PEAK
      </text>
      <text x={x} y={y - 18} textAnchor="middle" fontSize={10} fill="#FFFFFF" fontWeight="700" fontFamily="monospace">
        {peakMW} MW
      </text>
    </g>
  );
}

// ─────── Main Component ───────
export function ForecastChart({ onSimulateClick }: ForecastChartProps) {
  const energyState = useEnergyState();
  const [horizon, setHorizon] = useState<ForecastHorizonId>("6h");
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(12);
  const [activeWhatIf, setActiveWhatIf] = useState<WhatIfScenario | null>(null);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [showPeakInsight, setShowPeakInsight] = useState(false);
  const [showReasonPanel, setShowReasonPanel] = useState(false);
  const [legendVisible, setLegendVisible] = useState({
    actual: true,
    predicted: true,
    confidence: true,
  });

  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build effective energy state for What-If
  const effectiveState = activeWhatIf
    ? {
        ...energyState,
        totalDemandMW: Math.round(energyState.totalDemandMW * (activeWhatIf.demandMod ?? 1)),
        solarMW: Math.round(energyState.solarMW * (activeWhatIf.solarMod ?? 1)),
        windMW: Math.round(energyState.windMW * (activeWhatIf.windMod ?? 1)),
        batteryMW: Math.round(energyState.batteryMW * (activeWhatIf.batteryMod ?? 1)),
        gridMW: (activeWhatIf.gridAvailable === false) ? 0 : energyState.gridMW,
      }
    : energyState;

  const { points: rawPoints, summary } = generateForecast(horizon, effectiveState);

  // Enrich with energy mix
  const points = rawPoints.map((p, idx) => ({
    ...p,
    _energyMix: { ...getEnergyMixAtIndex(idx, p.predicted, effectiveState), time: p.t },
    // Confidence band as two separate values for Recharts Area
    confLower: p.lower,
    confUpper: p.upper,
  }));

  // Find peak index
  const peakVal = summary.predictedPeak;
  const peakIdx = points.findIndex((p) => p.predicted === peakVal);

  // Live simulation timer
  useEffect(() => {
    if (liveEnabled) {
      liveIntervalRef.current = setInterval(() => {
        setLastUpdated((prev) => {
          if (prev <= 1) {
            // Simulate refresh
            return Math.floor(Math.random() * 15) + 5;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    }
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, [liveEnabled]);

  // Demand thresholds for zones
  const baseDemand = effectiveState.totalDemandMW;
  const highThreshold = Math.round(baseDemand * 1.06);
  const peakThreshold = Math.round(baseDemand * 1.1);

  // RAMP RISK color
  const rampColor = summary.rampRisk === "Low" ? "text-emerald-600" : summary.rampRisk === "Moderate" ? "text-amber-600" : "text-rose-600";
  const rampBg = summary.rampRisk === "Low" ? "bg-emerald-50 border-emerald-200" : summary.rampRisk === "Moderate" ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200";

  // Horizon label mapping
  const horizonLabels: Record<ForecastHorizonId, string> = {
    "15m": "15 min",
    "1h": "1 hour",
    "6h": "6 hours",
    "24h": "24 hours",
  };

  return (
    <div className="rounded-3xl bg-white border border-[#E6E1D7] shadow-sm overflow-hidden">
      {/* ─── Header ─── */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xl font-bold text-[#1F2937]">AI Demand Forecast</h3>
              {/* Live status badge */}
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors",
                liveEnabled
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  liveEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                )} />
                {liveEnabled ? "AI Forecast Active" : "Static Mode"}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              Predicted plant load · Continuously updated
              {liveEnabled && (
                <span className="ml-2 text-emerald-600 font-semibold">
                  Updated {lastUpdated}s ago
                </span>
              )}
            </p>
            {activeWhatIf && (
              <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-800 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Scenario: {activeWhatIf.label}
                <button onClick={() => setActiveWhatIf(null)} className="ml-1 text-amber-500 hover:text-amber-800">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Range Tabs */}
            <div className="flex items-center gap-1 rounded-2xl bg-[#FAF8F5] border border-[#E6E1D7] p-1 text-xs font-semibold">
              {(["15m", "1h", "6h", "24h"] as ForecastHorizonId[]).map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizon(h)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 transition-all",
                    horizon === h
                      ? "bg-[#1B4D3E] text-white shadow-xs font-bold"
                      : "text-[#6B7280] hover:text-[#1F2937]"
                  )}
                >
                  {horizonLabels[h]}
                </button>
              ))}
            </div>

            {/* Live toggle */}
            <button
              onClick={() => setLiveEnabled(!liveEnabled)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                liveEnabled
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              )}
            >
              <Radio className={cn("w-3.5 h-3.5", liveEnabled && "animate-pulse")} />
              Live Simulation
            </button>
          </div>
        </div>

        {/* ─── Summary KPI Cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {/* Peak */}
          <button
            onClick={() => setShowPeakInsight(true)}
            className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left hover:border-[#1B4D3E] hover:bg-emerald-50/50 transition-all group"
          >
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-rose-500" />
              Predicted Peak
            </div>
            <div className="text-xl font-bold text-slate-900 font-display mt-0.5 group-hover:text-[#1B4D3E]">
              {summary.predictedPeak} MW
            </div>
            <div className="text-xs text-slate-500 font-medium">{summary.peakTime}</div>
          </button>

          {/* Horizon */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-blue-500" />
              Forecast Horizon
            </div>
            <div className="text-xl font-bold text-slate-900 font-display mt-0.5">
              {horizonLabels[horizon]}
            </div>
            <div className="text-xs text-slate-500 font-medium">{points.length} data points</div>
          </div>

          {/* Confidence */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-left">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Brain className="w-3 h-3 text-purple-500" />
              Confidence Band
            </div>
            <div className="text-xl font-bold text-slate-900 font-display mt-0.5">
              ±{summary.confidenceBand} MW
            </div>
            <div className="text-xs text-slate-500 font-medium">95% confidence</div>
          </div>

          {/* Ramp Risk */}
          <div className={cn("p-3 rounded-2xl border text-left", rampBg)}>
            <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-slate-500">
              <TrendingUp className="w-3 h-3" />
              Ramp Risk
            </div>
            <div className={cn("text-xl font-bold font-display mt-0.5", rampColor)}>
              {summary.rampRisk}
            </div>
            <div className="text-xs text-slate-500 font-medium">{summary.maxRampRate} MW/hr max</div>
          </div>
        </div>
      </div>

      {/* ─── Legend ─── */}
      <div className="px-6 pt-3 flex flex-wrap items-center gap-4">
        {[
          { key: "actual", label: "Actual Demand", color: "#2563EB", dash: false },
          { key: "predicted", label: "Predicted Demand", color: "#1B4D3E", dash: true },
          { key: "confidence", label: "Confidence Band", color: "#10B981", dash: false, area: true },
        ].map(({ key, label, color, dash, area }) => (
          <button
            key={key}
            onClick={() => setLegendVisible((v) => ({ ...v, [key]: !v[key as keyof typeof v] }))}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-opacity",
              !legendVisible[key as keyof typeof legendVisible] && "opacity-40"
            )}
          >
            {area ? (
              <span className="w-8 h-3 rounded bg-emerald-200 border border-emerald-400 opacity-70" />
            ) : (
              <span className="flex items-center">
                <span style={{ borderColor: color, borderStyle: dash ? "dashed" : "solid" }}
                  className="w-8 h-0 border-b-2 inline-block" />
              </span>
            )}
            <span className="text-slate-700">{label}</span>
            {legendVisible[key as keyof typeof legendVisible] ? (
              <Eye className="w-3 h-3 text-slate-400" />
            ) : (
              <EyeOff className="w-3 h-3 text-slate-400" />
            )}
          </button>
        ))}

        {/* Prototype label */}
        <div className="ml-auto text-[10px] text-slate-400 font-medium italic">
          Prototype Simulation · Public data + simulated plant telemetry
        </div>
      </div>

      {/* ─── Main Chart ─── */}
      <div className="px-2 py-2 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 24, right: 16, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="confBandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="t"
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94A3B8" }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              unit="MW"
              tick={{ fill: "#94A3B8" }}
              width={52}
            />

            {/* Demand Zones */}
            <ReferenceArea
              y1={highThreshold}
              y2={peakThreshold}
              fill="#FEF3C7"
              fillOpacity={0.5}
              label={{ value: "HIGH", position: "insideTopRight", fontSize: 9, fill: "#D97706", fontWeight: 700 }}
            />
            <ReferenceArea
              y1={peakThreshold}
              y2={peakThreshold + 100}
              fill="#FEE2E2"
              fillOpacity={0.5}
              label={{ value: "PEAK RISK", position: "insideTopRight", fontSize: 9, fill: "#DC2626", fontWeight: 700 }}
            />

            {/* Confidence band (only if visible) */}
            {legendVisible.confidence && (
              <Area
                type="monotone"
                dataKey="confUpper"
                stroke="none"
                fill="url(#confBandGrad)"
                fillOpacity={1}
                legendType="none"
                isAnimationActive={true}
                animationDuration={600}
              />
            )}
            {legendVisible.confidence && (
              <Area
                type="monotone"
                dataKey="confLower"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
                legendType="none"
                isAnimationActive={false}
              />
            )}

            {/* Actual demand (filled area) */}
            {legendVisible.actual && (
              <Area
                type="monotone"
                dataKey="actual"
                name="Actual Demand"
                stroke="#2563EB"
                strokeWidth={2.5}
                fill="url(#actualGrad)"
                fillOpacity={1}
                dot={false}
                connectNulls={false}
                animationDuration={500}
              />
            )}

            {/* Predicted demand (dashed line) */}
            {legendVisible.predicted && (
              <Line
                type="monotone"
                dataKey="predicted"
                name="Predicted Demand"
                stroke="#1B4D3E"
                strokeWidth={2.5}
                strokeDasharray="7 4"
                dot={false}
                activeDot={{ r: 5, fill: "#1B4D3E", stroke: "#fff", strokeWidth: 2 }}
                animationDuration={600}
              />
            )}

            {/* Peak marker */}
            {peakIdx >= 0 && (
              <ReferenceLine
                x={points[peakIdx]?.t as unknown as number}
                stroke="#FF4500"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `⚡ PEAK ${peakVal}MW`,
                  position: "top",
                  fill: "#FF4500",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            )}

            <Tooltip
              content={<ForecastTooltip />}
              cursor={{ stroke: "#1B4D3E", strokeWidth: 1.5, strokeDasharray: "4 2" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ─── AI Recommendation Bar ─── */}
      <div className="mx-4 mb-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#1B4D3E] text-white grid place-items-center shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 mb-0.5">
                <Cpu className="w-3 h-3 animate-pulse" />
                IntelliGrid Recommends
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {summary.aiRecommendation}
              </p>
            </div>
          </div>

          {/* Impact Cards */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center p-2 rounded-xl bg-white border border-emerald-100">
              <div className="text-xs font-bold text-emerald-700">{summary.expectedSaving}</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wide">cost avoided</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-white border border-emerald-100">
              <div className="text-xs font-bold text-emerald-700">18.4 t</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wide">CO₂ avoided</div>
            </div>
            <div className="text-center p-2 rounded-xl bg-white border border-emerald-100">
              <div className="text-xs font-bold text-emerald-700">99.9%</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-wide">reliability</div>
            </div>
          </div>

          <button
            onClick={() => setShowReasonPanel(!showReasonPanel)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1B4D3E] hover:text-emerald-700 border border-[#1B4D3E] hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap"
          >
            Why this decision? <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Reason panel */}
        {showReasonPanel && (
          <div className="mt-4 pt-4 border-t border-emerald-200 space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">WHY?</div>
            {[
              `Demand forecast shows a ${summary.predictedPeak} MW peak ${summary.peakTime}.`,
              `Solar availability is expected to fall as the afternoon progresses.`,
              `Battery currently at ${effectiveState.batteryMW > 0 ? "61% SOC" : "unavailable — emergency mode"}.`,
              `Charging before the peak window reduces grid dependency and peak tariff exposure.`,
              `${summary.rampRisk === "High" ? "High ramp risk: generator remains available as emergency backup." : "Generator available as emergency backup."}`,
            ].map((reason, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <span className="text-emerald-600 font-bold mt-0.5">•</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── What-If Panel ─── */}
      <div className="px-4 pb-4">
        <button
          onClick={() => setShowWhatIf(!showWhatIf)}
          className={cn(
            "flex items-center gap-2 text-xs font-semibold border rounded-xl px-3 py-2 transition-all w-full sm:w-auto",
            showWhatIf
              ? "bg-amber-50 text-amber-800 border-amber-300"
              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
          )}
        >
          <AlertTriangle className={cn("w-3.5 h-3.5", showWhatIf ? "text-amber-600" : "text-slate-400")} />
          What happens if...?
        </button>

        {showWhatIf && (
          <div className="mt-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Select a Scenario
              </span>
              {activeWhatIf && (
                <button
                  onClick={() => setActiveWhatIf(null)}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {WHAT_IF_SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => setActiveWhatIf(activeWhatIf?.id === scenario.id ? null : scenario)}
                  className={cn(
                    "flex flex-col items-start text-left p-2.5 rounded-xl border text-xs transition-all",
                    activeWhatIf?.id === scenario.id
                      ? "bg-amber-200 border-amber-500 text-amber-900"
                      : "bg-white border-amber-100 text-slate-700 hover:border-amber-400"
                  )}
                >
                  <span className="font-semibold">{scenario.label}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">{scenario.description}</span>
                </button>
              ))}
            </div>

            {activeWhatIf && (
              <div className="mt-2 p-3 rounded-xl bg-white border border-amber-200 text-xs space-y-2">
                <div className="font-bold text-amber-800 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Scenario Impact: {activeWhatIf.label}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="font-bold text-slate-900">{effectiveState.totalDemandMW} MW</div>
                    <div className="text-[10px] text-slate-500">Demand</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className="font-bold text-slate-900">
                      ₹{(8.5 + (activeWhatIf.gridAvailable === false ? 3.2 : 0)).toFixed(1)}/kWh
                    </div>
                    <div className="text-[10px] text-slate-500">Energy Cost</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className={cn("font-bold", (activeWhatIf.solarMod ?? 1) < 1 || (activeWhatIf.windMod ?? 1) < 1 ? "text-rose-600" : "text-emerald-700")}>
                      {Math.round(((effectiveState.solarMW + effectiveState.windMW) / Math.max(1, effectiveState.totalDemandMW)) * 100)}%
                    </div>
                    <div className="text-[10px] text-slate-500">Renewable</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <div className={cn("font-bold", activeWhatIf.gridAvailable === false ? "text-rose-600" : "text-emerald-700")}>
                      {activeWhatIf.gridAvailable === false ? "96.4%" : "99.8%"}
                    </div>
                    <div className="text-[10px] text-slate-500">Reliability</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Peak Insight Modal ─── */}
      {showPeakInsight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 grid place-items-center">
                  <Zap className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-600">AI Predicted Peak</div>
                  <div className="text-2xl font-bold font-display text-slate-900">{summary.predictedPeak} MW</div>
                  <div className="text-xs text-slate-500">{summary.peakTime}</div>
                </div>
              </div>
              <button onClick={() => setShowPeakInsight(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4 text-sm text-slate-700 leading-relaxed">
              <strong className="text-slate-900">AI INSIGHT:</strong>
              <br />
              Demand is expected to peak at {summary.predictedPeak} MW {summary.peakTime}.{" "}
              {summary.aiRecommendation}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowPeakInsight(false); onSimulateClick?.(); }}
                className="flex-1 py-2.5 rounded-xl bg-[#1B4D3E] text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                View Optimization
              </button>
              <button
                onClick={() => { setShowPeakInsight(false); setShowWhatIf(true); }}
                className="flex-1 py-2.5 rounded-xl border border-[#1B4D3E] text-[#1B4D3E] text-xs font-semibold hover:bg-emerald-50 transition-colors"
              >
                Simulate Peak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
