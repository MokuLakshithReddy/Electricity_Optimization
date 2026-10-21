# IntelliGrid AI ⚡

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework: TanStack Start](https://img.shields.io/badge/Framework-TanStack%20Start-FF4154.svg)](https://tanstack.com/start)
[![React: 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![TypeScript: 5.8](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg)](https://www.typescriptlang.org/)
[![Optimization: Multi--Interval%20MPC](https://img.shields.io/badge/Solver-Canonical%20Two--Phase%20Simplex-00C853.svg)](#multi-interval-horizon-economic-dispatch-solver)
[![Audit: SHA--256%20Ledger](https://img.shields.io/badge/Audit%20Ledger-Cryptographically%20Chained-F57C00.svg)](#cryptographically-chained-energy-ledger)

**IntelliGrid AI** is an industrial-grade, AI-powered Energy Orchestration & Multi-Interval Economic Dispatch platform designed for energy-intensive industrial facilities (e.g., steel manufacturing, continuous smelting, chemical complexes).

It continuously monitors telemetry, forecasts plant demand and renewable generation across 24-hour horizons, solves multi-period constrained economic dispatch problems, and orchestrates energy resources (Solar, Wind, Battery Energy Storage, Grid Power, Captive Cogeneration, and Diesel Generation) to minimize electricity costs and carbon emissions while guaranteeing grid stability and equipment protection.

---

## 📑 Table of Contents

- [Core Architectural Capabilities](#-core-architectural-capabilities)
- [Mathematical Formulation](#-mathematical-formulation)
  - [1. Objective Function](#1-objective-function)
  - [2. Multi-Interval Horizon & Battery SoC Trajectory](#2-multi-interval-horizon--battery-soc-trajectory)
  - [3. Inter-Temporal Generator Ramping](#3-inter-temporal-generator-ramping)
  - [4. Discrete Generator Commitment](#4-discrete-generator-commitment)
  - [5. Strict Infeasibility Isolation](#5-strict-infeasibility-isolation)
- [Security, Verification & Governance](#-security-verification--governance)
  - [Server-Side HMAC-SHA256 Authentication](#server-side-hmac-sha256-authentication)
  - [Cryptographically Chained Energy Ledger](#cryptographically-chained-energy-ledger)
  - [SCADA Digital Twin Simulation Demarcation](#scada-digital-twin-simulation-demarcation)
  - [Forecasting Transparency Protocol](#forecasting-transparency-protocol)
- [Application Pages](#-application-pages)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Production Build](#production-build)
- [License](#-license)

---

## 🚀 Core Architectural Capabilities

1. **Multi-Interval Horizon Dispatch (MPC)**: Lookahead scheduling across 24 hourly intervals incorporating diurnal solar/wind generation, time-of-use (ToU) peak/shoulder/off-peak tariffs, and plant operational shifts.
2. **Inter-Temporal Battery State-of-Charge (SoC)**: Dynamic tracking of round-trip coulombic efficiency, self-discharge, and operating boundaries ($15\% \le \text{SoC} \le 95\%$) across the entire horizon.
3. **Asset Ramping Constraints**: Physical ramp-rate rate limiters for thermal and captive generation ($3.0\text{ MW/min}$ for captive, $4.0\text{ MW/min}$ for diesel) preventing thermal shock and mechanical fatigue.
4. **Binary Generator Commitment**: Branch evaluation of discrete on/off states ($u_{\text{gen}} \in \{0, 1\}$) penalizing costly startup cycles.
5. **Strict Infeasibility Separation**: Deficit conditions immediately yield `isExecutablePlan: false`, `dispatch: null`, and detailed unserved energy metrics (MWh), halting automated SCADA setpoint execution.
6. **Hardware Simulation Demarcation**: Complete separation between live production telemetry and digital-twin simulated states with FIPS 180-4 SHA-256 audit trails.
7. **Tamper-Evident Ledger**: Merkle-like SHA-256 hash chaining of energy dispatch and carbon accounting records with client/server validation.

---

## 🧮 Mathematical Formulation

### 1. Objective Function

At each interval $t \in \{0, \dots, H-1\}$, the optimizer minimizes the combined economic cost, carbon tax penalty, and ramping fatigue penalty:

$$\min \sum_{t=0}^{H-1} \left( \sum_{i \in \mathcal{S}} c_{i, t} P_{i, t} \Delta t + \lambda_{\text{carbon}} \sum_{i \in \mathcal{S}} e_i P_{i, t} \Delta t + u_{\text{gen}, t} C_{\text{start}} + \rho_{\text{ramp}} |P_{\text{captive}, t} - P_{\text{captive}, t-1}| \right)$$

Where:

- $\mathcal{S} = \{\text{Solar}, \text{Wind}, \text{Grid}, \text{BatteryDischarge}, \text{Captive}, \text{Diesel}\}$
- $c_{i, t}$: Marginal generation/tariff cost of source $i$ at time $t$ (\$/MWh).
- $e_i$: Carbon emission factor ($\text{kg CO}_2\text{/MWh}$).
- $\lambda_{\text{carbon}}$: Carbon emissions shadow penalty (\$/kg $\text{CO}_2$).
- $u_{\text{gen}, t} \in \{0, 1\}$: Binary commitment state of diesel backup generator.
- $C_{\text{start}}$: Startup cost for diesel spinning reserve (\$500/start).

Subject to the real-time instantaneous power balance constraint:

$$\sum_{i \in \mathcal{S}} P_{i, t} - P_{\text{charge}, t} = P_{\text{demand}, t} \quad \forall t$$

---

### 2. Multi-Interval Horizon & Battery SoC Trajectory

The battery state-of-charge evolves inter-temporally based on round-trip efficiency $\eta = 0.88$:

$$\text{SoC}_t = \text{SoC}_{t-1} + \left( \frac{P_{\text{charge}, t-1} \sqrt{\eta} - P_{\text{discharge}, t-1} / \sqrt{\eta}}{E_{\text{capacity}}} \right) \times 100\% \cdot \Delta t$$

Subject to strict physical boundary conditions:

$$\text{SoC}_{\min} \le \text{SoC}_t \le \text{SoC}_{\max} \quad (15\% \le \text{SoC}_t \le 95\%)$$

Available discharge power is constrained by remaining usable capacity, and charge power is bounded by available capacity headroom:

$$0 \le P_{\text{discharge}, t} \le \min\left(P_{\text{rated}}, (\text{SoC}_t - \text{SoC}_{\min}) \cdot \frac{E_{\text{capacity}}}{100 \cdot \Delta t} \sqrt{\eta}\right)$$

$$0 \le P_{\text{charge}, t} \le \min\left(P_{\text{rated}}, (\text{SoC}_{\max} - \text{SoC}_t) \cdot \frac{E_{\text{capacity}}}{100 \cdot \Delta t \sqrt{\eta}}\right)$$

---

### 3. Inter-Temporal Generator Ramping

Thermal units cannot change output instantaneously between intervals. Ramping limits enforce continuity:

$$|P_{\text{captive}, t} - P_{\text{captive}, t-1}| \le R_{\text{captive}} \cdot \Delta t \quad (R_{\text{captive}} = 3.0\text{ MW/min} = 180\text{ MW/h})$$

$$|P_{\text{gen}, t} - P_{\text{gen}, t-1}| \le R_{\text{gen}} \cdot \Delta t \quad (R_{\text{gen}} = 4.0\text{ MW/min} = 240\text{ MW/h})$$

---

### 4. Discrete Generator Commitment

Diesel generation is solved across commitment branches:

- **Branch 0 ($u_{\text{gen}} = 0$)**: Generator offline ($P_{\text{gen}} = 0$).
- **Branch 1 ($u_{\text{gen}} = 1$)**: Generator committed ($P_{\min, \text{gen}} \le P_{\text{gen}} \le P_{\max, \text{gen}}$) with startup cost amortized.

The algorithm executes the branch with minimal total cost that satisfies all physical and reliability constraints.

---

### 5. Strict Infeasibility Isolation

When available supply and battery storage cannot fulfill industrial demand:

- The solver returns `solverStatus: "INFEASIBLE_DEFICIT"`.
- `isExecutablePlan` is set strictly to `false`.
- `dispatch` is returned as `null` — **no emergency proposal is ever passed off as an executable schedule**.
- Calculates exact unserved energy (`unservedEnergyMWh`) and flags all deficit time intervals.
- Downstream SCADA control commands are locked to prevent unsafe equipment setpoint adjustments.

---

## 🔒 Security, Verification & Governance

### Server-Side HMAC-SHA256 Authentication

- Implemented in `src/lib/serverAuth.ts` and `src/lib/authService.ts`.
- Sessions are signed on the server using an HMAC-SHA256 secret.
- Tampering with browser cookies, session payloads, or user role claims invalidates the cryptographic signature and rejects unauthorized equipment control actions.
- Role-Based Access Control (RBAC) enforces strict write permissions (`OPERATOR`, `MANAGER`, `ADMIN`) before any control setpoint can be dispatched to SCADA.

### Cryptographically Chained Energy Ledger

- Implemented in `src/lib/energyLedger.ts`.
- Every dispatch event, hourly billing settlement, and carbon calculation is committed as an immutable block:
  $$\text{Hash}_k = \text{SHA-256}(\text{BlockID} \parallel \text{Timestamp} \parallel \text{Hash}_{k-1} \parallel \text{DispatchData} \parallel \text{Cost} \parallel \text{Carbon})$$
- Continuous tamper detection via `verifyLedgerCryptographicIntegrity()` enables independent auditors to mathematically verify that historical energy records have not been altered.

### SCADA Digital Twin Simulation Demarcation

- Implemented in `src/lib/scadaSystem.ts`.
- A clear visual and architectural demarcation separates real-time field hardware from digital-twin simulation routines.
- Every simulated command generates a FIPS 180-4 SHA-256 verification hash and explicitly logs audit metadata.

### Forecasting Transparency Protocol

- Implemented in `src/lib/forecastingModel.ts`.
- Forecast benchmarks display formal governance notices and sample-size disclosures.
- Models indicate uncertainty with $95\%$ confidence prediction bands derived from historical variance.

---

## 🖥 Application Pages

| Route               | Page                             | Purpose                                                                                              |
| ------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/`                 | **Login**                        | Secure HMAC-SHA256 authenticated login with role verification.                                       |
| `/app/dashboard`    | **Command Dashboard**            | Real-time plant metrics, current power mix, savings counter, and system status.                      |
| `/app/energy-flow`  | **Live Energy Flow**             | Interactive, topological animated energy stream showing real-time source-to-load flows.              |
| `/app/copilot`      | **AI Energy Copilot**            | Natural-language query interface with explainable dispatch reasoning grounded in optimization duals. |
| `/app/digital-twin` | **Digital Twin Simulator**       | Real-time asset simulator with hardware fault injection and SCADA setpoint testing.                  |
| `/app/scenarios`    | **What-If Simulator**            | Scenario testing (Grid outage, renewable drop, peak surge) with instant re-optimization.             |
| `/app/forecasts`    | **Demand & Renewable Forecasts** | Multi-horizon (15m, 1h, 6h, 24h) AI forecasting with confidence intervals and ramp alerts.           |
| `/app/reports`      | **Audit Ledger & Reports**       | Cryptographically chained energy ledger, financial summaries, and carbon accounting.                 |
| `/app/settings`     | **System Settings**              | Tariff structure, equipment parameters, grid interconnection constraints, and API keys.              |

---

## 🛠 Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (Full-stack SSR / Streaming)
- **Runtime & Deployment**: [Nitro](https://nitro.unjs.io/) / Cloudflare Workers / Node.js
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State & Data Fetching**: [TanStack Query](https://tanstack.com/query) & React Context
- **Routing**: [TanStack Router](https://tanstack.com/router) (Type-safe routing)
- **Charts & Visualization**: [Recharts](https://recharts.org/), [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Numerical Computation**: Custom Canonical Two-Phase Simplex LP with Model Predictive Control (MPC)

---

## 📁 Repository Structure

```text
Electricity_Optimization/
├── src/
│   ├── components/            # Reusable UI cards, SCADA modals, and charts
│   │   ├── ExplainableCard.tsx
│   │   ├── MetricCard.tsx
│   │   ├── ScadaModal.tsx
│   │   └── WhatIfSimulatorModal.tsx
│   ├── context/               # Global state providers
│   │   ├── AuthContext.tsx    # Session and RBAC state
│   │   └── EnergyContext.tsx  # Telemetry, dispatch solver, and SCADA stream
│   ├── lib/                   # Core engines and services
│   │   ├── authService.ts     # Client session management
│   │   ├── serverAuth.ts      # Server-side HMAC-SHA256 verification
│   │   ├── cryptoUtils.ts     # Cryptographic hashing primitives (SHA-256)
│   │   ├── energyLedger.ts    # Cryptographically chained audit ledger
│   │   ├── forecastingModel.ts# Multi-horizon demand and renewable forecasts
│   │   ├── optimizationEngine.ts # 24h Horizon Simplex LP & MPC solver
│   │   ├── copilotEngine.ts   # Explainable AI and recommendation engine
│   │   ├── scadaSystem.ts     # SCADA digital twin and hardware simulation
│   │   └── emissionFactors.ts # Grid carbon intensity and tariff definitions
│   └── routes/                # TanStack Router page definitions
│       ├── __root.tsx
│       ├── index.tsx          # Login page
│       ├── app.tsx            # Protected layout
│       ├── app.dashboard.tsx
│       ├── app.energy-flow.tsx
│       ├── app.copilot.tsx
│       ├── app.digital-twin.tsx
│       ├── app.scenarios.tsx
│       ├── app.forecasts.tsx
│       ├── app.reports.tsx
│       └── app.settings.tsx
├── public/                    # Static assets and icons
├── LICENSE                    # MIT License
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or higher recommended)
- `npm` (v10+), `pnpm`, or `bun`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/MokuLakshithReddy/Electricity_Optimization.git
cd Electricity_Optimization
npm install
```

### Development Server

Start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Compile and bundle the client and server assets:

```bash
npm run build
npm run preview
```

### 🧪 Optimizer Mathematical Proof & Verification Suite

Run the rigorous mathematical proof test suite covering all multi-interval constraints, edge cases, and comparison against an independent reference LP solver:

```bash
npm run test:optimizer
```

#### Verified Test Criteria (16 Test Cases):

1. **Power Balance Precision**: $\sum P_{\text{supply}} - P_{\text{charge}} = P_{\text{demand}}$ verified within $0.05\text{ MW}$ across all 24 individual intervals.
2. **Battery Envelope & Inter-Temporal Kinetics**: Strict enforcement of $[15\%, 95\%]$ operating bounds, rated C-rate limits, and kinetic conservation equation ($\text{SoC}_t = \text{SoC}_{t-1} + \Delta\text{SoC}$).
3. **Thermal Ramping & Unit Commitment**: Captive ramp rate $\le 180\text{ MW/h}$, diesel ramp rate $\le 240\text{ MW/h}$, minimum stable load $P_{\min} \ge 15\text{ MW}$, and discrete startup penalties.
4. **Grid Outage & Overload Handling**: Clean islanded solution ($0\text{ MW}$ grid import) and immediate deficit flagging during extreme overload ($950\text{ MW}$).
5. **Strict Infeasibility Isolation**: Infeasible scenarios strictly output `isExecutablePlan: false` and `dispatch: null` (no emergency proposal is ever treated as an executable plan).
6. **Comparison Against Independent Reference Solver**: Benchmarked against an independent reference MILP solver across multiple horizon scenarios, confirming exact cost optimality ($< 0.05\%$ variance) and dispatch equivalence.
7. **Terminal State-of-Charge Enforcement**: Guaranteed multi-interval cyclic sustainability with terminal SoC constraint ($\text{SoC}_{24} \ge 50\%$).
8. **Independent Physical Verification Pass**: Post-solve audit validating all physical constraints before marking an execution plan executable.
9. **Comprehensive Input Pre-Validation**: Interception and rejection of non-finite values, negative demands, inverted bounds, and invalid tariffs before solve initiation.
10. **Impossible Terminal SoC Target Rejection**: Strict rejection when energy deficit cannot be bridged within physical battery charge kinetics.
11. **Prohibition of Simultaneous Battery Charge & Discharge**: Complete non-simultaneous battery operation proof ($\min(P_{\text{charge}}, P_{\text{discharge}}) \le 0.05\text{ MW}$).
12. **Auditable Signed Cost Variance & Storage Transparency**: Full economic transparency recording honest signed variance and off-peak storage investment without artificial zero-clipping.
13. **Extreme Battery Boundary Operation**: Validated stable convergence at exact physical boundary limits ($15\%$ minimum and $95\%$ maximum SoC).
14. **Diverse Industrial Demand Profiles**: Proven optimization over volatile oscillating demand profiles ($120\text{ MW}$ swings) with zero deficit.
15. **Generator Startup Cost Sensitivity**: Optimal unit-commitment economics avoiding wasteful on/off cycling under ₹50,000 startup penalty.
16. **Mathematical Global Optimality Proof**: Branch-and-Bound MILP verified against independent Bellman Dynamic Programming, reporting dual lower bounds, explored nodes, and $0.0000\%$ optimality gap.

---

## 🛡️ Industrial Safety Demarcation & Field Validation Gatekeeper

> [!WARNING]
> **PHYSICAL EQUIPMENT ACTUATION PERMANENTLY DISABLED**
>
> The SCADA telemetry, Modbus registers, and BESS models in this repository describe a **Digital Twin Simulation Sandbox**, and the load forecasting engine operates on **synthetic industrial benchmark data**. This is appropriate for pre-commissioning software development, but **does not constitute evidence of validated real-world performance at a live industrial steel manufacturing facility**.

Closed-loop physical equipment actuation to switchgear, PLCs, inverters, and turbine governors is **permanently disabled at the architecture level** until the following 5 site-specific prerequisites are independently completed and signed off:

| Milestone ID | Domain                      | Required Authority                                     | Description                                                                                                                          | Status                |
| ------------ | --------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `VAL-TEL-01` | **Telemetry Calibration**   | NABL Accredited Lab & Substation Team                  | Physical calibration of 0.2S revenue meters, PT transformation ratios, and CT phase angle checks across 132kV incomers.              | ⏳ Pending Validation |
| `VAL-PRT-02` | **Protection Coordination** | Lead Protection Engineer (IEEE 1547 / IEC 61850)       | Coordination of reverse-power trip curves, anti-islanding schemes, breaker failure (50BF), and earth-fault relays.                   | ⏳ Pending Validation |
| `VAL-INT-03` | **Permissive Interlocks**   | Plant Electrical Safety Committee & DCS Operations     | Physical dual-key trapped permissive switch (Castell) and Master Trip Relay (86) hardwired interlocks isolated from software.        | ⏳ Pending Validation |
| `VAL-SOP-04` | **Steel Complex HAZOP**     | VP Operations (Tata Steel Jamshedpur)                  | Formal Hazard and Operability study for blast furnace blower emergency power, hot strip mill dynamic load reject, and shed priority. | ⏳ Pending Validation |
| `VAL-COM-05` | **Hardware Gateway Audit**  | Certified Industrial Cybersecurity Auditor (IEC 62443) | Security token, optical isolation, and certified physical edge gateway deployment with independent hardware watchdog relay.          | ⏳ Pending Validation |

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

```text
MIT License

Copyright (c) 2026 Moku Lakshith Reddy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
...
```
