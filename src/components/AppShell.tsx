import { useEffect, useState } from "react";
import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Waves,
  LineChart,
  Bot,
  Boxes,
  FileText,
  Settings,
  Search,
  Bell,
  Menu,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { alerts } from "@/lib/energy";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/ui-kit";

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/executive", label: "Executive", icon: Briefcase },
  { to: "/app/energy-flow", label: "Energy Network", icon: Waves },
  { to: "/app/forecasts", label: "Forecasts", icon: LineChart },
  { to: "/app/copilot", label: "AI Copilot", icon: Bot },
  { to: "/app/digital-twin", label: "Digital Twin", icon: Boxes },
  { to: "/app/scenarios", label: "Scenarios & ROI", icon: Scale },
  { to: "/app/carbon", label: "Carbon & ESG", icon: Leaf },
  { to: "/app/reports", label: "Reports", icon: FileText },
  { to: "/app/settings", label: "Settings", icon: Settings },
] as const;

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
  return <span className="font-mono text-sm tabular-nums text-muted-foreground">{now}</span>;
}

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 border-r border-border/60 bg-sidebar/80 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">IntelliGrid AI</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Energy Copilot
            </p>
          </div>
        </div>

        <nav className="mt-4 space-y-1 px-3">
          {nav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-brand-gradient"
                  />
                ) : null}
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-3 bottom-4 glass rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-eco" />
            Plant grid secured
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Jamshedpur Works · Control Centre
          </p>
        </div>
      </aside>

      {open ? (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-background/70 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search assets, feeders, reports…"
              className="h-10 w-full rounded-xl border border-input bg-muted/40 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/50"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <StatusPill status="Plant Online" tone="eco" />
            <Clock />
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              </button>
              <AnimatePresence>
                {notifOpen ? (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    className="glass absolute right-0 mt-2 w-80 rounded-2xl p-3"
                  >
                    <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Notification Centre
                    </p>
                    <div className="max-h-80 space-y-1 overflow-y-auto">
                      {alerts.map((a) => (
                        <div key={a.id} className="rounded-xl p-2.5 hover:bg-muted/60">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{a.title}</p>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {a.time}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">{a.detail}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 py-1 pl-1 pr-3">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-gradient text-xs font-semibold text-primary-foreground">
                RK
              </div>
              <span className="hidden text-xs sm:block">R. Kulkarni</span>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
