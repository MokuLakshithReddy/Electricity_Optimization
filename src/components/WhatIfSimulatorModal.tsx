import { useState } from "react";
import { X, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEnergyState } from "@/context/EnergyContext";

interface WhatIfSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ScenarioPreset =
  | "normal"
  | "battery_failure"
  | "grid_failure"
  | "solar_drop"
  | "wind_drop"
  | "demand_spike"
  | "battery_expansion";

export function WhatIfSimulatorModal({ isOpen, onClose }: WhatIfSimulatorModalProps) {
  const [activeScenario, setActiveScenario] = useState<ScenarioPreset>("battery_failure");
  const { runSimulationScenario, resetToBaseline } = useEnergyState();

  if (!isOpen) return null;

  const scenarios: { id: ScenarioPreset; name: string; desc: string }[] = [
    { id: "battery_failure", name: "Battery Failure (0 MWh)", desc: "Simulate loss of 118 MWh BESS storage" },
    { id: "grid_failure", name: "132 kV Grid Outage (N-1)", desc: "Simulate loss of primary grid import feeder" },
    { id: "solar_drop", name: "Solar Generation -50%", desc: "Simulate sudden convective cloud cover" },
    { id: "wind_drop", name: "Wind Generation -50%", desc: "Simulate low coastal wind conditions" },
    { id: "demand_spike", name: "Plant Demand +20%", desc: "Simulate simultaneous rolling mill start" },
    { id: "battery_expansion", name: "BESS Capacity +100 MWh", desc: "Evaluate ROI of battery expansion" },
  ];

  const handleSelectScenario = (id: ScenarioPreset) => {
    setActiveScenario(id);
    runSimulationScenario(id);
  };

  const getResults = () => {
    switch (activeScenario) {
      case "battery_failure":
        return {
          title: "BATTERY FAILURE SIMULATION",
          gridChange: "+80 MW",
          genChange: "+25 MW",
          costDelta: "+₹1.8 L/hour",
          co2Delta: "+42 t/hour",
          reliability: "99.97%",
          status: "Grid & Diesel Backfill Required",
          impactColor: "text-amber-700",
          details: [
            "Grid import steps up from 156 MW to 236 MW (+80 MW).",
            "Emergency diesel gensets auto-start (+25 MW) to bridge ramp rate limit.",
            "Evening peak ToD tariff exposure increases by ₹1.8 lakh/hour.",
            "Captive plant units ramped to maximum thermal limit.",
          ],
        };
      case "grid_failure":
        return {
          title: "132 kV GRID OUTAGE SIMULATION",
          gridChange: "-156 MW",
          genChange: "+60 MW",
          costDelta: "+₹3.4 L/hour",
          co2Delta: "+86 t/hour",
          reliability: "98.4%",
          status: "Islanded Mode Active",
          impactColor: "text-rose-700",
          details: [
            "BESS bridges 70 MW instantly (<20 ms ride-through).",
            "Captive Thermal Units 1-3 ramp from 184 MW to 248 MW at 2.8 MW/min.",
            "All four diesel gensets auto-start (+60 MW total).",
            "48 MW of non-critical auxiliary load shed automatically.",
          ],
        };
      case "solar_drop":
        return {
          title: "SOLAR GENERATION -50% SIMULATION",
          gridChange: "+45 MW",
          genChange: "0 MW",
          costDelta: "+₹82,000/hour",
          co2Delta: "+18.4 t/hour",
          reliability: "99.99%",
          status: "Grid Replacement Active",
          impactColor: "text-[#1B4D3E]",
          details: [
            "Solar PV output drops from 145 MW to 50 MW.",
            "BESS discharges +27.5 MW additional stored energy.",
            "Grid import covers remaining deficit at shoulder rate.",
          ],
        };
      case "wind_drop":
        return {
          title: "WIND GENERATION -50% SIMULATION",
          gridChange: "+32 MW",
          genChange: "0 MW",
          costDelta: "+₹58,000/hour",
          co2Delta: "+14.2 t/hour",
          reliability: "99.99%",
          status: "Captive Compensation Active",
          impactColor: "text-[#1B4D3E]",
          details: [
            "Wind output drops from 104 MW to 0 MW.",
            "Captive plant ramps output +20 MW.",
            "Grid covers remaining demand.",
          ],
        };
      case "demand_spike":
        return {
          title: "PLANT DEMAND +20% SIMULATION",
          gridChange: "+74 MW",
          genChange: "+30 MW",
          costDelta: "+₹2.1 L/hour",
          co2Delta: "+38 t/hour",
          reliability: "99.95%",
          status: "Peak Demand Defense Active",
          impactColor: "text-amber-700",
          details: [
            "Total plant demand spikes from 520 MW to 650 MW (+130 MW).",
            "BESS discharges maximum 62 MW.",
            "Grid import increases to cover peak load.",
          ],
        };
      case "battery_expansion":
        return {
          title: "BESS CAPACITY +100 MWh SIMULATION",
          gridChange: "-62 MW",
          genChange: "0 MW",
          costDelta: "-₹4.8 L/day",
          co2Delta: "-34.2 t/day",
          reliability: "100.0%",
          status: "Maximum Arbitrage Value",
          impactColor: "text-emerald-700",
          details: [
            "Additional 100 MWh usable storage allows 100% peak ToD grid avoidance.",
            "Solar curtailment drops to 0%.",
            "Estimated payback period: 3.4 years on ₹19 Cr Capex.",
          ],
        };
      default:
        return {
          title: "SIMULATION RESULT",
          gridChange: "0 MW",
          genChange: "0 MW",
          costDelta: "0",
          co2Delta: "0",
          reliability: "99.97%",
          status: "Normal Operation",
          impactColor: "text-[#1B4D3E]",
          details: [],
        };
    }
  };

  const results = getResults();

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F0EA] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1B4D3E] text-white">
              <Play className="h-5 w-5 fill-white" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-[#1F2937]">
                IntelliGrid What-If Simulator
              </h3>
              <p className="text-xs text-[#6B7280]">
                Simulate grid outages, renewable drops, or load spikes in real time
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl p-2 text-[#6B7280] hover:bg-[#FAF8F5] hover:text-[#1F2937] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Select Scenario Chips */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                Select Stress Test Scenario:
              </label>
              <button
                onClick={() => {
                  setActiveScenario("normal");
                  resetToBaseline();
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1B4D3E] hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to Baseline</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {scenarios.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc.id)}
                  className={cn(
                    "flex flex-col text-left p-3 rounded-2xl border transition-all text-xs cursor-pointer",
                    activeScenario === sc.id
                      ? "bg-[#E8F5E9] border-[#1B4D3E] text-[#1B4D3E] font-bold shadow-xs"
                      : "bg-[#FAF8F5] border-[#E6E1D7] text-[#1F2937] hover:border-[#1B4D3E]/40",
                  )}
                >
                  <span className="font-bold">{sc.name}</span>
                  <span className="text-[10px] text-[#6B7280] mt-0.5">{sc.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Output Card */}
          <div className="rounded-3xl bg-[#FAF8F5] border border-[#E6E1D7] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E1D7] pb-3">
              <h4 className="font-display text-sm font-bold text-[#1F2937]">
                {results.title}
              </h4>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-white border border-[#E6E1D7] text-[#1B4D3E]">
                {results.status}
              </span>
            </div>

            {/* 4 Metric Boxes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-white p-3 border border-[#E6E1D7]">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase">Grid Impact</span>
                <p className="font-display text-lg font-bold text-[#1F2937] mt-0.5">{results.gridChange}</p>
              </div>

              <div className="rounded-2xl bg-white p-3 border border-[#E6E1D7]">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase">Genset Usage</span>
                <p className="font-display text-lg font-bold text-[#1F2937] mt-0.5">{results.genChange}</p>
              </div>

              <div className="rounded-2xl bg-white p-3 border border-[#E6E1D7]">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase">Cost Impact</span>
                <p className={`font-display text-lg font-bold mt-0.5 ${results.impactColor}`}>{results.costDelta}</p>
              </div>

              <div className="rounded-2xl bg-white p-3 border border-[#E6E1D7]">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase">Reliability</span>
                <p className="font-display text-lg font-bold text-emerald-700 mt-0.5">{results.reliability}</p>
              </div>
            </div>

            {/* AI Action Plan List */}
            <div className="pt-2">
              <p className="text-xs font-bold text-[#1F2937] mb-2">Automated AI Response Plan:</p>
              <ul className="space-y-1.5 text-xs text-[#4B5563]">
                {results.details.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#1B4D3E] font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-4 border-t border-[#F3F0EA] flex items-center justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="rounded-2xl border border-[#E6E1D7] bg-white px-5 py-2.5 text-xs font-bold text-[#1F2937] hover:bg-[#FAF8F5] transition-all cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
            }}
            className="rounded-2xl bg-[#1B4D3E] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#133E32] transition-all shadow-md cursor-pointer"
          >
            Apply to Digital Twin
          </button>
        </div>
      </div>
    </div>
  );
}
