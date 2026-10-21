import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Download, FileText, Leaf, IndianRupee, Zap, CheckCircle, ShieldCheck, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { queryLedgerReport, exportLedgerToCsv, buildHistoricalLedger, verifyLedgerCryptographicIntegrity } from "@/lib/energyLedger";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEnergyState } from "@/context/EnergyContext";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "Energy Reports — IntelliGrid AI" },
      {
        name: "description",
        content:
          "Daily, weekly and monthly energy, cost, carbon and renewable performance reports with PDF export.",
      },
      { property: "og:title", content: "Energy Reports — IntelliGrid AI" },
      {
        property: "og:description",
        content: "Board-ready energy and sustainability reporting for Tata Steel.",
      },
    ],
  }),
  component: ReportsPage,
});

export type ReportPeriod = "Daily" | "Weekly" | "Monthly";

export function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("Weekly");
  const [integrityStatus, setIntegrityStatus] = useState<{
    verified: boolean;
    blocks: number;
    isValid: boolean;
  } | null>(null);
  const energyState = useEnergyState();

  // Query historical energy ledger dynamically based on selected period
  const ledgerData = useMemo(() => queryLedgerReport(period), [period]);

  const reportMetrics = useMemo(() => ({
    title: ledgerData.title,
    consumed: ledgerData.totalConsumedMWh,
    consumedUnit: "MWh",
    cost: ledgerData.totalCostFormatted,
    emissions: ledgerData.totalEmissionsFormatted,
    emissionsUnit: "tCO₂",
    savings: ledgerData.totalSavingsFormatted,
    renewablePct: ledgerData.avgRenewablePct,
    reliability: ledgerData.avgReliability,
    gridPct: ledgerData.gridSharePct,
    bessPct: ledgerData.bessSharePct,
    usageData: ledgerData.usageChartData,
    costTrendData: ledgerData.costTrendData,
    ledger: ledgerData.ledgerRows,
  }), [ledgerData]);

  // Cryptographic Ledger Verification Action
  const handleVerifyLedger = () => {
    const fullLedger = buildHistoricalLedger();
    const res = verifyLedgerCryptographicIntegrity(fullLedger);
    if (res.isValid) {
      setIntegrityStatus({ verified: true, blocks: res.verifiedBlocks, isValid: true });
      toast.success(`Ledger verified: All ${res.verifiedBlocks} interval blocks validated with SHA-256 chain integrity.`);
    } else {
      setIntegrityStatus({ verified: true, blocks: res.verifiedBlocks, isValid: false });
      toast.error(`Verification failed at block #${res.brokenBlockIndex}: hash mismatch!`);
    }
  };

  // CSV Ledger Audit Export Action
  const handleExportCSV = () => {
    const csvContent = exportLedgerToCsv(72);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `IntelliGrid_Energy_Ledger_${period}_Audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Cryptographically signed interval energy ledger exported to CSV.");
  };



  // PDF Export Action
  const handleExportPDF = () => {
    const reportTitle = `${period} Energy & Sustainability Audit Report`;
    const genTime = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const printContent = `
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; color: #1F2937; padding: 32px; }
            h1 { color: #1B4D3E; font-size: 24px; margin-bottom: 4px; }
            p.sub { color: #6B7280; font-size: 12px; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
            .card { border: 1px solid #E6E1D7; border-radius: 12px; padding: 12px; background: #FAF8F5; }
            .card label { font-size: 10px; color: #6B7280; text-transform: uppercase; font-weight: bold; }
            .card val { font-size: 18px; font-weight: bold; color: #1F2937; display: block; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #E6E1D7; padding: 8px 12px; text-align: left; }
            th { background: #1B4D3E; color: white; }
          </style>
        </head>
        <body>
          <h1>INTELLIGRID AI — ${reportTitle.toUpperCase()}</h1>
          <p class="sub">Plant: Tata Steel Jamshedpur Works · Generated: ${genTime} · Period: ${period}</p>

          <div class="grid">
            <div class="card"><label>Energy Consumed</label><val>${reportMetrics.consumed} ${reportMetrics.consumedUnit}</val></div>
            <div class="card"><label>Electricity Cost</label><val>${reportMetrics.cost}</val></div>
            <div class="card"><label>Carbon Emissions</label><val>${reportMetrics.emissions} ${reportMetrics.emissionsUnit}</val></div>
            <div class="card"><label>Verified Savings</label><val>${reportMetrics.savings}</val></div>
          </div>

          <div class="grid">
            <div class="card"><label>Renewable Share</label><val>${reportMetrics.renewablePct}</val></div>
            <div class="card"><label>Power Reliability</label><val>${reportMetrics.reliability}</val></div>
            <div class="card"><label>Grid Dependency</label><val>${reportMetrics.gridPct}</val></div>
            <div class="card"><label>Battery Utilization</label><val>${reportMetrics.bessPct}</val></div>
          </div>

          <h3>Ledger Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Period</th>
                <th>Energy (MWh)</th>
                <th>Landed Cost</th>
                <th>CO₂ Emissions</th>
                <th>Renewable %</th>
                <th>Savings</th>
              </tr>
            </thead>
            <tbody>
              ${reportMetrics.ledger
                .map(
                  (row) => `
                <tr>
                  <td>${row.period}</td>
                  <td>${row.energy}</td>
                  <td>${row.cost}</td>
                  <td>${row.co2} t</td>
                  <td>${row.renewable}</td>
                  <td>${row.savings}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    toast.success(`${period} Energy Report exported successfully!`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F2937]">
            Reports & Compliance
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Energy, cost and carbon performance across Tata Steel Jamshedpur
          </p>
        </div>

        {/* Right Top Controls: Segmented Period Selector & PDF Export Button */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* HIGH CONTRAST SEGMENTED PERIOD SELECTOR */}
          <div className="flex items-center gap-1 rounded-full bg-[#FAF8F5] border border-[#E6E1D7] p-1 shadow-2xs">
            {(["Daily", "Weekly", "Monthly"] as ReportPeriod[]).map((p) => {
              const isActive = period === p;
              return (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  aria-pressed={isActive}
                  className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E] ${
                    isActive
                      ? "bg-[#1B4D3E] text-white shadow-xs"
                      : "text-[#4B5563] hover:bg-[#E8F5E9] hover:text-[#1B4D3E]"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* EXPORT CSV LEDGER BUTTON */}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E6E1D7] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#1B4D3E] hover:bg-[#FAF8F5] transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 text-[#1B4D3E]" />
            <span>Export CSV Ledger</span>
          </button>

          {/* EXPORT PDF BUTTON */}
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 rounded-full bg-[#1B4D3E] px-5 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#133E32] transition-all shadow-md active:scale-95 cursor-pointer border-none"
          >
            <Download className="h-4 w-4 text-white" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 4 Key Metrics Cards (Updated dynamically by period selection) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Energy Consumed */}
        <div className="rounded-3xl bg-white border border-[#E6E1D7] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Energy Consumed
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-50 text-[#2563EB]">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold text-[#1F2937]">
                {reportMetrics.consumed}
              </span>
              <span className="text-sm font-bold text-[#6B7280]">
                {reportMetrics.consumedUnit}
              </span>
            </div>
            <p className="text-xs text-[#6B7280] font-medium mt-1">
              Period total load
            </p>
          </div>
        </div>

        {/* Card 2: Electricity Cost */}
        <div className="rounded-3xl bg-white border border-[#E6E1D7] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Electricity Cost
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="font-display text-3xl font-extrabold text-[#1F2937]">
              {reportMetrics.cost}
            </span>
            <p className="text-xs text-[#6B7280] font-medium mt-1">
              Landed tariff exposure
            </p>
          </div>
        </div>

        {/* Card 3: Carbon Emissions */}
        <div className="rounded-3xl bg-white border border-[#E6E1D7] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Carbon Emissions
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Leaf className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-extrabold text-[#1F2937]">
                {reportMetrics.emissions}
              </span>
              <span className="text-sm font-bold text-[#6B7280]">
                {reportMetrics.emissionsUnit}
              </span>
            </div>
            <p className="text-xs text-emerald-700 font-medium mt-1">
              Scope 1 + Scope 2 emissions
            </p>
          </div>
        </div>

        {/* Card 4: Verified Savings */}
        <div className="rounded-3xl bg-white border border-[#E6E1D7] p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Verified Savings
            </span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#E8F5E9] text-[#1B4D3E]">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="font-display text-3xl font-extrabold text-[#1B4D3E]">
              {reportMetrics.savings}
            </span>
            <p className="text-xs text-[#1B4D3E] font-medium mt-1 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-[#1B4D3E]" />
              <span>AI Optimization verified</span>
            </p>
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Source-wise Consumption Stacked Bar Chart */}
        <div className="xl:col-span-2 rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1F2937]">
                Source-wise consumption
              </h3>
              <p className="text-xs text-[#6B7280]">
                {period} energy mix breakdown (MWh)
              </p>
            </div>
            <span className="text-xs font-bold text-[#1B4D3E] bg-[#E8F5E9] px-3 py-1 rounded-full border border-emerald-200">
              Renewable share {reportMetrics.renewablePct}
            </span>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportMetrics.usageData}>
                <CartesianGrid stroke="#F3F0EA" vertical={false} />
                <XAxis dataKey="t" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #E6E1D7",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="solar" stackId="a" fill="#F59E0B" name="Solar" />
                <Bar dataKey="wind" stackId="a" fill="#0284C7" name="Wind" />
                <Bar dataKey="captive" stackId="a" fill="#9333EA" name="Captive" />
                <Bar dataKey="grid" stackId="a" fill="#2563EB" radius={[6, 6, 0, 0]} name="Grid" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost & Savings Trend Chart */}
        <div className="rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-xs space-y-4">
          <div>
            <h3 className="font-display text-lg font-bold text-[#1F2937]">
              Cost & savings trend
            </h3>
            <p className="text-xs text-[#6B7280]">{period} trend progression</p>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportMetrics.costTrendData}>
                <CartesianGrid stroke="#F3F0EA" vertical={false} />
                <XAxis dataKey="t" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #E6E1D7",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="cost" stroke="#2563EB" strokeWidth={2.5} dot={false} name="Cost" />
                <Line type="monotone" dataKey="savings" stroke="#10B981" strokeWidth={2.5} dot={false} name="Savings" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Dynamic Report Ledger Table */}
      <div className="rounded-3xl bg-white border border-[#E6E1D7] p-6 shadow-xs space-y-4 overflow-x-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-[#1F2937]">
              {period} report ledger
            </h3>
            <p className="text-xs text-[#6B7280]">
              Audited historical energy, cost and carbon breakdown
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleVerifyLedger}
              className="text-xs font-bold text-[#1B4D3E] bg-[#FAF8F5] hover:bg-[#E8F5E9] px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border border-[#E6E1D7] transition-colors cursor-pointer shadow-2xs"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verify Blockchain Integrity (SHA-256)</span>
            </button>
            <span className="text-xs font-bold text-emerald-800 bg-[#E8F5E9] px-3 py-1.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
              <span>Cryptographically Chained</span>
            </span>
          </div>
        </div>

        {integrityStatus && (
          <div className={`p-3 rounded-2xl text-xs flex items-center justify-between border ${
            integrityStatus.isValid ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-900"
          }`}>
            <span className="font-medium">
              {integrityStatus.isValid
                ? `Cryptographic Audit Passed: All ${integrityStatus.blocks} interval blocks verified with authentic SHA-256 signatures and zero chain breaks.`
                : "Tamper Detected: Blockchain verification failed. Hash sequence broken."}
            </span>
            <span className="font-mono text-[11px] font-bold">FIPS 180-4 SHA-256 Verified</span>
          </div>
        )}

        <table className="w-full min-w-[680px] text-xs sm:text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#F3F0EA]">
              <th className="pb-3">Period</th>
              <th className="pb-3">Energy</th>
              <th className="pb-3">Landed Cost</th>
              <th className="pb-3">CO₂ Emissions</th>
              <th className="pb-3">Renewable %</th>
              <th className="pb-3">Verified Savings</th>
              <th className="pb-3 text-right">Block Hash (SHA-256)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F0EA]">
            {reportMetrics.ledger.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#FAF8F5] transition-colors">
                <td className="py-3.5 font-bold text-[#1F2937]">{row.period}</td>
                <td className="py-3.5 font-mono text-[#4B5563]">{row.energy} MWh</td>
                <td className="py-3.5 font-mono font-semibold text-[#1F2937]">{row.cost}</td>
                <td className="py-3.5 font-mono text-[#4B5563]">{row.co2} t</td>
                <td className="py-3.5 font-mono font-bold text-emerald-700">{row.renewable}</td>
                <td className="py-3.5 font-mono font-bold text-[#1B4D3E]">{row.savings}</td>
                <td className="py-3.5 font-mono text-[11px] text-right text-[#6B7280]">
                  <span className="bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E6E1D7]">
                    0x{row.hashShort}...
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
