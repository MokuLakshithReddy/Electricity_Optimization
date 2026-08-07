/**
 * Emission factors for Tata Steel industrial plant energy sources.
 * Expressed in metric tonnes CO2 per MWh (or kg CO2 / kWh).
 */
export const emissionFactors = {
  grid: 0.82,       // 132 kV Regional Grid (Coal-heavy baseline)
  captive: 0.71,    // Captive Thermal Power Plant
  generator: 2.60,  // Diesel Gensets (Peak emergency)
  solar: 0.00,      // Solar PV (Zero emissions)
  wind: 0.00,       // Wind Farm (Zero emissions)
  battery: 0.00,    // Battery Storage (Zero direct emissions)
};

export const tariffRates = {
  gridPeak: 11.80,    // ₹/kWh peak ToD tariff
  gridShoulder: 8.10, // ₹/kWh shoulder tariff
  gridOffpeak: 4.80,  // ₹/kWh off-peak tariff
  captive: 5.40,      // ₹/kWh captive generation cost
  solar: 2.10,        // ₹/kWh marginal solar cost
  wind: 2.60,         // ₹/kWh marginal wind cost
  battery: 3.20,      // ₹/kWh BESS discharge levelised cost
  generator: 18.40,   // ₹/kWh diesel generation cost
};
