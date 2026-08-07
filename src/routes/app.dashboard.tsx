import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
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
    </div>
  );
}
