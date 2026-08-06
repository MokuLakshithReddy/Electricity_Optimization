import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("glass rounded-2xl p-5", className)}
    >
      {children}
    </motion.div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

export function Metric({
  label,
  value,
  unit,
  hint,
  tone = "primary",
  icon,
  delay = 0,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  tone?: "primary" | "cyan" | "eco" | "warn" | "destructive";
  icon?: ReactNode;
  delay?: number;
}) {
  const toneMap: Record<string, string> = {
    primary: "text-primary",
    cyan: "text-cyan",
    eco: "text-eco",
    warn: "text-warn",
    destructive: "text-destructive",
  };
  return (
    <GlassCard delay={delay} className="group relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
        style={{ background: "var(--gradient-brand)" }}
      />
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className={cn("opacity-80", toneMap[tone])}>{icon}</span>
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-3xl font-semibold tabular-nums">{value}</span>
        {unit ? <span className="text-sm text-muted-foreground">{unit}</span> : null}
      </div>
      {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </GlassCard>
  );
}

export function Gauge({
  value,
  label,
  suffix = "%",
  color = "var(--eco)",
}: {
  value: number;
  label: string;
  suffix?: string;
  color?: string;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--muted)" strokeWidth="12" />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="-mt-24 text-center">
        <div className="font-display text-2xl font-semibold tabular-nums">
          {pct.toFixed(0)}
          <span className="text-base text-muted-foreground">{suffix}</span>
        </div>
      </div>
      <p className="mt-14 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

export function StatusPill({
  status,
  tone = "eco",
}: {
  status: string;
  tone?: "eco" | "warn" | "destructive" | "cyan" | "muted";
}) {
  const map: Record<string, string> = {
    eco: "bg-eco/15 text-eco border-eco/30",
    warn: "bg-warn/15 text-warn border-warn/30",
    destructive: "bg-destructive/15 text-destructive border-destructive/30",
    cyan: "bg-cyan/15 text-cyan border-cyan/30",
    muted: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        map[tone],
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 px-6 py-14 text-center">
      <div className="mb-4 rounded-2xl bg-muted/60 p-4 text-muted-foreground">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
