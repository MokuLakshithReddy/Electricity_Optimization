import { TrendingDown, ArrowDownRight, Sparkles } from "lucide-react";
import { costForecastData } from "@/data/costData";

export function CostForecastCard() {
  const points = costForecastData.trendSeries.map((d) => d.cost);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 200;
  const height = 40;

  const svgPoints = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" L ");

  const pathD = `M ${svgPoints}`;
  const fillD = `M 0,${height} L ${svgPoints} L ${width},${height} Z`;

  return (
    <div className="rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F3F0EA] pb-3 mb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-[#1F2937]">Energy Cost Forecast</h3>
          <p className="text-xs text-[#6B7280]">This Month Projection</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
          <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />
          <span>{costForecastData.changeVsBaseline}</span>
        </span>
      </div>

      {/* Main Metric */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
          Projected Energy Cost
        </p>
        <h3 className="font-display text-3xl font-extrabold text-[#1F2937] tracking-tight mt-1">
          {costForecastData.monthlyProjectedCost}
        </h3>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Baseline projection: {costForecastData.baselineCost}
        </p>
      </div>

      {/* Sparkline Area Chart */}
      <div className="my-4">
        <svg className="w-full h-12 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <path d={fillD} fill="url(#costGrad)" />
          <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Potential AI Savings Footer */}
      <div className="flex items-center justify-between rounded-2xl bg-[#E8F5E9] border border-emerald-200 p-3.5 mt-2">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-xl bg-[#1B4D3E] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-[#1B4D3E]">Potential AI Savings</p>
            <p className="text-xs font-bold text-[#1F2937]">
              {costForecastData.potentialAiSavings}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
          Identified
        </span>
      </div>
    </div>
  );
}
