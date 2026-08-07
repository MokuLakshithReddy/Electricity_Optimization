export type UpcomingDecision = {
  id: string;
  time: string;
  action: string;
  reason: string;
  expectedSaving: string;
  category: "Battery" | "Wind" | "Grid" | "Load";
  iconName: string;
};

export const primaryRecommendation = {
  id: "rec-6pm",
  title: "Increase battery discharge from 6 PM – 8 PM",
  reason: "Solar generation is falling while grid demand & ToD tariff are increasing.",
  impactCost: "Save ₹42,000",
  impactCarbon: "avoid 18 tCO₂",
  confidence: 94,
  actionButtonText: "View Optimization →",
  secondaryButtonText: "Simulate",
  timeWindow: "6:00 PM – 8:00 PM",
};

export const upcomingDecisions: UpcomingDecision[] = [
  {
    id: "dec-1",
    time: "6:00 PM",
    action: "Increase battery discharge",
    reason: "Displace peak ToD tariff grid import (₹11.80/kWh)",
    expectedSaving: "Save ₹42K",
    category: "Battery",
    iconName: "Zap",
  },
  {
    id: "dec-2",
    time: "7:30 PM",
    action: "Increase wind utilization",
    reason: "Coastal wind ramp +55 MW expected after sunset",
    expectedSaving: "Save ₹31K",
    category: "Wind",
    iconName: "Wind",
  },
  {
    id: "dec-3",
    time: "9:00 PM",
    action: "Reduce grid dependency",
    reason: "Ramp captive unit 2 to cover shoulder load",
    expectedSaving: "Save ₹28K",
    category: "Grid",
    iconName: "Network",
  },
  {
    id: "dec-4",
    time: "11:00 PM",
    action: "Recharge battery",
    reason: "Absorb off-peak low-cost wind energy (₹4.20/kWh)",
    expectedSaving: "Low-cost window",
    category: "Battery",
    iconName: "RotateCcw",
  },
];
