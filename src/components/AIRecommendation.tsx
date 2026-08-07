import { Sparkles, ArrowRight, PlayCircle } from "lucide-react";
import { primaryRecommendation } from "@/data/optimizationData";

interface AIRecommendationProps {
  onViewOptimization?: () => void;
  onSimulate?: () => void;
}

export function AIRecommendation({ onViewOptimization, onSimulate }: AIRecommendationProps) {
  return (
    <div className="rounded-3xl bg-gradient-to-r from-[#E8F5E9]/90 via-white to-[#F0FDF4] border-2 border-[#1B4D3E]/20 p-6 shadow-md hover:shadow-lg transition-all duration-200 mt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Side: Icon + Text Content */}
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#1B4D3E] text-white shadow-md">
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1B4D3E] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full border border-emerald-200">
                AI Recommendation
              </span>
              <span className="text-xs font-semibold text-emerald-800">
                94% Confidence
              </span>
            </div>

            <h4 className="font-display text-xl font-bold text-[#1F2937]">
              {primaryRecommendation.title}
            </h4>

            <p className="text-xs sm:text-sm text-[#4B5563]">
              {primaryRecommendation.reason}{" "}
              <strong className="text-[#1B4D3E] font-semibold">
                Expected impact: {primaryRecommendation.impactCost} and {primaryRecommendation.impactCarbon}.
              </strong>
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <button
            onClick={onSimulate}
            className="flex items-center gap-2 rounded-2xl border border-[#1B4D3E]/30 bg-white px-4 py-2.5 text-xs font-bold text-[#1B4D3E] hover:bg-[#E8F5E9] hover:border-[#1B4D3E] transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <PlayCircle className="h-4 w-4 text-[#1B4D3E]" />
            <span>Simulate</span>
          </button>

          <button
            onClick={onViewOptimization}
            className="flex items-center gap-2 rounded-2xl bg-[#1B4D3E] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#133E32] transition-all shadow-md cursor-pointer active:scale-95"
          >
            <span>{primaryRecommendation.actionButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
