import { useEffect, useState } from "react";
import {
  calculateSolarMW,
  calculateWindMW,
  fetchLiveWeatherData,
  LiveDataSourceMode,
  LiveWeatherData,
} from "./live-api";

export type SourceKey = "solar" | "wind" | "battery" | "grid" | "captive" | "diesel";

export type EnergySource = {
  key: SourceKey;
  name: string;
  mw: number;
  status: "Optimal" | "Standby" | "Charging" | "Available" | "Offline" | "Reserve";
  efficiency: number;
  co2: number;
  cost: number;
};

export type Snapshot = {
  demand: number;
  price: number;
  savingsToday: number;
  co2Today: number;
  renewablePct: number;
  batterySoc: number;
  batteryHealth: number;
  gridStatus: "Stable" | "Constrained";
  dieselStatus: "Standby" | "Running";
  systemHealth: number;
  sources: EnergySource[];
  updatedAt: number;
  isLive?: boolean;
  dataSource?: string;
  weather?: LiveWeatherData;
  error?: string;
};

// Deterministic PRNG so server-rendered and client-rendered values match.
let seed = 0x1f2e3d4c;
const next = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = (min: number, max: number) => min + next() * (max - min);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function makeSnapshot(prev?: Snapshot): Snapshot {
  const hour = new Date().getHours();

  const solarCurve = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
  const demand = clamp((prev?.demand ?? 480) + rnd(-18, 18), 300, 700);
  const solar = clamp(solarCurve * rnd(190, 250) + rnd(-8, 8), 0, 250);
  const wind = clamp((prev?.sources.find((s) => s.key === "wind")?.mw ?? 70) + rnd(-9, 9), 20, 150);
  const batterySoc = clamp((prev?.batterySoc ?? 72) + rnd(-1.4, 1.4), 10, 100);
  const battery = clamp(rnd(0, 60) * (batterySoc > 35 ? 1 : 0.2), 0, 70);
  const captive = clamp(rnd(90, 170), 60, 200);
  const remaining = demand - solar - wind - battery - captive;
  const grid = clamp(remaining > 0 ? remaining : 0, 0, 400);
  const diesel = remaining > 240 ? clamp(remaining - 240, 0, 60) : 0;
  const price = clamp((prev?.price ?? 7.4) + rnd(-0.35, 0.35), 4, 12);
  const renewablePct = clamp(((solar + wind) / demand) * 100, 0, 100);

  const sources: EnergySource[] = [
    {
      key: "solar",
      name: "Solar Park",
      mw: solar,
      status: solar > 5 ? "Optimal" : "Standby",
      efficiency: 92 + rnd(-3, 3),
      co2: 0,
      cost: 2.1,
    },
    {
      key: "wind",
      name: "Wind Farm",
      mw: wind,
      status: wind > 25 ? "Optimal" : "Standby",
      efficiency: 88 + rnd(-4, 4),
      co2: 0,
      cost: 2.6,
    },
    {
      key: "battery",
      name: "Battery Storage",
      mw: battery,
      status: solarCurve > 0.6 ? "Charging" : "Reserve",
      efficiency: 95 + rnd(-2, 2),
      co2: 0,
      cost: 3.2,
    },
    {
      key: "grid",
      name: "Grid Import",
      mw: grid,
      status: "Available",
      efficiency: 99,
      co2: grid * 0.00082,
      cost: price,
    },
    {
      key: "captive",
      name: "Captive Plant",
      mw: captive,
      status: "Available",
      efficiency: 79 + rnd(-3, 3),
      co2: captive * 0.00071,
      cost: 5.4,
    },
    {
      key: "diesel",
      name: "Diesel Genset",
      mw: diesel,
      status: diesel > 1 ? "Optimal" : "Standby",
      efficiency: 62 + rnd(-3, 3),
      co2: diesel * 0.0026,
      cost: 18.4,
    },
  ];

  return {
    demand,
    price,
    savingsToday: (prev?.savingsToday ?? 1840000) + rnd(200, 2600),
    co2Today: (prev?.co2Today ?? 412) + rnd(0.05, 0.4),
    renewablePct,
    batterySoc,
    batteryHealth: 96.4,
    gridStatus: price > 10.5 ? "Constrained" : "Stable",
    dieselStatus: diesel > 1 ? "Running" : "Standby",
    systemHealth: clamp(97 + rnd(-1.5, 1.5), 90, 100),
    sources,
    updatedAt: Date.now(),
    isLive: false,
    dataSource: "Mock Simulation",
  };
}

