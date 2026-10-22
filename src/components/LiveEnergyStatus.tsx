import { ShieldCheck, Wifi, AlertTriangle } from "lucide-react";
import { useEnergyState } from "@/context/EnergyContext";

interface LiveEnergyStatusProps {
  demandMW?: number;
  systemStatus?: string;
}

export function LiveEnergyStatus({
  demandMW: propDemandMW,
  systemStatus: propSystemStatus,
}: LiveEnergyStatusProps) {
  const energyState = useEnergyState();

  const demandMW = propDemandMW ?? energyState.totalDemandMW;
  const systemStatus = propSystemStatus ?? energyState.reliabilityStatus;
  const renewablePct = energyState.renewableUtilization;

  const demand = Math.max(1, demandMW);
  const gridPct = Number(((energyState.gridMW / demand) * 100).toFixed(0));
  const batteryPct = Number(((energyState.batteryMW / demand) * 100).toFixed(0));
  const captivePct = Number(((energyState.captiveMW / demand) * 100).toFixed(0));
  const genPct = Number(((energyState.generatorMW / demand) * 100).toFixed(0));

  const radius = 70;
  const circumference = Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, renewablePct)) / 100) * circumference;

  return (
    <div className="rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F3F0EA] pb-4 mb-4">
        <div>
          <h3 className="font-display text-lg font-bold text-[#1F2937]">Live Energy Status</h3>
          <p className="text-xs text-[#6B7280]">Real-time generation & demand</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold text-[#1B4D3E]">
          <Wifi className="h-3 w-3 text-emerald-600 animate-pulse" />
          <span>India Grid</span>
        </div>
      </div>

      {/* Semicircular Radial Gauge */}
      <div className="relative flex flex-col items-center justify-center my-2">
        <svg className="w-48 h-28 overflow-visible" viewBox="0 0 160 90">
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="#F3F0EA"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1B4D3E" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute top-10 flex flex-col items-center text-center">
          <span className="font-display text-3xl font-extrabold text-[#1F2937] leading-none">
            {demandMW} <span className="text-base font-semibold text-[#6B7280]">MW</span>
          </span>
          <span className="text-[11px] font-semibold text-[#6B7280] mt-1">
            Model-Estimated Demand
          </span>
        </div>

        <div
          className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${energyState.reliability < 99.0 ? "bg-rose-50 text-rose-800 border-rose-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}
        >
          {energyState.reliability < 99.0 ? (
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          )}
          <span>{systemStatus}</span>
        </div>
        <p className="mt-1 text-[11px] text-[#6B7280]">
          <strong className="text-emerald-700 font-semibold">{renewablePct}%</strong> load served by
          renewables
        </p>
      </div>

      {/* Source Breakdown Bars */}
      <div className="mt-5 space-y-2.5 pt-4 border-t border-[#F3F0EA]">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#1F2937]">Renewable (Solar + Wind)</span>
          <span className="font-bold text-emerald-700">{renewablePct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#F3F0EA] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#1B4D3E] to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, renewablePct))}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-2 border border-[#E6E1D7]">
            <span className="text-[#6B7280]">Grid</span>
            <span className="font-bold text-[#2563EB]">{gridPct}%</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-2 border border-[#E6E1D7]">
            <span className="text-[#6B7280]">Battery</span>
            <span className="font-bold text-emerald-600">{batteryPct}%</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-2 border border-[#E6E1D7]">
            <span className="text-[#6B7280]">Captive</span>
            <span className="font-bold text-purple-600">{captivePct}%</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[#FAF8F5] p-2 border border-[#E6E1D7]">
            <span className="text-[#6B7280]">Generator</span>
            <span className="font-bold text-rose-600">{genPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
