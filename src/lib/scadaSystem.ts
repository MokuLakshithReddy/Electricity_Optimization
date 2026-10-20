/**
 * IntelliGrid AI - Industrial SCADA, Metering & Equipment Control System
 * 
 * Provides real-time industrial telemetry, submetering registers (Modbus/OPC-UA),
 * HT-2 multi-part industrial tariff schedules, asset interlocks,
 * closed-loop dispatch command validation, alarm manager, and fail-safe watchdog fallback.
 */

export interface SubmeterRegister {
  meterId: string;
  name: string;
  location: string;
  activePowerMW: number;
  reactivePowerMVAR: number;
  apparentPowerMVA: number;
  voltageKV: number;
  frequencyHz: number;
  powerFactor: number; // 0..1 lag
  thdCurrentPct: number; // %
  lastReadingTimestamp: string;
  status: "NORMAL" | "WARNING" | "COMM_LOST";
}

export interface BessTelemetry {
  packVoltageV: number;
  dcCurrentA: number;
  socPct: number;
  sohPct: number;
  maxCellTempC: number;
  minCellTempC: number;
  inverterMode: "GRID_FOLLOWING" | "GRID_FORMING" | "STANDBY" | "PROTECTIVE_LOCKOUT";
  activePowerMW: number;
  cRate: number;
  cycleCount: number;
  thermalStatus: "OPTIMAL" | "THROTTLED" | "OVERTEMP";
}

export interface GeneratorTelemetry {
  unitId: string;
  unitName: string;
  status: "OFFLINE" | "HOT_STANDBY" | "RUNNING" | "STARTING";
  activePowerMW: number;
  ratedCapacityMW: number;
  minOperatingLoadMW: number;
  rampRateMWPerMin: number;
  fuelConsumptionLitresPerHour: number;
  fuelTankLevelPct: number;
  engineRpm: number;
  lubeOilPressureBar: number;
  coolantTempC: number;
  runningHours: number;
}

export interface ScadaAlarm {
  id: string;
  timestamp: string;
  asset: string;
  severity: "INFO" | "WARNING" | "CRITICAL_TRIP";
  code: string;
  message: string;
  isAcknowledged: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operatorId: string;
  action: string;
  targetAsset: string;
  oldSetpoint?: string | number;
  newSetpoint: string | number;
  validationStatus: "PASSED_INTERLOCKS" | "OVERRIDDEN" | "REJECTED";
  hashSha256: string;
}

export interface DispatchCommand {
  commandId: string;
  timestamp: string;
  solarSetpointMW: number;
  windSetpointMW: number;
  batterySetpointMW: number;
  gridImportSetpointMW: number;
  captiveSetpointMW: number;
  generatorSetpointMW: number;
  authorizedBy: string;
}

/**
 * Live Submetering Registers across the steel complex.
 */
export const SUBMETERS: SubmeterRegister[] = [
  {
    meterId: "MTR-INC-132KV",
    name: "Main Grid Incomer Feeder #1",
    location: "Switchyard Bay 4",
    activePowerMW: 156.2,
    reactivePowerMVAR: 28.4,
    apparentPowerMVA: 158.7,
    voltageKV: 132.4,
    frequencyHz: 49.98,
    powerFactor: 0.98,
    thdCurrentPct: 1.8,
    lastReadingTimestamp: new Date().toISOString(),
    status: "NORMAL",
  },
  {
    meterId: "MTR-SMS-EAF",
    name: "Steel Melting Shop & Arc Furnace",
    location: "SMS-1 Substation",
    activePowerMW: 142.0,
    reactivePowerMVAR: 36.2,
    apparentPowerMVA: 146.5,
    voltageKV: 33.1,
    frequencyHz: 49.98,
    powerFactor: 0.96,
    thdCurrentPct: 3.2,
    lastReadingTimestamp: new Date().toISOString(),
    status: "NORMAL",
  },
  {
    meterId: "MTR-HSM-ROD",
    name: "Hot Strip Mill & Rod Rolling",
    location: "Mill Complex Substation #2",
    activePowerMW: 184.5,
    reactivePowerMVAR: 44.0,
    apparentPowerMVA: 189.6,
    voltageKV: 33.0,
    frequencyHz: 49.98,
    powerFactor: 0.97,
    thdCurrentPct: 2.4,
    lastReadingTimestamp: new Date().toISOString(),
    status: "NORMAL",
  },
  {
    meterId: "MTR-CRM-TIN",
    name: "Cold Rolling Mill & Galvanizing",
    location: "CRM Substation #3",
    activePowerMW: 94.8,
    reactivePowerMVAR: 19.5,
    apparentPowerMVA: 96.7,
    voltageKV: 33.2,
    frequencyHz: 49.98,
    powerFactor: 0.98,
    thdCurrentPct: 1.9,
    lastReadingTimestamp: new Date().toISOString(),
    status: "NORMAL",
  },
  {
    meterId: "MTR-UTL-CHILL",
    name: "Central Chiller Plant & Compressors",
    location: "Utilities Substation",
    activePowerMW: 68.4,
    reactivePowerMVAR: 14.2,
    apparentPowerMVA: 69.8,
    voltageKV: 11.0,
    frequencyHz: 49.98,
    powerFactor: 0.98,
    thdCurrentPct: 1.5,
    lastReadingTimestamp: new Date().toISOString(),
    status: "NORMAL",
  },
];

