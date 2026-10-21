import React, { createContext, useContext, useState, useMemo, ReactNode, useEffect, useCallback } from "react";
import { emissionFactors, tariffRates } from "@/data/emissionFactors";
import { solveEconomicDispatch, OptimizationResult, DEFAULT_CONSTRAINTS } from "@/lib/optimizationEngine";

export type EnergyState = {
  totalDemandMW: number;
  criticalDemandMW: number;

  solarMW: number;
  windMW: number;
  batteryMW: number;
  gridMW: number;
  captiveMW: number;
  generatorMW: number;

  batterySOC: number;

  // Computed Values from Constrained Optimization
  renewableUtilization: number; // %
  energyCostSavedDaily: number; // ₹
  energyCostSavedFormatted: string;
  co2AvoidedDaily: number; // tonnes
  co2AvoidedFormatted: string;
  reliability: number; // %
  reliabilityStatus: string;
  gridRequirement: number; // MW

  // Constrained Solver Telemetry
  optimizationTelemetry: OptimizationResult;
  activeConstraints: string[];
  hourlySavings: number;
  baselineCostPerHour: number;
  optimizedCostPerHour: number;
  currentTariffTier: "Peak" | "Shoulder" | "OffPeak";

  // Historical sparkline arrays
  costSavedHistory: number[];
  co2AvoidedHistory: number[];
  renewableHistory: number[];
  reliabilityHistory: number[];
};

export type EnergyContextType = EnergyState & {
  updateSolarMW: (mw: number) => void;
  updateWindMW: (mw: number) => void;
  updateBatteryMW: (mw: number) => void;
  updateGridMW: (mw: number) => void;
  updateCaptiveMW: (mw: number) => void;
  updateGeneratorMW: (mw: number) => void;
  setTotalDemandMW: (mw: number) => void;
  setTariffTier: (tier: "Peak" | "Shoulder" | "OffPeak") => void;
  runSimulationScenario: (scenario: string) => void;
  resetToBaseline: () => void;
  applyOptimalSchedule: () => void;
};

const initialSparklines = {
  costSavedHistory: [8.2, 9.1, 10.4, 11.2, 11.8, 12.1, 12.4],
  co2AvoidedHistory: [310, 340, 365, 382, 395, 404, 412],
  renewableHistory: [38, 41, 40, 44, 46, 47.5, 48.2],
  reliabilityHistory: [99.9, 99.92, 99.95, 99.95, 99.96, 99.97, 99.97],
};

const EnergyContext = createContext<EnergyContextType | undefined>(undefined);

