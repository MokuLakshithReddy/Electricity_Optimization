import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Wind, Battery, Zap, Sliders, RefreshCw, Cpu } from "lucide-react";
import {
  calculateStrategies,
  PlantConditions,
  DEFAULT_PLANT_CONDITIONS,
  CalculatedStrategy,
} from "@/lib/strategyEngine";
import { StrategyCard } from "./StrategyCard";
import { StrategyDetailsModal } from "./StrategyDetailsModal";

interface StrategyComparisonProps {
  initialConditions?: Partial<PlantConditions>;
  showSimulatorControls?: boolean;
  className?: string;
}

export function StrategyComparison({
  initialConditions,
  showSimulatorControls = true,
  className = "",
}: StrategyComparisonProps) {
  const [conditions, setConditions] = useState<PlantConditions>({
    ...DEFAULT_PLANT_CONDITIONS,
    ...initialConditions,
  });

  const [activeModalStrategy, setActiveModalStrategy] = useState<CalculatedStrategy | null>(null);
  const [showControls, setShowControls] = useState(false);

  // Compute strategies dynamically from central strategyEngine
  const engineResult = calculateStrategies(conditions);
  const { strategies, costBenefitCapturedPct, carbonBenefitCapturedPct, balancedRationaleText } =
    engineResult;

  const handleResetConditions = () => {
    setConditions(DEFAULT_PLANT_CONDITIONS);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl lg:text-2xl font-bold text-slate-900">
              Strategy Comparison & Optimization
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Cpu className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              Live Optimization Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Compare rule-based baseline vs AI Pareto-optimized multi-objective energy dispatch strategies
          </p>
        </div>

        {showSimulatorControls && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowControls(!showControls)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                showControls
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{showControls ? "Hide What-If Controls" : "What-If Simulator"}</span>
            </button>

            {showControls && (
              <button
                onClick={handleResetConditions}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
                title="Reset simulation parameters"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Interactive What-If Simulation Controls Drawer */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 text-slate-900 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              Plant Operating Parameter Sliders
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Changes instantly update all 4 strategy calculations below
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Solar Availability */}
            <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Solar Availability
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  {Math.round(conditions.solarAvailability * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.8"
                step="0.1"
                value={conditions.solarAvailability}
                onChange={(e) =>
                  setConditions({ ...conditions, solarAvailability: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#159A72]"
              />
            </div>

            {/* Wind Availability */}
            <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-500" /> Wind Generation
                </span>
                <span className="font-mono font-bold text-cyan-700">
                  {Math.round(conditions.windAvailability * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.8"
                step="0.1"
                value={conditions.windAvailability}
                onChange={(e) =>
                  setConditions({ ...conditions, windAvailability: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#159A72]"
              />
            </div>

            {/* Battery Capacity */}
            <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-emerald-500" /> Battery Capacity
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {conditions.batteryCapacityMwh} MWh
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="600"
                step="25"
                value={conditions.batteryCapacityMwh}
                onChange={(e) =>
                  setConditions({
                    ...conditions,
                    batteryCapacityMwh: parseInt(e.target.value, 10),
                  })
                }
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#159A72]"
              />
            </div>

            {/* Grid Interconnect Status */}
            <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-blue-500" /> Utility Grid Status
                </span>
                <span
                  className={`font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                    conditions.gridAvailable
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {conditions.gridAvailable ? "Available" : "Grid Outage"}
                </span>
              </div>

              <label className="flex items-center justify-between text-xs cursor-pointer select-none pt-1">
                <span className="text-slate-600">Simulate Grid Outage</span>
                <input
                  type="checkbox"
                  checked={!conditions.gridAvailable}
                  onChange={(e) =>
                    setConditions({ ...conditions, gridAvailable: !e.target.checked })
                  }
                  className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Four Strategy Cards Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
        <StrategyCard
          strategy={strategies.current}
          onClick={() => setActiveModalStrategy(strategies.current)}
        />
        <StrategyCard
          strategy={strategies.costOptimized}
          onClick={() => setActiveModalStrategy(strategies.costOptimized)}
        />
        <StrategyCard
          strategy={strategies.carbonOptimized}
          onClick={() => setActiveModalStrategy(strategies.carbonOptimized)}
        />
        <StrategyCard
          strategy={strategies.balanced}
          onClick={() => setActiveModalStrategy(strategies.balanced)}
          costBenefitCapturedPct={costBenefitCapturedPct}
          carbonBenefitCapturedPct={carbonBenefitCapturedPct}
          rationaleText={balancedRationaleText}
        />
      </div>

      {/* In-depth Modal */}
      <StrategyDetailsModal
        strategy={activeModalStrategy}
        onClose={() => setActiveModalStrategy(null)}
      />
    </div>
  );
}
