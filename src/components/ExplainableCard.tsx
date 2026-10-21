import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, Cpu, Database, Play, CheckCircle2 } from "lucide-react";
import { inr } from "@/lib/energy";
import { confidenceLabel, type SmartRecommendation } from "@/lib/intel";
import { cn } from "@/lib/utils";
import { useEnergyState } from "@/context/EnergyContext";

export function ConfidenceRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = 17;
  const c = 2 * Math.PI * r;

  // Dynamic Ring Color
  const strokeColor =
    value >= 90
      ? "#10B981" // Green
      : value >= 70
        ? "#F59E0B" // Amber
        : "#EF4444"; // Warning

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#E6E1D7" strokeWidth="4" />
        <motion.circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (value / 100) * c }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-[11px] font-bold text-[#1F2937]">
        {value}%
      </span>
    </div>
  );
}

export function ExplainableCard({
  rec,
  defaultOpen = false,
  delay = 0,
  onSimulate,
}: {
  rec: SmartRecommendation;
  defaultOpen?: boolean;
  delay?: number;
  onSimulate?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [reviewed, setReviewed] = useState(false);
  const energyState = useEnergyState();

  // Dynamic telemetry context
  const liveDemand = energyState?.totalDemandMW || 520;
  const liveSolar = energyState?.solarMW || 145;
  const liveWind = energyState?.windMW || 104;
  const liveSoc = energyState?.batterySOC || 62;

  // Affected assets label
  const affectedAssets =
    rec.id === "r1"
      ? "BESS-1 + BESS-2"
      : rec.id === "r2"
        ? "Captive Unit 3"
        : rec.id === "r3"
          ? "Pickling Line"
          : "BESS-1 Reserve";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-3xl bg-white border border-[#E6E1D7] p-5 shadow-xs hover:border-[#1B4D3E]/30 transition-all space-y-4"
    >
      {/* TOP ROW: [Confidence Ring] [Category Badge] [Time] [Confidence + Risk] */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ConfidenceRing value={rec.confidence} />
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                  rec.category === "Cost"
                    ? "bg-[#E8F5E9] text-[#1B4D3E]"
                    : rec.category === "Reliability"
                      ? "bg-purple-50 text-purple-700"
                      : "bg-sky-50 text-sky-700"
                }`}
              >
                {rec.category}
              </span>
              <span className="font-mono text-xs font-semibold text-[#6B7280]">{rec.time}</span>
            </div>
            <p className="text-[11px] text-[#6B7280] font-medium mt-0.5">
              {confidenceLabel(rec.confidence)} confidence · Risk {rec.risk.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Priority Status Pill */}
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#E6E1D7] text-[#1B4D3E]">
          LIVE OPTIMIZED
        </span>
      </div>

      {/* MAIN TITLE & DESCRIPTION */}
      <div className="space-y-1">
        <h4 className="font-display text-base font-bold text-[#1F2937] leading-snug">
          {rec.title}
        </h4>
        <p className="text-xs text-[#4B5563] leading-relaxed break-words overflow-wrap-break-word">
          {rec.action}
        </p>
      </div>

      {/* IMPACT ROW: High Contrast Metric Boxes (#F5F7F6) */}
      <div className="grid grid-cols-3 gap-2.5 text-xs">
        <div className="rounded-2xl bg-[#F5F7F6] border border-[#E6E1D7] p-2.5 min-w-0">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase">Savings</p>
          <p className="font-display text-sm font-extrabold text-[#1B4D3E] mt-0.5 truncate">
            {rec.savings ? inr(rec.savings) : "—"}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F5F7F6] border border-[#E6E1D7] p-2.5 min-w-0">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase">CO₂ Avoided</p>
          <p className="font-display text-sm font-extrabold text-emerald-700 mt-0.5 truncate">
            {rec.carbon >= 0 ? "−" : "+"}
            {Math.abs(rec.carbon).toFixed(1)} t
          </p>
        </div>

        <div className="rounded-2xl bg-[#F5F7F6] border border-[#E6E1D7] p-2.5 min-w-0">
          <p className="text-[10px] font-bold text-[#6B7280] uppercase">Affected Assets</p>
          <p className="font-display text-xs font-bold text-[#1F2937] mt-0.5 truncate">
            {affectedAssets}
          </p>
        </div>
      </div>

      {/* BOTTOM ACTION BAR: Clear Interactive Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-2xl bg-[#F3F7F5] border border-[#D8E5DF] px-4 py-2.5 text-xs font-bold text-[#1B4D3E] hover:bg-[#E8F5E9] hover:border-[#1B4D3E]/40 transition-all cursor-pointer shadow-2xs"
      >
        <span className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[#1B4D3E]" />
          <span>Why did the AI decide this?</span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {/* EXPLAINABLE AI EXPANDED PANEL */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-2 space-y-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1D7] p-4 text-xs">
              {/* Decision Statement */}
              <div className="border-b border-[#E6E1D7] pb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  AI Decision Statement:
                </span>
                <p className="font-bold text-[#1F2937] mt-0.5">{rec.title}</p>
              </div>

              {/* WHY Bullet Points */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B4D3E]">
                  Why should we do it?
                </span>
                <ul className="space-y-1 text-[#4B5563]">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#1B4D3E] font-bold">•</span>
                    <span>{rec.why}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#1B4D3E] font-bold">•</span>
                    <span>Solar surplus is higher than plant demand during shoulder pricing.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#1B4D3E] font-bold">•</span>
                    <span>
                      Charging now avoids grid peak ToD tariffs (₹11.80/kWh) in evening window.
                    </span>
                  </li>
                </ul>
              </div>

              {/* TELEMETRY DATA USED */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Live Telemetry Data Used:
                </span>
                <div className="grid grid-cols-3 gap-2 mt-1.5 text-[11px]">
                  <div className="bg-white p-2 rounded-xl border border-[#E6E1D7]">
                    <span className="text-[#6B7280] block text-[10px]">Demand</span>
                    <span className="font-bold text-[#1F2937]">{liveDemand} MW</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E6E1D7]">
                    <span className="text-[#6B7280] block text-[10px]">Solar</span>
                    <span className="font-bold text-amber-600">{liveSolar} MW</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E6E1D7]">
                    <span className="text-[#6B7280] block text-[10px]">Wind</span>
                    <span className="font-bold text-sky-600">{liveWind} MW</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E6E1D7]">
                    <span className="text-[#6B7280] block text-[10px]">Battery SOC</span>
                    <span className="font-bold text-emerald-600">{liveSoc}%</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E6E1D7]">
                    <span className="text-[#6B7280] block text-[10px]">Grid</span>
                    <span className="font-bold text-[#2563EB]">Available</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-[#E6E1D7]">
                    <span className="text-[#6B7280] block text-[10px]">Forecast Peak</span>
                    <span className="font-bold text-[#1B4D3E]">542 MW</span>
                  </div>
                </div>
              </div>

              {/* FACTOR WEIGHTS */}
              <div className="space-y-2 pt-1 border-t border-[#E6E1D7]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Key Decision Factor Weights:
                </span>
                {rec.factors.map((f) => (
                  <div key={f.label} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-medium text-[#1F2937]">{f.label}</span>
                      <span className="font-mono font-bold text-[#1B4D3E]">{f.weight}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[#E6E1D7] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1B4D3E]"
                        style={{ width: `${f.weight}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* COUNTERFACTUAL RISK */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-amber-900">
                <span className="font-bold uppercase text-[10px] block text-amber-800">
                  What happens if we ignore this?
                </span>
                <p className="text-[11px] mt-0.5 leading-relaxed">{rec.counterfactual}</p>
              </div>

              {/* ACTION BUTTONS (Review -> Simulate -> Confirm) */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E6E1D7]">
                <button
                  onClick={() => setReviewed(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    reviewed
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-white border border-[#E6E1D7] text-[#1F2937] hover:bg-[#FAF8F5]"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{reviewed ? "Reviewed" : "Review"}</span>
                </button>

                <button
                  onClick={() => onSimulate?.()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1B4D3E] text-white text-xs font-bold hover:bg-[#133E32] transition-all cursor-pointer shadow-xs"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Run What-If</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