export function EnergyProvider({ children }: { children: ReactNode }) {
  const [demandMW, setDemandMW] = useState(520);
  const [criticalDemandMW] = useState(400);

  const [solar, setSolar] = useState(145);
  const [wind, setWind] = useState(104);
  const [battery, setBattery] = useState(62);
  const [grid, setGrid] = useState(156);
  const [captive, setCaptive] = useState(43);
  const [generator, setGenerator] = useState(10);
  const [batterySOC, setBatterySOC] = useState(72);
  const [tariffTier, setTariffTier] = useState<"Peak" | "Shoulder" | "OffPeak">("Peak");

  const [sparklines, setSparklines] = useState(initialSparklines);

  // Run the true Mathematical Constrained Economic Dispatch Optimization Solver
  const optimizationResult = useMemo(() => {
    return solveEconomicDispatch({
      demandMW,
      solarAvailableMW: solar,
      windAvailableMW: wind,
      currentBatterySOC: batterySOC,
      currentTariffTier: tariffTier,
      isGridAvailable: grid > 0 || tariffTier !== "OffPeak",
    });
  }, [demandMW, solar, wind, batterySOC, tariffTier, grid]);

  // Dynamic calculations based on state, emission factors & solver
  const computedState = useMemo(() => {
    const renewableMW = solar + wind;
    const renewableUtilization = Number(
      (Math.min(100, (renewableMW / Math.max(1, demandMW)) * 100)).toFixed(1)
    );

    // Modeled savings calculated by the mathematical optimization solver against reference baseline
    const hourlySavings = optimizationResult.hourlySavings;
    const energyCostSavedDaily = optimizationResult.dailySavingsEstimate;
    const lakhs = (energyCostSavedDaily / 100000).toFixed(1);
    const energyCostSavedFormatted = `₹${lakhs} L`;

    // Verified avoided CO2 from the solver
    const co2AvoidedDaily = Math.round(optimizationResult.co2AvoidedPerHour * 24);
    const co2AvoidedFormatted = `${co2AvoidedDaily} t`;

    // Reliability accounting for spinning reserves and technical minimums
    const totalSupplyMW = solar + wind + battery + grid + captive + generator;
    let reliability = optimizationResult.reliabilityPct;
    let reliabilityStatus = optimizationResult.reliabilityStatus;

    if (!optimizationResult.isExecutablePlan) {
      reliability = 72.0;
      reliabilityStatus = "INFEASIBLE DEFICIT · Physical Capacity Breached";
    } else if (totalSupplyMW < demandMW) {
      const deficitRatio = totalSupplyMW / Math.max(1, demandMW);
      reliability = Number(Math.max(65.0, deficitRatio * 99.97).toFixed(2));
      reliabilityStatus = `Supply Deficit (${(demandMW - totalSupplyMW).toFixed(0)} MW gap)`;
    }

    return {
      renewableUtilization,
      energyCostSavedDaily,
      energyCostSavedFormatted,
      co2AvoidedDaily,
      co2AvoidedFormatted,
      reliability,
      reliabilityStatus,
      gridRequirement: Math.max(0, demandMW - solar - wind - battery - captive),
      hourlySavings,
      baselineCostPerHour: optimizationResult.baselineCostPerHour,
      optimizedCostPerHour: optimizationResult.totalCostPerHour,
    };
  }, [demandMW, solar, wind, battery, grid, captive, generator, optimizationResult]);

  // Update sparklines when state changes
  const updateSparklines = useCallback((
    newCostSaved: number,
    newCO2: number,
    newRenewable: number,
    newRel: number
  ) => {
    const costLakhs = Number((newCostSaved / 100000).toFixed(1));
    setSparklines((prev) => ({
      costSavedHistory: [...prev.costSavedHistory.slice(1), costLakhs],
      co2AvoidedHistory: [...prev.co2AvoidedHistory.slice(1), newCO2],
      renewableHistory: [...prev.renewableHistory.slice(1), newRenewable],
      reliabilityHistory: [...prev.reliabilityHistory.slice(1), newRel],
    }));
  }, []);

  const updateSolarMW = (mw: number) => {
    setSolar(mw);
    const deficit = demandMW - (mw + wind + battery + captive);
    const newGrid = Math.max(0, deficit);
    setGrid(newGrid);
    updateSparklines(
      computedState.energyCostSavedDaily,
      computedState.co2AvoidedDaily,
      computedState.renewableUtilization,
      computedState.reliability
    );
  };

  const updateWindMW = (mw: number) => {
    setWind(mw);
    const deficit = demandMW - (solar + mw + battery + captive);
    setGrid(Math.max(0, deficit));
    updateSparklines(
      computedState.energyCostSavedDaily,
      computedState.co2AvoidedDaily,
      computedState.renewableUtilization,
      computedState.reliability
    );
  };

  const updateBatteryMW = (mw: number) => {
    // Clamp to battery C-rate discharge capacity (90 MW)
    const clamped = Math.min(DEFAULT_CONSTRAINTS.batteryMaxDischargeMW, Math.max(0, mw));
    setBattery(clamped);
    const deficit = demandMW - (solar + wind + clamped + captive);
    if (deficit > DEFAULT_CONSTRAINTS.gridContractDemandMW) {
      setGrid(DEFAULT_CONSTRAINTS.gridContractDemandMW);
      setGenerator(Math.max(0, deficit - DEFAULT_CONSTRAINTS.gridContractDemandMW));
    } else {
      setGrid(Math.max(0, deficit));
      setGenerator(0);
    }
  };

  const updateGridMW = (mw: number) => {
    setGrid(mw);
    if (mw === 0) {
      // Grid Outage! Emergency islanding mode
      const remainingDeficit = Math.max(0, demandMW - (solar + wind + battery + captive));
      setGenerator(remainingDeficit);
    }
  };

  const updateCaptiveMW = (mw: number) => {
    // Respect captive minimum load (30 MW)
    const val = Math.max(DEFAULT_CONSTRAINTS.captiveMinMW, mw);
    setCaptive(val);
  };

  const updateGeneratorMW = (mw: number) => setGenerator(mw);

  // Directly apply mathematically solved optimal setpoints
  const applyOptimalSchedule = () => {
    const d = optimizationResult.dispatch;
    setSolar(d.solarMW);
    setWind(d.windMW);
    setBattery(d.batteryDischargeMW);
    setGrid(d.gridMW);
    setCaptive(d.captiveMW);
    setGenerator(d.generatorMW);
    setBatterySOC(d.newBatterySOC);
  };

  const runSimulationScenario = (scenario: string) => {
    switch (scenario) {
      case "solar_drop": {
        setSolar(50);
        // Solve optimal dispatch with degraded solar
        const opt = solveEconomicDispatch({
          demandMW,
          solarAvailableMW: 50,
          windAvailableMW: wind,
          currentBatterySOC: batterySOC,
          currentTariffTier: tariffTier,
        });
        setGrid(opt.dispatch.gridMW);
        setBattery(opt.dispatch.batteryDischargeMW);
        setCaptive(opt.dispatch.captiveMW);
        setGenerator(opt.dispatch.generatorMW);
        break;
      }
      case "battery_failure": {
        setBattery(0);
        setBatterySOC(0);
        const opt = solveEconomicDispatch({
          demandMW,
          solarAvailableMW: solar,
          windAvailableMW: wind,
          currentBatterySOC: 0,
          currentTariffTier: tariffTier,
          constraints: { batteryCapacityMWh: 0, batteryMaxDischargeMW: 0 },
        });
        setGrid(opt.dispatch.gridMW);
        setCaptive(opt.dispatch.captiveMW);
        setGenerator(opt.dispatch.generatorMW);
        break;
      }
      case "wind_drop": {
        setWind(0);
        const opt = solveEconomicDispatch({
          demandMW,
          solarAvailableMW: solar,
          windAvailableMW: 0,
          currentBatterySOC: batterySOC,
          currentTariffTier: tariffTier,
        });
        setGrid(opt.dispatch.gridMW);
        setBattery(opt.dispatch.batteryDischargeMW);
        setCaptive(opt.dispatch.captiveMW);
        setGenerator(opt.dispatch.generatorMW);
        break;
      }
      case "grid_failure": {
        setGrid(0);
        const opt = solveEconomicDispatch({
          demandMW,
          solarAvailableMW: solar,
          windAvailableMW: wind,
          currentBatterySOC: batterySOC,
          currentTariffTier: tariffTier,
          isGridAvailable: false,
        });
        setBattery(opt.dispatch.batteryDischargeMW);
        setCaptive(opt.dispatch.captiveMW);
        setGenerator(opt.dispatch.generatorMW);
        break;
      }
      case "demand_spike": {
        const spikeDemand = 650;
        setDemandMW(spikeDemand);
        const opt = solveEconomicDispatch({
          demandMW: spikeDemand,
          solarAvailableMW: solar,
          windAvailableMW: wind,
          currentBatterySOC: batterySOC,
          currentTariffTier: tariffTier,
        });
        setGrid(opt.dispatch.gridMW);
        setBattery(opt.dispatch.batteryDischargeMW);
        setCaptive(opt.dispatch.captiveMW);
        setGenerator(opt.dispatch.generatorMW);
        break;
      }
      case "battery_expansion": {
        const opt = solveEconomicDispatch({
          demandMW,
          solarAvailableMW: solar,
          windAvailableMW: wind,
          currentBatterySOC: 90,
          currentTariffTier: tariffTier,
          constraints: { batteryCapacityMWh: 400, batteryMaxDischargeMW: 140 },
        });
        setBattery(opt.dispatch.batteryDischargeMW);
        setGrid(opt.dispatch.gridMW);
        setCaptive(opt.dispatch.captiveMW);
        setGenerator(opt.dispatch.generatorMW);
        break;
      }
      default:
        resetToBaseline();
        break;
    }
  };

  const resetToBaseline = () => {
    setDemandMW(520);
    setSolar(145);
    setWind(104);
    setBattery(62);
    setGrid(156);
    setCaptive(43);
    setGenerator(10);
    setBatterySOC(72);
    setTariffTier("Peak");
  };

  return (
    <EnergyContext.Provider
      value={{
        totalDemandMW: demandMW,
        criticalDemandMW,
        solarMW: solar,
        windMW: wind,
        batteryMW: battery,
        gridMW: grid,
        captiveMW: captive,
        generatorMW: generator,
        batterySOC,

        renewableUtilization: computedState.renewableUtilization,
        energyCostSavedDaily: computedState.energyCostSavedDaily,
        energyCostSavedFormatted: computedState.energyCostSavedFormatted,
        co2AvoidedDaily: computedState.co2AvoidedDaily,
        co2AvoidedFormatted: computedState.co2AvoidedFormatted,
        reliability: computedState.reliability,
        reliabilityStatus: computedState.reliabilityStatus,
        gridRequirement: computedState.gridRequirement,

        optimizationTelemetry: optimizationResult,
        activeConstraints: optimizationResult.activeConstraints,
        hourlySavings: computedState.hourlySavings,
        baselineCostPerHour: computedState.baselineCostPerHour,
        optimizedCostPerHour: computedState.optimizedCostPerHour,
        currentTariffTier: tariffTier,

        costSavedHistory: sparklines.costSavedHistory,
        co2AvoidedHistory: sparklines.co2AvoidedHistory,
        renewableHistory: sparklines.renewableHistory,
        reliabilityHistory: sparklines.reliabilityHistory,

        updateSolarMW,
        updateWindMW,
        updateBatteryMW,
        updateGridMW,
        updateCaptiveMW,
        updateGeneratorMW,
        setTotalDemandMW: setDemandMW,
        setTariffTier,
        runSimulationScenario,
        resetToBaseline,
        applyOptimalSchedule,
      }}
    >
      {children}
    </EnergyContext.Provider>
  );
}

export function useEnergyState() {
  const context = useContext(EnergyContext);
  if (!context) {
    throw new Error("useEnergyState must be used within an EnergyProvider");
  }
  return context;
}
