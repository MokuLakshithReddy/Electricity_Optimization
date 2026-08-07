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
};

export type PlantLocation = {
  id: string;
  name: string;
  location: string;
  demandMW: number;
  systemStatus: "System Stable" | "Peak Load Active" | "High Renewable";
};

export const plantLocations: PlantLocation[] = [
  {
    id: "ts-jamshedpur",
    name: "Tata Steel — Jamshedpur",
    location: "Jamshedpur, India",
    demandMW: 520,
    systemStatus: "System Stable",
  },
  {
    id: "ts-kalinganagar",
    name: "Tata Steel — Kalinganagar",
    location: "Kalinganagar, India",
    demandMW: 640,
    systemStatus: "High Renewable",
  },
  {
    id: "ts-meramandali",
    name: "Tata Steel — Meramandali",
    location: "Dhenkanal, India",
    demandMW: 480,
    systemStatus: "System Stable",
  },
];

export const currentEnergySources: EnergySourceItem[] = [
  {
    id: "solar",
    name: "Solar PV Park",
    key: "solar",
    mw: 145,
    pct: 28,
    status: "Optimal",
    co2Rate: 0,
    costRate: 2.1,
    tone: "amber",
    iconName: "Sun",
  },
  {
    id: "wind",
    name: "Wind Farm",
    key: "wind",
    mw: 104,
    pct: 20,
    status: "Optimal",
    co2Rate: 0,
    costRate: 2.6,
    tone: "cyan",
    iconName: "Wind",
  },
  {
    id: "battery",
    name: "Battery Storage (BESS)",
    key: "battery",
    mw: 62,
    pct: 12,
    status: "Discharging",
    co2Rate: 0,
    costRate: 3.2,
    tone: "green",
    iconName: "Zap",
  },
  {
    id: "grid",
    name: "132 kV Grid Import",
    key: "grid",
    mw: 156,
    pct: 30,
    status: "Available",
    co2Rate: 0.82,
    costRate: 8.1,
    tone: "blue",
    iconName: "Network",
  },
  {
    id: "captive",
    name: "Captive Thermal",
    key: "captive",
    mw: 43,
    pct: 8,
    status: "Active",
    co2Rate: 0.71,
    costRate: 5.4,
    tone: "purple",
    iconName: "Factory",
  },
  {
    id: "generator",
    name: "Diesel Gensets",
    key: "generator",
    mw: 10,
    pct: 2,
    status: "Standby",
    co2Rate: 2.6,
    costRate: 18.4,
    tone: "red",
    iconName: "ShieldAlert",
  },
];

export const kpiOverview = [
  {
    id: "cost-saved",
    title: "ENERGY COST SAVED",
    value: "₹12.4 L",
    numericValue: 1240000,
    change: "↑ 8.6% vs baseline",
    trend: "up",
    tone: "green",
    sparkline: [8, 9.2, 10.1, 10.8, 11.4, 11.9, 12.4],
  },
  {
    id: "co2-avoided",
    title: "CO₂ AVOIDED",
    value: "412 t",
    numericValue: 412,
    change: "↑ 12.4% vs baseline",
    trend: "up",
    tone: "green",
    sparkline: [310, 340, 365, 382, 395, 404, 412],
  },
  {
    id: "renewable-util",
    title: "RENEWABLE UTILIZATION",
    value: "48.2%",
    numericValue: 48.2,
    change: "↑ 9.8%",
    trend: "up",
    tone: "amber",
    sparkline: [38, 41, 40, 44, 46, 47.5, 48.2],
  },
  {
    id: "reliability",
    title: "POWER RELIABILITY",
    value: "99.97%",
    numericValue: 99.97,
    change: "Critical load protected",
    trend: "stable",
    tone: "purple",
    sparkline: [99.9, 99.92, 99.95, 99.95, 99.96, 99.97, 99.97],
  },
];