export function makeSnapshotWithLiveData(weather: LiveWeatherData, prev?: Snapshot): Snapshot {
  const solar = calculateSolarMW(weather.solarIrradiance, weather.cloudCover);
  const wind = calculateWindMW(weather.windSpeed100m);

  // Dynamic load modeling based on ambient temperature (HVAC load scaling)
  const baseDemand = 440 + Math.max(0, weather.temperature - 25) * 6;
  const demand = clamp((prev?.demand ?? baseDemand) + rnd(-5, 5), 320, 680);

  const batterySoc = clamp((prev?.batterySoc ?? 75) + rnd(-0.5, 0.5), 10, 100);
  const battery = clamp(solar > 120 ? 45 : 15, 0, 70);
  const captive = clamp(110 + rnd(-10, 10), 60, 180);

  const remaining = demand - solar - wind - battery - captive;
  const grid = clamp(remaining > 0 ? remaining : 0, 0, 400);
  const diesel = remaining > 220 ? clamp(remaining - 220, 0, 60) : 0;
  const price = clamp(7.2 + (grid > 150 ? 2.5 : 0) + rnd(-0.2, 0.2), 4, 12);
  const renewablePct = clamp(((solar + wind) / demand) * 100, 0, 100);

  const solarEfficiency = clamp(94 - Math.max(0, weather.temperature - 25) * 0.35, 75, 98);

  const sources: EnergySource[] = [
    {
      key: "solar",
      name: "Solar Park",
      mw: solar,
      status: solar > 5 ? "Optimal" : "Standby",
      efficiency: Number(solarEfficiency.toFixed(1)),
      co2: 0,
      cost: 2.1,
    },
    {
      key: "wind",
      name: "Wind Farm",
      mw: wind,
      status: wind > 10 ? "Optimal" : "Standby",
      efficiency: Number((89 + rnd(-2, 2)).toFixed(1)),
      co2: 0,
      cost: 2.6,
    },
    {
      key: "battery",
      name: "Battery Storage",
      mw: battery,
      status: solar > 100 ? "Charging" : "Reserve",
      efficiency: 95.5,
      co2: 0,
      cost: 3.2,
    },
    {
      key: "grid",
      name: "Grid Import",
      mw: grid,
      status: "Available",
      efficiency: 99.0,
      co2: Number((grid * 0.00082).toFixed(3)),
      cost: Number(price.toFixed(2)),
    },
    {
      key: "captive",
      name: "Captive Plant",
      mw: captive,
      status: "Available",
      efficiency: 81.2,
      co2: Number((captive * 0.00071).toFixed(3)),
      cost: 5.4,
    },
    {
      key: "diesel",
      name: "Diesel Genset",
      mw: diesel,
      status: diesel > 1 ? "Optimal" : "Standby",
      efficiency: 63.5,
      co2: Number((diesel * 0.0026).toFixed(3)),
      cost: 18.4,
    },
  ];

  return {
    demand: Number(demand.toFixed(1)),
    price: Number(price.toFixed(2)),
    savingsToday: Number(((prev?.savingsToday ?? 1840000) + rnd(150, 400)).toFixed(0)),
    co2Today: Number(((prev?.co2Today ?? 412) + rnd(0.01, 0.05)).toFixed(2)),
    renewablePct: Number(renewablePct.toFixed(1)),
    batterySoc: Number(batterySoc.toFixed(1)),
    batteryHealth: 96.4,
    gridStatus: price > 10.5 ? "Constrained" : "Stable",
    dieselStatus: diesel > 1 ? "Running" : "Standby",
    systemHealth: Number(clamp(97.5 + rnd(-0.5, 0.5), 92, 100).toFixed(1)),
    sources,
    updatedAt: Date.now(),
    isLive: true,
    dataSource: `Open-Meteo API (${weather.locationName})`,
    weather,
  };
}

