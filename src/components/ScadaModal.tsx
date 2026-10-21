import React from "react";
import { X, Activity, ShieldCheck, Gauge, AlertTriangle, Cpu, Zap, Lock, Info } from "lucide-react";
import {
  SUBMETERS,
  BESS_STATUS,
  GENERATOR_FLEET,
  ACTIVE_ALARMS,
  AUDIT_LOG,
  SCADA_SIMULATION_METADATA,
  SITE_SAFETY_VALIDATION,
} from "@/lib/scadaSystem";

interface ScadaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScadaModal({ isOpen, onClose }: ScadaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F0EA] pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-800 border border-amber-200">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-[#1F2937]">
                  SCADA Gateway & Submeter Telemetry
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse" />
                  DIGITAL TWIN SIMULATION (SANDBOX)
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Synthetic Modbus TCP / OPC-UA Register Model · Tata Steel Jamshedpur Complex
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl p-2 text-[#6B7280] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Safety & Commissioning Notice Banner */}
        <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Operational Safety Lockout Active
                </span>
                <span className="bg-amber-200 text-amber-950 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  EQUIPMENT ACTUATION PERMANENTLY DISABLED
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                {SITE_SAFETY_VALIDATION.disclaimer}
              </p>
            </div>
          </div>

          {/* 5-Point Independent Site Safety Validation Checklist */}
          <div className="mt-3 pt-3 border-t border-amber-200/60">
            <div className="text-[11px] font-bold text-amber-950 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Required Site Validation Milestones Before Commissioning</span>
              <span className="text-[10px] text-amber-800 font-normal">
                0 of 5 Validated (Pre-Commissioning Stage)
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SITE_SAFETY_VALIDATION.checklist.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-white/70 border border-amber-200 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1F2937] text-[11px]">{item.title}</span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                      PENDING
                    </span>
                  </div>
                  <p className="text-[10px] text-[#6B7280] leading-tight">{item.description}</p>
                  <p className="text-[9px] text-amber-900 font-mono italic">
                    Sign-off: {item.requiredAuthority}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 1. Submeter Registers Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-[#1B4D3E]" />
              <span>Plant Department Submeters (Simulated Modbus Registers)</span>
            </h4>
            <span className="text-[11px] text-[#6B7280]">Synthetic polling cycle: 500ms</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#E6E1D7]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E6E1D7] text-[#6B7280] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Submeter</th>
                  <th className="py-2.5 px-2">Active (MW)</th>
                  <th className="py-2.5 px-2">Reactive (MVAR)</th>
                  <th className="py-2.5 px-2">Voltage (kV)</th>
                  <th className="py-2.5 px-2">Frequency</th>
                  <th className="py-2.5 px-2">Power Factor</th>
                  <th className="py-2.5 px-2">THD</th>
                  <th className="py-2.5 px-2 text-right">Data Model</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F0EA]">
                {SUBMETERS.map((m) => (
                  <tr key={m.meterId} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-[#1F2937] block">{m.name}</span>
                      <span className="font-mono text-[10px] text-[#6B7280]">
                        {m.meterId} · {m.location}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono font-bold text-[#1F2937]">
                      {m.activePowerMW}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[#6B7280]">{m.reactivePowerMVAR}</td>
                    <td className="py-2.5 px-2 font-mono">{m.voltageKV}</td>
                    <td className="py-2.5 px-2 font-mono">{m.frequencyHz} Hz</td>
                    <td className="py-2.5 px-2 font-mono font-semibold text-emerald-700">
                      {m.powerFactor} lag
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[#6B7280]">{m.thdCurrentPct}%</td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 text-slate-700">
                        SYNTHETIC
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Battery BESS Telemetry & Generator Fleet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BESS Health */}
          <div className="rounded-2xl border border-[#E6E1D7] p-4 bg-[#FAF8F5] space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs text-[#1F2937] flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-emerald-600" />
                <span>BESS Inverter Telemetry (Simulated)</span>
              </h5>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                {BESS_STATUS.inverterMode}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2 rounded-xl border border-[#E6E1D7]">
                <span className="text-[10px] text-[#6B7280] block">Pack Voltage</span>
                <span className="font-mono font-bold text-xs text-[#1F2937]">
                  {BESS_STATUS.packVoltageV} V
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#E6E1D7]">
                <span className="text-[10px] text-[#6B7280] block">DC Current</span>
                <span className="font-mono font-bold text-xs text-[#1F2937]">
                  {BESS_STATUS.dcCurrentA} A
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-[#E6E1D7]">
                <span className="text-[10px] text-[#6B7280] block">Max Cell Temp</span>
                <span className="font-mono font-bold text-xs text-emerald-700">
                  {BESS_STATUS.maxCellTempC}°C
                </span>
              </div>
            </div>
          </div>

          {/* Generator Fleet */}
          <div className="rounded-2xl border border-[#E6E1D7] p-4 bg-[#FAF8F5] space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-xs text-[#1F2937] flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-emerald-600" />
                <span>Captive & Standby Fleet (Simulated)</span>
              </h5>
              <span className="text-[10px] font-mono text-[#6B7280]">2 Units Monitored</span>
            </div>
            <div className="space-y-2">
              {GENERATOR_FLEET.map((g) => (
                <div
                  key={g.unitId}
                  className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#E6E1D7] text-xs"
                >
                  <div>
                    <span className="font-bold text-[#1F2937] block text-xs">{g.unitName}</span>
                    <span className="text-[10px] font-mono text-[#6B7280]">
                      {g.unitId} · {g.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#1F2937]">{g.activePowerMW} MW</span>
                    <span className="text-[10px] block font-mono text-[#6B7280]">
                      Tank: {g.fuelTankLevelPct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Safety Alarms & Cryptographic Audit Log */}
        <div className="space-y-2">
          <h5 className="font-bold text-xs uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Active Safety Interlocks & Cryptographic Audit Ledger (SHA-256)</span>
          </h5>
          <div className="rounded-2xl border border-[#E6E1D7] p-3 text-xs space-y-2 bg-[#FAF8F5]">
            {AUDIT_LOG.map((entry) => (
              <div
                key={entry.id}
                className="bg-white p-2.5 rounded-xl border border-[#E6E1D7] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {entry.validationStatus}
                    </span>
                    <span className="font-bold text-[#1F2937]">{entry.action}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#6B7280]">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#4B5563]">
                  <span>
                    Operator: <strong className="font-mono">{entry.operatorId}</strong> · Setpoint:{" "}
                    {entry.newSetpoint}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#9CA3AF] truncate bg-slate-50 p-1 rounded border border-slate-100">
                  SHA-256: {entry.hashSha256}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-[#F3F0EA]">
          <span className="text-xs text-[#6B7280]">
            Software Watchdog Simulator: <strong className="text-emerald-700">Heartbeat OK</strong>{" "}
            · Reverse Power Relay Armed
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-2xl bg-[#1B4D3E] px-5 py-2 text-xs font-bold text-white hover:bg-[#133E32] transition-all cursor-pointer shadow-md"
          >
            Close Telemetry View
          </button>
        </div>
      </div>
    </div>
  );
}
