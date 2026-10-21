import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CloudRain,
  Sun,
  Wind,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  X,
  ArrowRight,
  ShieldAlert,
  Zap,
  Award,
  BarChart3,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { useEnergyState } from "@/context/EnergyContext";
import {
  generateForecast,
  ForecastHorizonId,
  ForecastPoint,
  MODEL_GOVERNANCE_CARD,
} from "@/data/forecastData";

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
  component: ForecastsPage,
});

const horizonsList: { id: ForecastHorizonId; label: string }[] = [
  { id: "15m", label: "15 minutes" },
  { id: "1h", label: "1 hour" },
  { id: "6h", label: "6 hours" },
  { id: "24h", label: "24 hours" },
];

function ForecastsPage() {
  const navigate = useNavigate();
  const energyState = useEnergyState();
  const [horizon, setHorizon] = useState<ForecastHorizonId>("6h");
  const [rampModalOpen, setRampModalOpen] = useState(false);
  const [validationModalOpen, setValidationModalOpen] = useState(false);

  // Generate dynamic forecast based on horizon & live central EnergyContext state
  const { points, summary } = useMemo(
    () => generateForecast(horizon, energyState),
    [horizon, energyState]
  );

  // Calculate dynamic Y-axis domain
  const allValues = points.flatMap((p) => [p.lower, p.upper, p.actual ?? 0, p.predicted]);
  const minY = Math.max(0, Math.floor(Math.min(...allValues) / 20) * 20 - 20);
  const maxY = Math.ceil(Math.max(...allValues) / 20) * 20 + 30;

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data: ForecastPoint = payload[0].payload;
      return (
        <div className="rounded-2xl bg-white border border-[#E6E1D7] p-3 shadow-xl text-xs space-y-1.5 min-w-[160px]">
          <p className="font-bold text-[#1F2937] border-b border-[#F3F0EA] pb-1">
            Time: <span className="font-mono text-[#1B4D3E]">{label}</span>
          </p>
          {data.actual !== null && data.actual !== undefined && (
            <div className="flex items-center justify-between gap-3 text-[#2563EB]">
              <span className="font-medium">Actual Demand:</span>
              <span className="font-bold font-mono">{data.actual} MW</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 text-[#1B4D3E]">
            <span className="font-medium">Predicted Demand:</span>
            <span className="font-bold font-mono">{data.predicted} MW</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[#6B7280]">
            <span className="font-medium">Confidence Band:</span>
            <span className="font-mono text-[11px] font-bold">
              {data.lower}–{data.upper} MW
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F2937]">
            Forecasting Engine
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Empirical ARX load model · Holdout Tested MAPE {MODEL_GOVERNANCE_CARD.holdoutEvaluation.mape}% over trailing 120h synthetic test set
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setValidationModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-[#1B4D3E] border border-[#E6E1D7] hover:bg-[#FAF8F5] transition-all cursor-pointer shadow-xs"
          >
            <FileCheck className="h-3.5 w-3.5 text-[#1B4D3E]" />
            <span>Model Card & Evaluation</span>
          </button>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-900 border border-amber-200 w-fit">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Benchmark Protocol · Pre-Commissioning</span>
          </div>
        </div>
      </div>

      {/* Benchmark Disclaimer Banner */}
      <div className="rounded-2xl bg-amber-50/80 border border-amber-200/90 p-3.5 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <strong className="font-semibold">Synthetic Benchmark Protocol:</strong>{" "}
          The evaluation metrics (2.38% MAPE over 120h holdout) demonstrate algorithmic convergence and benchmark superiority (vs 24h persistence and 7-day seasonal MA) on a standardized synthetic diurnal steel-mill dataset. These results do not claim commissioned plant accuracy on live factory SCADA. Production field deployment requires continuous on-site ingestion of historical plant telemetry.
        </div>
      </div>

      {/* 1. Dynamic Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: PREDICTED PEAK */}
        <div className="rounded-3xl bg-white border border-[#E6E1D7] p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            Predicted Peak
          </span>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold text-[#1F2937]">
                {summary.predictedPeak}
              </span>
              <span className="text-sm font-bold text-[#6B7280]">MW</span>
            </div>
            <p className="text-xs text-[#1B4D3E] font-medium mt-1">
              Peak window: {summary.peakTime}
            </p>
          </div>
        </div>

        {/* Card 2: FORECAST HORIZON & TESTED ACCURACY */}
        <div
          onClick={() => setValidationModalOpen(true)}
          className="rounded-3xl bg-white border border-[#E6E1D7] p-5 shadow-xs flex flex-col justify-between hover:border-sky-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Horizon & Accuracy
            </span>
            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full group-hover:bg-sky-100 transition-colors">
              Holdout Audit →
            </span>
          </div>
          <div className="my-2">
            <span className="font-display text-3xl font-extrabold text-[#0284C7]">
              {horizonsList.find((h) => h.id === horizon)?.label}
            </span>
            <p className="text-xs text-[#6B7280] font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>Tested MAPE: {MODEL_GOVERNANCE_CARD.holdoutEvaluation.mape}% (R² {MODEL_GOVERNANCE_CARD.holdoutEvaluation.r2})</span>
            </p>
          </div>
        </div>

        {/* Card 3: CONFIDENCE BAND */}
        <div className="rounded-3xl bg-white border border-[#E6E1D7] p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
            Confidence Band
          </span>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold text-emerald-700">
                ±{summary.confidenceBand}
              </span>
              <span className="text-sm font-bold text-[#6B7280]">MW</span>
            </div>
            <p className="text-xs text-[#6B7280] font-medium mt-1">
              95% prediction interval
            </p>
          </div>
        </div>

        {/* Card 4: RAMP RISK (Clickable) */}
        <div
          onClick={() => setRampModalOpen(true)}
          className="rounded-3xl bg-white border border-[#E6E1D7] p-5 shadow-xs flex flex-col justify-between hover:border-amber-500/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Ramp Risk
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full group-hover:bg-amber-100 transition-colors">
              Click for Details →
            </span>
          </div>
          <div className="my-2">
            <span
              className={`font-display text-3xl font-extrabold ${
                summary.rampRisk === "High"
                  ? "text-rose-600"
                  : summary.rampRisk === "Moderate"
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {summary.rampRisk}
            </span>
            <p className="text-xs text-[#6B7280] font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
              <span>Max ramp: +{summary.maxRampRate} MW/hr</span>
            </p>
          </div>
        </div>

      </div>

      {/* 2. Main Forecast Chart Container */}
      <div className="rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-bold text-[#1F2937]">
              Demand forecast
            </h3>
            <p className="text-xs text-[#6B7280]">Actual vs predicted load (MW)</p>
          </div>

          {/* Time Horizon Segment Control */}
          <div className="flex items-center gap-1 rounded-2xl bg-[#FAF8F5] p-1 border border-[#E6E1D7] w-fit">
            {horizonsList.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setHorizon(opt.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  horizon === opt.id
                    ? "bg-[#1B4D3E] text-white shadow-xs"
                    : "text-[#6B7280] hover:text-[#1F2937]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs font-semibold text-[#4B5563] pt-1">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#2563EB]" />
            <span>Actual Demand</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#1B4D3E]" />
            <span>Predicted Demand</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-6 rounded-xs bg-emerald-500/20 border border-emerald-500/40" />
            <span>Confidence Band (95%)</span>
          </div>
        </div>

        {/* Main Chart */}
        <div className="h-[360px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="confidenceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.03} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#F3F0EA" vertical={false} />
              <XAxis dataKey="t" stroke="#9CA3AF" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                domain={[minY, maxY]}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Shaded Area for Confidence Band (lower to upper) */}
              <Area
                type="monotone"
                dataKey="bandRange"
                stroke="none"
                fill="url(#confidenceFill)"
                name="Confidence Band"
              />

              {/* Actual Demand Solid Line */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ r: 4, fill: "#2563EB", strokeWidth: 2, stroke: "#FFFFFF" }}
                name="Actual Demand"
                connectNulls={false}
              />

              {/* Predicted Demand Primary Line */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#1B4D3E"
                strokeWidth={3}
                strokeDasharray="6 4"
                dot={{ r: 4, fill: "#1B4D3E", strokeWidth: 2, stroke: "#FFFFFF" }}
                name="Predicted Demand"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. AI Forecast Insight Card */}
      <div className="rounded-3xl bg-gradient-to-r from-[#1B4D3E] via-[#133E32] to-[#0D5C46] text-white p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/60 border border-emerald-400/30 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>AI Forecast Insight</span>
            </div>

            <h4 className="font-display text-xl sm:text-2xl font-bold leading-tight">
              Demand is expected to peak at{" "}
              <span className="text-emerald-300 font-extrabold">{summary.predictedPeak} MW</span>{" "}
              around {summary.peakTime}.
            </h4>

            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              AI recommends increasing battery readiness before peak window to reduce high-tariff grid dependency.
            </p>

            {/* Stat Badges */}
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="rounded-2xl bg-white/10 px-3.5 py-1.5 text-xs font-medium border border-white/10">
                <span className="text-emerald-200">Predicted Peak:</span>{" "}
                <span className="font-bold text-white">{summary.predictedPeak} MW</span>
              </div>
              <div className="rounded-2xl bg-white/10 px-3.5 py-1.5 text-xs font-medium border border-white/10">
                <span className="text-emerald-200">Peak Time:</span>{" "}
                <span className="font-bold text-white">{summary.peakTime}</span>
              </div>
              <div className="rounded-2xl bg-white/10 px-3.5 py-1.5 text-xs font-medium border border-white/10">
                <span className="text-emerald-200">Expected Ramp:</span>{" "}
                <span className="font-bold text-white">+{summary.maxRampRate} MW/hr</span>
              </div>
              <div className="rounded-2xl bg-white/10 px-3.5 py-1.5 text-xs font-medium border border-white/10">
                <span className="text-emerald-200">Expected Impact:</span>{" "}
                <span className="font-bold text-amber-300">{summary.expectedSaving} saving</span>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <button
              onClick={() => navigate({ to: "/app/scenarios" })}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#133E32] hover:bg-emerald-50 transition-all shadow-lg cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <span>Optimize for Peak</span>
              <ArrowRight className="h-4 w-4 text-[#133E32]" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Renewable & Weather Breakdown */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-[#1F2937]">
              Renewable Generation Forecast
            </h3>
            <p className="text-xs text-[#6B7280]">Next 24 hours · Solar & wind prediction (MW)</p>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { t: "12 AM", solar: 0, wind: 95 },
                  { t: "3 AM", solar: 0, wind: 110 },
                  { t: "6 AM", solar: 25, wind: 80 },
                  { t: "9 AM", solar: 140, wind: 65 },
                  { t: "12 PM", solar: 210, wind: 55 },
                  { t: "3 PM", solar: 175, wind: 60 },
                  { t: "6 PM", solar: 40, wind: 85 },
                  { t: "9 PM", solar: 0, wind: 95 },
                  { t: "12 AM", solar: 0, wind: 100 },
                ]}
              >
                <defs>
                  <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284C7" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F3F0EA" vertical={false} />
                <XAxis dataKey="t" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="solar" stroke="#F59E0B" strokeWidth={2} fill="url(#solarGrad)" name="Solar PV" />
                <Area type="monotone" dataKey="wind" stroke="#0284C7" strokeWidth={2} fill="url(#windGrad)" name="Wind Farm" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-[#1F2937]">Weather & Cloud Cover</h3>
            <p className="text-xs text-[#6B7280]">Cloud cover % impacting PV yield</p>
          </div>
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 rounded-2xl bg-[#FAF8F5] p-3 border border-[#E6E1D7]">
              <Sun className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#1F2937]">Peak Irradiance</p>
                <p className="text-[11px] text-[#6B7280]">912 W/m² predicted at 12:40 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-[#FAF8F5] p-3 border border-[#E6E1D7]">
              <Wind className="h-5 w-5 text-sky-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#1F2937]">Wind Velocity</p>
                <p className="text-[11px] text-[#6B7280]">8.4 m/s steady after 07:20 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-[#FAF8F5] p-3 border border-[#E6E1D7]">
              <CloudRain className="h-5 w-5 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#1F2937]">Cloud Cover</p>
                <p className="text-[11px] text-[#6B7280]">62% probability at 02:15 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ramp Risk Explanation Detail Modal */}
      {rampModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#F3F0EA] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1F2937]">
                    Ramp Risk Analysis
                  </h3>
                  <p className="text-xs text-[#6B7280]">IntelliGrid Predictive Evaluation</p>
                </div>
              </div>
              <button
                onClick={() => setRampModalOpen(false)}
                className="rounded-2xl p-2 text-[#6B7280] hover:bg-[#FAF8F5] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-[#FAF8F5] p-3.5 border border-[#E6E1D7]">
                <span className="text-xs font-semibold text-[#6B7280]">Risk Level</span>
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                    summary.rampRisk === "High"
                      ? "bg-rose-50 text-rose-800 border border-rose-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}
                >
                  {summary.rampRisk} Risk
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white p-3 border border-[#E6E1D7]">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase">Expected Ramp</span>
                  <p className="font-display text-base font-bold text-[#1F2937] mt-0.5">
                    +{summary.maxRampRate} MW/hr
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-3 border border-[#E6E1D7]">
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase">Peak Window</span>
                  <p className="font-display text-base font-bold text-[#1F2937] mt-0.5">
                    {summary.peakRampWindow}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1F2937]">Root Cause Analysis:</label>
                <p className="text-xs text-[#4B5563] bg-[#FAF8F5] p-3 rounded-2xl border border-[#E6E1D7]">
                  "{summary.rampReason}"
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1B4D3E]">AI Recommendation:</label>
                <p className="text-xs text-[#1B4D3E] font-medium bg-[#E8F5E9] p-3 rounded-2xl border border-emerald-200">
                  "{summary.aiRecommendation}"
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-[#F3F0EA]">
              <button
                onClick={() => setRampModalOpen(false)}
                className="rounded-2xl border border-[#E6E1D7] px-4 py-2 text-xs font-bold text-[#1F2937] hover:bg-[#FAF8F5] transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setRampModalOpen(false);
                  navigate({ to: "/app/scenarios" });
                }}
                className="rounded-2xl bg-[#1B4D3E] px-5 py-2 text-xs font-bold text-white hover:bg-[#133E32] transition-all cursor-pointer shadow-md"
              >
                Apply Mitigation Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Model Governance & Empirical Evaluation Modal */}
      {validationModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#F3F0EA] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1F2937]">
                    Model Evaluation & Empirical Benchmark
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    {MODEL_GOVERNANCE_CARD.modelId} ({MODEL_GOVERNANCE_CARD.modelVersion})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setValidationModalOpen(false)}
                className="rounded-2xl p-2 text-[#6B7280] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Architecture & Training Window */}
              <div className="rounded-2xl bg-[#FAF8F5] p-3.5 border border-[#E6E1D7] space-y-2">
                <p className="font-bold text-[#1F2937]">Model Architecture</p>
                <p className="text-[#4B5563] font-mono text-[11px]">
                  {MODEL_GOVERNANCE_CARD.architecture}
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="rounded-xl bg-white p-2 border border-[#E6E1D7]">
                    <span className="text-[#6B7280] block">Training Window</span>
                    <span className="font-bold text-[#1F2937]">{MODEL_GOVERNANCE_CARD.chronologicalSplit.trainHours}h (70%)</span>
                  </div>
                  <div className="rounded-xl bg-white p-2 border border-[#E6E1D7]">
                    <span className="text-[#6B7280] block">Validation Window</span>
                    <span className="font-bold text-[#1F2937]">{MODEL_GOVERNANCE_CARD.chronologicalSplit.valHours}h (13.3%)</span>
                  </div>
                  <div className="rounded-xl bg-white p-2 border border-emerald-200 bg-emerald-50/50">
                    <span className="text-emerald-800 font-semibold block">Holdout Test Set</span>
                    <span className="font-bold text-emerald-950">{MODEL_GOVERNANCE_CARD.chronologicalSplit.holdoutTestHours}h (16.7%)</span>
                  </div>
                </div>
              </div>

              {/* Holdout Test Evaluation vs Baselines */}
              <div>
                <p className="font-bold text-[#1F2937] mb-2 flex items-center justify-between">
                  <span>Out-of-Sample Holdout Benchmark (120 Hours)</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    Chronological Unseen Data
                  </span>
                </p>
                <div className="overflow-x-auto rounded-2xl border border-[#E6E1D7]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] border-b border-[#E6E1D7] text-[#6B7280] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Model / Baseline</th>
                        <th className="py-2.5 px-2">MAPE (%)</th>
                        <th className="py-2.5 px-2">RMSE (MW)</th>
                        <th className="py-2.5 px-2">MAE (MW)</th>
                        <th className="py-2.5 px-2">R² Score</th>
                        <th className="py-2.5 px-2 text-right">vs Model</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F0EA]">
                      <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                        <td className="py-2.5 px-3 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>IntelliGrid ARX v4.2 (Trained)</span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-emerald-700">
                          {MODEL_GOVERNANCE_CARD.holdoutEvaluation.mape}%
                        </td>
                        <td className="py-2.5 px-2 font-mono">{MODEL_GOVERNANCE_CARD.holdoutEvaluation.rmse}</td>
                        <td className="py-2.5 px-2 font-mono">{MODEL_GOVERNANCE_CARD.holdoutEvaluation.mae}</td>
                        <td className="py-2.5 px-2 font-mono text-emerald-700">{MODEL_GOVERNANCE_CARD.holdoutEvaluation.r2}</td>
                        <td className="py-2.5 px-2 text-right text-emerald-800">Reference</td>
                      </tr>
                      {MODEL_GOVERNANCE_CARD.baselines.map((b) => (
                        <tr key={b.baselineName} className="text-[#4B5563]">
                          <td className="py-2.5 px-3">
                            <span className="font-medium text-[#1F2937] block">{b.baselineName}</span>
                            <span className="text-[10px] text-[#6B7280]">{b.description}</span>
                          </td>
                          <td className="py-2.5 px-2 font-mono">{b.mape}%</td>
                          <td className="py-2.5 px-2 font-mono">{b.rmse}</td>
                          <td className="py-2.5 px-2 font-mono">{b.mae}</td>
                          <td className="py-2.5 px-2 font-mono">{b.r2}</td>
                          <td className="py-2.5 px-2 text-right text-emerald-700 font-bold">
                            -{b.relativeImprovementMape}% error
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Feature Importance */}
              <div>
                <p className="font-bold text-[#1F2937] mb-2">Feature Importance Breakdown</p>
                <div className="space-y-1.5">
                  {MODEL_GOVERNANCE_CARD.featureImportance.map((f) => (
                    <div key={f.feature} className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-medium text-[#1F2937]">{f.feature}</span>
                        <span className="font-mono text-[#6B7280]">{f.weightPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#F3F0EA] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1B4D3E] rounded-full"
                          style={{ width: `${f.weightPct * 2.5}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-[#F3F0EA]">
              <span className="text-[11px] text-[#6B7280]">
                Last evaluated on 120-hour holdout test set · ISO 50001 compliant
              </span>
              <button
                onClick={() => setValidationModalOpen(false)}
                className="rounded-2xl bg-[#1B4D3E] px-5 py-2 text-xs font-bold text-white hover:bg-[#133E32] transition-all cursor-pointer shadow-md"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
