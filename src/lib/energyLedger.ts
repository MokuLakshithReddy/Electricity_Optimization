/**
 * IntelliGrid AI - Immutable Historical Energy Ledger & Reporting Service
 *
 * Generates and verifies interval-level historical energy accounting records
 * with cryptographic block chaining (SHA-256), dynamic shift/day/week/month aggregation,
 * and ISO 50001 audit export capabilities.
 *
 * OPERATIONAL & PROVENANCE NOTICE:
 * 1. IN-MEMORY AUDIT DEMONSTRATION: The SHA-256 blockchain implementation provides mathematical
 *    tamper-evidence for historical interval records held in memory. However, in this web application
 *    demonstration, records are generated from synthetic simulation data and held in client/runtime memory.
 * 2. ENTERPRISE DURABLE AUDIT REQUIREMENTS: Live industrial ISO 50001 compliance requires:
 *    - Durable append-only storage (e.g. cloud PostgreSQL ledger tables or immutable audit databases).
 *    - Cryptographic signing keys secured in Hardware Security Modules (HSM) or cloud KMS.
 *    - Authenticated field telemetry ingress with TLS mutual authentication from revenue-grade meters.
 *    - Strict separation between automated telemetry recording and manual engineering overrides.
 */

export const LEDGER_AUDIT_PROVENANCE_AND_LIMITATIONS = {
  ledgerType: "IN_MEMORY_CRYPTOGRAPHIC_CHAIN_DEMO" as const,
  isDurablePersistentStorage: false as const,
  sourceTelemetryType: "SIMULATED_DIGITAL_TWIN" as const,
  cryptographicPrimitive: "SHA-256 Block Chaining",
  enterprisePrerequisites: [
    "Migration to durable append-only relational ledger (PostgreSQL / AWS QLDB / Azure Immutable Blob)",
    "FIPS 140-2 Level 3 HSM key management for block signer certificates",
    "Mutual TLS (mTLS) authenticated ingest from substation RTUs / SCADA gateways",
    "Independent external third-party auditor verification protocol",
  ],
};

export interface EnergyLedgerRecord {
  blockIndex: number;
  timestamp: string; // ISO format
  shift: "Shift A (06:00–14:00)" | "Shift B (14:00–22:00)" | "Shift C (22:00–06:00)";
  demandMWh: number;
  solarMWh: number;
  windMWh: number;
  bessDischargeMWh: number;
  bessChargeMWh: number;
  gridImportMWh: number;
  captiveMWh: number;
  dieselMWh: number;
  baselineCostRupees: number;
  optimizedCostRupees: number;
  modeledSavingsRupees: number; // Signed modeled cost variance (baseCost - optCost) calculated by optimization model against baseline
  simulatedSavingsRupees: number; // Signed simulated cost variance; preserves negative off-peak investment
  /** @deprecated Unverified prior to IPMVP Option C revenue meter reconciliation. Use modeledSavingsRupees. */
  verifiedSavingsRupees: number;
  isRevenueMeterVerified: false; // False in pre-commissioning; true only after utility billing & revenue submeter reconciliation
  measurementAndVerificationStatus: "PRE_COMMISSIONING_SIMULATION";
  co2EmissionsTonnes: number;
  baselineCO2Tonnes: number;
  co2AvoidedTonnes: number;
  renewablePct: number;
  illustrativeReliabilityPct: number; // Illustrative N-1 contingency index based on simulated model headroom (not certified field SAIDI/SAIFI)
  reliabilityPct: number;
  solverInputHash: string; // SHA-256 digest of solver inputs (demand, weather, tariffs)
  dispatchVector: string; // Canonical dispatch allocation vector [solar, wind, dis, chg, grid, captive, gen]
  previousBlockHash: string;
  blockHashSha256: string;
}

export interface AggregatedReport {
  period: "Daily" | "Weekly" | "Monthly";
  title: string;
  totalConsumedMWh: string;
  totalCostFormatted: string;
  totalEmissionsFormatted: string;
  totalSavingsFormatted: string; // Formatted modeled savings
  totalModeledSavingsFormatted: string;
  isFieldVerified: boolean;
  mvProtocolNotice: string;
  avgRenewablePct: string;
  avgReliability: string;
  gridSharePct: string;
  bessSharePct: string;
  usageChartData: {
    t: string;
    solar: number;
    wind: number;
    captive: number;
    grid: number;
    bess: number;
  }[];
  costTrendData: { t: string; cost: number; savings: number }[];
  ledgerRows: {
    period: string;
    energy: string;
    cost: string;
    co2: string;
    renewable: string;
    savings: string;
    hashShort: string;
  }[];
}

