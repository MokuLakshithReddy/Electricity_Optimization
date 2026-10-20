/**
 * IntelliGrid AI - Physical & Financial Digital Twin Simulation Engine
 * 
 * Replaces linear slider formulas with a rigorous 24-hour chronological
 * physical battery dispatch, round-trip efficiency losses, cell degradation,
 * multi-tier ToD tariff schedules, generation constraints, and an outage reliability model.
 */

import { tariffRates, emissionFactors } from "@/data/emissionFactors";

export interface SimulatorInputs {
  additionalSolarMW: number; // 0..250 MW
  additionalBatteryMWh: number; // 0..500 MWh
  fuelPriceChangePct: number; // -30..+80 %
  productionIncreasePct: number; // 0..60 %
  gridOutage: boolean;
}

export interface HourlyDispatchStep {
  hour: number;
  timeLabel: string;
  demandMW: number;
  solarMW: number;
  windMW: number;
  batteryMW: number; // positive = discharge, negative = charge
  batterySOC: number; // %
  gridMW: number;
  captiveMW: number;
  generatorMW: number;
  unservedMW: number;
  costRupees: number;
  co2Tonnes: number;
}

export interface PhysicalSimulationResult {
  hourlySchedule: HourlyDispatchStep[];
  baselineAnnualCostCr: number; // ₹ Cr / year
  simulatedAnnualCostCr: number; // ₹ Cr / year
  annualSavingsCr: number; // ₹ Cr / year
  capexCr: number; // ₹ Cr
  opexAnnualCr: number; // ₹ Cr / year
  simplePaybackYears: number; // years
  discountedPaybackYears: number; // years
  npvCr: number; // ₹ Cr (15-year NPV @ 10% discount)
  irrPct: number; // %
  lcosPerKWh: number; // ₹/kWh Levelized Cost of Storage
  annualCO2AvoidedTonnes: number; // tCO2 / year
  powerAvailabilityPct: number; // % based on Loss of Load Expectation
  batteryCycleDegradationPctPerYear: number; // % annual capacity loss
  unservedEnergyMWhAnnual: number; // MWh unserved
  baselineCO2AnnualTonnes: number;
  simulatedCO2AnnualTonnes: number;
}

/**
 * Executes a full 24-hour chronological physical and financial simulation.
 */
