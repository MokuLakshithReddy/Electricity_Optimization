// Enterprise intelligence layer: explainable AI, confidence, timeline,
// carbon accounting, strategy scenarios and ROI modelling.

export type Factor = {
  label: string;
  weight: number; // 0..100 contribution to the decision
  detail: string;
};

export type SmartRecommendation = {
  id: string;
  time: string; // HH:MM of the 24h plan
  title: string;
  action: string;
  category: "Cost" | "Carbon" | "Reliability" | "Asset";
  confidence: number;
  savings: number;
  carbon: number;
  risk: "Low" | "Medium" | "High";
  model: string;
  dataPoints: number;
  why: string;
  factors: Factor[];
  counterfactual: string;
  tone: "eco" | "cyan" | "primary" | "warn";
};

export const smartRecommendations: SmartRecommendation[] = [
  {
    id: "r1",
    time: "09:20",
    title: "Charge battery bank to 85%",
    action: "Absorb 62 MW of solar surplus into BESS-1 and BESS-2",
    category: "Cost",
    confidence: 93, // Calibrated from ToD spread certainty and measured 90.25% round-trip efficiency
    savings: 412000,
    carbon: 18.4,
    risk: "Low",
    model: "DispatchOptimizer v4.2 (MILP + Conformal ARX forecast)",
    dataPoints: 18420,
    why: "Marginal solar energy is priced at ₹2.10/kWh right now, while the forecast discharge value in the 18:00–21:00 ToD block is ₹11.80/kWh — a 5.6× arbitrage spread that clears round-trip losses by a wide margin.",
    factors: [
      {
        label: "ToD tariff spread",
        weight: 46,
        detail: "₹9.70/kWh delta between charge and discharge windows",
      },
      {
        label: "Solar surplus forecast",
        weight: 28,
        detail: "62 MW above internal load for 2h10m (93% calibrated confidence)",
      },
      {
        label: "Battery SoC headroom",
        weight: 16,
        detail: "Current 72% → 85% target, 118 MWh usable",
      },
      { label: "Round-trip efficiency", weight: 10, detail: "90.25% measured over last 30 cycles" },
    ],
    counterfactual:
      "If the battery is left idle, 62 MW of PV is curtailed and the evening peak is served from grid import — ₹4.1 lakh higher cost and 18.4 tCO₂ more.",
    tone: "eco",
  },
  {
    id: "r2",
    time: "11:45",
    title: "Pre-ramp captive unit 3 to 84 MW",
    action: "Raise captive output ahead of forecast cloud cover",
    category: "Reliability",
    confidence: 78,
    savings: 96000,
    carbon: -4.1,
    risk: "Medium",
    model: "WeatherImpact v2.8 (satellite nowcast)",
    dataPoints: 9260,
    why: "A convective cell is tracking toward the solar park with 45-minute lead time. PV output is expected to fall 38%, and captive unit 3 needs 22 minutes to ramp — starting now avoids a diesel start.",
    factors: [
      { label: "Cloud nowcast", weight: 44, detail: "Cell at 18 km, 24 km/h bearing 214°" },
      { label: "Ramp-rate constraint", weight: 31, detail: "Captive unit 3 ramps at 2.8 MW/min" },
      {
        label: "Diesel avoidance value",
        weight: 25,
        detail: "₹18.40/kWh avoided if the gap is bridged",
      },
    ],
    counterfactual:
      "Without the pre-ramp, two gensets start at T+40 min, costing ₹96k and adding 4.1 tCO₂.",
    tone: "warn",
  },
  {
    id: "r3",
    time: "14:10",
    title: "Defer pickling line by 90 minutes",
    action: "Shift 34 MW of flexible load out of the shoulder tariff",
    category: "Cost",
    confidence: 88,
    savings: 230000,
    carbon: 6.2,
    risk: "Low",
    model: "LoadFlex v3.1 (constraint solver)",
    dataPoints: 5140,
    why: "The pickling line has 4 hours of slack against downstream scheduling, and moving it into the 16:00 low-tariff pocket avoids the shoulder rate without touching the hot strip mill sequence.",
    factors: [
      {
        label: "Schedule slack",
        weight: 40,
        detail: "4h buffer before the galvanising queue is affected",
      },
      { label: "Tariff pocket", weight: 38, detail: "₹6.80/kWh vs ₹9.60/kWh shoulder rate" },
      {
        label: "Thermal continuity",
        weight: 22,
        detail: "Bath temperature holds within spec for 110 min",
      },
    ],
    counterfactual: "Running on schedule costs ₹2.3 lakh more and offers no throughput benefit.",
    tone: "cyan",
  },
  {
    id: "r4",
    time: "16:30",
    title: "Hold battery reserve at 40%",
    action: "Cap discharge depth to protect ride-through capability",
    category: "Reliability",
    confidence: 97,
    savings: 0,
    carbon: 0,
    risk: "Low",
    model: "GridRisk v1.9 (PMU anomaly detection)",
    dataPoints: 26100,
    why: "Feeder B has logged three frequency excursions below 49.6 Hz in the last six hours. A 40% reserve gives 26 minutes of islanded operation, enough to protect the rolling mill from an unplanned trip.",
    factors: [
      {
        label: "Grid frequency instability",
        weight: 52,
        detail: "3 excursions < 49.6 Hz in 6h on feeder B",
      },
      {
        label: "Critical load exposure",
        weight: 33,
        detail: "Rolling mill restart cost ≈ ₹1.4 crore",
      },
      {
        label: "Forecast arbitrage loss",
        weight: 15,
        detail: "₹0.9 lakh of foregone discharge value",
      },
    ],
    counterfactual:
      "Deep-cycling for arbitrage gains ₹0.9 lakh but exposes ₹1.4 crore of restart risk.",
    tone: "primary",
  },
  {
    id: "r5",
    time: "18:40",
    title: "Discharge 60 MW, block grid import",
    action: "Serve the evening peak from BESS + captive",
    category: "Cost",
    confidence: 91,
    savings: 1260000,
    carbon: 41.2,
    risk: "Low",
    model: "DispatchOptimizer v4.2 (MILP + LSTM forecast)",
    dataPoints: 18420,
    why: "The 18:00–21:00 ToD block prices grid energy at ₹11.80/kWh. Battery energy banked at ₹2.10/kWh plus captive at ₹5.40/kWh serves the same 140 MW block at less than half the landed cost.",
    factors: [
      { label: "Peak tariff exposure", weight: 49, detail: "140 MW × 3h at ₹11.80/kWh" },
      { label: "Stored energy available", weight: 29, detail: "118 MWh banked at ₹2.10/kWh" },
      { label: "Captive headroom", weight: 22, detail: "38 MW spare at ₹5.40/kWh" },
    ],
    counterfactual:
      "Importing through the peak adds ₹12.6 lakh and 41.2 tCO₂ for identical output.",
    tone: "eco",
  },
  {
    id: "r6",
    time: "21:15",
    title: "Absorb post-sunset wind ramp",
    action: "Recharge BESS with 55 MW of surplus wind",
    category: "Carbon",
    confidence: 86,
    savings: 305000,
    carbon: 22.7,
    risk: "Low",
    model: "RenewableForecast v5.0 (ensemble NWP)",
    dataPoints: 14780,
    why: "The coastal pressure gradient builds to 8.4 m/s after sunset. Night demand cannot absorb the full ramp, so unstored wind would be curtailed at zero value.",
    factors: [
      {
        label: "Wind ramp forecast",
        weight: 45,
        detail: "+55 MW for ~4 hours, 86% ensemble agreement",
      },
      { label: "Night load deficit", weight: 33, detail: "Demand 310 MW vs 365 MW available" },
      { label: "Curtailment penalty", weight: 22, detail: "Unstored surplus earns ₹0/kWh" },
    ],
    counterfactual:
      "Curtailing the ramp wastes 220 MWh of zero-carbon energy and 22.7 tCO₂ of avoidance.",
    tone: "cyan",
  },
  {
    id: "r7",
    time: "02:30",
    title: "Schedule DG-3 service window",
    action: "Take genset 3 offline for 1,500-hour maintenance",
    category: "Asset",
    confidence: 83,
    savings: 148000,
    carbon: 1.2,
    risk: "Low",
    model: "AssetHealth v3.4 (vibration + oil analytics)",
    dataPoints: 7320,
    why: "DG-3 is at 1,480 running hours with rising bearing vibration (4.1 mm/s RMS). Overnight demand is the day's lowest, so the unit's reserve duty can be covered by BESS without cost impact.",
    factors: [
      { label: "Runtime threshold", weight: 38, detail: "1,480 / 1,500 hours" },
      { label: "Vibration trend", weight: 34, detail: "2.6 → 4.1 mm/s RMS over 3 weeks" },
      { label: "Low-demand window", weight: 28, detail: "Night load 310 MW, full reserve intact" },
    ],
    counterfactual:
      "Deferring to daytime risks an unplanned failure valued at ₹1.48 lakh of emergency dispatch.",
    tone: "primary",
  },
  {
    id: "r8",
    time: "05:50",
    title: "Pre-cool compressor house",
    action: "Run auxiliaries during the off-peak ₹4.90/kWh window",
    category: "Cost",
    confidence: 90,
    savings: 74000,
    carbon: 2.8,
    risk: "Low",
    model: "LoadFlex v3.1 (constraint solver)",
    dataPoints: 5140,
    why: "Thermal inertia in the compressor house holds setpoint for 3.5 hours, so cooling energy bought at the night rate displaces morning shoulder-tariff consumption one-for-one.",
    factors: [
      { label: "Off-peak price gap", weight: 47, detail: "₹4.90 vs ₹8.10/kWh at 09:00" },
      { label: "Thermal inertia", weight: 35, detail: "3.5h setpoint hold measured" },
      { label: "Equipment duty cycle", weight: 18, detail: "Within compressor start limits" },
    ],
    counterfactual: "Cooling on demand at 09:00 costs ₹74k more for the same comfort envelope.",
    tone: "eco",
  },
];