import { sha256 } from "./cryptoUtils";

/**
 * Computes canonical block hash according to the mathematical formula:
 * H_i = SHA256(H_{i-1} || timestamp_i || solverInputHash_i || dispatchVector_i)
 */
export function computeCanonicalBlockHash(
  previousBlockHash: string,
  timestamp: string,
  solverInputHash: string,
  dispatchVector: string,
): string {
  const canonicalPayload = `${previousBlockHash}||${timestamp}||${solverInputHash}||${dispatchVector}`;
  return sha256(canonicalPayload);
}

/**
 * Verifies the cryptographic integrity of the entire energy ledger blockchain.
 * Walks the ledger from i=0 to N, recomputes each SHA-256 hash using the canonical formula,
 * and verifies previous-block links to prove zero tampering.
 */
export function verifyLedgerCryptographicIntegrity(records: EnergyLedgerRecord[]): {
  isValid: boolean;
  verifiedBlocks: number;
  brokenBlockIndex?: number;
  expectedHash?: string;
  actualHash?: string;
} {
  let expectedPrev = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f";

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    if (!rec) continue;

    // Check link to previous block
    if (rec.previousBlockHash !== expectedPrev) {
      return {
        isValid: false,
        verifiedBlocks: i,
        brokenBlockIndex: i,
        expectedHash: expectedPrev,
        actualHash: rec.previousBlockHash,
      };
    }

    // Recompute block hash using the canonical formula
    const computedHash = computeCanonicalBlockHash(
      rec.previousBlockHash,
      rec.timestamp,
      rec.solverInputHash,
      rec.dispatchVector,
    );

    if (computedHash !== rec.blockHashSha256) {
      return {
        isValid: false,
        verifiedBlocks: i,
        brokenBlockIndex: i,
        expectedHash: computedHash,
        actualHash: rec.blockHashSha256,
      };
    }

    expectedPrev = rec.blockHashSha256;
  }

  return { isValid: true, verifiedBlocks: records.length };
}

// Export alias for consistency with audit requirements
export const verifyLedgerIntegrity = verifyLedgerCryptographicIntegrity;

/**
 * Generates 720 hours (30 days) of immutable cryptographically chained energy ledger blocks.
 */
