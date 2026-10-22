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
- [Application Pages](#-application-pages)
- [Tech Stack](#-tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
- [License](#-license)

---

## 🚀 Core Architectural Capabilities

1. **Multi-Interval Horizon Dispatch (MPC)**: Lookahead scheduling across 24 hourly intervals incorporating diurnal solar/wind generation, time-of-use (ToU) peak/shoulder/off-peak tariffs, and plant operational shifts.
2. **Inter-Temporal Battery State-of-Charge (SoC)**: Dynamic tracking of round-trip coulombic efficiency, self-discharge, and operating boundaries ($15\% \le \text{SoC} \le 95\%$) across the entire horizon.
3. **Asset Ramping Constraints**: Physical ramp-rate rate limiters for thermal and captive generation ($3.0\text{ MW/min}$ for captive, $4.0\text{ MW/min}$ for diesel) preventing thermal shock and mechanical fatigue.
4. **Binary Generator Commitment**: Branch evaluation of discrete on/off states ($u_{\text{gen}} \in \{0, 1\}$) penalizing costly startup cycles.
5. **Strict Infeasibility Separation**: Deficit conditions immediately yield `isExecutablePlan: false`, `dispatch: null`, and detailed unserved energy metrics (MWh), halting automated SCADA setpoint execution.
6. **Hardware Simulation Demarcation**: Complete separation between live production telemetry and digital-twin simulated states with FIPS 180-4 SHA-256 audit trails.
7. **Tamper-Evident Ledger**: PostgreSQL/Supabase SHA-256 hash chaining of energy dispatch and carbon accounting records with server-side transaction atomic RPC functions.

---

## 🔒 Security, Verification & Governance

### Supabase Auth & httpOnly Cookies

- Implemented in `src/lib/serverAuth.ts` and `src/lib/authService.ts`.
- Sessions are authenticated via `@supabase/ssr` using httpOnly session cookies.
- User roles are stored strictly in `app_metadata` on the server and cannot be elevated via browser storage.
- Role-Based Access Control (RBAC) enforces strict write permissions (`OPERATOR`, `MANAGER`, `ADMIN`) before any control setpoint can be dispatched.

---

## 🛠 Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (Full-stack SSR / Streaming)
- **Runtime & Deployment**: [Nitro](https://nitro.unjs.io/) / Cloudflare Workers / Node.js
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State & Data Fetching**: [TanStack Query](https://tanstack.com/query) & React Context
- **Routing**: [TanStack Router](https://tanstack.com/router) (Type-safe routing)
- **Numerical Computation**: Custom Canonical Two-Phase Simplex LP with Model Predictive Control (MPC)

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or higher)
- `npm` (v10+)

### Installation

```bash
git clone https://github.com/MokuLakshithReddy/Electricity_Optimization.git
cd Electricity_Optimization
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