/**
 * BESS Battery Bank SCADA Telemetry
 */
export const BESS_STATUS: BessTelemetry = {
  packVoltageV: 784.2,
  dcCurrentA: 790.5,
  socPct: 72.4,
  sohPct: 96.8,
  maxCellTempC: 28.4,
  minCellTempC: 26.8,
  inverterMode: "GRID_FOLLOWING",
  activePowerMW: 62.0,
  cRate: 0.31,
  cycleCount: 842,
  thermalStatus: "OPTIMAL",
};

/**
 * Diesel Generator Fleet Status
 */
export const GENERATOR_FLEET: GeneratorTelemetry[] = [
  {
    unitId: "DG-01",
    unitName: "Caterpillar 3516B High-Speed Genset #1",
    status: "HOT_STANDBY",
    activePowerMW: 0,
    ratedCapacityMW: 30,
    minOperatingLoadMW: 6,
    rampRateMWPerMin: 4.5,
    fuelConsumptionLitresPerHour: 0,
    fuelTankLevelPct: 86.4,
    engineRpm: 1500,
    lubeOilPressureBar: 4.8,
    coolantTempC: 68.2,
    runningHours: 1240,
  },
  {
    unitId: "DG-02",
    unitName: "Caterpillar 3516B High-Speed Genset #2",
    status: "RUNNING",
    activePowerMW: 10,
    ratedCapacityMW: 30,
    minOperatingLoadMW: 6,
    rampRateMWPerMin: 4.5,
    fuelConsumptionLitresPerHour: 2400,
    fuelTankLevelPct: 82.1,
    engineRpm: 1500,
    lubeOilPressureBar: 5.1,
    coolantTempC: 84.5,
    runningHours: 1680,
  },
  {
    unitId: "DG-03",
    unitName: "Wärtsilä 20V32 Heavy Medium-Speed #3",
    status: "COLD_STANDBY",
    activePowerMW: 0,
    ratedCapacityMW: 30,
    minOperatingLoadMW: 8,
    rampRateMWPerMin: 3.0,
    fuelConsumptionLitresPerHour: 0,
    fuelTankLevelPct: 94.0,
    engineRpm: 0,
    lubeOilPressureBar: 0,
    coolantTempC: 32.0,
    runningHours: 420,
  },
];

/**
 * Active Industrial SCADA Alarms
 */
export const ACTIVE_ALARMS: ScadaAlarm[] = [
  {
    id: "ALM-8041",
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    asset: "BESS-1 PCS",
    severity: "INFO",
    code: "INF_SOC_ARBITRAGE",
    message: "BESS scheduled for 60 MW discharge during 18:00 Peak ToD window.",
    isAcknowledged: true,
  },
  {
    id: "ALM-8042",
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    asset: "Feeder 132kV",
    severity: "WARNING",
    code: "WRN_GRID_RESERVE_TIGHT",
    message: "Grid import within 15 MW of 250 MW contract demand ceiling.",
    isAcknowledged: true,
  },
];

/**
 * Immutable Audit Log of Dispatch Actions
 */
