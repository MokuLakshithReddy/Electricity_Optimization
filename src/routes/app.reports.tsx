import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Download, FileText, Leaf, IndianRupee, Zap, CheckCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
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
  const energyState = useEnergyState();

  // Dynamic Dataset per Period
  const reportMetrics = useMemo(() => {
    switch (period) {
      case "Daily":
        return {
          title: "Daily Energy Performance Report",
          consumed: "520",
          consumedUnit: "MWh",
          cost: "₹48.2 L",
          emissions: "214",
          emissionsUnit: "tCO₂",
          savings: "₹6.4 L",
          renewablePct: "48.2%",
          reliability: "99.97%",
          gridPct: "30.0%",
          bessPct: "12.0%",
          usageData: [
            { t: "00:00", solar: 0, wind: 45, captive: 35, grid: 60 },
            { t: "04:00", solar: 0, wind: 55, captive: 40, grid: 50 },
            { t: "08:00", solar: 65, wind: 35, captive: 42, grid: 45 },
            { t: "12:00", solar: 145, wind: 25, captive: 40, grid: 30 },
            { t: "16:00", solar: 80, wind: 40, captive: 42, grid: 40 },
            { t: "20:00", solar: 0, wind: 60, captive: 45, grid: 70 },
          ],
          costTrendData: [
            { t: "00:00", cost: 3.8, savings: 0.4 },
            { t: "04:00", cost: 3.2, savings: 0.5 },
            { t: "08:00", cost: 4.6, savings: 0.7 },
            { t: "12:00", cost: 5.1, savings: 1.1 },
            { t: "16:00", cost: 4.8, savings: 0.9 },
            { t: "20:00", cost: 6.2, savings: 1.4 },
          ],
          ledger: [
            { period: "Shift A (06:00–14:00)", energy: "185", cost: "₹16.8 L", co2: "72", renewable: "52.4%", savings: "₹2.4 L" },
            { period: "Shift B (14:00–22:00)", energy: "210", cost: "₹22.4 L", co2: "94", renewable: "42.1%", savings: "₹2.8 L" },
            { period: "Shift C (22:00–06:00)", energy: "125", cost: "₹9.0 L", co2: "48", renewable: "48.6%", savings: "₹1.2 L" },
          ],
        };
      case "Weekly":
        return {
          title: "Weekly Industrial Energy & ESG Audit",
          consumed: "11,482",
          consumedUnit: "MWh",
          cost: "₹7.84 Cr",
          emissions: "4,318",
          emissionsUnit: "tCO₂",
          savings: "₹1.24 Cr",
          renewablePct: "38.4%",
          reliability: "99.95%",
          gridPct: "32.4%",
          bessPct: "14.2%",
          usageData: [
            { t: "Mon", solar: 1400, wind: 900, captive: 2200, grid: 2600 },
            { t: "Tue", solar: 1460, wind: 1020, captive: 2180, grid: 2560 },
            { t: "Wed", solar: 1520, wind: 880, captive: 2250, grid: 2500 },
            { t: "Thu", solar: 1380, wind: 950, captive: 2210, grid: 2640 },
            { t: "Fri", solar: 1580, wind: 1100, captive: 2150, grid: 2480 },
            { t: "Sat", solar: 1620, wind: 1150, captive: 1900, grid: 2100 },
            { t: "Sun", solar: 1680, wind: 1200, captive: 1800, grid: 1950 },
          ],
          costTrendData: [
            { t: "Mon", cost: 1.18, savings: 0.18 },
            { t: "Tue", cost: 1.15, savings: 0.19 },
            { t: "Wed", cost: 1.12, savings: 0.20 },
            { t: "Thu", cost: 1.19, savings: 0.17 },
            { t: "Fri", cost: 1.10, savings: 0.21 },
            { t: "Sat", cost: 0.95, savings: 0.24 },
            { t: "Sun", cost: 0.88, savings: 0.26 },
          ],
          ledger: [
            { period: "Week 31 (28 Jul - 03 Aug)", energy: "11,200", cost: "₹7.60 Cr", co2: "4,280", renewable: "31.2%", savings: "₹1.12 Cr" },
            { period: "Week 32 (04 Aug - 10 Aug)", energy: "11,380", cost: "₹7.69 Cr", co2: "4,322", renewable: "32.1%", savings: "₹1.16 Cr" },
            { period: "Week 33 (11 Aug - 17 Aug)", energy: "11,560", cost: "₹7.78 Cr", co2: "4,364", renewable: "33.0%", savings: "₹1.20 Cr" },
            { period: "Week 34 (18 Aug - 24 Aug)", energy: "11,740", cost: "₹7.87 Cr", co2: "4,406", renewable: "33.9%", savings: "₹1.24 Cr" },
            { period: "Week 35 (25 Aug - 31 Aug)", energy: "11,920", cost: "₹7.96 Cr", co2: "4,448", renewable: "34.8%", savings: "₹1.28 Cr" },
          ],
        };
      case "Monthly":
        return {
          title: "Monthly Enterprise Executive Energy Report",
          consumed: "48,620",
          consumedUnit: "MWh",
          cost: "₹32.6 Cr",
          emissions: "18,420",
          emissionsUnit: "tCO₂",
          savings: "₹4.82 Cr",
          renewablePct: "42.6%",
          reliability: "99.98%",
          gridPct: "28.5%",
          bessPct: "15.8%",
          usageData: [
            { t: "Jan", solar: 5800, wind: 3800, captive: 9200, grid: 11000 },
            { t: "Feb", solar: 6100, wind: 4100, captive: 9000, grid: 10500 },
            { t: "Mar", solar: 6900, wind: 3900, captive: 8800, grid: 10200 },
            { t: "Apr", solar: 7400, wind: 3600, captive: 8900, grid: 9800 },
            { t: "May", solar: 8100, wind: 3400, captive: 9100, grid: 9600 },
            { t: "Jun", solar: 7800, wind: 4200, captive: 8700, grid: 9400 },
            { t: "Jul", solar: 6200, wind: 5100, captive: 9300, grid: 9900 },
            { t: "Aug", solar: 6500, wind: 4800, captive: 9200, grid: 9700 },
          ],
          costTrendData: [
            { t: "Jan", cost: 4.5, savings: 0.55 },
            { t: "Feb", cost: 4.3, savings: 0.60 },
            { t: "Mar", cost: 4.1, savings: 0.64 },
            { t: "Apr", cost: 3.9, savings: 0.68 },
            { t: "May", cost: 3.8, savings: 0.72 },
            { t: "Jun", cost: 3.7, savings: 0.76 },
            { t: "Jul", cost: 3.9, savings: 0.71 },
            { t: "Aug", cost: 3.8, savings: 0.75 },
          ],
          ledger: [
            { period: "Jan 2026", energy: "49,200", cost: "₹34.1 Cr", co2: "19,200", renewable: "39.4%", savings: "₹4.10 Cr" },
            { period: "Feb 2026", energy: "48,100", cost: "₹33.2 Cr", co2: "18,800", renewable: "40.8%", savings: "₹4.35 Cr" },
            { period: "Mar 2026", energy: "49,800", cost: "₹33.8 Cr", co2: "18,600", renewable: "42.1%", savings: "₹4.60 Cr" },
            { period: "Apr 2026", energy: "47,900", cost: "₹32.1 Cr", co2: "17,900", renewable: "43.5%", savings: "₹4.80 Cr" },
            { period: "May 2026", energy: "50,200", cost: "₹33.5 Cr", co2: "18,200", renewable: "44.2%", savings: "₹5.10 Cr" },
          ],
        };
    }
  }, [period]);

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
          <span className="text-xs font-bold text-emerald-800 bg-[#E8F5E9] px-3 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Audit-verified</span>
          </span>
        </div>

        <table className="w-full min-w-[680px] text-xs sm:text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wider text-[#6B7280] border-b border-[#F3F0EA]">
              <th className="pb-3">Period</th>
              <th className="pb-3">Energy</th>
              <th className="pb-3">Landed Cost</th>
              <th className="pb-3">CO₂ Emissions</th>
              <th className="pb-3">Renewable %</th>
              <th className="pb-3">Verified Savings</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
