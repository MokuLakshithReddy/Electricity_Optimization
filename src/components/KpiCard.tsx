import { Zap, Leaf, PieChart, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KpiCardData {
  id: string;
  title: string;
  value: string;
  change: string;
  trend?: "up" | "down" | "stable" | "warning";
  tone: "green" | "amber" | "purple" | "blue" | "rose";
  sparkline: number[];
}

interface KpiCardProps {
  data: KpiCardData;
}

export function KpiCard({ data }: KpiCardProps) {
  const getIcon = () => {
    switch (data.id) {
      case "cost-saved":
        return <Zap className="h-5 w-5 text-[#1B4D3E] shrink-0" />;
      case "co2-avoided":
        return <Leaf className="h-5 w-5 text-emerald-700 shrink-0" />;
      case "renewable-util":
        return <PieChart className="h-5 w-5 text-amber-700 shrink-0" />;
      case "reliability":
        return data.trend === "warning" ? (
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 animate-bounce" />
        ) : (
          <ShieldCheck className="h-5 w-5 text-purple-700 shrink-0" />
        );
      default:
        return <Zap className="h-5 w-5 text-[#1B4D3E] shrink-0" />;
    }
  };

  const getToneStyle = () => {
    switch (data.tone) {
      case "green":
        return {
          iconBg: "bg-[#E8F5E9]",
          sparkColor: "#1B4D3E",
          changeColor: "text-emerald-700",
        };
      case "amber":
        return {
          iconBg: "bg-amber-50",
          sparkColor: "#D97706",
          changeColor: "text-amber-700",
        };
      case "purple":
        return {
          iconBg: "bg-purple-50",
          sparkColor: "#7C3AED",
          changeColor: "text-purple-700",
        };
      case "rose":
        return {
          iconBg: "bg-rose-50",
          sparkColor: "#E11D48",
          changeColor: "text-rose-700",
        };
      default:
        return {
          iconBg: "bg-[#E8F5E9]",
          sparkColor: "#1B4D3E",
          changeColor: "text-emerald-700",
        };
    }
  };

  const toneStyle = getToneStyle();

  // Create SVG path string from sparkline points
  const min = Math.min(...data.sparkline);
  const max = Math.max(...data.sparkline);
  const range = max - min || 1;
  const width = 160;
  const height = 30;
  const points = data.sparkline
    .map((val, idx) => {
      const x = (idx / (data.sparkline.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" L ");

  const pathD = `M ${points}`;

  return (
    <div className="h-full min-h-[220px] w-full min-w-0 rounded-3xl bg-white border border-[#E6E1D7] p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden box-border">
      {/* 1. Icon Area + KPI Title Header (No collision, responsive text wrapping) */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-2xl", toneStyle.iconBg)}
        >
          {getIcon()}
        </div>
        <h4 className="min-w-0 flex-1 text-xs sm:text-sm lg:text-[15px] font-bold uppercase tracking-wider text-[#6B7280] leading-snug whitespace-normal break-words">
          {data.title}
        </h4>
      </div>

      {/* 2. Value Area (Responsive font sizes: 26-32px mobile, 32-36px tablet, 38-42px desktop) */}
      <div className="my-3 min-w-0">
        <div className="font-display text-2xl sm:text-3xl lg:text-[38px] font-extrabold tracking-tight text-[#1F2937] leading-tight truncate min-w-0">
          {data.value}
        </div>
        {/* 3. Comparison / Status Text */}
        <p
          className={cn(
            "mt-1 text-xs sm:text-sm font-semibold truncate min-w-0 max-w-full",
            toneStyle.changeColor,
          )}
        >
          {data.change}
        </p>
      </div>

      {/* 4. Sparkline Area (Divider + SVG Chart staying inside card) */}
      <div className="pt-2 border-t border-[#F3F0EA] min-w-0 w-full overflow-hidden shrink-0">
        <svg className="w-full h-7 overflow-visible min-w-0" viewBox={`0 0 ${width} ${height}`}>
          <path
            d={pathD}
            fill="none"
            stroke={toneStyle.sparkColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* End Point Indicator Dot */}
          {data.sparkline.length > 0 && (
            <circle
              cx={width}
              cy={
                height -
                (((data.sparkline[data.sparkline.length - 1] ?? min) - min) / range) *
                  (height - 8) -
                4
              }
              r="3.5"
              fill={toneStyle.sparkColor}
            />
          )}
        </svg>
      </div>
    </div>
  );
}
