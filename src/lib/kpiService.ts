export interface PlantTelemetryKPIs {
  energyCostReduction: number; // percentage, e.g. 18.6
  co2AvoidedMTD: number; // metric tonnes, e.g. 2148
  supplyAvailability: number; // percentage, e.g. 99.98
  activeNodesCount: number;
  lastUpdated: string;
  gridFrequencyHz: number;
}

export const MOCK_PLANT_KPIS: PlantTelemetryKPIs = {
  energyCostReduction: 18.6,
  co2AvoidedMTD: 2148,
  supplyAvailability: 99.98,
  activeNodesCount: 6,
  lastUpdated: new Date().toISOString(),
  gridFrequencyHz: 50.02,
};

export const kpiService = {
  /**
   * Fetch latest live energy telemetry KPIs
   */
  async getLivePlantKPIs(): Promise<PlantTelemetryKPIs> {
    // In production, this connects to SCADA / OPC-UA / IoT telemetry websocket or REST API
    return {
      ...MOCK_PLANT_KPIS,
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * Format numbers for display
   */
  formatKPI(value: number, type: "percentage" | "weight" | "standard"): string {
    if (type === "percentage") {
      return `${value.toFixed(1)}%`;
    }
    if (type === "weight") {
      return `${value.toLocaleString("en-US")} t`;
    }
    return value.toString();
  },
};