export const carbon = {
  today: 412.6,
  todayBaseline: 498.9,
  monthly: 11840,
  monthlyBaseline: 14260,
  savedToday: 86.4,
  savedMonth: 2420,
  renewablePct: 46.8,
  esgScore: 82,
  esgGrade: "A−",
  intensity: 0.412, // tCO2 per MWh
  intensityBaseline: 0.498,
  trees: 112400,
  scope: [
    { name: "Scope 1 — Captive & diesel", value: 268 },
    { name: "Scope 2 — Grid import", value: 131 },
    { name: "Scope 3 — Logistics", value: 13.6 },
  ],
  monthlySeries: Array.from({ length: 12 }, (_, i) => ({
    t: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i],
    emitted: Math.round(1320 - i * 34 + Math.sin(i) * 48),
    avoided: Math.round(140 + i * 22 + Math.cos(i) * 30),
  })),
  esgPillars: [
    { name: "Emissions intensity", score: 86 },
    { name: "Renewable share", score: 78 },
    { name: "Energy efficiency", score: 84 },
    { name: "Reporting quality", score: 91 },
    { name: "Asset stewardship", score: 74 },
  ],
};

export type Strategy = {
  key: "current" | "cost" | "carbon" | "balanced";
  name: string;
  summary: string;
  cost: number; // ₹ crore / year
  co2: number; // ktCO2 / year
  renewable: number; // %
  reliability: number; // %
  savings: number; // ₹ / year vs current
  confidence: number;
  tone: "muted" | "eco" | "cyan" | "primary";
  rationale: string;
};

