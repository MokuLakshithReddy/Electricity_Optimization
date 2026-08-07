import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, CircleCheck, Cpu, Database, TrendingUp } from "lucide-react";
import { inr } from "@/lib/energy";
import { confidenceLabel, type SmartRecommendation } from "@/lib/intel";
import { cn } from "@/lib/utils";

const toneVar: Record<string, string> = {
  eco: "var(--eco)",
  cyan: "var(--cyan)",
  primary: "var(--primary)",
  warn: "var(--warn)",
};

export function ConfidenceRing({
  value,
  size = 46,
  tone = "cyan",
}: {
  value: number;
  size?: number;
  tone?: string;
}) {
  const r = 18;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="var(--muted)" strokeWidth="4" />
        <motion.circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          stroke={toneVar[tone] ?? "var(--cyan)"}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (value / 100) * c }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono text-[10px] font-semibold tabular-nums">
        {value}%
      </span>
    </div>
  );
}

export function ExplainableCard({
  rec,
  defaultOpen = false,
  delay = 0,
}: {
  rec: SmartRecommendation;
  defaultOpen?: boolean;
  delay?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const color = toneVar[rec.tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass rounded-2xl p-4"
    >
      <div className="flex items-start gap-3">
        <ConfidenceRing value={rec.confidence} tone={rec.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: `color-mix(in oklab, ${color} 16%, transparent)`, color }}
            >
              {rec.category}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">{rec.time}</span>
            <span className="text-[10px] text-muted-foreground">
              {confidenceLabel(rec.confidence)} confidence · risk {rec.risk.toLowerCase()}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold">{rec.title}</p>
          <p className="text-xs text-muted-foreground">{rec.action}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
          <p className="text-muted-foreground">Savings</p>
          <p className="font-semibold text-eco">{rec.savings ? inr(rec.savings) : "—"}</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
          <p className="text-muted-foreground">CO₂</p>
          <p className="font-semibold text-cyan">
            {rec.carbon >= 0 ? "−" : "+"}
            {Math.abs(rec.carbon).toFixed(1)} t
          </p>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
          <p className="text-muted-foreground">Signals</p>
          <p className="font-semibold">{rec.dataPoints.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-3 flex w-full items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-2">
          <Brain className="h-3.5 w-3.5 text-cyan" /> Why did the AI decide this?
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="text-xs leading-relaxed text-foreground/90">{rec.why}</p>

              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Decision factors
                </p>
                {rec.factors.map((f) => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>{f.label}</span>
                      <span className="font-mono text-muted-foreground">{f.weight}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${f.weight}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{f.detail}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-warn/25 bg-warn/10 p-2.5">
                <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-warn">
                  <TrendingUp className="h-3 w-3" /> If we ignore this
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">{rec.counterfactual}</p>
              </div>

              <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Cpu className="h-3 w-3" /> {rec.model}
                </span>
                <span className="flex items-center gap-1">
                  <Database className="h-3 w-3" /> {rec.dataPoints.toLocaleString("en-IN")} signals
                </span>
                <span className="flex items-center gap-1">
                  <CircleCheck className="h-3 w-3 text-eco" /> Audit-logged
                </span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
