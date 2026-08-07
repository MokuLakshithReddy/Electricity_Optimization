export interface ForecastPoint {
  t: string; // Time label
  timestamp: string;
  actual?: number | null; // MW
  predicted: number; // MW
  upper: number; // MW (upper confidence bound)
  lower: number; // MW (lower confidence bound)
  bandRange: [number, number]; // [lower, upper] for Recharts Area
  solar?: number;
  wind?: number;
  rampRate?: number;
}

export type ForecastHorizonId = "15m" | "1h" | "6h" | "24h";

export interface ForecastSummary {
  predictedPeak: number;
  peakTime: string;
  confidenceBand: number; // ± MW
  rampRisk: "Low" | "Moderate" | "High";
  maxRampRate: number; // MW/hr
  peakRampWindow: string;
  rampReason: string;
  aiRecommendation: string;
  expectedSaving: string;
}

export type HourlyForecastPoint = {
  time: string;
  demand: number; // MW
  solar: number; // MW
  wind: number; // MW
  grid: number; // MW
  battery: number; // MW
  price: number; // ₹/kWh
  carbonIntensity: number; // gCO2/kWh
  isOptimalWindow?: boolean;
};

export const forecast24h: HourlyForecastPoint[] = [
  { time: "12 AM", demand: 380, solar: 0, wind: 95, grid: 240, battery: 45, price: 4.8, carbonIntensity: 420 },
  { time: "3 AM", demand: 360, solar: 0, wind: 110, grid: 205, battery: 45, price: 4.5, carbonIntensity: 390 },
  { time: "6 AM", demand: 420, solar: 25, wind: 80, grid: 265, battery: 50, price: 5.8, carbonIntensity: 460 },
  { time: "9 AM", demand: 510, solar: 140, wind: 65, grid: 255, battery: 50, price: 7.2, carbonIntensity: 430 },
  { time: "12 PM", demand: 560, solar: 210, wind: 55, grid: 220, battery: 75, price: 6.5, carbonIntensity: 320 },
  { time: "3 PM", demand: 540, solar: 175, wind: 60, grid: 225, battery: 80, price: 6.8, carbonIntensity: 350 },
  { time: "6 PM", demand: 580, solar: 40, wind: 85, grid: 375, battery: 80, price: 11.8, carbonIntensity: 580, isOptimalWindow: true },
  { time: "8 PM", demand: 560, solar: 0, wind: 95, grid: 385, battery: 80, price: 11.5, carbonIntensity: 560, isOptimalWindow: true },
  { time: "9 PM", demand: 500, solar: 0, wind: 105, grid: 325, battery: 70, price: 9.2, carbonIntensity: 490 },
  { time: "12 AM", demand: 410, solar: 0, wind: 100, grid: 260, battery: 50, price: 5.2, carbonIntensity: 410 },
];

export const weeklyForecast = [
  { day: "Mon", avgDemand: 510, renewablePct: 46, cost: 42.5 },
  { day: "Tue", avgDemand: 524, renewablePct: 48, cost: 41.2 },
  { day: "Wed", avgDemand: 518, renewablePct: 51, cost: 39.8 },
  { day: "Thu", avgDemand: 530, renewablePct: 45, cost: 43.1 },
  { day: "Fri", avgDemand: 520, renewablePct: 48.2, cost: 40.6 },
  { day: "Sat", avgDemand: 460, renewablePct: 56, cost: 32.4 },
  { day: "Sun", avgDemand: 440, renewablePct: 62, cost: 28.9 },
];

