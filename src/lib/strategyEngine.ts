export interface PlantConditions {
  solarAvailability: number; // 0..2 (1.0 = 100% baseline)
  windAvailability: number; // 0..2 (1.0 = 100% baseline)
  batteryCapacityMwh: number; // e.g. 200 MWh
  gridAvailable: boolean;
  gridPricePerKwh: number; // e.g. 8.5 ₹/kWh
  captiveCoalAvailable: boolean;
  generatorAvailable: boolean;
  plantDemandMw: number; // e.g. 520 MW
  carbonTaxPerTon?: number;
}

export interface EnergyMixBreakdown {
  solarPct: number;
  windPct: number;
  batteryPct: number;
  gridPct: number;
  captivePct: number;
  backupGeneratorPct: number;
}

export interface CalculatedStrategy {
  key: "current" | "cost" | "carbon" | "balanced";
  title: string;
  description: string;
  annualCostCr: number; // ₹ Crore / year
  co2EmissionsKt: number; // ktCO2 / year
  renewablePct: number; // %
  reliabilityPct: number; // %
  savingsVsCurrentCr: number; // ₹ Crore / year
  savingsExactRupees: number; // Exact ₹ amount
  confidenceScore: number; // 0..100 %
  isRecommended: boolean;
  energyMix: EnergyMixBreakdown;
  optimizationObjective: string;
  constraintsUsed: string[];
  aiReasoning: string;
}

export interface StrategyMap {
  current: CalculatedStrategy;
  costOptimized: CalculatedStrategy;
  carbonOptimized: CalculatedStrategy;
  balanced: CalculatedStrategy;
}

export interface StrategyEngineOutput {
  strategies: StrategyMap;
  costBenefitCapturedPct: number;
  carbonBenefitCapturedPct: number;
  balancedRationaleText: string;
}

export const DEFAULT_PLANT_CONDITIONS: PlantConditions = {
  solarAvailability: 1.0,
  windAvailability: 1.0,
  batteryCapacityMwh: 200,
  gridAvailable: true,
  gridPricePerKwh: 8.5,
  captiveCoalAvailable: true,
  generatorAvailable: true,
  plantDemandMw: 520,
};

/**
 * Format Indian Currency: ₹17.60 Cr or ₹8.80 Cr
 */
export function formatIndianCurrencyCr(croreValue: number): string {
  if (croreValue <= 0) return "baseline";
  return `₹${croreValue.toFixed(2)} Cr`;
}

/**
 * Format exact Rupees with commas (e.g. ₹17,60,00,000)
 */
export function formatExactRupees(croreValue: number): string {
  if (croreValue <= 0) return "₹0";
  const exact = Math.round(croreValue * 1e7);
  return `₹${exact.toLocaleString("en-IN")}`;
}

/**
 * Central Strategy Optimization Engine
 * Calculates dynamic strategy cards based on changing plant inputs.
 */
