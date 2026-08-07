import { motion, AnimatePresence } from "framer-motion";
import { X, Star, CheckCircle2, Cpu, ShieldAlert, Zap, Sun, Wind, BatteryCharging, Factory, Flame } from "lucide-react";
import { CalculatedStrategy, formatIndianCurrencyCr, formatExactRupees } from "@/lib/strategyEngine";

interface StrategyDetailsModalProps {
  strategy: CalculatedStrategy | null;
  onClose: () => void;
}

export function StrategyDetailsModal({ strategy, onClose }: StrategyDetailsModalProps) {
  if (!strategy) return null;

  const mixItems = [
    { label: "Solar PV", pct: strategy.energyMix.solarPct, icon: Sun, color: "bg-amber-500" },
    { label: "Wind Turbine", pct: strategy.energyMix.windPct, icon: Wind, color: "bg-cyan-500" },
    { label: "Battery BESS", pct: strategy.energyMix.batteryPct, icon: BatteryCharging, color: "bg-emerald-500" },
    { label: "Utility Grid", pct: strategy.energyMix.gridPct, icon: Zap, color: "bg-blue-500" },
    { label: "Captive Thermal", pct: strategy.energyMix.captivePct, icon: Factory, color: "bg-orange-500" },
    { label: "Backup Diesel", pct: strategy.energyMix.backupGeneratorPct, icon: Flame, color: "bg-rose-500" },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xl text-slate-900 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-2xl font-bold text-slate-900">
                  {strategy.title}
                </h3>
                {strategy.isRecommended && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                    AI RECOMMENDED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">{strategy.description}</p>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Metric Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
              <span className="text-[11px] text-slate-500 font-medium block">Annual Cost</span>
              <span className="font-display text-lg font-bold text-slate-900 mt-0.5 block">
                ₹{strategy.annualCostCr} Cr
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
              <span className="text-[11px] text-slate-500 font-medium block">CO₂ Emissions</span>
              <span className="font-display text-lg font-bold text-slate-900 mt-0.5 block">
                {strategy.co2EmissionsKt} ktCO₂
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
              <span className="text-[11px] text-slate-500 font-medium block">Renewable Share</span>
              <span className="font-display text-lg font-bold text-emerald-700 mt-0.5 block">
                {strategy.renewablePct}%
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
              <span className="text-[11px] text-slate-500 font-medium block">Reliability</span>
              <span className="font-display text-lg font-bold text-slate-900 mt-0.5 block">
                {strategy.reliabilityPct}%
              </span>
            </div>
          </div>

          {/* Energy Source Mix Breakdown */}
          <div className="space-y-3 my-6 text-left">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Energy Source Mix
              </h4>
              <span className="text-xs font-semibold text-emerald-700">
                Annual Savings: {formatIndianCurrencyCr(strategy.savingsVsCurrentCr)}
                {strategy.savingsVsCurrentCr > 0 && ` (${formatExactRupees(strategy.savingsVsCurrentCr)})`}
              </span>
            </div>

            <div className="space-y-2.5">
              {mixItems.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <item.icon className="w-3.5 h-3.5 text-slate-500" />
                      {item.label}
                    </span>
                    <span className="font-mono text-slate-900 font-semibold">{item.pct}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, Math.max(0, item.pct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Rationale & Objective */}
          <div className="space-y-4 pt-4 border-t border-slate-100 text-left">
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-left space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                <Cpu className="w-4 h-4 text-emerald-600" />
                AI Optimization Rationale
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed font-normal">
                "{strategy.aiReasoning}"
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 block">Optimization Objective</span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {strategy.optimizationObjective}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="font-semibold text-slate-700 block">Active Constraints</span>
                <ul className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-slate-600">
                  {strategy.constraintsUsed.map((c, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer close */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              Close Strategy Details
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