export function generateForecast(
  horizon: ForecastHorizonId,
  energyState: {
    totalDemandMW: number;
    solarMW: number;
    windMW: number;
    batteryMW: number;
    gridMW: number;
    activeScenario?: string;
  }
): { points: ForecastPoint[]; summary: ForecastSummary } {
  const baseDemand = energyState.totalDemandMW || 520;
  const solarFactor = energyState.solarMW / 145; // 0 to 1
  const windFactor = energyState.windMW / 104;

  let pointsCount = 13;
  let points: ForecastPoint[] = [];

  const now = new Date();
  const baseHour = now.getHours();

  if (horizon === "15m") {
    pointsCount = 16;
    for (let i = 0; i < pointsCount; i++) {
      const isPast = i < 4;
      const minutes = i;
      const t = `+${minutes}m`;
      const wave = Math.sin(i * 0.3) * 8 + Math.cos(i * 0.2) * 5;
      const noise = (i % 3 === 0 ? 3 : -2);
      const actualVal = isPast ? Math.round(baseDemand - 12 + i * 2.5 + noise) : null;
      const predictedVal = Math.round(baseDemand - 5 + i * 1.8 + wave);
      const uncertainty = Math.round(14 + i * 0.8);

      points.push({
        t,
        timestamp: `${t}`,
        actual: actualVal,
        predicted: predictedVal,
        upper: predictedVal + uncertainty,
        lower: predictedVal - uncertainty,
        bandRange: [predictedVal - uncertainty, predictedVal + uncertainty],
      });
    }
  } else if (horizon === "1h") {
    pointsCount = 13;
    for (let i = 0; i < pointsCount; i++) {
      const isPast = i < 3;
      const mins = i * 5;
      const t = mins === 0 ? "Now" : `+${mins}m`;
      const wave = Math.sin(i * 0.4) * 16;
      const actualVal = isPast ? Math.round(baseDemand - 18 + i * 6) : null;
      const predictedVal = Math.round(baseDemand - 10 + i * 3.5 + wave);
      const uncertainty = Math.round(18 + i * 1.2);

      points.push({
        t,
        timestamp: t,
        actual: actualVal,
        predicted: predictedVal,
        upper: predictedVal + uncertainty,
        lower: predictedVal - uncertainty,
        bandRange: [predictedVal - uncertainty, predictedVal + uncertainty],
      });
    }
  } else if (horizon === "6h") {
    pointsCount = 13; // Every 30 mins for 6h
    const labels = [
      "Now",
      "+30m",
      "+1h",
      "+1.5h",
      "+2h",
      "+2.5h",
      "+3h",
      "+3.5h",
      "+4h",
      "+4.5h",
      "+5h",
      "+5.5h",
      "+6h",
    ];

    for (let i = 0; i < labels.length; i++) {
      const isPast = i < 3; // First 3 points are actual historical
      const t = labels[i];
      
      // Industrial load curve modeling
      let loadDelta = 0;
      if (i >= 3 && i <= 7) loadDelta = (i - 2) * 12; // Ramp up towards peak
      else if (i > 7) loadDelta = 60 - (i - 7) * 6; // Slight drop after peak

      // Solar drop impact
      if (solarFactor < 0.6 && i > 4) {
        loadDelta += 24; // Extra thermal/grid ramp when solar drops
      }

      const actualVal = isPast ? Math.round(baseDemand - 15 + i * 8) : null;
      const predictedVal = Math.round(baseDemand + loadDelta);
      const uncertainty = Math.round(28 + i * 1.5);

      points.push({
        t,
        timestamp: t,
        actual: actualVal,
        predicted: predictedVal,
        upper: predictedVal + uncertainty,
        lower: predictedVal - uncertainty,
        bandRange: [predictedVal - uncertainty, predictedVal + uncertainty],
      });
    }
  } else {
    // 24h Horizon
    const hours = [
      "12 AM",
      "3 AM",
      "6 AM",
      "9 AM",
      "12 PM",
      "3 PM",
      "6 PM",
      "8 PM",
      "9 PM",
      "12 AM",
    ];
    const baseCurve = [380, 360, 420, 510, 560, 540, 580, 562, 500, 410];
    
    // Scale curve according to current base demand ratio
    const scaleRatio = baseDemand / 520;

    for (let i = 0; i < hours.length; i++) {
      const isPast = i <= 3;
      const rawDemand = Math.round(baseCurve[i] * scaleRatio);
      const actualVal = isPast ? rawDemand : null;
      const predictedVal = rawDemand;
      const uncertainty = Math.round(32 + Math.sin(i) * 10);

      points.push({
        t: hours[i],
        timestamp: hours[i],
        actual: actualVal,
        predicted: predictedVal,
        upper: predictedVal + uncertainty,
        lower: predictedVal - uncertainty,
        bandRange: [predictedVal - uncertainty, predictedVal + uncertainty],
      });
    }
  }

  // Calculate Summary KPIs
  const predictedPeak = Math.max(...points.map((p) => p.predicted));
  const peakPoint = points.find((p) => p.predicted === predictedPeak) || points[points.length - 1];
  const peakTime = peakPoint.t === "Now" ? "Current" : peakPoint.t;

  // Calculate Average Confidence Band (± MW)
  const avgUncertainty = Math.round(
    points.reduce((acc, p) => acc + (p.upper - p.predicted), 0) / points.length
  );

  // Calculate Ramp Rate (MW/hr)
  let maxRamp = 0;
  for (let i = 1; i < points.length; i++) {
    const diff = Math.abs(points[i].predicted - points[i - 1].predicted);
    if (diff > maxRamp) maxRamp = diff;
  }
  const scaledMaxRamp = Math.round(maxRamp * (horizon === "15m" ? 4 : horizon === "1h" ? 2 : 1.2));

  let rampRisk: "Low" | "Moderate" | "High" = "Moderate";
  if (scaledMaxRamp < 20) rampRisk = "Low";
  else if (scaledMaxRamp > 45) rampRisk = "High";

  const summary: ForecastSummary = {
    predictedPeak,
    peakTime: peakTime.startsWith("+") ? `in ${peakTime.slice(1)}` : peakTime,
    confidenceBand: avgUncertainty,
    rampRisk,
    maxRampRate: scaledMaxRamp,
    peakRampWindow: "7:30 PM – 8:30 PM",
    rampReason:
      solarFactor < 0.6
        ? "Sudden solar generation drop combined with scheduled rolling mill startup."
        : "Peak evening production ramp coinciding with ToD high-tariff grid window.",
    aiRecommendation:
      "Pre-position 60 MWh battery capacity before peak window to avoid grid peak tariffs.",
    expectedSaving: `₹${(Math.round(baseDemand * 0.08 * 10) / 10).toFixed(1)}K`,
  };

  return { points, summary };
}