export function calculateStrategies(
  conditions: PlantConditions = DEFAULT_PLANT_CONDITIONS
): StrategyEngineOutput {
  const {
    solarAvailability,
    windAvailability,
    batteryCapacityMwh,
    gridAvailable,
    captiveCoalAvailable,
    generatorAvailable,
    plantDemandMw,
  } = conditions;

  // Base adjustments according to plant conditions
  const solarFactor = Math.max(0, solarAvailability);
  const windFactor = Math.max(0, windAvailability);
  const storageFactor = batteryCapacityMwh / 200;
  const gridPenalty = gridAvailable ? 1.0 : 1.4; // Grid outage forces expensive captive/diesel
  const demandFactor = plantDemandMw / 520;

  // 1. Current Strategy Baseline
  const currentCost = Math.round(1284 * demandFactor * gridPenalty);
  const currentCo2 = Math.round(512 * demandFactor * (2 - (solarFactor + windFactor) * 0.2));
  const currentRenewable = Math.min(
    75,
    Math.round(38 * (solarFactor * 0.6 + windFactor * 0.4))
  );
  const currentReliability = gridAvailable ? 97.8 : 91.2;

  // 2. Cost-Optimized Strategy
  const costCo2 = Math.round(
    486 * demandFactor * (2.0 - (solarFactor * 0.4 + windFactor * 0.3))
  );
  const costRenewable = Math.min(
    80,
    Math.round(41 * (solarFactor * 0.5 + windFactor * 0.5))
  );
  const costReliability = gridAvailable ? 98.4 : 93.5;
  // Cost savings expand with more renewables or storage
  const baseCostSavings = 176 * (1 + (storageFactor - 1) * 0.15 + (solarFactor - 1) * 0.2);
  const costAnnualCost = Math.max(800, currentCost - Math.round(baseCostSavings));
  const costSavingsCr = currentCost - costAnnualCost;

  // 3. Carbon-Optimized Strategy
  const carbonRenewable = Math.min(
    95,
    Math.round(61 * (solarFactor * 0.55 + windFactor * 0.45))
  );
  const carbonCo2 = Math.round(
    388 * demandFactor * (1.8 - (solarFactor * 0.5 + windFactor * 0.5))
  );
  const carbonReliability = gridAvailable ? 98.1 : 92.8;
  const baseCarbonSavings = 88 * (1 + (solarFactor - 1) * 0.3 + (windFactor - 1) * 0.25);
  const carbonAnnualCost = Math.max(850, currentCost - Math.round(baseCarbonSavings));
  const carbonSavingsCr = currentCost - carbonAnnualCost;

  // 4. Balanced Strategy (AI Recommended Pareto Optimal)
  const balancedCost = Math.round(
    currentCost - (currentCost - costAnnualCost) * 0.8068
  ); // ~81% of cost benefit
  const balancedCo2 = Math.round(
    currentCo2 - (currentCo2 - carbonCo2) * 0.8064
  ); // ~81% of carbon benefit
  const balancedRenewable = Math.min(
    88,
    Math.round(54 * (solarFactor * 0.5 + windFactor * 0.5))
  );
  const balancedReliability = gridAvailable ? 99.2 : 96.8;
  const balancedSavingsCr = currentCost - balancedCost;

  // Confidence calculations based on data availability & grid stability
  const currentConfidence = 100;
  const costConfidence = Math.min(99, Math.round(92 * (gridAvailable ? 1 : 0.88)));
  const carbonConfidence = Math.min(99, Math.round(89 * (solarFactor > 0.5 ? 1 : 0.92)));
  const balancedConfidence = Math.min(99, Math.round(95 * (gridAvailable ? 1 : 0.94)));

  // Dynamic Benefit Capture Percentages
  const maxCostBenefit = Math.max(1, currentCost - costAnnualCost);
  const maxCarbonBenefit = Math.max(1, currentCo2 - carbonCo2);

  const costBenefitCapturedPct = Math.min(
    99,
    Math.max(1, Math.round(((currentCost - balancedCost) / maxCostBenefit) * 100))
  );
  const carbonBenefitCapturedPct = Math.min(
    99,
    Math.max(1, Math.round(((currentCo2 - balancedCo2) / maxCarbonBenefit) * 100))
  );

  const balancedRationaleText = `Captures ${costBenefitCapturedPct}% of the cost benefit and ${carbonBenefitCapturedPct}% of the carbon benefit with the highest availability.`;

  const strategies: Record<string, CalculatedStrategy> = {
    current: {
      key: "current",
      title: "Current Strategy",
      description: "Rule-based dispatch with manual peak management",
      annualCostCr: currentCost,
      co2EmissionsKt: currentCo2,
      renewablePct: currentRenewable,
      reliabilityPct: currentReliability,
      savingsVsCurrentCr: 0,
      savingsExactRupees: 0,
      confidenceScore: currentConfidence,
      isRecommended: false,
      energyMix: {
        solarPct: Math.round(18 * solarFactor),
        windPct: Math.round(20 * windFactor),
        batteryPct: 8,
        gridPct: 35,
        captivePct: 14,
        backupGeneratorPct: 5,
      },
      optimizationObjective: "Manual static merit-order dispatch based on historical TOD slots.",
      constraintsUsed: [
        "Fixed ramp-up limits",
        "Manual genset start threshold",
        "Static battery charge schedule",
      ],
      aiReasoning:
        "Baseline operation relies on fixed operator heuristics. Peak loads are covered by grid import and captive thermal generation regardless of real-time tariff fluctuations.",
    },

    costOptimized: {
      key: "cost",
      title: "Cost-Optimized",
      description: "Minimise landed ₹/kWh within reliability limits",
      annualCostCr: costAnnualCost,
      co2EmissionsKt: costCo2,
      renewablePct: costRenewable,
      reliabilityPct: costReliability,
      savingsVsCurrentCr: costSavingsCr,
      savingsExactRupees: Math.round(costSavingsCr * 1e7),
      confidenceScore: costConfidence,
      isRecommended: false,
      energyMix: {
        solarPct: Math.round(25 * solarFactor),
        windPct: Math.round(16 * windFactor),
        batteryPct: 18,
        gridPct: 24,
        captivePct: 15,
        backupGeneratorPct: 2,
      },
      optimizationObjective: "Minimize total landed cost of energy per kWh over 24-hour horizon.",
      constraintsUsed: [
        "Max BESS cycle rate: 1.5 cycles/day",
        "Grid peak demand cap: 150 MW",
        "Thermal captive minimum stable generation",
      ],
      aiReasoning:
        "Aggressively shifts battery charging to cheap off-peak hours and maximizes captive cogeneration during high TOD grid tariffs.",
    },

    carbonOptimized: {
      key: "carbon",
      title: "Carbon-Optimized",
      description: "Minimise tCO₂ with a cost ceiling",
      annualCostCr: carbonAnnualCost,
      co2EmissionsKt: carbonCo2,
      renewablePct: carbonRenewable,
      reliabilityPct: carbonReliability,
      savingsVsCurrentCr: carbonSavingsCr,
      savingsExactRupees: Math.round(carbonSavingsCr * 1e7),
      confidenceScore: carbonConfidence,
      isRecommended: false,
      energyMix: {
        solarPct: Math.round(32 * solarFactor),
        windPct: Math.round(29 * windFactor),
        batteryPct: 15,
        gridPct: 16,
        captivePct: 8,
        backupGeneratorPct: 0,
      },
      optimizationObjective: "Minimize Scope 1 & Scope 2 carbon intensity (tCO₂/MWh).",
      constraintsUsed: [
        "Zero diesel generator dispatch",
        "Max renewable curtailment limit: < 2%",
        "Cap captive thermal output to green ceiling",
      ],
      aiReasoning:
        "Prioritizes maximum solar and wind absorption, keeping captive coal thermal generation to minimal baseline levels and eliminating diesel backup completely.",
    },

    balanced: {
      key: "balanced",
      title: "Balanced",
      description: "Pareto-optimal blend of cost, carbon and reliability",
      annualCostCr: balancedCost,
      co2EmissionsKt: balancedCo2,
      renewablePct: balancedRenewable,
      reliabilityPct: balancedReliability,
      savingsVsCurrentCr: balancedSavingsCr,
      savingsExactRupees: Math.round(balancedSavingsCr * 1e7),
      confidenceScore: balancedConfidence,
      isRecommended: true,
      energyMix: {
        solarPct: Math.round(22 * solarFactor),
        windPct: Math.round(18 * windFactor),
        batteryPct: 14,
        gridPct: 31,
        captivePct: 10,
        backupGeneratorPct: 5,
      },
      optimizationObjective: "Multi-objective Pareto optimization balancing cost, CO₂, and grid ride-through reserve.",
      constraintsUsed: [
        "40% BESS emergency spinning reserve",
        "ToD arbitrage optimization",
        "N-1 contingency ride-through reliability limit",
      ],
      aiReasoning:
        "Solar availability is high during afternoon while wind generation increases overnight. The optimizer stores surplus renewable energy in the battery and uses grid power only when renewable generation cannot satisfy plant demand.",
    },
  };

  return {
    strategies,
    costBenefitCapturedPct,
    carbonBenefitCapturedPct,
    balancedRationaleText,
  };
}
