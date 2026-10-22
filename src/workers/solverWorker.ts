/**
 * Web Worker for Offloading Intertemporal Horizon Dispatch & What-If Solvers
 *
 * Runs linear programming (Two-Phase Simplex & Branch-and-Bound MILP) off the main UI thread.
 * Guarantees zero slider jank or UI stuttering during interactive scenario testing.
 */

import {
  solveHorizonDispatch,
  solveEconomicDispatch,
  HorizonDispatchInput,
  DispatchInput,
} from "@/lib/optimizationEngine";

self.onmessage = (event: MessageEvent) => {
  const { type, id, payload } = event.data || {};

  try {
    if (type === "SOLVE_HORIZON") {
      const result = solveHorizonDispatch(payload as HorizonDispatchInput);
      self.postMessage({ type: "SOLVE_RESULT", id, result });
    } else if (type === "SOLVE_DISPATCH") {
      const result = solveEconomicDispatch(payload as DispatchInput);
      self.postMessage({ type: "SOLVE_RESULT", id, result });
    } else {
      self.postMessage({ type: "SOLVE_ERROR", id, error: `Unknown worker action '${type}'` });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: "SOLVE_ERROR", id, error: errorMsg });
  }
};