export function useLiveEnergy(intervalMs = 5000, preferredMode?: LiveDataSourceMode) {
  const [snap, setSnap] = useState<Snapshot>(() => makeSnapshot());

  useEffect(() => {
    let isMounted = true;

    async function updateEnergyData() {
      const mode =
        preferredMode ||
        (localStorage.getItem("intelligrid_data_mode") as LiveDataSourceMode) ||
        "open-meteo";

      if (mode === "mock") {
        if (isMounted) setSnap((prev) => makeSnapshot(prev));
        return;
      }

      try {
        const liveWeather = await fetchLiveWeatherData();
        if (isMounted) {
          setSnap((prev) => makeSnapshotWithLiveData(liveWeather, prev));
        }
      } catch (err) {
        console.warn("Live API fetch failed, falling back to simulation snapshot:", err);
        if (isMounted) {
          setSnap((prev) => {
            const fallback = makeSnapshot(prev);
            fallback.error = err instanceof Error ? err.message : "Live data offline";
            return fallback;
          });
        }
      }
    }

    // Immediate initial fetch
    updateEnergyData();

    // Live periodic refresh
    const id = setInterval(updateEnergyData, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [intervalMs, preferredMode]);

  return snap;
}

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: n > 1000 ? 0 : 2 });

export function demandSeries(points: number, stepLabel: (i: number) => string, base = 480) {
  let v = base;
  return Array.from({ length: points }, (_, i) => {
    v = clamp(v + rnd(-25, 26) + Math.sin(i / 3) * 12, 300, 700);
    return {
      t: stepLabel(i),
      actual: i < points * 0.55 ? Math.round(v) : null,
      predicted: Math.round(v + rnd(-12, 12)),
      upper: Math.round(v + 34),
      lower: Math.round(v - 34),
    };
  });
}

export function renewableSeries() {
  return Array.from({ length: 24 }, (_, h) => {
    const curve = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI));
    return {
      t: `${String(h).padStart(2, "0")}:00`,
      solar: Math.round(curve * rnd(200, 245)),
      wind: Math.round(40 + Math.abs(Math.cos(h / 3)) * rnd(40, 105)),
      cloud: Math.round(clamp(35 + Math.sin(h / 2) * 30 + rnd(-10, 10), 0, 100)),
    };
  });
}

export const recommendations = [
  {
    title: "Charge battery before 2:00 PM",
    reason: "Solar surplus of 62 MW forecast between 11:40 and 13:50 at ₹2.10/kWh marginal cost.",
    savings: 412000,
    carbon: 18.4,
    confidence: 94,
    tone: "eco" as const,
  },
  {
    title: "Avoid grid import 6 PM – 9 PM",
    reason: "Evening ToD tariff peaks at ₹11.80/kWh. Shift 140 MW to captive + battery discharge.",
    savings: 1260000,
    carbon: 41.2,
    confidence: 91,
    tone: "primary" as const,
  },
  {
    title: "Wind generation expected after sunset",
    reason: "Coastal gradient builds to 8.4 m/s at 19:20; expect +55 MW for 4 hours.",
    savings: 305000,
    carbon: 22.7,
    confidence: 86,
    tone: "cyan" as const,
  },
  {
    title: "Rain expected in 45 minutes",
    reason: "Solar output likely to drop 38%. Pre-emptively ramp captive unit 3 to 84 MW.",
    savings: 96000,
    carbon: 4.1,
    confidence: 78,
    tone: "warn" as const,
  },
  {
    title: "Hold battery reserve at 40%",
    reason:
      "Grid frequency excursions detected on feeder B; reserve protects rolling mill continuity.",
    savings: 0,
    carbon: 0,
    confidence: 97,
    tone: "primary" as const,
  },
];

export type Alert = {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info";
  time: string;
};

export const alerts: Alert[] = [
  {
    id: "a1",
    title: "Battery bank 2 temperature rising",
    detail: "Cell block 2C at 47°C — cooling loop throttled to 80%.",
    severity: "warning",
    time: "2 min ago",
  },
  {
    id: "a2",
    title: "Wind turbine WT-07 offline",
    detail: "Pitch controller fault. Estimated restoration 3h 20m.",
    severity: "critical",
    time: "14 min ago",
  },
  {
    id: "a3",
    title: "Solar string 14 underperforming",
    detail: "Output 26% below array average — soiling suspected.",
    severity: "warning",
    time: "38 min ago",
  },
  {
    id: "a4",
    title: "Generator DG-3 maintenance due",
    detail: "1,480 running hours reached. Schedule service window.",
    severity: "info",
    time: "1 h ago",
  },
  {
    id: "a5",
    title: "Grid feeder A voltage dip",
    detail: "Dip to 0.92 pu for 240 ms. Ride-through successful.",
    severity: "info",
    time: "2 h ago",
  },
];
