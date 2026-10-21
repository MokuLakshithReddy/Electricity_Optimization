import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { ExplainableCard } from "@/components/ExplainableCard";
import { smartRecommendations } from "@/lib/intel";
import { inr } from "@/lib/energy";

export function RecommendationTimeline({ compact = false }: { compact?: boolean }) {
  const total = smartRecommendations.reduce((a, r) => a + r.savings, 0);
  const carbon = smartRecommendations.reduce((a, r) => a + Math.max(0, r.carbon), 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan" />
          <h2 className="text-sm font-semibold">Next 24-hour AI recommendation timeline</h2>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="text-muted-foreground">
            Planned savings <span className="font-semibold text-eco">{inr(Math.round(total))}</span>
          </span>
          <span className="text-muted-foreground">
            CO₂ avoided <span className="font-semibold text-cyan">{carbon.toFixed(1)} t</span>
          </span>
        </div>
      </div>

      <div className="relative pl-6">
        <div
          className="absolute left-[7px] top-1 bottom-1 w-px"
          style={{
            background: "linear-gradient(to bottom, var(--primary), var(--eco), transparent)",
          }}
        />
        <div className="space-y-4">
          {smartRecommendations.map((rec, i) => (
            <div key={rec.id} className="relative">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="absolute -left-[22px] top-5 h-3 w-3 rounded-full border-2 border-background"
                style={{
                  background:
                    rec.tone === "eco"
                      ? "var(--eco)"
                      : rec.tone === "warn"
                        ? "var(--warn)"
                        : rec.tone === "cyan"
                          ? "var(--cyan)"
                          : "var(--primary)",
                }}
              />
              <ExplainableCard rec={rec} delay={i * 0.05} defaultOpen={!compact && i === 0} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
