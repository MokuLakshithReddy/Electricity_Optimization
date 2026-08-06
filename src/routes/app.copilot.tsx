import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkle } from "lucide-react";
import { AiBrain } from "@/components/AiBrain";
import { GlassCard, PageHeader, StatusPill } from "@/components/ui-kit";
import { inr, recommendations, useLiveEnergy } from "@/lib/energy";

export const Route = createFileRoute("/app/copilot")({
  head: () => ({
    meta: [
      { title: "AI Energy Copilot — IntelliGrid AI" },
      {
        name: "description",
        content:
          "Ask the energy copilot why costs moved, how to cut the bill, and what happens if the grid fails.",
      },
      { property: "og:title", content: "AI Energy Copilot — IntelliGrid AI" },
      {
        property: "og:description",
        content: "Conversational energy intelligence for plant operations teams.",
      },
    ],
  }),
  component: Copilot,
});

type Msg = { role: "user" | "assistant"; text: string };

const suggestions = [
  "Why did electricity cost increase today?",
  "How can we reduce today's bill?",
  "Why is the battery charging now?",
  "What happens if the grid fails?",
  "How much carbon did we save?",
];

function answerFor(q: string): string {
  const s = q.toLowerCase();
  if (s.includes("cost") && (s.includes("increase") || s.includes("why")))
    return `Landed cost rose ₹1.42/kWh versus yesterday. Three drivers:\n\n1. **ToD tariff step-up** — the 18:00–21:00 block moved to ₹11.80/kWh, and 138 MWh of rolling-mill load stayed inside that window.\n2. **Solar shortfall** — cloud cover averaged 61% between 11:00 and 14:00, cutting PV yield by 42 MWh.\n3. **Captive unit 2 derate** — heat rate drifted 3.1%, pushing marginal generation cost from ₹5.10 to ₹5.62/kWh.\n\nRecovering the peak-window shift alone claws back roughly ₹12.6 lakh today.`;
  if (s.includes("reduce") || s.includes("bill"))
    return `Four actions with the highest expected value for the remaining operating day:\n\n• Charge the battery bank to 85% before 14:00 while marginal solar sits at ₹2.10/kWh — **₹4.1 lakh**.\n• Discharge 60 MW across 18:00–21:00 instead of importing — **₹12.6 lakh**.\n• Defer the non-critical pickling line by 90 minutes — **₹2.3 lakh**.\n• Hold diesel at standby; captive unit 3 is ₹13.0/kWh cheaper — **₹1.8 lakh**.\n\nCombined: **₹20.8 lakh** with 68 tCO₂ avoided and no reliability impact.`;
  if (s.includes("battery"))
    return `The battery is charging because the optimiser sees a negative net-cost window. Solar surplus is 62 MW above internal load, marginal charge cost is ₹2.10/kWh, and the forecast discharge value at 18:40 is ₹11.80/kWh — a 5.6× arbitrage spread. Charging stops automatically at 85% SoC to preserve a 40% reserve for grid ride-through.`;
  if (s.includes("grid") && s.includes("fail"))
    return `Simulated N-1 grid loss at present load (${"~"}500 MW):\n\n• Captive plant ramps 92 → 168 MW in 45 seconds.\n• Battery bridges the gap at 70 MW for 26 minutes.\n• Two 15 MW gensets auto-start at T+90 s.\n• Non-critical load shed: 48 MW (coke oven fans, auxiliary lighting).\n\n**Result:** blast furnace and BOF stay energised. Reliability score 96.4%, incremental cost ₹9.4 lakh per hour of islanded operation.`;
  if (s.includes("carbon") || s.includes("co2") || s.includes("saved"))
    return `Today you avoided **86.4 tCO₂** against the FY24 grid-intensity baseline: 51.2 t from solar, 22.6 t from wind, 9.1 t from battery arbitrage displacing peak coal generation, and 3.5 t from diesel avoidance. Month-to-date avoidance is 2,148 t — 12.4% ahead of the sustainability target.`;
  return `Here's what I see across the plant right now: demand is tracking the forecast within 1.8%, renewables cover a healthy share of load, and no source is operating outside its safe envelope. Ask me about cost drivers, battery strategy, grid contingencies, or carbon performance and I'll break down the numbers.`;
}

function Copilot() {
  const s = useLiveEnergy(4000);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Good day. I'm your IntelliGrid copilot — I'm watching 1,284 sensors across six energy sources. Ask me anything about cost, carbon, reliability or dispatch strategy.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: answerFor(q) }]);
      setThinking(false);
      inputRef.current?.focus();
    }, 900);
  };

  return (
    <div>
      <PageHeader
        title="AI Energy Copilot"
        subtitle="Reasoning over live telemetry, tariffs, weather and asset health"
        right={<StatusPill status={`Context: ${s.demand.toFixed(0)} MW live`} tone="cyan" />}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <GlassCard className="flex h-[640px] flex-col p-0">
          <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
            <AiBrain className="h-9 w-9" />
            <div>
              <p className="text-sm font-semibold">IntelliGrid Copilot</p>
              <p className="text-xs text-muted-foreground">Online · reasoning model active</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={m.role === "user" ? "flex justify-end" : "flex"}
              >
                {m.role === "user" ? (
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {m.text}
                  </div>
                ) : (
                  <div className="max-w-[85%] whitespace-pre-line text-sm leading-relaxed text-foreground">
                    {m.text.split("**").map((chunk, j) =>
                      j % 2 ? (
                        <strong key={j} className="text-eco">
                          {chunk}
                        </strong>
                      ) : (
                        <span key={j}>{chunk}</span>
                      ),
                    )}
                  </div>
                )}
              </motion.div>
            ))}
            {thinking ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkle className="h-4 w-4 animate-pulse text-cyan" />
                Analysing dispatch, tariffs and forecasts…
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border/60 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-border/70 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-cyan/40 hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-end gap-2 rounded-2xl border border-input bg-muted/40 p-2"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={2}
                placeholder="Ask the copilot about cost, carbon, battery or grid contingencies…"
                className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={thinking}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-primary-foreground disabled:opacity-50"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </GlassCard>

        <div className="space-y-4">
          <GlassCard delay={0.1}>
            <h2 className="text-sm font-semibold">Live recommendations</h2>
            <div className="mt-3 space-y-3">
              {recommendations.slice(0, 4).map((r) => (
                <div key={r.title} className="rounded-xl border border-border/60 bg-muted/30 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold">{r.title}</p>
                    <span className="shrink-0 text-[10px] text-cyan">{r.confidence}%</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{r.reason}</p>
                  <div className="mt-2 flex gap-3 text-[11px]">
                    <span className="text-eco">{r.savings ? inr(r.savings) : "—"}</span>
                    <span className="text-cyan">{r.carbon ? `${r.carbon} tCO₂` : "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
