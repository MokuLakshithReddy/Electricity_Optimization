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
};

export type LiveDataSourceMode = "open-meteo" | "custom-api" | "mock";

const DEFAULT_LAT = 26.9124; // Jaipur / Rajasthan Solar & Wind Corridor
const DEFAULT_LON = 75.7873;
const DEFAULT_LOCATION_NAME = "Bhadla Grid Zone, IN";

/**
 * Fetch real-time weather and solar/wind irradiance data from Open-Meteo API.
 * Open-Meteo provides real-time atmospheric & irradiance data with no API key requirement.
 */
export async function fetchLiveWeatherData(
  lat = DEFAULT_LAT,
  lon = DEFAULT_LON,
): Promise<LiveWeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_speed_100m,shortwave_radiation_instant,direct_normal_irradiance,cloud_cover&timeformat=unixtime`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo API returned status ${res.status}`);
  }

  const data = await res.json();
  const current = data.current;

  return {
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
  };
}

/**
 * Convert Solar Irradiance (W/m²) to Solar Park MW Output.
 * Standard peak solar irradiance is ~1000 W/m². Solar park peak capacity: 250 MW.
 */
export function calculateSolarMW(irradianceWm2: number, cloudCoverPct: number): number {
  // Peak capacity 250 MW at 1000 W/m² irradiance with 20% panel efficiency factor
  const baseMw = (irradianceWm2 / 1000) * 250;
  // Apply minor attenuation for high cloud cover
  const cloudFactor = 1 - (cloudCoverPct / 100) * 0.25;
  const mw = Math.max(0, baseMw * cloudFactor);
  return Math.min(250, Number(mw.toFixed(1)));
}

/**
 * Convert Wind Speed (m/s at hub height) to Wind Farm MW Output.
 * Cut-in speed: 3 m/s, Rated speed: 12 m/s, Cut-out speed: 25 m/s. Wind farm peak capacity: 150 MW.
 */
export function calculateWindMW(windSpeedMs: number): number {
  const peakCapacityMw = 150;
  const cutInSpeed = 3;
  const ratedSpeed = 12;
  const cutOutSpeed = 25;

  if (windSpeedMs < cutInSpeed || windSpeedMs > cutOutSpeed) {
    return 5.0; // Minimal residual spin
  }
  if (windSpeedMs >= ratedSpeed) {
    return peakCapacityMw;
  }
  // Cubic power curve approximation between cut-in and rated speeds
  const fraction = Math.pow((windSpeedMs - cutInSpeed) / (ratedSpeed - cutInSpeed), 3);
  const mw = Math.max(10, fraction * peakCapacityMw);
  return Math.min(peakCapacityMw, Number(mw.toFixed(1)));
}

/**
 * Fetch custom REST API endpoint if user has configured one.
 */
export async function fetchCustomApiData(endpointUrl: string): Promise<Partial<LiveWeatherData>> {
  const res = await fetch(endpointUrl, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Custom API returned HTTP ${res.status}`);
  }
  return await res.json();
}
