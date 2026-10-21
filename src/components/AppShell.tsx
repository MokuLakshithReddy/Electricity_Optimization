import { useEffect, useState } from "react";
import { Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Menu, ShieldAlert } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { FloatingAIAssistant } from "@/components/FloatingAIAssistant";
import { WhatIfSimulatorModal } from "@/components/WhatIfSimulatorModal";
import { EnergyProvider } from "@/context/EnergyContext";
import { authService } from "@/lib/authService";
import { alerts } from "@/lib/energy";

function Clock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-xs font-semibold tabular-nums text-[#6B7280]">{now}</span>;
}

export function AppShell() {
  return (
    <EnergyProvider>
      <AppShellContent />
    </EnergyProvider>
  );
}

function AppShellContent() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(true);

  useEffect(() => {
    setMobileMenuOpen(false);
    // Enforce authentication gate: No unauthenticated access to control room
    if (typeof window !== "undefined") {
      const authed = authService.isAuthenticated();
      setIsAuthed(authed);
      if (!authed) {
        navigate({ to: "/" });
      }
    }
  }, [pathname, navigate]);

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-[#031019] flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md bg-[#081C28] border border-red-500/30 p-8 rounded-3xl space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold">Plant Access Control Required</h2>
          <p className="text-xs text-slate-400">
            No active server-verified session detected. You are being redirected to the control centre sign-in.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="px-5 py-2.5 bg-[#159A72] text-white rounded-xl text-xs font-semibold"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FAF8F5] text-[#1F2937]">
      {/* Desktop Persistent Vertical Navigation Sidebar */}
      <div className="hidden lg:block">
        <Sidebar onOpenWhatIf={() => setSimulatorOpen(true)} />
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 bg-[#FAF8F5]">
            <Sidebar onOpenWhatIf={() => setSimulatorOpen(true)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Operational Header Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[#E6E1D7] bg-[#FAF8F5]/90 px-4 backdrop-blur-md sm:px-6">
          <button
            className="rounded-xl p-2 text-[#6B7280] hover:bg-[#F3F0EA] lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              placeholder="Search plant assets, feeders, reports…"
              className="h-10 w-full rounded-2xl border border-[#E6E1D7] bg-white pl-9 pr-3 text-xs outline-none placeholder:text-[#9CA3AF] focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-bold text-[#1B4D3E] border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Plant Grid Online</span>
            </div>
            <Clock />

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-xl p-2 text-[#6B7280] hover:bg-white hover:text-[#1F2937] transition-colors border border-transparent hover:border-[#E6E1D7]"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
              </button>
              <AnimatePresence>
                {notifOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    className="absolute right-0 mt-2 w-80 rounded-3xl bg-white border border-[#E6E1D7] p-4 shadow-xl z-50"
                  >
                    <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Notification Centre
                    </p>
                    <div className="max-h-80 space-y-1.5 overflow-y-auto">
                      {alerts.map((a) => (
                        <div key={a.id} className="rounded-2xl p-3 bg-[#FAF8F5] border border-[#E6E1D7] hover:border-[#1B4D3E]/30 transition-all">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-[#1F2937]">{a.title}</p>
                            <span className="shrink-0 text-[10px] text-[#6B7280]">
                              {a.time}
                            </span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-[#6B7280]">{a.detail}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* User Profile Badge */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#E6E1D7] bg-white py-1 pl-1 pr-3 shadow-2xs">
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-[#1B4D3E] text-xs font-bold text-white">
                EM
              </div>
              <span className="hidden text-xs font-semibold text-[#1F2937] sm:block">
                Energy Manager
              </span>
            </div>
          </div>
        </header>

        {/* Main Route Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Floating AI Assistant Launcher Widget & Copilot Drawer */}
      <FloatingAIAssistant />

      {/* Interactive What-If Simulator Modal */}
      <WhatIfSimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
      />
    </div>
  );
}
