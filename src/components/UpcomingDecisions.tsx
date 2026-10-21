import { Zap, Wind, Network, RotateCcw, ArrowRight } from "lucide-react";
import { upcomingDecisions, UpcomingDecision } from "@/data/optimizationData";

interface UpcomingDecisionsProps {
  onViewAll?: () => void;
}

export function UpcomingDecisions({ onViewAll }: UpcomingDecisionsProps) {
  const getIcon = (name: string) => {
    switch (name) {
      case "Zap":
        return <Zap className="h-4 w-4 text-emerald-700" />;
      case "Wind":
        return <Wind className="h-4 w-4 text-[#0284C7]" />;
      case "Network":
        return <Network className="h-4 w-4 text-purple-700" />;
      case "RotateCcw":
        return <RotateCcw className="h-4 w-4 text-amber-700" />;
      default:
        return <Zap className="h-4 w-4 text-emerald-700" />;
    }
  };

  const getBg = (name: string) => {
    switch (name) {
      case "Zap":
        return "bg-emerald-50";
      case "Wind":
        return "bg-sky-50";
      case "Network":
        return "bg-purple-50";
      case "RotateCcw":
        return "bg-amber-50";
      default:
        return "bg-emerald-50";
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F3F0EA] pb-3 mb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-[#1F2937]">Upcoming AI Decisions</h3>
          <p className="text-xs text-[#6B7280]">Automated dispatch schedule</p>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-bold text-[#1B4D3E] hover:underline"
        >
          <span>View All</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Decision List */}
      <div className="space-y-3">
        {upcomingDecisions.map((dec: UpcomingDecision) => (
          <div
            key={dec.id}
            className="flex items-center justify-between rounded-2xl bg-[#FAF8F5] border border-[#E6E1D7] p-3 hover:border-[#1B4D3E]/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${getBg(dec.iconName)}`}
              >
                {getIcon(dec.iconName)}
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1F2937]">{dec.action}</span>
                  <span className="text-[10px] font-semibold text-[#6B7280]">{dec.time}</span>
                </div>
                <p className="text-[11px] text-[#6B7280] truncate max-w-[170px] mt-0.5">
                  {dec.reason}
                </p>
              </div>
            </div>

            <span className="shrink-0 text-xs font-bold text-emerald-800 bg-[#E8F5E9] px-2.5 py-1 rounded-xl border border-emerald-200">
              {dec.expectedSaving}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
