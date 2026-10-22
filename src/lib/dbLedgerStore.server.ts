import { getSupabaseServiceClient } from "./supabaseService";
import type { EnergyLedgerRecord } from "./energyLedger";

export async function appendLedgerBlockToSupabase(record: EnergyLedgerRecord) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new Error(
      "UNSUPPORTED_OR_UNCONFIGURED_DATABASE_BACKEND: POSTGRES_SUPABASE backend requires SUPABASE_SERVICE_ROLE_KEY configured strictly on the server.",
    );
  }

  const { error } = await supabase.rpc("append_ledger_block", {
    p_timestamp_utc: record.timestamp,
    p_shift: record.shift,
    p_demand_mwh: record.demandMWh,
    p_solar_mwh: record.solarMWh,
    p_wind_mwh: record.windMWh,
    p_bess_discharge_mwh: record.bessDischargeMWh,
    p_bess_charge_mwh: record.bessChargeMWh,
    p_grid_import_mwh: record.gridImportMWh,
    p_captive_mwh: record.captiveMWh,
    p_diesel_mwh: record.dieselMWh,
    p_baseline_cost_inr: record.baselineCostRupees,
    p_optimized_cost_inr: record.optimizedCostRupees,
    p_modeled_savings_inr: record.modeledSavingsRupees,
    p_verified_savings_inr: record.verifiedSavingsRupees,
    p_is_revenue_meter_verified: record.isRevenueMeterVerified,
    p_mv_status: record.measurementAndVerificationStatus,
    p_co2_emissions_tonnes: record.co2EmissionsTonnes,
    p_co2_avoided_tonnes: record.co2AvoidedTonnes,
    p_renewable_pct: record.renewablePct,
    p_reliability_pct: record.reliabilityPct,
    p_solver_input_hash: record.solverInputHash,
    p_dispatch_vector: record.dispatchVector,
    p_provenance_tag: record.sourceTelemetryType || "SIMULATION",
  });

  if (error) {
    throw new Error(`Supabase Postgres RPC Error: ${error.message}`);
  }
}

export async function checkSupabaseHealth() {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return { isConfigured: false, isHealthy: false, error: "Missing SUPABASE_SERVICE_ROLE_KEY" };
  }

  const tStart = Date.now();
  try {
    const { error } = await supabase.from("energy_ledger_blocks").select("block_index").limit(1);
    const latencyMs = Date.now() - tStart;
    if (error) {
      return { isConfigured: true, isHealthy: false, latencyMs, error: error.message };
    }
    return { isConfigured: true, isHealthy: true, latencyMs };
  } catch (err: unknown) {
    const latencyMs = Date.now() - tStart;
    const msg = err instanceof Error ? err.message : String(err);
    return { isConfigured: true, isHealthy: false, latencyMs, error: msg };
  }
}