export function runDigitalTwinSimulation(inputs: SimulatorInputs): PhysicalSimulationResult {
  const {
    additionalSolarMW,
    additionalBatteryMWh,
    fuelPriceChangePct,
    productionIncreasePct,
    gridOutage,
  } = inputs;

  // 1. Plant Asset Capacities
  const totalSolarCapMW = 145 + additionalSolarMW;
  const totalBatteryCapMWh = 200 + additionalBatteryMWh;
  const batteryMaxCrate = 0.5; // 0.5C max charge/discharge
  const maxBatDischargeMW = totalBatteryCapMWh * batteryMaxCrate;
  const maxBatChargeMW = totalBatteryCapMWh * batteryMaxCrate;

  // Physical Round-Trip Efficiency: 89% AC-to-AC
  // One-way charging = 94.34%, one-way discharging = 94.34%
  const etaOneWay = Math.sqrt(0.89); // ~0.9434
  const minSOC = 15; // 15% lower protective buffer
  const maxSOC = 95; // 95% upper thermal buffer

  // Captive thermal unit
  const captiveMinMW = 30;
  const captiveMaxMW = 95;

  // Diesel fuel cost with slider multiplier
  const baselineDieselPricePerLitre = 94; // ₹/litre
  const dieselPricePerLitre = baselineDieselPricePerLitre * (1 + fuelPriceChangePct / 100);
  const genFuelCostPerKWh = dieselPricePerLitre * 0.24; // ~₹22.56/kWh baseline

  // Demand scaling with production increase slider
  const demandScaleFactor = 1 + productionIncreasePct / 100;
  const base24hDemand = [
    390, 370, 360, 380, 410, 440, // 00:00 - 05:00
    470, 510, 530, 540, 550, 560, // 06:00 - 11:00
    540, 530, 520, 530, 550, 580, // 12:00 - 17:00
    590, 580, 540, 500, 450, 410, // 18:00 - 23:00
  ];

  // Diurnal solar curve (normalized 0..1)
  const solarProfile = [
    0, 0, 0, 0, 0, 0,
    0.05, 0.25, 0.55, 0.82, 0.96, 1.0,
    0.98, 0.88, 0.68, 0.42, 0.15, 0.02,
    0, 0, 0, 0, 0, 0,
  ];

  // Wind profile (higher in evening/night)
  const windProfileMW = [
    95, 102, 110, 108, 98, 85,
    75, 68, 62, 58, 54, 52,
    55, 60, 65, 72, 80, 92,
    98, 105, 108, 104, 98, 96,
  ];

  // 2. Step-by-Step Chronological Dispatch Loop (24 hours)
  let currentSOC = 70; // Start at 70% SoC
  let totalDailyCostRupees = 0;
  let totalDailyBaselineCostRupees = 0;
  let totalDailyCO2Tonnes = 0;
  let totalDailyBaselineCO2Tonnes = 0;
  let totalDailyUnservedMWh = 0;
  let totalDailyServedMWh = 0;
  let totalDailyDemandMWh = 0;
  let totalDailyBatteryThroughputMWh = 0;

  const hourlySchedule: HourlyDispatchStep[] = [];

  for (let h = 0; h < 24; h++) {
    const demand = Number((base24hDemand[h] * demandScaleFactor).toFixed(1));
    totalDailyDemandMWh += demand;

    // Time-of-Day Tariff Schedule
    let gridTariffRate = tariffRates.gridShoulder; // ₹7.20/kWh
    let isPeak = false;
    let isOffPeak = false;

    if (h >= 18 && h < 22) {
      gridTariffRate = tariffRates.gridPeak; // ₹11.80/kWh
      isPeak = true;
    } else if (h >= 22 || h < 6) {
      gridTariffRate = tariffRates.gridOffPeak; // ₹4.50/kWh
      isOffPeak = true;
    }

    // Renewable generation available
    const solarAvail = Number((solarProfile[h] * totalSolarCapMW).toFixed(1));
    const windAvail = Number((windProfileMW[h]).toFixed(1));

    // Usable energy in battery
    const usableEnergyMWh = (totalBatteryCapMWh * Math.max(0, currentSOC - minSOC)) / 100;
    const headroomEnergyMWh = (totalBatteryCapMWh * Math.max(0, maxSOC - currentSOC)) / 100;

    let batDischarge = 0;
    let batCharge = 0;
    let dispatchedSolar = Math.min(demand, solarAvail);
    let dispatchedWind = Math.min(demand - dispatchedSolar, windAvail);
    let netDemand = demand - dispatchedSolar - dispatchedWind;

    // Surplus solar to battery
    const solarSurplus = solarAvail - dispatchedSolar;
    if (solarSurplus > 0 && headroomEnergyMWh > 0) {
      batCharge = Math.min(solarSurplus, maxBatChargeMW, headroomEnergyMWh / etaOneWay);
    }

    // Off-peak opportunistic grid charging (if grid is available and SOC < 85%)
    if (isOffPeak && !gridOutage && currentSOC < 85 && batCharge === 0) {
      const gridCharge = Math.min(maxBatChargeMW, 35, (totalBatteryCapMWh * (85 - currentSOC)) / 100 / etaOneWay);
      batCharge += gridCharge;
      netDemand += gridCharge;
    }

    // In peak tariff, dispatch battery to offset grid/diesel
    if ((isPeak || gridOutage) && netDemand > 0 && usableEnergyMWh > 0) {
      batDischarge = Math.min(netDemand, maxBatDischargeMW, usableEnergyMWh * etaOneWay);
      netDemand -= batDischarge;
    }

    // Captive thermal unit
    let captive = 0;
    if (netDemand > 0) {
      captive = Math.min(captiveMaxMW, Math.max(captiveMinMW, netDemand));
      netDemand = Math.max(0, netDemand - captive);
    } else {
      captive = captiveMinMW; // Min technical load
    }

    // Grid Import
    let grid = 0;
    if (!gridOutage && netDemand > 0) {
      const contractLimit = 250;
      grid = Math.min(contractLimit, netDemand);
      netDemand = Math.max(0, netDemand - grid);
    }

    // If demand still remains and battery has spare discharge capacity
    if (netDemand > 0 && batDischarge < maxBatDischargeMW && usableEnergyMWh > 0) {
      const extraDischarge = Math.min(netDemand, maxBatDischargeMW - batDischarge, (usableEnergyMWh - batDischarge / etaOneWay) * etaOneWay);
      batDischarge += Math.max(0, extraDischarge);
      netDemand -= Math.max(0, extraDischarge);
    }

    // Backup Diesel Generator
    let generator = 0;
    if (netDemand > 0) {
      generator = Math.min(120, netDemand);
      netDemand = Math.max(0, netDemand - generator);
    }

    // Unserved demand (Outage shortfall)
    const unserved = Math.max(0, netDemand);
    totalDailyUnservedMWh += unserved;
    totalDailyServedMWh += (demand - unserved);

    // Update Battery State of Charge with one-way efficiencies
    const deltaSOC = ((batCharge * etaOneWay - (batDischarge / etaOneWay)) / totalBatteryCapMWh) * 100;
    currentSOC = Math.max(minSOC, Math.min(maxSOC, currentSOC + deltaSOC));
    totalDailyBatteryThroughputMWh += (batCharge + batDischarge);

    // Hourly Operating Cost
    const costStep =
      dispatchedSolar * tariffRates.solar * 1000 +
      dispatchedWind * tariffRates.wind * 1000 +
      batDischarge * (tariffRates.battery + 0.85) * 1000 +
      grid * gridTariffRate * 1000 +
      captive * tariffRates.captive * 1000 +
      generator * genFuelCostPerKWh * 1000 +
      unserved * 50 * 1000; // Value of Lost Load penalty ₹50/kWh

    // Unoptimized Baseline cost for that hour
    const baselineSolar = Math.min(demand * 0.4, 145 * solarProfile[h]);
    const baselineCaptive = Math.min(captiveMinMW + 20, demand - baselineSolar);
    const baselineGrid = gridOutage ? 0 : Math.min(250, demand - baselineSolar - baselineCaptive);
    const baselineGen = Math.max(0, demand - baselineSolar - baselineCaptive - baselineGrid);
    const baselineCostStep =
      baselineSolar * tariffRates.solar * 1000 +
      baselineCaptive * tariffRates.captive * 1000 +
      baselineGrid * tariffRates.gridPeak * 1000 +
      baselineGen * genFuelCostPerKWh * 1000 +
      (gridOutage && baselineGen < demand - baselineSolar - baselineCaptive ? (demand - baselineSolar - baselineCaptive - baselineGen) * 50 * 1000 : 0);

    totalDailyCostRupees += costStep;
    totalDailyBaselineCostRupees += baselineCostStep;

    // Carbon Emissions
    const co2Step =
      dispatchedSolar * emissionFactors.solar +
      dispatchedWind * emissionFactors.wind +
      batDischarge * emissionFactors.battery +
      grid * emissionFactors.grid +
      captive * emissionFactors.captive +
      generator * emissionFactors.generator;

    const baselineCO2Step =
      baselineSolar * emissionFactors.solar +
      baselineCaptive * emissionFactors.captive +
      baselineGrid * emissionFactors.grid +
      baselineGen * emissionFactors.generator;

    totalDailyCO2Tonnes += co2Step;
    totalDailyBaselineCO2Tonnes += baselineCO2Step;

    const timeLabel = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

    hourlySchedule.push({
      hour: h,
      timeLabel,
      demandMW: demand,
      solarMW: Number(dispatchedSolar.toFixed(1)),
      windMW: Number(dispatchedWind.toFixed(1)),
      batteryMW: Number((batDischarge - batCharge).toFixed(1)),
      batterySOC: Number(currentSOC.toFixed(1)),
      gridMW: Number(grid.toFixed(1)),
      captiveMW: Number(captive.toFixed(1)),
      generatorMW: Number(generator.toFixed(1)),
      unservedMW: Number(unserved.toFixed(1)),
      costRupees: Math.round(costStep),
      co2Tonnes: Number(co2Step.toFixed(1)),
    });
  }

  // 3. Annualized Financial & Engineering Metrics
  const dailySavingsRupees = Math.max(0, totalDailyBaselineCostRupees - totalDailyCostRupees);
  const annualSavingsCr = Number(((dailySavingsRupees * 365) / 1e7).toFixed(2));
  const baselineAnnualCostCr = Number(((totalDailyBaselineCostRupees * 365) / 1e7).toFixed(2));
  const simulatedAnnualCostCr = Number(((totalDailyCostRupees * 365) / 1e7).toFixed(2));

  // Capital Expenditure (CAPEX):
  // Solar: ₹3.4 Cr / MW
  // Battery: ₹1.85 Cr / MWh + Inverter PCS ₹0.35 Cr / MW
  const solarCapex = additionalSolarMW * 3.4;
  const batteryCapex = additionalBatteryMWh * 1.85 + (additionalBatteryMWh * batteryMaxCrate) * 0.35;
  const capexCr = Number((solarCapex + batteryCapex).toFixed(2));

  // Annual OPEX: 1.5% of CAPEX
  const opexAnnualCr = Number((capexCr * 0.015).toFixed(2));
  const netAnnualSavingsCr = Math.max(0, annualSavingsCr - opexAnnualCr);

  // Simple & Discounted Payback
  const simplePaybackYears = capexCr > 0 && netAnnualSavingsCr > 0 ? Number((capexCr / netAnnualSavingsCr).toFixed(1)) : 0;

  // 15-Year Discounted Cash Flow NPV @ 10% discount rate
  const discountRate = 0.10;
  let npv = -capexCr;
  let discountedCumulative = -capexCr;
  let discountedPayback = 0;

  for (let year = 1; year <= 15; year++) {
    // Battery cell degradation reduces savings by ~1.2% per year
    const yearlyNet = netAnnualSavingsCr * Math.pow(0.988, year - 1);
    const discountedCash = yearlyNet / Math.pow(1 + discountRate, year);
    npv += discountedCash;

    discountedCumulative += discountedCash;
    if (discountedCumulative >= 0 && discountedPayback === 0) {
      discountedPayback = year;
    }
  }

  const npvCr = Number(npv.toFixed(2));
  const discountedPaybackYears = discountedPayback > 0 ? discountedPayback : Number((simplePaybackYears * 1.25).toFixed(1));

  // Internal Rate of Return (IRR) approximation
  const irrPct = capexCr > 0 && netAnnualSavingsCr > 0 ? Number(((netAnnualSavingsCr / capexCr) * 100 * 1.15).toFixed(1)) : 0;

  // Levelized Cost of Storage (LCOS in ₹/kWh):
  // LCOS = (CAPEX + Sum OPEX) / Lifetime Delivered kWh
  const lifetimeDeliveredMWh = totalDailyBatteryThroughputMWh * 365 * 12; // 12-year battery life
  const totalBessLifeCostRupees = (batteryCapex * 1e7) + (batteryCapex * 1e7 * 0.015 * 12);
  const lcosPerKWh = lifetimeDeliveredMWh > 0 ? Number((totalBessLifeCostRupees / (lifetimeDeliveredMWh * 1000)).toFixed(2)) : 4.85;

  // Power Availability Pct based on unserved energy
  const powerAvailabilityPct = Number((Math.min(99.99, (totalDailyServedMWh / Math.max(1, totalDailyDemandMWh)) * 100)).toFixed(2));

  // Battery Cycle Degradation Model:
  // Degradation per year based on full equivalent cycles:
  const equivalentFullCyclesPerDay = totalDailyBatteryThroughputMWh / Math.max(1, totalBatteryCapMWh * 2);
  const batteryCycleDegradationPctPerYear = Number((equivalentFullCyclesPerDay * 365 * 0.0055).toFixed(2)); // ~2.0% fade/year

  const annualCO2AvoidedTonnes = Math.round((totalDailyBaselineCO2Tonnes - totalDailyCO2Tonnes) * 365);
  const baselineCO2AnnualTonnes = Math.round(totalDailyBaselineCO2Tonnes * 365);
  const simulatedCO2AnnualTonnes = Math.round(totalDailyCO2Tonnes * 365);

  return {
    hourlySchedule,
    baselineAnnualCostCr,
    simulatedAnnualCostCr,
    annualSavingsCr,
    capexCr,
    opexAnnualCr,
    simplePaybackYears,
    discountedPaybackYears,
    npvCr,
    irrPct,
    lcosPerKWh,
    annualCO2AvoidedTonnes,
    powerAvailabilityPct,
    batteryCycleDegradationPctPerYear,
    unservedEnergyMWhAnnual: Math.round(totalDailyUnservedMWh * 365),
    baselineCO2AnnualTonnes,
    simulatedCO2AnnualTonnes,
  };
}
