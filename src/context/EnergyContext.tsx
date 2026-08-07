import React, { createContext, useContext, useState, useMemo, ReactNode } from "react";
import { emissionFactors, tariffRates } from "@/data/emissionFactors";

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

  // Computed Values
  renewableUtilization: number; // %
  energyCostSavedDaily: number; // ₹
  energyCostSavedFormatted: string;
  co2AvoidedDaily: number; // tonnes
  co2AvoidedFormatted: string;
  reliability: number; // %
  reliabilityStatus: string;
  gridRequirement: number; // MW

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
  runSimulationScenario: (scenario: string) => void;
  resetToBaseline: () => void;
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

  const [sparklines, setSparklines] = useState(initialSparklines);

  // Dynamic calculations based on state & emission factors
  const computedState = useMemo(() => {
    // 1. Renewable Utilization %
    const renewableMW = solar + wind;
    const renewableUtilization = Number((Math.min(100, (renewableMW / Math.max(1, demandMW)) * 100)).toFixed(1));

    // 2. Energy Cost Saved
    const baselineCostPerHour = demandMW * tariffRates.gridPeak * 1000;
    const optimizedCostPerHour =
      (solar * tariffRates.solar +
        wind * tariffRates.wind +
        battery * tariffRates.battery +
        grid * tariffRates.gridShoulder +
        captive * tariffRates.captive +
        generator * tariffRates.generator) *
      1000;

    const hourlySavings = Math.max(0, baselineCostPerHour - optimizedCostPerHour);
    const energyCostSavedDaily = hourlySavings * 24;

    // Formatted Lakhs string e.g. ₹12.4 L
    const lakhs = (energyCostSavedDaily / 100000).toFixed(1);
    const energyCostSavedFormatted = `₹${lakhs} L`;

    // 3. CO2 Avoided
    const baselineCO2PerHour = demandMW * emissionFactors.grid;
    const optimizedCO2PerHour =
      solar * emissionFactors.solar +
      wind * emissionFactors.wind +
      battery * emissionFactors.battery +
      grid * emissionFactors.grid +
      captive * emissionFactors.captive +
      generator * emissionFactors.generator;

    const hourlyCO2Avoided = Math.max(0, baselineCO2PerHour - optimizedCO2PerHour);
    const co2AvoidedDaily = Number((hourlyCO2Avoided * 24).toFixed(0));
    const co2AvoidedFormatted = `${co2AvoidedDaily} t`;

    // 4. Power Reliability
    const totalSupplyMW = solar + wind + battery + grid + captive + generator;
    let reliability = 99.97;
    let reliabilityStatus = "Critical load protected";

    if (totalSupplyMW < demandMW) {
      const deficitRatio = totalSupplyMW / Math.max(1, demandMW);
      reliability = Number(Math.max(65.0, deficitRatio * 99.97).toFixed(2));
      reliabilityStatus = `Supply Deficit (${(demandMW - totalSupplyMW).toFixed(0)} MW gap)`;
    } else if (totalSupplyMW >= demandMW + 30) {
      reliability = 99.97;
      reliabilityStatus = "Critical load protected";
    } else {
      reliability = 98.4;
      reliabilityStatus = "Tight Reserve Margin";
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
    };
  }, [demandMW, solar, wind, battery, grid, captive, generator]);

  // Update sparklines when state changes
  const updateSparklines = (
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
  };

  const updateSolarMW = (mw: number) => {
    setSolar(mw);
    // Auto adjust grid to balance demand if needed
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
    setBattery(mw);
    const deficit = demandMW - (solar + wind + mw + captive);
    if (deficit > 200) {
      setGrid(200);
      setGenerator(Math.max(0, deficit - 200));
    } else {
      setGrid(Math.max(0, deficit));
      setGenerator(0);
    }
  };

  const updateGridMW = (mw: number) => {
    setGrid(mw);
    if (mw === 0) {
      // Grid Outage! Emergency auto-response
      const remainingDeficit = Math.max(0, demandMW - (solar + wind + battery + captive));
      setGenerator(remainingDeficit);
    }
  };

  const updateCaptiveMW = (mw: number) => setCaptive(mw);
  const updateGeneratorMW = (mw: number) => setGenerator(mw);

  const runSimulationScenario = (scenario: string) => {
    switch (scenario) {
      case "solar_drop":
        setSolar(50);
        setGrid(251);
        break;
      case "battery_failure":
        setBattery(0);
        setGrid(218);
        setGenerator(0);
        break;
      case "wind_drop":
        setWind(0);
        setGrid(260);
        break;
      case "grid_failure":
        setGrid(0);
        setCaptive(85);
        setGenerator(65);
        break;
      case "demand_spike":
        setDemandMW(650);
        setGrid(286);
        break;
      case "battery_expansion":
        setBattery(118);
        setGrid(94);
        break;
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
        runSimulationScenario,
        resetToBaseline,
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
