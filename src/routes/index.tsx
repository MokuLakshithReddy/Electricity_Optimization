import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { LoginCard } from "@/components/auth/LoginCard";
import { LumenRoofHero } from "@/components/LumenRoofHero";
import { X, Activity, ShieldCheck, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen Roof · IntelliGrid AI — Predict. Optimize. Save." },
      {
        name: "description",
        content:
          "Forget the energy market, weather conditions and seasons. AI energy copilot for industrial plants: predict demand, optimise solar, wind, battery, grid and captive power, and cut cost and carbon.",
      },
      { property: "og:title", content: "Lumen Roof · IntelliGrid AI — Predict. Optimize. Save." },
      {
        property: "og:description",
        content: "Enterprise energy intelligence and solar optimization for industrial control rooms.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [signInOpen, setSignInOpen] = useState(false);
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [headlineVariant, setHeadlineVariant] = useState<"enterprise" | "lumen">("enterprise");

  const handleLoginSuccess = () => {
    setSignInOpen(false);
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="relative min-h-screen bg-[#0b1426] text-slate-100 overflow-x-hidden font-sans">
      {/* 1. Lumen Roof — Morning / Night Fog Hero (Full Viewport) */}
      <LumenRoofHero
        onOpenSignIn={() => setSignInOpen(true)}
        onOpenTelemetry={() => setTelemetryOpen(true)}
        headlineVariant={headlineVariant}
        onToggleHeadlineVariant={() =>
          setHeadlineVariant((v) => (v === "enterprise" ? "lumen" : "enterprise"))
        }
      />

      {/* 2. Seamless Below-the-Fold Industrial Architecture & Telemetry Section */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24 border-t border-white/10 bg-[#0b1426]/80 backdrop-blur-md">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* LEFT COLUMN: Brand + Network Visual + Telemetry KPIs */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full">
            <BrandPanel />
          </div>

          {/* RIGHT COLUMN: Control Centre Sign In Card */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <LoginCard onSuccess={handleLoginSuccess} />
          </div>
        </div>
      </section>

      {/* 3. Glassmorphic Sign-In Modal (when triggered via Hero CTA) */}
      {signInOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-[480px]">
            <button
              type="button"
              onClick={() => setSignInOpen(false)}
              className="absolute -top-3 -right-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white text-slate-800 shadow-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close sign in dialog"
            >
              <X className="w-4 h-4" />
            </button>
            <LoginCard onSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}

      {/* 4. Glassmorphic Telemetry & KPIs Modal */}
      {telemetryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl rounded-[28px] border border-white/20 bg-[#0d1726]/90 p-6 lg:p-8 backdrop-blur-xl shadow-2xl text-white">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white">Plant Telemetry & Energy Grid</h3>
                  <p className="text-xs text-slate-400">Live multi-source industrial orchestration telemetry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTelemetryOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Close telemetry modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-6 space-y-6 max-h-[75vh] overflow-y-auto pr-1">
              <BrandPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
