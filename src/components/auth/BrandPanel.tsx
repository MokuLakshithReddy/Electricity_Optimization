import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { EnergyNetwork } from "./EnergyNetwork";
import { KPIStats } from "./KPIStats";

export function BrandPanel({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col justify-between text-white ${className}`}>
      {/* Top Header Logo */}
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/30">
          <Zap className="h-6 w-6 fill-current text-white" />
        </div>
        <span className="font-display text-xl font-bold tracking-tight text-white">
          IntelliGrid AI
        </span>
      </div>

      {/* Main Content Area */}
      <div className="my-8 lg:my-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            <span className="text-white block">Predict.</span>
            <span className="text-[#159A72] block">Optimize.</span>
            <span className="text-[#159A72] block">Save.</span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="max-w-lg text-sm lg:text-base leading-relaxed text-slate-300 font-normal"
        >
          An AI energy copilot orchestrating solar, wind, battery, grid, captive power and diesel
          across the plant — continuously forecasting demand, cutting electricity cost and carbon
          while guaranteeing uninterrupted supply.
        </motion.p>

        {/* 6-Node Energy Graphic */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="py-4"
        >
          <EnergyNetwork />
        </motion.div>
      </div>

      {/* Bottom KPI Telemetry */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
      >
        <KPIStats />
      </motion.div>
    </div>
  );
}
