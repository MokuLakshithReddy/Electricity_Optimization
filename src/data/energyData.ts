/**
 * IntelliGrid AI - Industrial Energy Telemetry Dataset
 * 
 * DATA PROVENANCE NOTICE:
 * All plant locations, power dispatch values (MW), costs, and savings in this module
 * are synthetic digital twin benchmarks generated for pre-commissioning software development.
 * They are NOT live physical plant measurements or certified financial savings.
 */

export const DATA_PROVENANCE_DECLARATION = {
  type: "SYNTHETIC_SIMULATION_BENCHMARK" as const,
  isMeasuredPlantData: false,
  isCertifiedSavings: false,
  sourceDescription: "Digital Twin Simulation Sandbox · Pre-Commissioning Model",
  disclaimer:
    "DATA PROVENANCE NOTICE: All power readings (MW), tariffs, emissions, and savings figures in this dataset are generated from synthetic steel plant simulation benchmarks. They are NOT live physical plant telemetry or verified financial savings.",
} as const;

export type EnergySourceItem = {
  id: string;
  name: string;
  key: "solar" | "wind" | "battery" | "grid" | "captive" | "generator";
  mw: number;
  pct: number;
  status: "Optimal" | "Charging" | "Discharging" | "Available" | "Standby" | "Active";
  co2Rate: number; // tCO2/MWh
  costRate: number; // ₹/kWh
  tone: "green" | "cyan" | "amber" | "purple" | "blue" | "red";
  iconName: string;
  dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK";
};

export type PlantLocation = {
  id: string;
  name: string;
  location: string;
  demandMW: number;
  systemStatus: "System Stable" | "Peak Load Active" | "High Renewable";
  dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK";
};

export const plantLocations: PlantLocation[] = [
  {
    id: "ts-jamshedpur",
    name: "Tata Steel — Jamshedpur (Simulated Model)",
    location: "Jamshedpur, India (Digital Twin Sandbox)",
    demandMW: 520,
    systemStatus: "System Stable",
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
  },
  {
    id: "ts-kalinganagar",
    name: "Tata Steel — Kalinganagar (Simulated Model)",
    location: "Kalinganagar, India (Digital Twin Sandbox)",
    demandMW: 640,
    systemStatus: "High Renewable",
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
  },
  {
    id: "ts-meramandali",
    name: "Tata Steel — Meramandali (Simulated Model)",
    location: "Dhenkanal, India (Digital Twin Sandbox)",
    demandMW: 480,
    systemStatus: "System Stable",
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
  },
];

export const currentEnergySources: EnergySourceItem[] = [
  {
    id: "solar",
    name: "Solar PV Park (Simulated)",
    key: "solar",
    mw: 145,
    pct: 28,
    status: "Optimal",
    co2Rate: 0,
    costRate: 2.1,
    tone: "amber",
    iconName: "Sun",
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
  },
  {
    id: "wind",
    name: "Wind Farm (Simulated)",
    key: "wind",
    mw: 104,
    pct: 20,
    status: "Optimal",
    co2Rate: 0,
    costRate: 2.6,
    tone: "cyan",
    iconName: "Wind",
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
  },
  {
    id: "battery",
    name: "Battery Storage (BESS Simulated)",
    key: "battery",
    mw: 62,
    pct: 12,
    status: "Discharging",
    co2Rate: 0,
    costRate: 3.2,
    tone: "green",
    iconName: "Zap",
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
  },
  {
    id: "grid",
    name: "132 kV Grid Import (Simulated)",
    key: "grid",
    mw: 156,
    pct: 30,
    status: "Available",
    co2Rate: 0.82,
    costRate: 8.1,
    tone: "blue",
    iconName: "Network",
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
  },
  {
    id: "captive",
    name: "Captive Thermal (Simulated)",
    key: "captive",
    mw: 43,
    pct: 8,
    status: "Active",
    co2Rate: 0.71,
    costRate: 5.4,
    tone: "purple",
    iconName: "Factory",
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
  },
  {
    id: "generator",
    name: "Diesel Gensets (Simulated)",
    key: "generator",
    mw: 10,
    pct: 2,
    status: "Standby",
    co2Rate: 2.6,
    costRate: 18.4,
    tone: "red",
    iconName: "ShieldAlert",
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
  },
];

export const kpiOverview = [
  {
    id: "cost-saved",
    title: "SIMULATED COST SAVED",
    value: "₹12.4 L",
    numericValue: 1240000,
    change: "↑ 8.6% vs baseline",
    trend: "up",
    tone: "green",
    sparkline: [8, 9.2, 10.1, 10.8, 11.4, 11.9, 12.4],
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
    isSimulated: true,
  },
  {
    id: "co2-avoided",
    title: "SIMULATED CO₂ AVOIDED",
    value: "412 t",
    numericValue: 412,
    change: "↑ 12.4% vs baseline",
    trend: "up",
    tone: "green",
    sparkline: [310, 340, 365, 382, 395, 404, 412],
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
    isSimulated: true,
  },
  {
    id: "renewable-util",
    title: "SIMULATED RENEWABLE SHARE",
    value: "48.2%",
    numericValue: 48.2,
    change: "↑ 9.8%",
    trend: "up",
    tone: "amber",
    sparkline: [38, 41, 40, 44, 46, 47.5, 48.2],
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
    isSimulated: true,
  },
  {
    id: "reliability",
    title: "SIMULATED RELIABILITY",
    value: "99.97%",
    numericValue: 99.97,
    change: "Digital twin protected",
    trend: "stable",
    tone: "purple",
    sparkline: [99.9, 99.92, 99.95, 99.95, 99.96, 99.97, 99.97],
    dataProvenance: "SYNTHETIC_SIMULATION_BENCHMARK",
    isSimulated: true,
  },
];
