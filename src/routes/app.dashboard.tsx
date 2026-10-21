import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Activity } from "lucide-react";
import { HeroHeader } from "@/components/HeroHeader";
import { KpiCard, KpiCardData } from "@/components/KpiCard";
import { LiveEnergyStatus } from "@/components/LiveEnergyStatus";
import { ForecastChart } from "@/components/ForecastChart";
import { AIRecommendation } from "@/components/AIRecommendation";
import { CostForecastCard } from "@/components/CostForecastCard";
import { UpcomingDecisions } from "@/components/UpcomingDecisions";
import { ImpactSummary } from "@/components/ImpactSummary";
import { SourceMixSection } from "@/components/SourceMixSection";
import { WhatIfSimulatorModal } from "@/components/WhatIfSimulatorModal";
import { ScadaModal } from "@/components/ScadaModal";
import { plantLocations, PlantLocation } from "@/data/energyData";
import { useEnergyState } from "@/context/EnergyContext";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "IntelliGrid AI — Energy Control Dashboard" },
      {
        name: "description",
        content:
          "Optimize energy. Protect production. AI-powered industrial energy orchestration for Tata Steel control rooms.",
      },
      { property: "og:title", content: "IntelliGrid AI — Energy Control Dashboard" },
      {
        property: "og:description",
        content: "Predict, optimize, and save across solar, wind, BESS, grid, and captive power.",
      },
    ],
  }),
  component: DashboardContent,
});

function DashboardContent() {
  const navigate = useNavigate();
  const energyState = useEnergyState();

  const [selectedPlant, setSelectedPlant] = useState<PlantLocation>(plantLocations[0]);
  const [selectedDate, setSelectedDate] = useState("8 Aug 2026");
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [scadaOpen, setScadaOpen] = useState(false);

  // Dynamic KPI data bound directly to live central EnergyContext state
  const dynamicKpis: KpiCardData[] = [
    {
      id: "cost-saved",
      title: "ENERGY COST SAVED",
      value: energyState.energyCostSavedFormatted,
      change: "↑ 8.6% vs baseline",
      tone: "green",
      sparkline: energyState.costSavedHistory,
    },
    {
      id: "co2-avoided",
      title: "CO₂ AVOIDED",
      value: energyState.co2AvoidedFormatted,
      change: "↑ 12.4% vs baseline",
      tone: "green",
      sparkline: energyState.co2AvoidedHistory,
    },
    {
      id: "renewable-util",
      title: "RENEWABLE UTILIZATION",
      value: `${energyState.renewableUtilization}%`,
      change: "↑ 9.8%",
      tone: "amber",
      sparkline: energyState.renewableHistory,
    },
    {
      id: "reliability",
      title: "POWER RELIABILITY",
      value: `${energyState.reliability}%`,
      change: energyState.reliabilityStatus,
      trend: energyState.reliability < 99.0 ? "warning" : "stable",
      tone: energyState.reliability < 99.0 ? "rose" : "purple",
      sparkline: energyState.reliabilityHistory,
    },
  ];

  return (
    <div className="space-y-6 pb-12 min-w-0 overflow-x-hidden">
      {/* 1. Large Hero / Header Section */}
      <HeroHeader
        selectedPlant={selectedPlant}
        onSelectPlant={setSelectedPlant}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Live SCADA Telemetry & Industrial Interlock Banner */}
      <div className="bg-[#1B4D3E]/5 border border-[#1B4D3E]/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <div>
            <div className="text-xs font-semibold text-[#1B4D3E] uppercase tracking-wider flex items-center gap-2">
              <span>Industrial Telemetry & Safety Interlocks (Digital Twin Model)</span>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                Simulation Sandbox · PLC Actuation Locked
              </span>
            </div>
            <div className="text-xs text-[#6B7280]">
              5 Synthetic Submeter Registers • Virtual Inverter 50.02 Hz • Software Watchdog Heartbeat Active
            </div>
          </div>
        </div>
        <button
          onClick={() => setScadaOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B4D3E] hover:bg-[#153e32] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Activity className="h-3.5 w-3.5" />
          Open Digital Twin SCADA
        </button>
      </div>

      {/* Main Grid: Left/Center Analytics (2 cols on xl) + Right Insights (1 col on xl) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start min-w-0">
        {/* CENTER / MAIN CONTENT AREA */}
        <div className="xl:col-span-2 space-y-6 min-w-0">
          {/* 2. Responsive 4-Column KPI Cards Grid (Equal height, no text overflow, minmax 0) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
            {dynamicKpis.map((kpi) => (
              <KpiCard key={kpi.id} data={kpi} />
            ))}
          </div>

          {/* 3. Main Forecast Chart Card */}
          <ForecastChart onSimulateClick={() => setSimulatorOpen(true)} />

          {/* 4. Horizontal AI Recommendation Card */}
          <AIRecommendation
            onViewOptimization={() => navigate({ to: "/app/scenarios" })}
            onSimulate={() => setSimulatorOpen(true)}
          />

          {/* 5. Current Energy Mix Section */}
          <SourceMixSection
            onSelectSource={() => navigate({ to: "/app/energy-flow" })}
          />
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6 min-w-0">
          {/* 6. Live Energy Status & Radial Gauge */}
          <LiveEnergyStatus
            demandMW={energyState.totalDemandMW}
            systemStatus={energyState.reliabilityStatus}
          />

          {/* 7. Energy Cost Forecast Card */}
          <CostForecastCard />

          {/* 8. Upcoming AI Decisions Schedule */}
          <UpcomingDecisions
            onViewAll={() => navigate({ to: "/app/scenarios" })}
          />
        </div>
      </div>

      {/* 9. Full-Width Bottom Impact Section Banner */}
      <ImpactSummary
        onViewImpactReport={() => navigate({ to: "/app/reports" })}
      />

      {/* Interactive What-If Simulator Modal */}
      <WhatIfSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
      />

      {/* Industrial SCADA & Equipment Interlocks Modal */}
      <ScadaModal
        isOpen={scadaOpen}
        onClose={() => setScadaOpen(false)}
      />
    </div>
  );
}
