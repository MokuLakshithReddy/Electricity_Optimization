import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { LoginCard } from "@/components/auth/LoginCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IntelliGrid AI — Predict. Optimize. Save." },
      {
        name: "description",
        content:
          "AI energy copilot for industrial plants: predict demand, optimise solar, wind, battery, grid and captive power, and cut cost and carbon.",
      },
      { property: "og:title", content: "IntelliGrid AI — Predict. Optimize. Save." },
      {
        property: "og:description",
        content: "Enterprise energy intelligence for industrial control rooms.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    navigate({ to: "/app/dashboard" });
  };

  return (
    <div className="min-h-screen bg-[#031019] text-slate-100 flex flex-col justify-center relative overflow-hidden font-sans">
      {/* Background industrial grid pattern overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#159A72_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0F6B53]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00C9D7]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12 min-h-screen flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* LEFT COLUMN: Brand + Network Visual + Telemetry KPIs (~55%) */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full">
            <BrandPanel />
          </div>

          {/* RIGHT COLUMN: Control Centre Sign In Card (~45%) */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <LoginCard onSuccess={handleLoginSuccess} />
          </div>
        </div>
      </main>
    </div>
  );
}