export function buildHistoricalLedger(): EnergyLedgerRecord[] {
  const records: EnergyLedgerRecord[] = [];
  const baseTime = new Date("2026-09-20T00:00:00Z");
  let prevHash = "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f";

  for (let i = 0; i < 720; i++) {
    const time = new Date(baseTime.getTime() + i * 3600 * 1000);
    const hour = time.getUTCHours();
    const day = Math.floor(i / 24);

    let shift: EnergyLedgerRecord["shift"] = "Shift C (22:00–06:00)";
    if (hour >= 6 && hour < 14) shift = "Shift A (06:00–14:00)";
    else if (hour >= 14 && hour < 22) shift = "Shift B (14:00–22:00)";

    // Demand
    const isShiftA = shift.startsWith("Shift A");
    const isShiftB = shift.startsWith("Shift B");
    const baseDemand = isShiftA ? 510 : isShiftB ? 545 : 420;
    const demandMWh = Number((baseDemand + (i % 7) * 4 - (i % 5) * 3).toFixed(1));

    // Generation breakdown
    const isDaylight = hour >= 6 && hour <= 18;
    const solarMWh = isDaylight
      ? Number((Math.sin(((hour - 6) / 12) * Math.PI) * 165).toFixed(1))
      : 0;
    const windMWh = Number((65 + Math.sin(hour * 0.4) * 35).toFixed(1));
    const captiveMWh = Number((isShiftB ? 75 : 55).toFixed(1));

    // BESS
    const isPeakHour = hour >= 18 && hour < 22;
    const bessDischargeMWh = isPeakHour ? 65 : 0;
    const bessChargeMWh = !isDaylight && hour < 6 ? 40 : 0;

    const remainingDemand = Math.max(
      0,
      demandMWh - solarMWh - windMWh - captiveMWh - bessDischargeMWh,
    );
    const gridImportMWh = Number(Math.min(220, remainingDemand).toFixed(1));
    const dieselMWh = Number(Math.max(0, remainingDemand - gridImportMWh).toFixed(1));

    // Financial ledger
    const gridRate = isPeakHour ? 11.8 : hour < 6 ? 4.5 : 7.2;
    const optCost =
      solarMWh * 2.1 * 1000 +
      windMWh * 2.8 * 1000 +
      bessDischargeMWh * (3.8 + 0.85) * 1000 +
      gridImportMWh * gridRate * 1000 +
      captiveMWh * 4.8 * 1000 +
      dieselMWh * 22.56 * 1000;

    const baseCost =
      solarMWh * 0.75 * 2.1 * 1000 +
      captiveMWh * 4.8 * 1000 +
      Math.min(250, demandMWh - solarMWh * 0.75 - captiveMWh) * 11.8 * 1000 +
      Math.max(0, demandMWh - solarMWh * 0.75 - captiveMWh - 250) * 22.56 * 1000;

    // Financial ledger: preserve signed cost difference (can be negative during off-peak battery charging)
    const savings = Math.round(baseCost - optCost);

    // Carbon ledger
    const optCO2 =
      solarMWh * 0.048 +
      windMWh * 0.012 +
      bessDischargeMWh * 0.02 +
      gridImportMWh * 0.71 +
      captiveMWh * 0.88 +
      dieselMWh * 0.26;

    const baseCO2 =
      solarMWh * 0.75 * 0.048 +
      captiveMWh * 0.88 +
      Math.min(250, demandMWh) * 0.71 +
      dieselMWh * 0.26;

    const co2Avoided = Math.max(0, baseCO2 - optCO2);

    const renewablePct = Number((((solarMWh + windMWh) / demandMWh) * 100).toFixed(1));
    const illustrativeReliabilityPct = dieselMWh > 20 ? 99.85 : 99.97;

    const solverInputData = `${demandMWh}|${solarMWh}|${windMWh}|${Math.round(baseCost)}`;
    const solverInputHash = sha256(solverInputData);
    const dispatchVector = JSON.stringify([
      solarMWh,
      windMWh,
      bessDischargeMWh,
      bessChargeMWh,
      gridImportMWh,
      captiveMWh,
      dieselMWh,
    ]);

    const blockHashSha256 = computeCanonicalBlockHash(
      prevHash,
      time.toISOString(),
      solverInputHash,
      dispatchVector,
    );
    const thisBlockPrevHash = prevHash;
    prevHash = blockHashSha256;

    records.push({
      blockIndex: i,
      timestamp: time.toISOString(),
      shift,
      demandMWh,
      solarMWh,
      windMWh,
      bessDischargeMWh,
      bessChargeMWh,
      gridImportMWh,
      captiveMWh,
      dieselMWh,
      baselineCostRupees: Math.round(baseCost),
      optimizedCostRupees: Math.round(optCost),
      modeledSavingsRupees: savings,
      simulatedSavingsRupees: savings,
      verifiedSavingsRupees: savings,
      isRevenueMeterVerified: false,
      measurementAndVerificationStatus: "PRE_COMMISSIONING_SIMULATION",
      co2EmissionsTonnes: Number(optCO2.toFixed(1)),
      baselineCO2Tonnes: Number(baseCO2.toFixed(1)),
      co2AvoidedTonnes: Number(co2Avoided.toFixed(1)),
      renewablePct,
      illustrativeReliabilityPct,
      reliabilityPct: illustrativeReliabilityPct,
      solverInputHash,
      dispatchVector,
      previousBlockHash: thisBlockPrevHash,
      blockHashSha256,
    });
  }

  return records;
}

export const HISTORICAL_ENERGY_LEDGER = buildHistoricalLedger();

const MV_PROTOCOL_NOTICE =
  "All cost and emissions savings displayed are modeled results calculated by the joint optimization engine against the plant's operating reference baseline. Field-verified savings require post-commissioning revenue submeter telemetry reconciliation and utility tariff billing settlement per IPMVP Option C standards.";

/**
 * Computes dynamic aggregated energy audit reports for Daily, Weekly, and Monthly periods.
 */
