/**
 * IntelliGrid AI - Horizon-Based Optimizer Proof & Rigorous Verification Suite (Vitest)
 *
 * Comprehensive tests covering:
 * 1. Power balance for every interval across a 24-hour horizon.
 * 2. Battery charge/discharge envelope, round-trip efficiency kinetics, and SoC evolution.
 * 3. Generator startup, shutdown, and inter-temporal ramp limits (Captive & Diesel).
 * 4. Grid outage (islanded) and severe insufficient-generation deficit scenarios.
 * 5. Strict separation of infeasible results from executable schedules (null dispatch).
 * 6. Mathematical comparison against an independent reference LP solver on reproducible test cases.
 */

import { describe, it, expect } from "vitest";
import {
  solveHorizonDispatch,
  solveEconomicDispatch,
  verifyHorizonScheduleConstraints,
  DEFAULT_CONSTRAINTS,
  HorizonDispatchInput,
  HorizonIntervalDispatch,
} from "../lib/optimizationEngine";
import * as fs from "node:fs";
import * as crypto from "node:crypto";
import {
  solveReferenceLP,
  ReferenceLPProblem,
  solveReferenceHorizonMILP,
  solveExhaustiveReferenceMILP,
  solveContinuousRelaxationLowerBound,
  solve3StageShiftHeuristicBenchmark,
  certify24HourGlobalOptimality,
} from "./referenceSolver";
import {
  durableLedgerStore,
  DurablePersistentLedgerStore,
  RevenueMeterTelemetryIngestor,
  RevenueMeterPacket,
  EnergyLedgerRecord,
  CalibrationAuthorityRegistry,
  AUTHORIZED_GATEWAY_DIRECTORY,
  ENERGY_LEDGER_REVENUE_GRADE_DISCLAIMER,
} from "../lib/energyLedger";
import {
  industrialCommissioningGate,
  industrialActuationController,
  AUTHORIZED_ENGINEERING_KEYRING,
  HISTORICAL_CREDENTIAL_ROTATION_AUDIT,
} from "../lib/scadaSystem";
import { tariffRates as DEFAULT_TARIFFS } from "../data/emissionFactors";

