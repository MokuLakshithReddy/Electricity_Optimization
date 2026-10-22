import { z } from "zod";

export type LiveWeatherData = {
  temperature: number; // °C
  windSpeed: number; // m/s at 10m
  windSpeed100m: number; // m/s at 100m (hub height)
  solarIrradiance: number; // W/m² (direct + diffuse shortwave radiation)
  directNormalIrradiance: number; // W/m²
  cloudCover: number; // %
  relativeHumidity: number; // %
  surfacePressure: number; // hPa
  latitude: number;
  longitude: number;
  locationName: string;
  fetchedAt: number;
  clockTimeKolkata: string;
  hourlyForecast?: {
    time: string[];
    solarMW: number[];
    windMW: number[];
  };
};

export type LiveDataSourceMode = "open-meteo" | "custom-api" | "mock";

const DEFAULT_LAT = 26.9124; // Jaipur / Rajasthan Solar & Wind Corridor
const DEFAULT_LON = 75.7873;
const DEFAULT_LOCATION_NAME = "Jaipur Industrial Corridor, IN";

// Admin-configured allowlist for SSRF prevention
const ALLOWED_HOSTS = new Set([
  "api.open-meteo.com",
  "open-meteo.com",
  "api.intelligrid.internal",
]);

// Private/Link-local IP patterns to block
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /localhost/i,
];

export function isUrlAllowedForIngest(urlStr: string): { isAllowed: boolean; reason?: string } {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "https:") {
      return { isAllowed: false, reason: "Only HTTPS endpoints are permitted for external API ingest." };
    }

    const hostname = parsed.hostname.toLowerCase();
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return { isAllowed: false, reason: `Private/local host '${hostname}' is strictly blocked for SSRF protection.` };
      }
    }

    if (!ALLOWED_HOSTS.has(hostname)) {
      return { isAllowed: false, reason: `Hostname '${hostname}' is not in the admin allowlist [${Array.from(ALLOWED_HOSTS).join(", ")}].` };
    }

    return { isAllowed: true };
  } catch {
    return { isAllowed: false, reason: "Malformed URL string." };
  }
}

const openMeteoResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().optional(),
  current: z
    .object({
      temperature_2m: z.number().optional(),
      relative_humidity_2m: z.number().optional(),
      surface_pressure: z.number().optional(),
      wind_speed_10m: z.number().optional(),
      wind_speed_100m: z.number().optional(),
      shortwave_radiation_instant: z.number().optional(),
      direct_normal_irradiance: z.number().optional(),
      cloud_cover: z.number().optional(),
    })
    .optional(),
  hourly: z
    .object({
      time: z.array(z.union([z.string(), z.number()])),
      shortwave_radiation: z.array(z.number()).optional(),
      wind_speed_100m: z.array(z.number()).optional(),
    })
    .optional(),
});

// Server-side / in-memory 5-minute cache
let cachedWeatherData: { data: LiveWeatherData; expiresAt: number } | null = null;

export function getKolkataTimeFormatted(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

/**
 * Fetch real-time weather and 24-hour solar/wind forecast from Open-Meteo API.
 */
export async function fetchLiveWeatherData(
  lat = DEFAULT_LAT,
  lon = DEFAULT_LON,
): Promise<LiveWeatherData> {
  if (cachedWeatherData && Date.now() < cachedWeatherData.expiresAt) {
    return cachedWeatherData.data;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_speed_100m,shortwave_radiation_instant,direct_normal_irradiance,cloud_cover&hourly=shortwave_radiation,wind_speed_100m&timeformat=unixtime&timezone=Asia%2FKolkata`;

  const allowCheck = isUrlAllowedForIngest(url);
  if (!allowCheck.isAllowed) {
    throw new Error(`SSRF Prevention Triggered: ${allowCheck.reason}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Open-Meteo API returned status ${res.status}`);
    }

    const rawJson = await res.json();
    const validated = openMeteoResponseSchema.parse(rawJson);
    const current = validated.current || {};

    const hourlySolarMW: number[] = [];
    const hourlyWindMW: number[] = [];
    const hourlyTimes: string[] = [];

    if (validated.hourly?.shortwave_radiation && validated.hourly?.wind_speed_100m) {
      const times = validated.hourly.time;
      const rads = validated.hourly.shortwave_radiation;
      const winds = validated.hourly.wind_speed_100m;

      for (let i = 0; i < Math.min(24, times.length); i++) {
        const rad = rads[i] ?? 0;
        const w = winds[i] ?? 6.5;
        hourlySolarMW.push(calculateSolarMW(rad, 15));
        hourlyWindMW.push(calculateWindMW(w));
        hourlyTimes.push(String(times[i] ?? i));
      }
    }

    const liveData: LiveWeatherData = {
      temperature: current.temperature_2m ?? 32,
      windSpeed: current.wind_speed_10m ?? 6.5,
      windSpeed100m: current.wind_speed_100m ?? 8.2,
      solarIrradiance: current.shortwave_radiation_instant ?? 0,
      directNormalIrradiance: current.direct_normal_irradiance ?? 0,
      cloudCover: current.cloud_cover ?? 15,
      relativeHumidity: current.relative_humidity_2m ?? 45,
      surfacePressure: current.surface_pressure ?? 1008,
      latitude: lat,
      longitude: lon,
      locationName: DEFAULT_LOCATION_NAME,
      fetchedAt: Date.now(),
      clockTimeKolkata: getKolkataTimeFormatted(),
      hourlyForecast: {
        time: hourlyTimes,
        solarMW: hourlySolarMW,
        windMW: hourlyWindMW,
      },
    };

    cachedWeatherData = { data: liveData, expiresAt: Date.now() + 300000 };
    return liveData;
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("External API request timed out after 5000ms.");
    }
    throw err;
  }
}

export function calculateSolarMW(irradianceWm2: number, cloudCoverPct: number): number {
  const baseMw = (irradianceWm2 / 1000) * 250;
  const cloudFactor = 1 - (cloudCoverPct / 100) * 0.25;
  const mw = Math.max(0, baseMw * cloudFactor);
  return Math.min(250, Number(mw.toFixed(1)));
}

export function calculateWindMW(windSpeedMs: number): number {
  const peakCapacityMw = 150;
  const cutInSpeed = 3;
  const ratedSpeed = 12;
  const cutOutSpeed = 25;

  if (windSpeedMs < cutInSpeed || windSpeedMs > cutOutSpeed) {
    return 5.0;
  }
  if (windSpeedMs >= ratedSpeed) {
    return peakCapacityMw;
  }
  const fraction = Math.pow((windSpeedMs - cutInSpeed) / (ratedSpeed - cutInSpeed), 3);
  const mw = Math.max(10, fraction * peakCapacityMw);
  return Math.min(peakCapacityMw, Number(mw.toFixed(1)));
}

/**
 * Safely fetch custom REST API endpoint with SSRF allowlist protection and 5s timeout.
 */
export async function fetchCustomApiData(endpointUrl: string): Promise<Partial<LiveWeatherData>> {
  const allowCheck = isUrlAllowedForIngest(endpointUrl);
  if (!allowCheck.isAllowed) {
    throw new Error(`SSRF Prevention Triggered: ${allowCheck.reason}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(endpointUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Custom API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return openMeteoResponseSchema.partial().parse(data) as Partial<LiveWeatherData>;
  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Custom API request timed out after 5000ms.");
    }
    throw err;
  }
}
