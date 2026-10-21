/**
 * Emission factors for Tata Steel industrial plant energy sources.
 * Expressed in metric tonnes CO2 per MWh (or kg CO2 / kWh).
 */
export const emissionFactors = {
  grid: 0.82, // 132 kV Regional Grid (Coal-heavy baseline)
  captive: 0.71, // Captive Thermal Power Plant
  generator: 2.6, // Diesel Gensets (Peak emergency)
  solar: 0.0, // Solar PV (Zero emissions)
  wind: 0.0, // Wind Farm (Zero emissions)
  battery: 0.0, // Battery Storage (Zero direct emissions)
};

export const tariffRates = {
  gridPeak: 11.8, // ₹/kWh peak ToD tariff
  gridShoulder: 8.1, // ₹/kWh shoulder tariff
  gridOffpeak: 4.8, // ₹/kWh off-peak tariff
  gridOffPeak: 4.8, // ₹/kWh off-peak tariff alias
  captive: 5.4, // ₹/kWh captive generation cost
  solar: 2.1, // ₹/kWh marginal solar cost
  wind: 2.6, // ₹/kWh marginal wind cost
  battery: 3.2, // ₹/kWh BESS discharge levelised cost
  generator: 18.4, // ₹/kWh diesel generation cost
};