export const strategies: Strategy[] = [
  {
    key: "current",
    name: "Current Strategy",
    summary: "Rule-based dispatch with manual peak management",
    cost: 1284,
    co2: 512,
    renewable: 38,
    reliability: 97.8,
    savings: 0,
    confidence: 100,
    tone: "muted",
    rationale:
      "Baseline: operators dispatch on static merit order and react to tariff blocks manually.",
  },
  {
    key: "cost",
    name: "Cost-Optimized",
    summary: "Minimise landed ₹/kWh within reliability limits",
    cost: 1108,
    co2: 486,
    renewable: 41,
    reliability: 98.4,
    savings: 176000000,
    confidence: 92,
    tone: "cyan",
    rationale:
      "Aggressive battery arbitrage and load shifting; accepts more captive running when it is cheaper than grid.",
  },
  {
    key: "carbon",
    name: "Carbon-Optimized",
    summary: "Minimise tCO₂ with a cost ceiling",
    cost: 1196,
    co2: 388,
    renewable: 61,
    reliability: 98.1,
    savings: 88000000,
    confidence: 89,
    tone: "eco",
    rationale:
      "Maximises renewable absorption and curtails diesel entirely; slightly higher cost from storage cycling.",
  },
  {
    key: "balanced",
    name: "Balanced",
    summary: "Pareto-optimal blend of cost, carbon and reliability",
    cost: 1142,
    co2: 412,
    renewable: 54,
    reliability: 99.2,
    savings: 142000000,
    confidence: 95,
    tone: "primary",
    rationale:
      "Recommended. Captures 81% of the cost benefit and 71% of the carbon benefit with the highest availability.",
  },
];

export type RoiInput = { solarMw: number; batteryMwh: number; windMw: number };

export function computeRoi({ solarMw, batteryMwh, windMw }: RoiInput) {
  const capex = solarMw * 3.6e6 + batteryMwh * 1.9e6 + windMw * 6.2e6;
  const annualSavings = solarMw * 6.6e5 + batteryMwh * 3.2e5 + windMw * 1.05e6;
  const opex = capex * 0.014;
  const net = Math.max(annualSavings - opex, 0);
  const payback = net > 0 ? capex / net : 0;
  const carbonPerYear = solarMw * 1.42 + batteryMwh * 0.42 + windMw * 2.1;
  const npv = net * 8.51 - capex; // 25y horizon, 11% discount ≈ annuity factor
  const irr = capex > 0 ? (net / capex) * 100 * 1.32 : 0;
  const lifetimeKwh = (solarMw * 1750 + windMw * 2900 + batteryMwh * 320) * 1000 * 25;
  const lcoe = capex > 0 ? capex / Math.max(1, lifetimeKwh) : 0;
  const series = Array.from({ length: 16 }, (_, y) => ({
    t: `Y${y}`,
    cash: Math.round((net * y - capex) / 1e7) / 10, // ₹ crore
  }));
  return { capex, annualSavings: net, payback, carbonPerYear, npv, irr, lcoe, series };
}

export const confidenceLabel = (c: number) =>
  c >= 90 ? "Very high" : c >= 80 ? "High" : c >= 65 ? "Moderate" : "Exploratory";
