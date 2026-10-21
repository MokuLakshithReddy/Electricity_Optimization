import { ArrowRight, Leaf, ShieldCheck, Wallet } from "lucide-react";
import { useEnergyState } from "@/context/EnergyContext";

interface ImpactSummaryProps {
  onViewImpactReport?: () => void;
}

export function ImpactSummary({ onViewImpactReport }: ImpactSummaryProps) {
  const energyState = useEnergyState();

  const costSavedText = energyState?.energyCostSavedFormatted || "₹18.4 L";
  const co2AvoidedText = energyState?.co2AvoidedDaily
    ? `${energyState.co2AvoidedDaily.toLocaleString()} t`
    : "4,820 t";
  const reliabilityText = energyState?.reliability ? `${energyState.reliability}%` : "99.97%";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1B4D3E] via-[#133E32] to-[#0D5C46] text-white p-6 sm:p-8 lg:p-9 shadow-xl mt-6">
      {/* Background Vector Art - Subtle & Non-blocking */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 opacity-10 flex items-center justify-end pr-6">
        <svg
          className="h-full max-h-48 w-auto text-white"
          viewBox="0 0 300 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M 150 180 C 180 100 240 80 300 60 M 150 180 L 300 180" />
          <circle cx="220" cy="110" r="30" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Main 3-Column Grid Layout: 38% | 44% | 18% on Desktop */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[38%_44%_18%] gap-6 lg:gap-8 items-center min-w-0">
        {/* COLUMN 1 — MESSAGE (38% width) */}
        <div className="min-w-0 flex flex-col justify-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/60 border border-emerald-400/30 px-3.5 py-1 text-xs font-semibold text-emerald-300 mb-3 w-fit">
            <Leaf className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Plant Environmental & Cost Impact</span>
          </div>

          {/* Main Heading */}
          <h3 className="font-display font-bold text-white text-xl sm:text-2xl lg:text-[26px] xl:text-[30px] leading-[1.15] tracking-tight">
            Your energy decisions <br className="hidden sm:inline" />
            are building a cleaner, <br className="hidden sm:inline" />
            more resilient plant.
          </h3>
        </div>

        {/* COLUMN 2 — IMPACT METRICS (44% width: 3 equal horizontal KPI blocks) */}
        <div className="min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5 items-start min-w-0">
            {/* KPI 1: Cost Savings */}
            <div className="flex flex-col min-w-0">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald-300 mb-2">
                <Wallet className="h-4 w-4" />
              </div>
              <p className="font-display font-bold text-lg sm:text-xl lg:text-xl xl:text-2xl text-white leading-tight tracking-tight whitespace-nowrap min-w-0">
                {costSavedText}
              </p>
              <p className="text-xs sm:text-sm text-emerald-200/80 font-medium leading-snug mt-1 break-words">
                Cost Savings MTD
              </p>
            </div>

            {/* KPI 2: CO2 Avoided */}
            <div className="flex flex-col min-w-0">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald-300 mb-2">
                <Leaf className="h-4 w-4" />
              </div>
              <p className="font-display font-bold text-lg sm:text-xl lg:text-xl xl:text-2xl text-white leading-tight tracking-tight whitespace-nowrap min-w-0">
                {co2AvoidedText}
              </p>
              <p className="text-xs sm:text-sm text-emerald-200/80 font-medium leading-snug mt-1 break-words">
                CO₂ Avoided
              </p>
            </div>

            {/* KPI 3: Power Reliability */}
            <div className="flex flex-col min-w-0">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald-300 mb-2">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <p className="font-display font-bold text-lg sm:text-xl lg:text-xl xl:text-2xl text-white leading-tight tracking-tight whitespace-nowrap min-w-0">
                {reliabilityText}
              </p>
              <p className="text-xs sm:text-sm text-emerald-200/80 font-medium leading-snug mt-1 break-words">
                Power Reliability
              </p>
            </div>
          </div>
        </div>

        {/* COLUMN 3 — ACTION (18% width: Vertically Centered Pill Button) */}
        <div className="min-w-0 flex items-center justify-start lg:justify-end">
          <button
            onClick={onViewImpactReport}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs sm:text-sm font-bold text-[#133E32] hover:bg-emerald-50 transition-all shadow-md cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <span>View Impact Report</span>
            <ArrowRight className="h-4 w-4 text-[#133E32]" />
          </button>
        </div>
      </div>
    </div>
  );
}