export const AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "AUD-10029",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    operatorId: "USR-KULKARNI",
    action: "DISPATCH_SETPOINT_UPDATE",
    targetAsset: "BESS-1 Inverter",
    oldSetpoint: "40 MW",
    newSetpoint: "62 MW",
    validationStatus: "PASSED_INTERLOCKS",
    hashSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  {
    id: "AUD-10030",
    timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    operatorId: "SYS-AUTONOMOUS-DISPATCH",
    action: "SOLAR_RAMP_REBALANCE",
    targetAsset: "Grid Incomer",
    oldSetpoint: "145 MW",
    newSetpoint: "156 MW",
    validationStatus: "PASSED_INTERLOCKS",
    hashSha256: "7d1b5e28a9b23412a874f6e1491795b28a9c1482b498f3b8912c47a98f1234bc",
  },
];

/**
 * Validates approved dispatch plans against physical and safety interlocks.
 */
export function validateDispatchPlan(plan: DispatchCommand): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Interlock 1: Battery power limits
  if (plan.batterySetpointMW > 90) {
    violations.push("Battery discharge setpoint exceeds maximum inverter rating (90 MW).");
  }
  if (plan.batterySetpointMW < -80) {
    violations.push("Battery charge rate exceeds maximum C-rate charging limit (80 MW).");
  }

  // Interlock 2: Grid contract ceiling & reverse power
  if (plan.gridImportSetpointMW > 250) {
    violations.push("Grid import setpoint breaches 250 MW contract demand ceiling.");
  }
  if (plan.gridImportSetpointMW < 0) {
    violations.push("Reverse power protection interlock active: Grid backfeeding prohibited under HT-2 tariff.");
  }

  // Interlock 3: Generator minimum stable load
  if (plan.generatorSetpointMW > 0 && plan.generatorSetpointMW < 12) {
    violations.push("Generator setpoint is below 12 MW technical minimum stable load.");
  }

  // Interlock 4: Captive thermal minimum
  if (plan.captiveSetpointMW < 30) {
    violations.push("Captive thermal generator cannot operate below 30 MW minimum throttle.");
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Simulates real-time dispatch execution to PLCs / SCADA gateway.
 */
export function executeApprovedDispatch(plan: DispatchCommand): {
  success: boolean;
  auditEntry: AuditLogEntry;
  error?: string;
} {
  const validation = validateDispatchPlan(plan);
  if (!validation.isValid) {
    return {
      success: false,
      auditEntry: {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operatorId: plan.authorizedBy,
        action: "DISPATCH_SETPOINT_REJECTED",
        targetAsset: "Multi-Asset Gateway",
        newSetpoint: "REJECTED",
        validationStatus: "REJECTED",
        hashSha256: "0000000000000000000000000000000000000000000000000000000000000000",
      },
      error: validation.violations.join("; "),
    };
  }

  const auditEntry: AuditLogEntry = {
    id: `AUD-${Date.now()}`,
    timestamp: new Date().toISOString(),
    operatorId: plan.authorizedBy,
    action: "DISPATCH_EXECUTED_TO_PLCS",
    targetAsset: "Industrial SCADA Gateway",
    newSetpoint: `BESS:${plan.batterySetpointMW}MW|Grid:${plan.gridImportSetpointMW}MW|Cap:${plan.captiveSetpointMW}MW`,
    validationStatus: "PASSED_INTERLOCKS",
    hashSha256: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
  };

  AUDIT_LOG.unshift(auditEntry);
  return { success: true, auditEntry };
}

/**
 * Watchdog Heartbeat & Autonomous Safe Fallback Monitor
 */
export class ScadaWatchdogMonitor {
  private lastHeartbeatMs: number = Date.now();
  private isSafeIslandMode: boolean = false;

  public pingHeartbeat(): void {
    this.lastHeartbeatMs = Date.now();
    this.isSafeIslandMode = false;
  }

  public checkHealth(): { isHealthy: boolean; mode: "NORMAL_SYNC" | "SAFE_FALLBACK_ISLAND" } {
    const elapsedSec = (Date.now() - this.lastHeartbeatMs) / 1000;
    if (elapsedSec > 10) {
      this.isSafeIslandMode = true;
      return { isHealthy: false, mode: "SAFE_FALLBACK_ISLAND" };
    }
    return { isHealthy: true, mode: "NORMAL_SYNC" };
  }
}

export const scadaWatchdog = new ScadaWatchdogMonitor();
