import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Waves,
  Sparkles,
  LineChart,
  Boxes,
  Leaf,
  Scale,
  Bell,
  FileText,
  Settings,
  Zap,
  ShieldCheck,
  Building2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/authService";

export const navItems = [
  { to: "/app/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/app/energy-flow", label: "Energy Monitor", icon: Waves },
  { to: "/app/scenarios", label: "AI Optimization", icon: Sparkles },
  { to: "/app/forecasts", label: "Forecasting", icon: LineChart },
  { to: "/app/digital-twin", label: "Battery", icon: Boxes },
  { to: "/app/carbon", label: "Carbon & ESG", icon: Leaf },
  { to: "/app/scenarios" as any, label: "What-If Simulator", icon: Scale },
  { to: "/app/copilot", label: "Alerts", icon: Bell },
  { to: "/app/reports", label: "Reports", icon: FileText },
] as const;

interface SidebarProps {
  onOpenWhatIf?: () => void;
}

export function Sidebar({ onOpenWhatIf }: SidebarProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const currentUser = authService.getCurrentUser();

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between h-screen sticky top-0 border-r border-[#E6E1D7] bg-[#FAF8F5] p-5 select-none z-30">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-2 mb-6">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1B4D3E] text-white shadow-md">
            <Zap className="h-6 w-6 text-white fill-white/20" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-lg font-bold tracking-tight text-[#1F2937]">
              IntelliGrid AI
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1B4D3E]">
              Energy Orchestrator
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active =
              pathname === item.to ||
              (item.label === "Overview" && pathname === "/app/dashboard") ||
              (item.label === "What-If Simulator" && pathname.includes("scenarios"));

            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={(e) => {
                  if (item.label === "What-If Simulator" && onOpenWhatIf) {
                    onOpenWhatIf();
                  }
                }}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[#E8F5E9] text-[#1B4D3E] font-semibold shadow-xs"
                    : "text-[#6B7280] hover:bg-[#F3F0EA] hover:text-[#1F2937]",
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    active ? "text-[#1B4D3E]" : "text-[#9CA3AF]",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div>
        {/* Settings link */}
        <Link
          to="/app/settings"
          className={cn(
            "flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all mb-4",
            pathname === "/app/settings"
              ? "bg-[#E8F5E9] text-[#1B4D3E] font-semibold"
              : "text-[#6B7280] hover:bg-[#F3F0EA] hover:text-[#1F2937]",
          )}
        >
          <Settings className="h-4 w-4 text-[#9CA3AF]" />
          <span>Settings</span>
        </Link>

        {/* Small impact sidebar prompt */}
        <div className="rounded-2xl bg-[#E8F5E9]/60 border border-[#1B4D3E]/15 p-3.5 mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1B4D3E]">
            <ShieldCheck className="h-4 w-4 text-[#1B4D3E]" />
            Plant Grid Secured
          </div>
          <p className="mt-1 text-[11px] text-[#4B5563]">
            Continuous AI load optimization active for 520 MW demand.
          </p>
        </div>

        {/* User / Plant Info Card at Bottom */}
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#E6E1D7] bg-white p-3 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#1B4D3E]/10 text-[#1B4D3E] font-bold text-xs">
              {currentUser?.name
                ? currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "OP"}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-xs font-bold text-[#1F2937] truncate">{currentUser?.role || "Operator"}</p>
              <p className="text-[10px] text-[#6B7280] truncate">{currentUser?.name || "Shift Operations"}</p>
            </div>
          </div>
          <button
            onClick={() => {
              authService.logout();
              window.location.href = "/";
            }}
            title="Sign out of control centre"
            className="text-[10px] text-[#9CA3AF] hover:text-red-600 font-semibold px-1.5 py-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer shrink-0"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