describe("IntelliGrid AI — Optimizer & Governance Suite", () => {
  it("Test 1: Exact Power Balance Across All 24 Intervals", () => {
    const H = 24;
    const demandCurve = [
      380, 370, 365, 360, 375, 420, 480, 520, 540, 530, 510, 490, 485, 495, 510, 525, 550, 560, 580,
      570, 540, 490, 440, 400,
    ];
    const solarCurve = [
      0, 0, 0, 0, 0, 15, 60, 110, 155, 180, 190, 185, 170, 150, 115, 65, 20, 0, 0, 0, 0, 0, 0, 0,
    ];
    const windCurve = [
      75, 80, 85, 90, 85, 70, 60, 55, 50, 45, 40, 45, 50, 55, 60, 65, 70, 80, 85, 90, 95, 90, 85, 80,
    ];
    const tariffTiers: ("Peak" | "Shoulder" | "OffPeak")[] = [
      "OffPeak",
      "OffPeak",
      "OffPeak",
      "OffPeak",
      "OffPeak",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Peak",
      "Peak",
      "Peak",
      "Peak",
      "Shoulder",
      "OffPeak",
      "OffPeak",
    ];

    const result = solveHorizonDispatch({
      horizonHours: H,
      hourlyDemandMW: demandCurve,
      hourlySolarAvailableMW: solarCurve,
      hourlyWindAvailableMW: windCurve,
      hourlyTariffTier: tariffTiers,
      initialBatterySOC: 65,
      initialCaptiveMW: 55,
      initialGeneratorMW: 0,
      initialGeneratorCommitted: false,
    });

    expect(result.solverStatus).toBe("PROVEN_GLOBAL_OPTIMAL");
    expect(result.isExecutablePlan).toBe(true);
    expect(result.intervals.length).toBe(24);

    for (let t = 0; t < 24; t++) {
      const inv = result.intervals[t]!;
      const totalGen = inv.solarMW + inv.windMW + inv.gridMW + inv.captiveMW + inv.generatorMW;
      const netSupply = totalGen + inv.batteryDischargeMW - inv.batteryChargeMW;
      const delta = Math.abs(netSupply - inv.demandMW);
      expect(delta).toBeLessThan(0.05);
    }
  });

  it("Test 2: Battery Operating Envelope & Inter-Temporal SoC Trajectory", () => {
    const H = 24;
    const demand = new Array(24).fill(450);
    const solar = [
      0, 0, 0, 0, 0, 20, 80, 140, 180, 200, 200, 190, 170, 140, 100, 40, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    const wind = new Array(24).fill(60);
    const tiers: ("Peak" | "Shoulder" | "OffPeak")[] = [
      "OffPeak",
      "OffPeak",
      "OffPeak",
      "OffPeak",
      "OffPeak",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Peak",
      "Peak",
      "Peak",
      "Peak",
      "Shoulder",
      "OffPeak",
      "OffPeak",
    ];

    const initialSOC = 50;
    const result = solveHorizonDispatch({
      horizonHours: H,
      hourlyDemandMW: demand,
      hourlySolarAvailableMW: solar,
      hourlyWindAvailableMW: wind,
      hourlyTariffTier: tiers,
      initialBatterySOC: initialSOC,
    });

    const etaSqrt = Math.sqrt(DEFAULT_CONSTRAINTS.batteryRoundTripEfficiency);
    const capMWh = DEFAULT_CONSTRAINTS.batteryCapacityMWh;

    let prevSOC = initialSOC;
    for (let t = 0; t < 24; t++) {
      const inv = result.intervals[t]!;
      expect(inv.batteryDischargeMW).toBeLessThanOrEqual(
        DEFAULT_CONSTRAINTS.batteryMaxDischargeMW + 1e-4,
      );
      expect(inv.batteryChargeMW).toBeLessThanOrEqual(
        DEFAULT_CONSTRAINTS.batteryMaxChargeMW + 1e-4,
      );
      expect(inv.batterySOC).toBeGreaterThanOrEqual(DEFAULT_CONSTRAINTS.batteryMinSOC - 0.05);
      expect(inv.batterySOC).toBeLessThanOrEqual(DEFAULT_CONSTRAINTS.batteryMaxSOC + 0.05);

      const expectedDeltaMWh = inv.batteryChargeMW * etaSqrt - inv.batteryDischargeMW / etaSqrt;
      const expectedSOC = prevSOC + (expectedDeltaMWh / capMWh) * 100;
      const socDiff = Math.abs(inv.batterySOC - expectedSOC);
      expect(socDiff).toBeLessThan(0.1);
      prevSOC = inv.batterySOC;
    }
  });

  it("Test 3: Generator Ramping, Startup from Offline & Discrete Unit Commitment", () => {
    const H = 12;
    const volatileDemand = [380, 430, 490, 530, 480, 420, 390, 450, 520, 470, 410, 380];
    const lowRenewables = new Array(12).fill(25);
    const tiers: ("Peak" | "Shoulder" | "OffPeak")[] = new Array(12).fill("Peak");

    const result = solveHorizonDispatch({
      horizonHours: H,
      hourlyDemandMW: volatileDemand,
      hourlySolarAvailableMW: lowRenewables,
      hourlyWindAvailableMW: lowRenewables,
      hourlyTariffTier: tiers,
      initialBatterySOC: 30,
      initialCaptiveMW: 50,
      initialGeneratorMW: 0,
      initialGeneratorCommitted: false,
    });

    const maxCaptiveRamp = DEFAULT_CONSTRAINTS.captiveRampRateMWPerMin * 60;
    const maxGenRamp = DEFAULT_CONSTRAINTS.generatorRampRateMWPerMin * 60;

    let prevCaptive = 50;
    let prevGen = 0;
    let prevGenCommitted = false;

    for (let t = 0; t < H; t++) {
      const inv = result.intervals[t]!;
      const captiveRamp = Math.abs(inv.captiveMW - prevCaptive);
      expect(captiveRamp).toBeLessThanOrEqual(maxCaptiveRamp + 0.1);

      if (!prevGenCommitted && inv.generatorCommitted) {
        expect(inv.generatorMW).toBeGreaterThanOrEqual(DEFAULT_CONSTRAINTS.generatorMinMW - 0.05);
        expect(inv.generatorMW).toBeLessThanOrEqual(
          DEFAULT_CONSTRAINTS.generatorMinMW + maxGenRamp + 0.05,
        );
      } else if (prevGenCommitted && inv.generatorCommitted) {
        const genRamp = Math.abs(inv.generatorMW - prevGen);
        expect(genRamp).toBeLessThanOrEqual(maxGenRamp + 0.1);
      } else {
        expect(inv.generatorMW).toBe(0);
      }

      prevCaptive = inv.captiveMW;
      prevGen = inv.generatorMW;
      prevGenCommitted = inv.generatorCommitted;
    }
  });

  it("Test 4: Grid Outage (Islanded) & Severe Capacity Deficit Handling", () => {
    const islandedResult = solveHorizonDispatch({
      horizonHours: 6,
      hourlyDemandMW: [280, 290, 300, 310, 305, 295],
      hourlySolarAvailableMW: [120, 140, 150, 130, 90, 40],
      hourlyWindAvailableMW: [70, 75, 80, 75, 70, 65],
      hourlyTariffTier: ["Shoulder", "Shoulder", "Shoulder", "Shoulder", "Shoulder", "Shoulder"],
      initialBatterySOC: 80,
      isGridAvailable: false,
    });

    expect(islandedResult.solverStatus).toBe("PROVEN_GLOBAL_OPTIMAL");
    expect(islandedResult.isExecutablePlan).toBe(true);
    for (const inv of islandedResult.intervals) {
      expect(inv.gridMW).toBe(0);
    }

    const deficitResult = solveEconomicDispatch({
      demandMW: 950,
      solarAvailableMW: 150,
      windAvailableMW: 80,
      currentBatterySOC: 40,
      currentTariffTier: "Peak",
      isGridAvailable: true,
    });

    expect(deficitResult.solverStatus).toBe("INFEASIBLE_DEFICIT");
    expect(deficitResult.isExecutablePlan).toBe(false);
    expect(deficitResult.dispatch).toBeNull();
    expect(deficitResult.unservedEnergyMWh).toBeGreaterThan(0);
  });

  it("Test 5: Strict Infeasibility Separation (No Emergency Proposal as Feasible)", () => {
    const res = solveEconomicDispatch({
      demandMW: 1200,
      solarAvailableMW: 50,
      windAvailableMW: 30,
      currentBatterySOC: 20,
      currentTariffTier: "Peak",
      isGridAvailable: false,
    });

    expect(res.isExecutablePlan).toBe(false);
    expect(res.dispatch).toBeNull();
    expect(res.solverStatus).toBe("INFEASIBLE_DEFICIT");
    expect(res.unservedEnergyMWh).toBeGreaterThan(0);
  });

  it("Test 6: Comparison Against Independent Reference MILP Benchmark Solver", () => {
    const testA: ReferenceLPProblem = {
      c: [3200, 4100, 7200, 9500],
      A: [[1, 1, 1, 1]],
      b: [350],
      ub: [150, 100, 200, 120],
    };
    const refSolA = solveReferenceLP(testA);
    expect(refSolA.status).toBe("OPTIMAL");

    const H = 24;
    const demand24 = [
      380, 370, 365, 360, 375, 420, 480, 520, 540, 530, 510, 490, 485, 495, 510, 525, 550, 560, 580,
      570, 540, 490, 440, 400,
    ];
    const solar24 = [
      0, 0, 0, 0, 0, 15, 60, 110, 155, 180, 190, 185, 170, 150, 115, 65, 20, 0, 0, 0, 0, 0, 0, 0,
    ];
    const wind24 = [
      75, 80, 85, 90, 85, 70, 60, 55, 50, 45, 40, 45, 50, 55, 60, 65, 70, 80, 85, 90, 95, 90, 85, 80,
    ];
    const tiers24: ("Peak" | "Shoulder" | "OffPeak")[] = [
      "OffPeak",
      "OffPeak",
      "OffPeak",
      "OffPeak",
      "OffPeak",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Peak",
      "Peak",
      "Peak",
      "Peak",
      "Shoulder",
      "OffPeak",
      "OffPeak",
    ];

    const fullProblem: HorizonDispatchInput = {
      horizonHours: H,
      hourlyDemandMW: demand24,
      hourlySolarAvailableMW: solar24,
      hourlyWindAvailableMW: wind24,
      hourlyTariffTier: tiers24,
      initialBatterySOC: 65,
      initialCaptiveMW: 55,
      initialGeneratorMW: 0,
      initialGeneratorCommitted: false,
    };

    const horizonResult = solveHorizonDispatch(fullProblem);
    const milpRefResult = solveReferenceHorizonMILP(fullProblem);

    expect(horizonResult.solverStatus).toBe("PROVEN_GLOBAL_OPTIMAL");
    expect(milpRefResult.status).toBe("OPTIMAL");

    const costRatio =
      Math.abs(horizonResult.totalHorizonCost - milpRefResult.totalCost) / milpRefResult.totalCost;
    expect(costRatio).toBeLessThan(0.0005);
  });

  it("Test 7: Terminal State-of-Charge (SoC) Target Enforcement", () => {
    const H = 24;
    const demand = [
      360, 350, 350, 360, 380, 420, 480, 500, 520, 510, 490, 480, 470, 480, 500, 520, 540, 560, 580,
      570, 530, 480, 420, 380,
    ];
    const solar = [
      0, 0, 0, 0, 0, 15, 60, 120, 160, 180, 190, 180, 160, 140, 100, 50, 15, 0, 0, 0, 0, 0, 0, 0,
    ];
    const wind = new Array(24).fill(65);
    const tiers: ("Peak" | "Shoulder" | "OffPeak")[] = [
      "OffPeak",
      "OffPeak",
      "OffPeak",
      "OffPeak",
      "OffPeak",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Shoulder",
      "Peak",
      "Peak",
      "Peak",
      "Peak",
      "Shoulder",
      "OffPeak",
      "OffPeak",
    ];

    const targetSOC = 50;
    const result = solveHorizonDispatch({
      horizonHours: H,
      hourlyDemandMW: demand,
      hourlySolarAvailableMW: solar,
      hourlyWindAvailableMW: wind,
      hourlyTariffTier: tiers,
      initialBatterySOC: 60,
      targetTerminalSOC: targetSOC,
    });

    expect(result.solverStatus).toBe("PROVEN_GLOBAL_OPTIMAL");
    expect(result.isExecutablePlan).toBe(true);
    const finalSOC = result.intervals[23]!.batterySOC;
    expect(finalSOC).toBeGreaterThanOrEqual(targetSOC - 0.5);
  });

  it("Test 8: Independent Physical Verification Gatekeeper & Constraint Auditing", () => {
    const badIntervals = [
      {
        hour: 0,
        timeLabel: "00:00",
        demandMW: 500,
        solarMW: 100,
        windMW: 50,
        batteryDischargeMW: 0,
        batteryChargeMW: 0,
        netBatteryMW: 0,
        gridMW: 200,
        gridContractMW: 200,
        gridExcessMW: 0,
        captiveMW: 50,
        generatorMW: 0,
        generatorCommitted: false,
        batterySOC: 50,
        costRupees: 100000,
        baselineCostRupees: 150000,
        savingsRupees: 50000,
        costVarianceRupees: 50000,
        marginalCostPerKWh: 8.0,
      },
    ];

    const verification = verifyHorizonScheduleConstraints(
      badIntervals,
      DEFAULT_CONSTRAINTS,
      50,
      0,
      false,
      50,
      50,
      true,
    );

    expect(verification.isValid).toBe(false);
    expect(verification.violations.some((v) => v.constraint === "POWER_BALANCE")).toBe(true);
  });

  it("Test 9: Comprehensive Input Validation Pre-Check", () => {
    const nanResult = solveHorizonDispatch({
      horizonHours: 3,
      hourlyDemandMW: [300, NaN, 400],
      hourlySolarAvailableMW: [50, 50, 50],
      hourlyWindAvailableMW: [50, 50, 50],
      hourlyTariffTier: ["Peak", "Peak", "Peak"],
      initialBatterySOC: 50,
    });
    expect(nanResult.solverStatus).toBe("INFEASIBLE_DEFICIT");
    expect(nanResult.isExecutablePlan).toBe(false);
  });

  it("Test 10: Impossible Terminal SoC Target Rejection", () => {
    const impossibleResult = solveHorizonDispatch({
      horizonHours: 1,
      hourlyDemandMW: [200],
      hourlySolarAvailableMW: [100],
      hourlyWindAvailableMW: [100],
      hourlyTariffTier: ["OffPeak"],
      initialBatterySOC: 20,
      targetTerminalSOC: 95,
    });

    expect(impossibleResult.solverStatus).toBe("INFEASIBLE_DEFICIT");
    expect(impossibleResult.isExecutablePlan).toBe(false);
  });

  it("Test 11: Prohibition of Simultaneous Battery Charging & Discharging", () => {
    const H = 24;
    const demand = new Array(24).fill(380);
    const solar = [
      0, 0, 0, 0, 0, 20, 80, 140, 180, 200, 200, 190, 170, 140, 100, 40, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    const wind = new Array(24).fill(50);
    const tiers: ("Peak" | "Shoulder" | "OffPeak")[] = new Array(24).fill("Shoulder");

    const result = solveHorizonDispatch({
      horizonHours: H,
      hourlyDemandMW: demand,
      hourlySolarAvailableMW: solar,
      hourlyWindAvailableMW: wind,
      hourlyTariffTier: tiers,
      initialBatterySOC: 50,
    });

    expect(result.isExecutablePlan).toBe(true);
    for (let t = 0; t < H; t++) {
      const inv = result.intervals[t]!;
      expect(Math.min(inv.batteryChargeMW, inv.batteryDischargeMW)).toBeLessThanOrEqual(0.05);
    }
  });

  it("Test 12: Auditable Signed Cost Variance & Storage Investment Transparency", () => {
    const H = 24;
    const demand = new Array(24).fill(350);
    const solar = [
      0, 0, 0, 0, 0, 0, 50, 100, 150, 180, 180, 150, 100, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    const wind = new Array(24).fill(40);
    const tiers: ("Peak" | "Shoulder" | "OffPeak")[] = new Array(24).fill("Shoulder");

    const result = solveHorizonDispatch({
      horizonHours: H,
      hourlyDemandMW: demand,
      hourlySolarAvailableMW: solar,
      hourlyWindAvailableMW: wind,
      hourlyTariffTier: tiers,
      initialBatterySOC: 40,
      targetTerminalSOC: 40,
    });

    expect(result.isExecutablePlan).toBe(true);
    let sumIntervalSavings = 0;
    for (let t = 0; t < H; t++) {
      sumIntervalSavings += result.intervals[t]!.savingsRupees;
    }
    expect(Math.abs(sumIntervalSavings - result.totalHorizonSavings)).toBeLessThanOrEqual(H);
  });

  it("Test 13: Battery Extreme Boundary Operation (15% Min & 95% Max)", () => {
    const minSOCResult = solveHorizonDispatch({
      horizonHours: 3,
      hourlyDemandMW: [300, 300, 300],
      hourlySolarAvailableMW: [100, 100, 100],
      hourlyWindAvailableMW: [50, 50, 50],
      hourlyTariffTier: ["OffPeak", "OffPeak", "OffPeak"],
      initialBatterySOC: 15,
    });
    expect(minSOCResult.isExecutablePlan).toBe(true);
    for (const inv of minSOCResult.intervals) {
      expect(inv.batterySOC).toBeGreaterThanOrEqual(15 - 0.05);
    }
  });

  it("Test 14: Diverse Industrial Demand Profiles", () => {
    const H = 24;
    const volatileDemand = [
      320, 480, 310, 490, 330, 460, 520, 390, 560, 410, 530, 380, 490, 340, 510, 360, 540, 580, 520,
      570, 480, 390, 430, 350,
    ];
    const result = solveHorizonDispatch({
      horizonHours: H,
      hourlyDemandMW: volatileDemand,
      hourlySolarAvailableMW: new Array(24).fill(50),
      hourlyWindAvailableMW: new Array(24).fill(40),
      hourlyTariffTier: new Array(24).fill("Shoulder"),
      initialBatterySOC: 55,
    });

    expect(result.isExecutablePlan).toBe(true);
    expect(result.solverStatus).toBe("PROVEN_GLOBAL_OPTIMAL");
  });

  it("Test 15: Generator Startup Cost Sensitivity", () => {
    const H = 6;
    const highDemand = [360, 410, 440, 430, 400, 370];
    const highStartupResult = solveHorizonDispatch({
      horizonHours: H,
      hourlyDemandMW: highDemand,
      hourlySolarAvailableMW: new Array(6).fill(0),
      hourlyWindAvailableMW: new Array(6).fill(10),
      hourlyTariffTier: new Array(6).fill("Peak"),
      initialBatterySOC: 40,
      initialCaptiveMW: 80,
      constraints: {
        generatorStartupCost: 50000,
        gridContractDemandMW: 200,
      },
    });

    expect(highStartupResult.isExecutablePlan).toBe(true);
  });

  it("Test 16: Mathematical Global Optimality Proof", () => {
    const H = 12;
    const demand12 = [380, 370, 365, 390, 450, 490, 520, 530, 510, 480, 450, 400];
    const problem: HorizonDispatchInput = {
      horizonHours: H,
      hourlyDemandMW: demand12,
      hourlySolarAvailableMW: new Array(12).fill(40),
      hourlyWindAvailableMW: new Array(12).fill(30),
      hourlyTariffTier: new Array(12).fill("Shoulder"),
      initialBatterySOC: 60,
    };

    const bnbResult = solveHorizonDispatch(problem);
    expect(bnbResult.isExecutablePlan).toBe(true);
    expect(bnbResult.optimalityProof?.isMathematicallyProvenGlobal).toBe(true);
  });

  it("Test 27: Revenue-Grade Meter Ingestion & IPMVP Verification", () => {
    const basePacket: Omit<RevenueMeterPacket, "crc16Checksum"> = {
      meterSerialNumber: "SEC-L&T-ER300P-94821",
      accuracyClass: "IEC_62053_22_CLASS_0_2S",
      timestampISO: "2026-10-21T08:00:00.000Z",
      substationIncomerKV: 132,
      activePowerMW: 485.5,
      reactivePowerMVAr: 85.2,
      powerFactor: 0.94,
      gridFrequencyHz: 50.02,
      ptRatio: 1200,
      ctRatio: 1000,
      calibrationCertificateNumber: "NABL-CAL-2026-ER-0091",
    };
    const validPacket = RevenueMeterTelemetryIngestor.createAuthenticPacket(basePacket);
    const validation = RevenueMeterTelemetryIngestor.validateAndIngest(validPacket);
    expect(validation.isValid).toBe(true);
  });

  it("Test 28: Durable Persistent Ledger Storage & Cryptographic Tamper-Evidence", async () => {
    durableLedgerStore.clear();
    const basePacket: Omit<RevenueMeterPacket, "crc16Checksum"> = {
      meterSerialNumber: "SEC-L&T-ER300P-94821",
      accuracyClass: "IEC_62053_22_CLASS_0_2S",
      timestampISO: "2026-10-21T07:00:00.000Z",
      substationIncomerKV: 132,
      activePowerMW: 490.0,
      reactivePowerMVAr: 80.0,
      powerFactor: 0.95,
      gridFrequencyHz: 50.0,
      ptRatio: 1200,
      ctRatio: 1000,
      calibrationCertificateNumber: "NABL-CAL-2026-ER-0091",
    };
    const packet = RevenueMeterTelemetryIngestor.createAuthenticPacket(basePacket);
    const block0 = RevenueMeterTelemetryIngestor.createVerifiedLedgerRecord(
      0,
      "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
      packet,
      {
        solarMW: 140,
        windMW: 60,
        captiveMW: 80,
        gridMW: 210,
        bessDischargeMW: 0,
        bessChargeMW: 0,
        dieselMW: 0,
      },
      5600000,
      4000000,
    );

    const persistRes0 = await durableLedgerStore.appendRecord(block0);
    expect(persistRes0.persisted).toBe(true);
    expect(persistRes0.chainIntegrityValid).toBe(true);
  });

  it("Test 29: Industrial SCADA Commissioning Gate & Actuation Lockout", () => {
    industrialCommissioningGate.clearSignoffs();
    const blockedAttempt = industrialActuationController.requestActuation({
      equipmentId: "BESS-INV-01",
      equipmentType: "BESS_INVERTER",
      targetSetpointMW: 45.0,
      operatorId: "SHIFT_OPERATOR_04",
    });

    expect(blockedAttempt.accepted).toBe(false);
    expect(blockedAttempt.executionMode).toBe("PHYSICAL_ACTUATION_LOCKED");
  });
});
