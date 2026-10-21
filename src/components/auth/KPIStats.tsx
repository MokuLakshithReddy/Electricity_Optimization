import { useEffect, useState } from "react";
import { kpiService, PlantTelemetryKPIs, MOCK_PLANT_KPIS } from "@/lib/kpiService";

export function KPIStats({ className = "" }: { className?: string }) {
  const [kpis, setKpis] = useState<PlantTelemetryKPIs>(MOCK_PLANT_KPIS);

  useEffect(() => {
    kpiService.getLivePlantKPIs().then(setKpis);
  }, []);

  return (
    <div
      className={`grid grid-cols-3 gap-4 lg:gap-8 border-t border-slate-800/60 pt-6 ${className}`}
    >
      <div>
        <div className="font-display text-2xl lg:text-3xl font-bold text-white tracking-tight">
          {kpis.energyCostReduction.toFixed(1)}%
        </div>
        <div className="text-xs text-slate-400 font-medium mt-1 leading-snug">
          energy cost reduction
        </div>
      </div>

      <div>
        <div className="font-display text-2xl lg:text-3xl font-bold text-white tracking-tight">
          {kpis.co2AvoidedMTD.toLocaleString()} t
        </div>
        <div className="text-xs text-slate-400 font-medium mt-1 leading-snug">CO₂ avoided MTD</div>
      </div>

      <div>
        <div className="font-display text-2xl lg:text-3xl font-bold text-white tracking-tight">
          {kpis.supplyAvailability.toFixed(2)}%
        </div>
        <div className="text-xs text-slate-400 font-medium mt-1 leading-snug">
          supply availability
        </div>
      </div>
    </div>
  );
}
