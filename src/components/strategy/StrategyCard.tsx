import React, { useState } from "react";
import { Star, Check, Info } from "lucide-react";
import {
  CalculatedStrategy,
  formatIndianCurrencyCr,
  formatExactRupees,
} from "@/lib/strategyEngine";

interface StrategyCardProps {
  strategy: CalculatedStrategy;
  onClick: () => void;
  costBenefitCapturedPct?: number;
  carbonBenefitCapturedPct?: number;
  rationaleText?: string;
}

export function StrategyCard({
  strategy,
  onClick,
  costBenefitCapturedPct,
  carbonBenefitCapturedPct,
  rationaleText,
}: StrategyCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showSavingsTooltip, setShowSavingsTooltip] = useState(false);

  const isRecommended = strategy.isRecommended;

  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col justify-between rounded-[20px] bg-white p-5 lg:p-6 transition-all duration-200 cursor-pointer select-none text-slate-900 border ${
        isRecommended
          ? "border-[#159A72] shadow-xl ring-2 ring-[#159A72]/20 scale-[1.01]"
          : "border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300"
      }`}
    >
      {/* Top Header */}
      <div>
        {/* Recommended Badge for Balanced Card */}
        {isRecommended && (
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold text-[#0F6B53] uppercase tracking-wider">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E8F5E9] border border-[#159A72]/30 shadow-xs">
              <Star className="w-3.5 h-3.5 fill-[#159A72] text-[#159A72]" />
              AI Recommended
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className={`font-display text-lg lg:text-xl font-bold tracking-tight ${
                isRecommended ? "text-[#0F6B53]" : "text-slate-900"
              }`}
            >
              {strategy.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500 font-normal leading-snug line-clamp-2">
              {strategy.description}
            </p>
          </div>

          {/* Optimization Confidence Ring */}
          <div
            className="relative shrink-0"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 border border-slate-200">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isRecommended ? "text-[#159A72]" : "text-emerald-600"}
                  strokeDasharray={`${strategy.confidenceScore}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {strategy.confidenceScore}%
                </span>
              </div>
            </div>

            {/* Hover Tooltip for Optimization Confidence */}
            {showTooltip && (
              <div className="absolute right-0 top-14 z-30 w-48 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] font-medium leading-relaxed shadow-xl border border-slate-700 pointer-events-none">
                "Confidence reflects forecast certainty, data quality and optimization stability."
              </div>
            )}
          </div>
        </div>

        {/* Two-Column Aligned Metrics Layout */}
        <div className="mt-5 space-y-2.5 text-xs border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Annual cost</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              ₹{strategy.annualCostCr} Cr
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Emissions</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {strategy.co2EmissionsKt} ktCO₂
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Renewable</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {strategy.renewablePct}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Reliability</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {strategy.reliabilityPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-5 space-y-3">
        {/* Savings vs Current Bar */}
        <div
          className="relative rounded-xl bg-slate-100/80 px-3.5 py-2.5 flex items-center justify-between text-xs"
          onMouseEnter={() => setShowSavingsTooltip(true)}
          onMouseLeave={() => setShowSavingsTooltip(false)}
        >
          <span className="text-slate-500 font-medium">Savings vs current</span>
          <span className="font-mono font-bold text-[#0F6B53]">
            {strategy.savingsVsCurrentCr > 0
              ? formatIndianCurrencyCr(strategy.savingsVsCurrentCr)
              : "baseline"}
          </span>

          {/* Exact Rupees Hover Tooltip */}
          {showSavingsTooltip && strategy.savingsVsCurrentCr > 0 && (
            <div className="absolute bottom-11 right-0 z-30 px-3 py-1.5 rounded-lg bg-slate-900 text-emerald-400 text-xs font-mono font-semibold shadow-xl border border-slate-700 whitespace-nowrap pointer-events-none">
              Exact value: {formatExactRupees(strategy.savingsVsCurrentCr)}
            </div>
          )}
        </div>

        {/* Balanced Recommendation Rationale Text */}
        {isRecommended && (
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F6B53]">
              <Check className="w-4 h-4 text-[#159A72] shrink-0" />
              <span>Recommended by IntelliGrid AI</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
              {rationaleText ||
                `Captures ${costBenefitCapturedPct || 81}% of the cost benefit and ${
                  carbonBenefitCapturedPct || 71
                }% of the carbon benefit with the highest availability.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