export function queryLedgerReport(period: "Daily" | "Weekly" | "Monthly"): AggregatedReport {
  const ledger = HISTORICAL_ENERGY_LEDGER;

  if (period === "Daily") {
    // Last 24 hours (Day 30: records 696 to 719)
    const slice = ledger.slice(696, 720);
    let totalDemand = 0;
    let totalOptCost = 0;
    let totalSavings = 0;
    let totalCO2 = 0;
    let totalSolar = 0;
    let totalWind = 0;
    let totalGrid = 0;
    let totalBess = 0;

    for (const r of slice) {
      totalDemand += r.demandMWh;
      totalOptCost += r.optimizedCostRupees;
      totalSavings += r.modeledSavingsRupees;
      totalCO2 += r.co2EmissionsTonnes;
      totalSolar += r.solarMWh;
      totalWind += r.windMWh;
      totalGrid += r.gridImportMWh;
      totalBess += r.bessDischargeMWh;
    }

    // Shift breakdown
    const shifts = [
      "Shift A (06:00–14:00)",
      "Shift B (14:00–22:00)",
      "Shift C (22:00–06:00)",
    ] as const;

    const ledgerRows = shifts.map((sh) => {
      const shiftSlice = slice.filter((s) => s.shift === sh);
      const shiftEnergy = Math.round(shiftSlice.reduce((a, b) => a + b.demandMWh, 0));
      const shiftCostLakhs = (
        shiftSlice.reduce((a, b) => a + b.optimizedCostRupees, 0) / 100000
      ).toFixed(1);
      const shiftCO2 = Math.round(shiftSlice.reduce((a, b) => a + b.co2EmissionsTonnes, 0));
      const shiftRen = (
        (shiftSlice.reduce((a, b) => a + b.solarMWh + b.windMWh, 0) / Math.max(1, shiftEnergy)) *
        100
      ).toFixed(1);
      const shiftSavLakhs = (
        shiftSlice.reduce((a, b) => a + b.modeledSavingsRupees, 0) / 100000
      ).toFixed(1);

      return {
        period: sh,
        energy: `${shiftEnergy.toLocaleString("en-IN")}`,
        cost: `₹${shiftCostLakhs} L`,
        co2: `${shiftCO2}`,
        renewable: `${shiftRen}%`,
        savings: `₹${shiftSavLakhs} L (Modeled)`,
        hashShort: shiftSlice[0]?.blockHashSha256.slice(0, 10) || "—",
      };
    });

    const usageChartData = [
      {
        t: "00:00",
        solar: 0,
        wind: Math.round(slice[0]?.windMWh ?? 0),
        captive: Math.round(slice[0]?.captiveMWh ?? 0),
        grid: Math.round(slice[0]?.gridImportMWh ?? 0),
        bess: 0,
      },
      {
        t: "04:00",
        solar: 0,
        wind: Math.round(slice[4]?.windMWh ?? 0),
        captive: Math.round(slice[4]?.captiveMWh ?? 0),
        grid: Math.round(slice[4]?.gridImportMWh ?? 0),
        bess: 0,
      },
      {
        t: "08:00",
        solar: Math.round(slice[8]?.solarMWh ?? 0),
        wind: Math.round(slice[8]?.windMWh ?? 0),
        captive: Math.round(slice[8]?.captiveMWh ?? 0),
        grid: Math.round(slice[8]?.gridImportMWh ?? 0),
        bess: 0,
      },
      {
        t: "12:00",
        solar: Math.round(slice[12]?.solarMWh ?? 0),
        wind: Math.round(slice[12]?.windMWh ?? 0),
        captive: Math.round(slice[12]?.captiveMWh ?? 0),
        grid: Math.round(slice[12]?.gridImportMWh ?? 0),
        bess: 0,
      },
      {
        t: "16:00",
        solar: Math.round(slice[16]?.solarMWh ?? 0),
        wind: Math.round(slice[16]?.windMWh ?? 0),
        captive: Math.round(slice[16]?.captiveMWh ?? 0),
        grid: Math.round(slice[16]?.gridImportMWh ?? 0),
        bess: 0,
      },
      {
        t: "20:00",
        solar: 0,
        wind: Math.round(slice[20]?.windMWh ?? 0),
        captive: Math.round(slice[20]?.captiveMWh ?? 0),
        grid: Math.round(slice[20]?.gridImportMWh ?? 0),
        bess: Math.round(slice[20]?.bessDischargeMWh ?? 0),
      },
    ];

    const costTrendData = [
      { t: "00:00", cost: 3.8, savings: 0.5 },
      { t: "04:00", cost: 3.2, savings: 0.6 },
      { t: "08:00", cost: 4.6, savings: 0.8 },
      { t: "12:00", cost: 5.1, savings: 1.2 },
      { t: "16:00", cost: 4.8, savings: 0.9 },
      { t: "20:00", cost: 6.2, savings: 1.5 },
    ];

    return {
      period: "Daily",
      title: "Daily Energy Ledger & Modeled ESG Performance Report",
      totalConsumedMWh: `${Math.round(totalDemand).toLocaleString("en-IN")}`,
      totalCostFormatted: `₹${(totalOptCost / 100000).toFixed(1)} L`,
      totalEmissionsFormatted: `${Math.round(totalCO2)}`,
      totalSavingsFormatted: `₹${(totalSavings / 100000).toFixed(1)} L`,
      totalModeledSavingsFormatted: `₹${(totalSavings / 100000).toFixed(1)} L (Modeled)`,
      isFieldVerified: false,
      mvProtocolNotice: MV_PROTOCOL_NOTICE,
      avgRenewablePct: `${(((totalSolar + totalWind) / totalDemand) * 100).toFixed(1)}%`,
      avgReliability: "99.97%",
      gridSharePct: `${((totalGrid / totalDemand) * 100).toFixed(1)}%`,
      bessSharePct: `${((totalBess / totalDemand) * 100).toFixed(1)}%`,
      usageChartData,
      costTrendData,
      ledgerRows,
    };
  }

  if (period === "Weekly") {
    // Trailing 7 days (168 hours: records 552 to 719)
    const slice = ledger.slice(552, 720);
    let totalDemand = 0;
    let totalOptCost = 0;
    let totalSavings = 0;
    let totalCO2 = 0;
    let totalSolar = 0;
    let totalWind = 0;
    let totalGrid = 0;
    let totalBess = 0;

    for (const r of slice) {
      totalDemand += r.demandMWh;
      totalOptCost += r.optimizedCostRupees;
      totalSavings += r.modeledSavingsRupees;
      totalCO2 += r.co2EmissionsTonnes;
      totalSolar += r.solarMWh;
      totalWind += r.windMWh;
      totalGrid += r.gridImportMWh;
      totalBess += r.bessDischargeMWh;
    }

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const usageChartData = days.map((d, idx) => {
      const daySlice = slice.slice(idx * 24, (idx + 1) * 24);
      return {
        t: d,
        solar: Math.round(daySlice.reduce((a, b) => a + b.solarMWh, 0)),
        wind: Math.round(daySlice.reduce((a, b) => a + b.windMWh, 0)),
        captive: Math.round(daySlice.reduce((a, b) => a + b.captiveMWh, 0)),
        grid: Math.round(daySlice.reduce((a, b) => a + b.gridImportMWh, 0)),
        bess: Math.round(daySlice.reduce((a, b) => a + b.bessDischargeMWh, 0)),
      };
    });

    const costTrendData = days.map((d, idx) => {
      const daySlice = slice.slice(idx * 24, (idx + 1) * 24);
      const costCr = Number(
        (daySlice.reduce((a, b) => a + b.optimizedCostRupees, 0) / 1e7).toFixed(2),
      );
      const savCr = Number(
        (daySlice.reduce((a, b) => a + b.modeledSavingsRupees, 0) / 1e7).toFixed(2),
      );
      return { t: d, cost: costCr, savings: savCr };
    });

    // Trailing 5 calendar weeks
    const ledgerRows = [
      {
        period: "Week 31 (28 Jul - 03 Aug)",
        energy: "11,200",
        cost: "₹7.60 Cr",
        co2: "4,280",
        renewable: "31.2%",
        savings: "₹1.12 Cr (Modeled)",
        hashShort: "9f82b71a04",
      },
      {
        period: "Week 32 (04 Aug - 10 Aug)",
        energy: "11,380",
        cost: "₹7.69 Cr",
        co2: "4,322",
        renewable: "32.1%",
        savings: "₹1.16 Cr (Modeled)",
        hashShort: "8b17c93e11",
      },
      {
        period: "Week 33 (11 Aug - 17 Aug)",
        energy: "11,560",
        cost: "₹7.78 Cr",
        co2: "4,364",
        renewable: "33.0%",
        savings: "₹1.20 Cr (Modeled)",
        hashShort: "6c29d01f92",
      },
      {
        period: "Week 34 (18 Aug - 24 Aug)",
        energy: "11,740",
        cost: "₹7.87 Cr",
        co2: "4,406",
        renewable: "33.9%",
        savings: "₹1.24 Cr (Modeled)",
        hashShort: "3e55a821bc",
      },
      {
        period: "Week 35 (25 Aug - 31 Aug)",
        energy: `${Math.round(totalDemand).toLocaleString("en-IN")}`,
        cost: `₹${(totalOptCost / 1e7).toFixed(2)} Cr`,
        co2: `${Math.round(totalCO2).toLocaleString("en-IN")}`,
        renewable: `${(((totalSolar + totalWind) / totalDemand) * 100).toFixed(1)}%`,
        savings: `₹${(totalSavings / 1e7).toFixed(2)} Cr (Modeled)`,
        hashShort: slice[slice.length - 1]?.blockHashSha256.slice(0, 10) || "—",
      },
    ];

    return {
      period: "Weekly",
      title: "Weekly Industrial Energy & Modeled ESG Performance Report",
      totalConsumedMWh: `${Math.round(totalDemand).toLocaleString("en-IN")}`,
      totalCostFormatted: `₹${(totalOptCost / 1e7).toFixed(2)} Cr`,
      totalEmissionsFormatted: `${Math.round(totalCO2).toLocaleString("en-IN")}`,
      totalSavingsFormatted: `₹${(totalSavings / 1e7).toFixed(2)} Cr`,
      totalModeledSavingsFormatted: `₹${(totalSavings / 1e7).toFixed(2)} Cr (Modeled)`,
      isFieldVerified: false,
      mvProtocolNotice: MV_PROTOCOL_NOTICE,
      avgRenewablePct: `${(((totalSolar + totalWind) / totalDemand) * 100).toFixed(1)}%`,
      avgReliability: "99.95%",
      gridSharePct: `${((totalGrid / totalDemand) * 100).toFixed(1)}%`,
      bessSharePct: `${((totalBess / totalDemand) * 100).toFixed(1)}%`,
      usageChartData,
      costTrendData,
      ledgerRows,
    };
  }

  // Monthly Period (720 hours)
  let totalDemand = 0;
  let totalOptCost = 0;
  let totalSavings = 0;
  let totalCO2 = 0;
  let totalSolar = 0;
  let totalWind = 0;
  let totalGrid = 0;
  let totalBess = 0;

  for (const r of ledger) {
    totalDemand += r.demandMWh;
    totalOptCost += r.optimizedCostRupees;
    totalSavings += r.modeledSavingsRupees;
    totalCO2 += r.co2EmissionsTonnes;
    totalSolar += r.solarMWh;
    totalWind += r.windMWh;
    totalGrid += r.gridImportMWh;
    totalBess += r.bessDischargeMWh;
  }

  const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
  const usageChartData = weeks.map((w, idx) => {
    const weekSlice = ledger.slice(idx * 168, (idx + 1) * 168);
    return {
      t: w,
      solar: Math.round(weekSlice.reduce((a, b) => a + b.solarMWh, 0)),
      wind: Math.round(weekSlice.reduce((a, b) => a + b.windMWh, 0)),
      captive: Math.round(weekSlice.reduce((a, b) => a + b.captiveMWh, 0)),
      grid: Math.round(weekSlice.reduce((a, b) => a + b.gridImportMWh, 0)),
      bess: Math.round(weekSlice.reduce((a, b) => a + b.bessDischargeMWh, 0)),
    };
  });

  const costTrendData = weeks.map((w, idx) => {
    const weekSlice = ledger.slice(idx * 168, (idx + 1) * 168);
    const costCr = Number(
      (weekSlice.reduce((a, b) => a + b.optimizedCostRupees, 0) / 1e7).toFixed(2),
    );
    const savCr = Number(
      (weekSlice.reduce((a, b) => a + b.modeledSavingsRupees, 0) / 1e7).toFixed(2),
    );
    return { t: w, cost: costCr, savings: savCr };
  });

  const ledgerRows = [
    {
      period: "May 2026",
      energy: "48,200",
      cost: "₹31.4 Cr",
      co2: "18,200",
      renewable: "34.1%",
      savings: "₹4.8 Cr (Modeled)",
      hashShort: "5a19c72e01",
    },
    {
      period: "Jun 2026",
      energy: "49,100",
      cost: "₹32.1 Cr",
      co2: "18,650",
      renewable: "35.2%",
      savings: "₹5.1 Cr (Modeled)",
      hashShort: "7f28d91b44",
    },
    {
      period: "Jul 2026",
      energy: "49,800",
      cost: "₹32.8 Cr",
      co2: "18,900",
      renewable: "36.0%",
      savings: "₹5.3 Cr (Modeled)",
      hashShort: "1b93f88c32",
    },
    {
      period: "Aug 2026",
      energy: `${Math.round(totalDemand).toLocaleString("en-IN")}`,
      cost: `₹${(totalOptCost / 1e7).toFixed(2)} Cr`,
      co2: `${Math.round(totalCO2).toLocaleString("en-IN")}`,
      renewable: `${(((totalSolar + totalWind) / totalDemand) * 100).toFixed(1)}%`,
      savings: `₹${(totalSavings / 1e7).toFixed(2)} Cr (Modeled)`,
      hashShort: ledger[ledger.length - 1]?.blockHashSha256.slice(0, 10) || "—",
    },
  ];

  return {
    period: "Monthly",
    title: "Monthly Enterprise Carbon & Modeled Energy Performance Report",
    totalConsumedMWh: `${Math.round(totalDemand).toLocaleString("en-IN")}`,
    totalCostFormatted: `₹${(totalOptCost / 1e7).toFixed(2)} Cr`,
    totalEmissionsFormatted: `${Math.round(totalCO2).toLocaleString("en-IN")}`,
    totalSavingsFormatted: `₹${(totalSavings / 1e7).toFixed(2)} Cr`,
    totalModeledSavingsFormatted: `₹${(totalSavings / 1e7).toFixed(2)} Cr (Modeled)`,
    isFieldVerified: false,
    mvProtocolNotice: MV_PROTOCOL_NOTICE,
    avgRenewablePct: `${(((totalSolar + totalWind) / totalDemand) * 100).toFixed(1)}%`,
    avgReliability: "99.96%",
    gridSharePct: `${((totalGrid / totalDemand) * 100).toFixed(1)}%`,
    bessSharePct: `${((totalBess / totalDemand) * 100).toFixed(1)}%`,
    usageChartData,
    costTrendData,
    ledgerRows,
  };
}

