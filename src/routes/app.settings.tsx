import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Bot, Building2, Moon, Plug, ReceiptIndianRupee } from "lucide-react";
import { toast } from "sonner";
import { GlassCard, PageHeader, StatusPill } from "@/components/ui-kit";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — IntelliGrid AI" },
      {
        name: "description",
        content:
          "Configure company details, energy sources, tariffs, AI behaviour and notification preferences.",
      },
      { property: "og:title", content: "Settings — IntelliGrid AI" },
      { property: "og:description", content: "Plant, tariff and AI configuration." },
    ],
  }),
  component: SettingsPage,
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        defaultValue={value}
        className="mt-1.5 h-10 w-full rounded-xl border border-input bg-muted/40 px-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
      />
    </label>
  );
}

function Toggle({
  label,
  hint,
  defaultOn = true,
}: {
  label: string;
  hint?: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/30 p-3 text-left"
    >
      <span>
        <span className="block text-sm">{label}</span>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </span>
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${on ? "bg-brand-gradient" : "bg-muted"}`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-background transition-all ${on ? "left-6" : "left-1"}`}
        />
      </span>
    </button>
  );
}

function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Plant configuration, tariffs and copilot behaviour"
        right={
          <button
            onClick={() => toast.success("Configuration saved")}
            className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Save changes
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard delay={0.02}>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Company information</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Company" value="Tata Steel Limited" />
            <Field label="Plant" value="Jamshedpur Works" />
            <Field label="Control centre" value="Energy Control Centre — Block C" />
            <Field label="Contracted demand" value="720 MW" />
          </div>
        </GlassCard>

        <GlassCard delay={0.05}>
          <div className="flex items-center gap-2">
            <Plug className="h-4 w-4 text-cyan" />
            <h2 className="text-sm font-semibold">Energy sources</h2>
          </div>
          <div className="mt-4 space-y-2">
            {[
              ["Solar Park", "250 MWp"],
              ["Wind Farm", "150 MW"],
              ["Battery Storage", "320 MWh"],
              ["Grid Import", "400 MW"],
              ["Captive Plant", "200 MW"],
              ["Diesel Gensets", "4 × 15 MW"],
            ].map(([n, c]) => (
              <div
                key={n}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm"
              >
                <span>{n}</span>
                <span className="flex items-center gap-3 text-xs text-muted-foreground">
                  {c}
                  <StatusPill status="Enabled" tone="eco" />
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard delay={0.08}>
          <div className="flex items-center gap-2">
            <ReceiptIndianRupee className="h-4 w-4 text-warn" />
            <h2 className="text-sm font-semibold">Tariff configuration</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Off-peak (₹/kWh)" value="4.20" />
            <Field label="Normal (₹/kWh)" value="7.40" />
            <Field label="Peak (₹/kWh)" value="11.80" />
            <Field label="Demand charge (₹/kVA)" value="420" />
            <Field label="Peak window" value="18:00 – 21:00" />
            <Field label="Off-peak window" value="23:00 – 06:00" />
          </div>
        </GlassCard>

        <GlassCard delay={0.11}>
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-eco" />
            <h2 className="text-sm font-semibold">AI settings</h2>
          </div>
          <div className="mt-4 space-y-2">
            <Toggle label="Autonomous dispatch" hint="Let the copilot execute low-risk actions" />
            <Toggle
              label="Aggressive cost optimisation"
              hint="Prioritise ₹ over reserve margin"
              defaultOn={false}
            />
            <Toggle label="Carbon-first mode" hint="Weight emissions above marginal cost" />
            <Toggle label="Explain every recommendation" />
          </div>
        </GlassCard>

        <GlassCard delay={0.14}>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Notification preferences</h2>
          </div>
          <div className="mt-4 space-y-2">
            <Toggle label="Critical asset alarms" />
            <Toggle label="Tariff window reminders" />
            <Toggle label="Daily report digest" />
            <Toggle label="Maintenance due alerts" defaultOn={false} />
          </div>
        </GlassCard>

        <GlassCard delay={0.17}>
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-cyan" />
            <h2 className="text-sm font-semibold">Appearance</h2>
          </div>
          <div className="mt-4 space-y-2">
            <Toggle label="Control-room dark mode" hint="Optimised for low-light operations" />
            <Toggle label="Reduced motion" defaultOn={false} />
            <Toggle label="High-contrast alarms" />
          </div>
        </GlassCard>

        <LiveDataSettingsCard />
      </div>
    </div>
  );
}

function LiveDataSettingsCard() {
  const [mode, setMode] = useState<string>(
    () => localStorage.getItem("intelligrid_data_mode") || "open-meteo",
  );
  const [apiUrl, setApiUrl] = useState<string>(
    () =>
      localStorage.getItem("intelligrid_custom_api_url") ||
      "https://api.intelligrid.example.com/v1/telemetry",
  );

  const handleSelectMode = (newMode: string) => {
    setMode(newMode);
    localStorage.setItem("intelligrid_data_mode", newMode);
    toast.success(
      `Live data source set to ${newMode === "open-meteo" ? "Open-Meteo API" : newMode === "custom-api" ? "Custom REST API" : "Mock Simulation"}`,
    );
  };

  const handleSaveApiUrl = (url: string) => {
    setApiUrl(url);
    localStorage.setItem("intelligrid_custom_api_url", url);
  };

  return (
    <GlassCard delay={0.2} className="lg:col-span-2 border-emerald-500/30 bg-emerald-950/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plug className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-emerald-300">Real Live Data Integration</h2>
        </div>
        <StatusPill
          status={
            mode === "open-meteo"
              ? "Connected (Open-Meteo)"
              : mode === "custom-api"
                ? "Custom API"
                : "Mock Mode"
          }
          tone={mode === "mock" ? "warn" : "eco"}
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Choose your live data stream source for plant telemetry, weather irradiance, and renewable
        generation.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => handleSelectMode("open-meteo")}
          className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all ${
            mode === "open-meteo"
              ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
              : "border-border/60 bg-muted/20 hover:bg-muted/40"
          }`}
        >
          <span className="text-sm font-medium text-foreground">Open-Meteo API</span>
          <span className="text-xs text-muted-foreground">
            Real-time solar radiation (W/m²), wind speed (m/s), and weather physics.
          </span>
        </button>

        <button
          onClick={() => handleSelectMode("custom-api")}
          className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all ${
            mode === "custom-api"
              ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
              : "border-border/60 bg-muted/20 hover:bg-muted/40"
          }`}
        >
          <span className="text-sm font-medium text-foreground">Custom REST API</span>
          <span className="text-xs text-muted-foreground">
            Connect directly to an industrial IoT backend or external HTTP endpoint.
          </span>
        </button>

        <button
          onClick={() => handleSelectMode("mock")}
          className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-all ${
            mode === "mock"
              ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500"
              : "border-border/60 bg-muted/20 hover:bg-muted/40"
          }`}
        >
          <span className="text-sm font-medium text-foreground">Mock Simulation</span>
          <span className="text-xs text-muted-foreground">
            Fallback internal deterministic pseudo-random generator.
          </span>
        </button>
      </div>

      {mode === "custom-api" && (
        <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3">
          <label className="block">
            <span className="text-xs text-muted-foreground">Custom API Endpoint URL</span>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => handleSaveApiUrl(e.target.value)}
              placeholder="https://api.yourplant.com/v1/telemetry"
              className="mt-1.5 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </label>
        </div>
      )}
    </GlassCard>
  );
}
