import React from "react";
import { X, Activity, ShieldCheck, Gauge, AlertTriangle, Cpu, Zap, Radio } from "lucide-react";
import { SUBMETERS, BESS_STATUS, GENERATOR_FLEET, ACTIVE_ALARMS, AUDIT_LOG } from "@/lib/scadaSystem";

interface ScadaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ScadaModal({ isOpen, onClose }: ScadaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F3F0EA] pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#E8F5E9] text-[#1B4D3E] border border-emerald-200">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-[#1F2937]">
                  SCADA Gateway & Submeter Telemetry
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  MODBUS/OPC-UA LIVE
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                Live physical registers across Tata Steel Jamshedpur 132kV / 33kV switchyard
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

        {/* 1. Submeter Registers Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-[#1B4D3E]" />
              <span>Plant Department Submeters</span>
            </h4>
            <span className="text-[11px] text-[#6B7280]">Sampling rate: 500ms</span>
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
                  <th className="py-2.5 px-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F0EA]">
                {SUBMETERS.map((m) => (
                  <tr key={m.meterId} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-[#1F2937] block">{m.name}</span>
                      <span className="font-mono text-[10px] text-[#6B7280]">{m.meterId} · {m.location}</span>
                    </td>
                    <td className="py-2.5 px-2 font-mono font-bold text-[#1F2937]">{m.activePowerMW}</td>
                    <td className="py-2.5 px-2 font-mono text-[#6B7280]">{m.reactivePowerMVAR}</td>
                    <td className="py-2.5 px-2 font-mono">{m.voltageKV}</td>
                    <td className="py-2.5 px-2 font-mono">{m.frequencyHz} Hz</td>
                    <td className="py-2.5 px-2 font-mono font-semibold text-emerald-700">{m.powerFactor} lag</td>
                    <td className="py-2.5 px-2 font-mono text-[#6B7280]">{m.thdCurrentPct}%</td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {m.status}
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
                <span>BESS Pack Telemetry</span>
              </h5>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {BESS_STATUS.inverterMode}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-[#E6E1D7]">
                <span className="text-[10px] text-[#6B7280] block">State of Charge</span>
                <span className="font-display text-base font-extrabold text-[#1F2937]">{BESS_STATUS.socPct}%</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E6E1D7]">
                <span className="text-[10px] text-[#6B7280] block">State of Health</span>
                <span className="font-display text-base font-extrabold text-[#1F2937]">{BESS_STATUS.sohPct}%</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E6E1D7]">
                <span className="text-[10px] text-[#6B7280] block">Pack Voltage</span>
                <span className="font-display text-base font-extrabold text-[#1F2937]">{BESS_STATUS.packVoltageV} V</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E6E1D7]">
                <span className="text-[10px] text-[#6B7280] block">Max Cell Temp</span>
                <span className="font-display text-base font-extrabold text-emerald-700">{BESS_STATUS.maxCellTempC} °C</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E6E1D7]">
                <span className="text-[10px] text-[#6B7280] block">Active C-Rate</span>
                <span className="font-display text-base font-extrabold text-[#1F2937]">{BESS_STATUS.cRate}C</span>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-[#E6E1D7]">
                <span className="text-[10px] text-[#6B7280] block">Cycle Count</span>
                <span className="font-display text-base font-extrabold text-[#1F2937]">{BESS_STATUS.cycleCount}</span>
              </div>
            </div>
          </div>

          {/* Diesel Peakers */}
          <div className="rounded-2xl border border-[#E6E1D7] p-4 bg-[#FAF8F5] space-y-3">
            <h5 className="font-bold text-xs text-[#1F2937] flex items-center gap-1.5">
              <Cpu className="h-4 w-4 text-amber-600" />
              <span>Generator Fleet Operating State</span>
            </h5>
            <div className="space-y-2">
              {GENERATOR_FLEET.map((g) => (
                <div key={g.unitId} className="bg-white p-2.5 rounded-xl border border-[#E6E1D7] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#1F2937]">{g.unitId}</span>
                    <span className="text-[11px] text-[#6B7280] block">{g.unitName}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-[#1F2937]">{g.activePowerMW} / {g.ratedCapacityMW} MW</span>
                    <span className="text-[10px] block font-mono text-[#6B7280]">Tank: {g.fuelTankLevelPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Safety Alarms & Audit Log */}
        <div className="space-y-2">
          <h5 className="font-bold text-xs uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Active Interlocks & Audit Ledger</span>
          </h5>
          <div className="rounded-2xl border border-[#E6E1D7] p-3 text-xs space-y-2 bg-[#FAF8F5]">
            {ACTIVE_ALARMS.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-[#E6E1D7]">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    a.severity === "WARNING" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                  }`}>
                    {a.severity}
                  </span>
                  <span className="font-bold text-[#1F2937]">{a.asset}:</span>
                  <span className="text-[#4B5563]">{a.message}</span>
                </div>
                <span className="font-mono text-[10px] text-[#6B7280]">{a.code}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-between items-center border-t border-[#F3F0EA]">
          <span className="text-xs text-[#6B7280]">
            Watchdog Heartbeat: <strong className="text-emerald-700">OK (350ms RTT)</strong> · Zero-Export Interlock Armed
          </span>
          <button
            onClick={onClose}
            className="rounded-2xl bg-[#1B4D3E] px-5 py-2 text-xs font-bold text-white hover:bg-[#133E32] transition-all cursor-pointer shadow-md"
          >
            Close Telemetry View
          </button>
        </div>
      </div>
    </div>
  );
}