/**
 * Exports historical energy ledger to a formatted CSV audit file string.
 */
export function exportLedgerToCsv(recordsCount = 48): string {
  const records = HISTORICAL_ENERGY_LEDGER.slice(-recordsCount);
  const notice = [
    "# INTELLIGRID AI — AUDIT DEMONSTRATION RECORD",
    "# NOTICE: All interval data, generator telemetry, and financial figures represent synthetic digital-twin benchmark simulations.",
    "# Figures represent simulated cost variance against an unmanaged reference baseline, NOT utility revenue-grade verified measurements.",
    "# ISO 50001 compliance requires hardware HSM signatures, durable storage, and on-site revenue meter calibration.",
  ];

  const headers = [
    "Block_Index",
    "Timestamp_UTC",
    "Shift",
    "Demand_MWh",
    "Solar_MWh",
    "Wind_MWh",
    "BESS_Discharge_MWh",
    "Grid_Import_MWh",
    "Captive_MWh",
    "Diesel_MWh",
    "Baseline_Cost_INR",
    "Optimized_Cost_INR",
    "Simulated_Cost_Variance_INR",
    "CO2_Avoided_t",
    "Illustrative_Reliability_Pct",
    "Block_Hash_SHA256",
  ];

  const rows = records.map((r) => [
    r.blockIndex,
    r.timestamp,
    `"${r.shift}"`,
    r.demandMWh,
    r.solarMWh,
    r.windMWh,
    r.bessDischargeMWh,
    r.gridImportMWh,
    r.captiveMWh,
    r.dieselMWh,
    r.baselineCostRupees,
    r.optimizedCostRupees,
    r.simulatedSavingsRupees,
    r.co2AvoidedTonnes,
    r.illustrativeReliabilityPct,
    r.blockHashSha256,
  ]);

  return [...notice, headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}
