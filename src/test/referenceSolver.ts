/**
 * IntelliGrid AI - Independent Reference Optimization Benchmark Solver
 * 
 * Provides an independent, mathematically separate reference implementation
 * for validating the custom Two-Phase Simplex UCED optimization engine.
 * 
 * Used in unit and integration test suites to prove:
 * 1. Exact mathematical optimality (primal-dual cost agreement < 0.05%).
 * 2. Strict constraint compliance across all decision variables.
 * 3. Identical dispatch trajectories on reproducible test cases.
 */

export interface ReferenceLPProblem {
  c: number[];       // Objective coefficients (to minimize)
  A: number[][];     // Constraint matrix (m x n)
  b: number[];       // Right-hand side (m)
  ub: number[];      // Variable upper bounds (n)
}

export interface ReferenceLPSolution {
  status: "OPTIMAL" | "INFEASIBLE" | "UNBOUNDED";
  x: number[];
  objValue: number;
  dualVariables: number[];
}

/**
 * Independent Reference Solver: Bounded Primal Simplex with Matrix Inversion / Dense Tableau
 * Completely independent codebase from optimizationEngine.ts solveDispatchSimplex
 */
export function solveReferenceLP(problem: ReferenceLPProblem): ReferenceLPSolution {
  const { c, A, b, ub } = problem;
  const m = A.length;
  const n = c.length;

  // Transform bounded LP:
  // min c^T x
  // s.t. A x = b
  //      x_j + s_j = ub_j  (j = 0..n-1)
  //      x >= 0, s >= 0
  const totalVars = 2 * n; // n original + n slacks
  const totalConstraints = m + n;

  // Build full matrix
  const fullA: number[][] = [];
  const fullB: number[] = [];

  for (let i = 0; i < m; i++) {
    const row = new Array(totalVars).fill(0);
    for (let j = 0; j < n; j++) row[j] = A[i][j];
    fullA.push(row);
    fullB.push(b[i]);
  }

  for (let j = 0; j < n; j++) {
    const row = new Array(totalVars).fill(0);
    row[j] = 1.0;
    row[n + j] = 1.0; // Slack s_j
    fullA.push(row);
    fullB.push(ub[j]);
  }

  // Artificial variables for Phase 1
  const artificials = totalConstraints;
  const totalCols = totalVars + artificials + 1; // +1 for RHS
  const tableau: number[][] = [];
  const basis: number[] = [];

  for (let i = 0; i < totalConstraints; i++) {
    const row = new Array(totalCols).fill(0);
    for (let j = 0; j < totalVars; j++) row[j] = fullA[i][j];
    row[totalVars + i] = 1.0; // Artificial var
    row[totalCols - 1] = fullB[i];
    tableau.push(row);
    basis.push(totalVars + i);
  }

  // Phase 1 objective: minimize sum of artificial variables
  const phase1Obj = new Array(totalCols).fill(0);
  for (let i = 0; i < totalConstraints; i++) {
    for (let j = 0; j < totalCols; j++) {
      phase1Obj[j] -= tableau[i][j];
    }
  }
  for (let i = 0; i < totalConstraints; i++) {
    phase1Obj[totalVars + i] = 0;
  }
  tableau.push(phase1Obj);

  // Pivot helper
  function pivot(pRow: number, pCol: number) {
    const pVal = tableau[pRow][pCol];
    for (let j = 0; j < totalCols; j++) tableau[pRow][j] /= pVal;
    for (let i = 0; i < tableau.length; i++) {
      if (i !== pRow) {
        const factor = tableau[i][pCol];
        if (Math.abs(factor) > 1e-12) {
          for (let j = 0; j < totalCols; j++) {
            tableau[i][j] -= factor * tableau[pRow][j];
          }
        }
      }
    }
    basis[pRow] = pCol;
  }

  // Solve Phase 1
  let iter = 0;
  const MAX_ITER = 300;
  const lastRow = totalConstraints;

  while (iter++ < MAX_ITER) {
    let enterCol = -1;
    let minReducedCost = -1e-7;
    for (let j = 0; j < totalVars; j++) {
      if (tableau[lastRow][j] < minReducedCost) {
        minReducedCost = tableau[lastRow][j];
        enterCol = j;
      }
    }
    if (enterCol === -1) break;

    let leaveRow = -1;
    let minRatio = Infinity;
    for (let i = 0; i < totalConstraints; i++) {
      if (tableau[i][enterCol] > 1e-8) {
        const ratio = tableau[i][totalCols - 1] / tableau[i][enterCol];
        if (ratio < minRatio) {
          minRatio = ratio;
          leaveRow = i;
        }
      }
    }
    if (leaveRow === -1) break;
    pivot(leaveRow, enterCol);
  }

  if (Math.abs(tableau[lastRow][totalCols - 1]) > 1e-4) {
    return {
      status: "INFEASIBLE",
      x: new Array(n).fill(0),
      objValue: Infinity,
      dualVariables: new Array(m).fill(0),
    };
  }

  tableau.pop(); // Remove Phase 1 objective

  // Phase 2: Actual objective
  const phase2Obj = new Array(totalCols).fill(0);
  for (let j = 0; j < n; j++) phase2Obj[j] = c[j];

  for (let i = 0; i < totalConstraints; i++) {
    const bVar = basis[i];
    if (bVar < n) {
      const coef = phase2Obj[bVar];
      if (Math.abs(coef) > 1e-12) {
        for (let j = 0; j < totalCols; j++) {
          phase2Obj[j] -= coef * tableau[i][j];
        }
      }
    }
  }
  tableau.push(phase2Obj);

  // Solve Phase 2
  while (iter++ < MAX_ITER * 2) {
    let enterCol = -1;
    let minReducedCost = -1e-7;
    for (let j = 0; j < totalVars; j++) {
      if (tableau[lastRow][j] < minReducedCost) {
        minReducedCost = tableau[lastRow][j];
        enterCol = j;
      }
    }
    if (enterCol === -1) break;

    let leaveRow = -1;
    let minRatio = Infinity;
    for (let i = 0; i < totalConstraints; i++) {
      if (tableau[i][enterCol] > 1e-8) {
        const ratio = tableau[i][totalCols - 1] / tableau[i][enterCol];
        if (ratio < minRatio) {
          minRatio = ratio;
          leaveRow = i;
        }
      }
    }
    if (leaveRow === -1) {
      return {
        status: "UNBOUNDED",
        x: new Array(n).fill(0),
        objValue: -Infinity,
        dualVariables: new Array(m).fill(0),
      };
    }
    pivot(leaveRow, enterCol);
  }

  const x = new Array(n).fill(0);
  for (let i = 0; i < totalConstraints; i++) {
    const bVar = basis[i];
    if (bVar < n) {
      x[bVar] = Math.max(0, Math.min(ub[bVar], tableau[i][totalCols - 1]));
    }
  }

  let objValue = 0;
  for (let j = 0; j < n; j++) objValue += c[j] * x[j];

  const dualVariables: number[] = [];
  for (let i = 0; i < m; i++) {
    dualVariables.push(Math.abs(tableau[lastRow][totalVars + i]));
  }

  return {
    status: "OPTIMAL",
    x,
    objValue,
    dualVariables,
  };
}
