import { Sun, Wind, Zap, Network, ShieldAlert } from "lucide-react";
import { useEnergyState } from "@/context/EnergyContext";

interface SourceMixSectionProps {
  onSelectSource?: (sourceKey: string) => void;
}

export function SourceMixSection({ onSelectSource }: SourceMixSectionProps) {
  const energyState = useEnergyState();
  const demand = Math.max(1, energyState.totalDemandMW);

  const sources = [
    {
      id: "solar",
      name: "Solar PV Park",
      key: "solar",
      mw: energyState.solarMW,
      pct: Number(((energyState.solarMW / demand) * 100).toFixed(0)),
      status: energyState.solarMW > 0 ? "Optimal" : "Standby",
      icon: <Sun className="h-5 w-5 text-amber-600" />,
      bg: "bg-amber-50",
    },
    {
      id: "wind",
      name: "Wind Farm",
      key: "wind",
      mw: energyState.windMW,
      pct: Number(((energyState.windMW / demand) * 100).toFixed(0)),
      status: energyState.windMW > 0 ? "Optimal" : "Standby",
      icon: <Wind className="h-5 w-5 text-[#0284C7]" />,
      bg: "bg-sky-50",
    },
    {
      id: "battery",
      name: "Battery Storage",
      key: "battery",
      mw: energyState.batteryMW,
      pct: Number(((energyState.batteryMW / demand) * 100).toFixed(0)),
      status: energyState.batteryMW > 0 ? "Discharging" : "Idle",
      icon: <Zap className="h-5 w-5 text-emerald-700" />,
      bg: "bg-emerald-50",
    },
    {
      id: "grid",
      name: "Grid Import",
      key: "grid",
      mw: energyState.gridMW,
      pct: Number(((energyState.gridMW / demand) * 100).toFixed(0)),
      status: energyState.gridMW > 0 ? "Available" : "Tripped",
      icon: <Network className="h-5 w-5 text-[#2563EB]" />,
      bg: "bg-blue-50",
    },
    {
      id: "generator",
      name: "Diesel Gensets",
      key: "generator",
      mw: energyState.generatorMW,
      pct: Number(((energyState.generatorMW / demand) * 100).toFixed(0)),
      status: energyState.generatorMW > 0 ? "Active" : "Standby",
      icon: <ShieldAlert className="h-5 w-5 text-rose-600" />,
      bg: "bg-rose-50",
    },
  ];

  return (
    <div className="mt-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display text-xl font-bold text-[#1F2937]">Current Energy Mix</h3>
          <p className="text-xs text-[#6B7280]">
            Live generation breakdown across plant energy assets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {sources.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectSource?.(item.key)}
            className="rounded-3xl bg-white border border-[#E6E1D7] p-4 shadow-xs hover:shadow-md hover:border-[#1B4D3E]/30 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`grid h-10 w-10 place-items-center rounded-2xl ${item.bg}`}>
                {item.icon}
              </div>
              <span className="text-xs font-extrabold text-[#1F2937] bg-[#FAF8F5] px-2.5 py-1 rounded-xl border border-[#E6E1D7]">
                {item.pct}%
              </span>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                {item.name}
              </p>
              <h4 className="font-display text-2xl font-bold text-[#1F2937] mt-0.5">
                {item.mw} <span className="text-xs font-normal text-[#6B7280]">MW</span>
              </h4>
            </div>

            <div className="mt-3 pt-2 border-t border-[#F3F0EA] flex items-center justify-between text-[10px]">
              <span className="font-semibold text-[#6B7280]">Status</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full ${item.mw > 0 ? "text-emerald-800 bg-[#E8F5E9]" : "text-amber-800 bg-amber-50"}`}
              >
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
