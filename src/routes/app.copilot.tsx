import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  Mic,
  Zap,
  ShieldCheck,
  Leaf,
  Activity,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Cpu,
  AlertTriangle,
} from "lucide-react";
import { useEnergyState } from "@/context/EnergyContext";
import { ExplainableCard } from "@/components/ExplainableCard";
import { smartRecommendations } from "@/lib/intel";

export const Route = createFileRoute("/app/copilot")({
  head: () => ({
    meta: [
      { title: "AI Energy Copilot — IntelliGrid AI" },
      {
        name: "description",
        content:
          "Conversational energy intelligence for industrial plant operations. Analyze cost, carbon, reliability, and dispatch in real time.",
      },
      { property: "og:title", content: "AI Energy Copilot — IntelliGrid AI" },
      {
        property: "og:description",
        content: "Enterprise AI control assistant for Tata Steel Jamshedpur energy management.",
      },
    ],
  }),
  component: CopilotPage,
});

type MessageRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  decision?: {
    grid: number;
    solar: number;
    wind: number;
    battery: number;
    generator: number;
  };
  impact?: {
    costSaved: string;
    co2Avoided: string;
    reliability: string;
    confidence: number;
  };
  actionLink?: {
    label: string;
    route?: string;
    scenarioId?: string;
  };
}

const quickQuestions = [
  "Why is my energy cost high?",
  "Should we charge the battery now?",
  "What happens if solar drops 30%?",
  "How can we reduce CO₂ today?",
  "Why did AI choose the grid?",
  "Can the plant survive a battery failure?",
];

function CopilotPage() {
  const navigate = useNavigate();
  const energyState = useEnergyState();
  const { runSimulationScenario } = energyState;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinkingStep, setThinkingStep] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinkingStep]);

  // Generate intelligent response based on current live energy context
  const getAIResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase();

    // What-If: Battery Failure
    if (q.includes("battery") && (q.includes("fail") || q.includes("survive") || q.includes("down"))) {
      runSimulationScenario("battery_failure");
      return {
        id: Date.now().toString(),
        role: "assistant",
        text: `Battery BESS-1 is currently unavailable (0 MWh capacity).\n\nI have recalculated the plant dispatch model:\n\n• Solar PV output: ${energyState.solarMW} MW\n• Wind farm output: ${energyState.windMW} MW\n• Grid import step-up: ${energyState.gridMW + 80} MW\n• Diesel generator backup: 25 MW auto-started\n• Power reliability: 99.97% maintained across critical mills.\n\nRisk Assessment:\nLoss of battery arbitrage increases peak ToD exposure by ₹1.8 L/hour. Generator-1 is held in hot standby to absorb sudden load steps.`,
        decision: {
          grid: energyState.gridMW + 80,
          solar: energyState.solarMW,
          wind: energyState.windMW,
          battery: 0,
          generator: 25,
        },
        impact: {
          costSaved: "+₹1.8 L/hr cost exposure",
          co2Avoided: "+42 t/hr CO₂",
          reliability: "99.97%",
          confidence: 94,
        },
        actionLink: {
          label: "View What-If Simulation details →",
          scenarioId: "battery_failure",
        },
      };
    }

    // What-If: Solar Drop
    if (q.includes("solar") && (q.includes("drop") || q.includes("cloud") || q.includes("30%") || q.includes("50%"))) {
      runSimulationScenario("solar_drop");
      return {
        id: Date.now().toString(),
        role: "assistant",
        text: `Simulated 50% solar PV drop (convective cloud cover over solar park).\n\nAutomated AI Response Plan:\n• Solar output drops from 145 MW → 50 MW.\n• BESS-1 discharges +27.5 MW additional stored energy (<20 ms response).\n• Grid import ramps +45 MW to cover thermal deficit.\n• No load shed required for rolling mills.`,
        decision: {
          grid: energyState.gridMW + 45,
          solar: 50,
          wind: energyState.windMW,
          battery: energyState.batteryMW + 28,
          generator: 0,
        },
        impact: {
          costSaved: "₹82,000/hr tariff exposure",
          co2Avoided: "18.4 t/hr CO₂",
          reliability: "99.99%",
          confidence: 96,
        },
        actionLink: {
          label: "Open Scenario Optimizer →",
          route: "/app/scenarios",
        },
      };
    }

    // Question: Why grid?
    if (q.includes("grid") || q.includes("why did ai choose")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        text: `Grid power was selected for the current 15-minute interval because:\n\n• Solar generation is currently tracking at ${energyState.solarMW} MW.\n• Wind generation (${energyState.windMW} MW) is insufficient to cover the ${energyState.totalDemandMW} MW plant demand.\n• Battery SOC (${energyState.batterySOC}%) is being preserved for the upcoming 18:00–21:00 evening peak ToD tariff window.\n• Grid import currently provides the lowest reliable marginal cost (₹8.10/kWh shoulder rate vs ₹18.40/kWh diesel generation).`,
        decision: {
          grid: energyState.gridMW,
          solar: energyState.solarMW,
          wind: energyState.windMW,
          battery: energyState.batteryMW,
          generator: energyState.generatorMW,
        },
        impact: {
          costSaved: energyState.energyCostSavedFormatted,
          co2Avoided: energyState.co2AvoidedFormatted,
          reliability: `${energyState.reliability}%`,
          confidence: 94,
        },
        actionLink: {
          label: "View decision details →",
          route: "/app/scenarios",
        },
      };
    }

    // Question: Why cost high?
    if (q.includes("cost") || q.includes("high") || q.includes("bill")) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        text: `Plant energy cost rate is currently ₹11.80/kWh due to Time-of-Day (ToD) peak pricing.\n\nPrimary Drivers:\n1. Peak ToD Tariff Window — High grid rate step-up.\n2. Heavy Industrial Load — Rolling mill #2 running at 100% capacity (${energyState.totalDemandMW} MW total demand).\n3. Solar Yield — Contributing ${energyState.solarMW} MW (28% of total mix).\n\nAI Optimization Recommendation:\nDischarge BESS-1 to cap peak grid demand above 350 MW and save ₹41,200 during this interval.`,
        decision: {
          grid: energyState.gridMW,
          solar: energyState.solarMW,
          wind: energyState.windMW,
          battery: energyState.batteryMW,
          generator: energyState.generatorMW,
        },
        impact: {
          costSaved: "₹41,200 potential saving",
          co2Avoided: "18.4 t avoided",
          reliability: "99.97%",
          confidence: 95,
        },
        actionLink: {
          label: "Optimize Energy Costs →",
          route: "/app/scenarios",
        },
      };
    }

    // Question: Charge battery?
    if (q.includes("battery") && (q.includes("charge") || q.includes("should"))) {
      return {
        id: Date.now().toString(),
        role: "assistant",
        text: `Yes, charging the battery bank to 85% is strongly recommended.\n\nReasoning:\n• Solar surplus is available at ₹2.10/kWh.\n• Evening peak ToD grid rate will rise to ₹11.80/kWh.\n• Spread arbitrage yields ₹4.1 L daily net savings.\n• 15% SOC headroom is maintained for voltage stabilization.`,
        decision: {
          grid: energyState.gridMW,
          solar: energyState.solarMW,
          wind: energyState.windMW,
          battery: 62,
          generator: 0,
        },
        impact: {
          costSaved: "₹4.1 L/day net saving",
          co2Avoided: "34.2 t/day avoided",
          reliability: "100.0%",
          confidence: 97,
        },
        actionLink: {
          label: "Execute Battery Charge →",
          route: "/app/scenarios",
        },
      };
    }

    // Default fallback response
    return {
      id: Date.now().toString(),
      role: "assistant",
      text: `I am continuously analyzing live telemetry across Tata Steel Jamshedpur.\n\nCurrent Operational Status:\n• Plant Demand: ${energyState.totalDemandMW} MW\n• Renewable Share: ${energyState.renewableUtilization}%\n• Power Reliability: ${energyState.reliability}%\n• Grid Import: ${energyState.gridMW} MW\n\nAsk me about cost drivers, battery dispatch, What-If outage simulations, or CO₂ reduction targets.`,
      decision: {
        grid: energyState.gridMW,
        solar: energyState.solarMW,
        wind: energyState.windMW,
        battery: energyState.batteryMW,
        generator: energyState.generatorMW,
      },
      impact: {
        costSaved: energyState.energyCostSavedFormatted,
        co2Avoided: energyState.co2AvoidedFormatted,
        reliability: `${energyState.reliability}%`,
        confidence: 93,
      },
    };
  };

  const handleSendMessage = (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || thinkingStep) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: queryText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulate multi-step AI thinking
    setThinkingStep("Analyzing live plant telemetry...");
    setTimeout(() => {
      setThinkingStep("Evaluating available energy sources & tariffs...");
    }, 400);
    setTimeout(() => {
      setThinkingStep("Calculating optimal dispatch model...");
    }, 800);
    setTimeout(() => {
      const responseMsg = getAIResponse(queryText);
      setMessages((prev) => [...prev, responseMsg]);
      setThinkingStep(null);
    }, 1200);
  };

  const toggleMic = () => {
    setIsListening(true);
    setInput("Should we charge the battery now?");
    setTimeout(() => {
      setIsListening(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1F2937]">
            AI Energy Copilot
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Reasoning over live telemetry, ToD tariffs, weather forecasts and asset health
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F5E9] px-3.5 py-1.5 text-xs font-bold text-[#1B4D3E] border border-emerald-200 w-fit">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Context: {energyState.totalDemandMW} MW live</span>
        </div>
      </div>

      {/* Main 2-Column Grid: 68% Left Copilot Panel | 32% Right Explainable Recommendations */}
      <div className="grid grid-cols-1 xl:grid-cols-[68%_32%] gap-6 items-start">
        
        {/* LEFT COLUMN: MAIN COPILOT PANEL */}
        <div className="rounded-3xl bg-white border border-[#E6E1D7] shadow-xs flex flex-col h-[740px] overflow-hidden">
          
          {/* Panel Header & Live Telemetry Context Bar */}
          <div className="border-b border-[#F3F0EA] p-4 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1B4D3E] text-white">
                <Sparkles className="h-5 w-5 fill-white" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#1F2937]">
                  IntelliGrid Copilot
                </h3>
                <p className="text-xs text-[#6B7280]">Online · Industrial Reasoning Engine Active</p>
              </div>
            </div>

            {/* Live Plant Context Badges */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-ping" />
                LIVE TELEMETRY
              </span>
              <span className="rounded-xl bg-white border border-[#E6E1D7] px-2 py-1 text-[#1F2937]">
                Demand: <strong className="text-[#1B4D3E]">{energyState.totalDemandMW} MW</strong>
              </span>
              <span className="rounded-xl bg-white border border-[#E6E1D7] px-2 py-1 text-[#1F2937]">
                Solar: <strong className="text-amber-600">{energyState.solarMW} MW</strong>
              </span>
              <span className="rounded-xl bg-white border border-[#E6E1D7] px-2 py-1 text-[#1F2937]">
                Wind: <strong className="text-sky-600">{energyState.windMW} MW</strong>
              </span>
              <span className="rounded-xl bg-white border border-[#E6E1D7] px-2 py-1 text-[#1F2937]">
                BESS: <strong className="text-emerald-700">{energyState.batterySOC}%</strong>
              </span>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* Welcome State when no messages */}
            {messages.length === 0 && (
              <div className="my-6 rounded-3xl bg-[#FAF8F5] border border-[#E6E1D7] p-6 space-y-3">
                <h3 className="font-display text-xl font-bold text-[#1F2937]">
                  Good evening. I'm your IntelliGrid Copilot.
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563]">
                  I'm monitoring your plant's energy demand, solar, wind, battery, grid and backup generation in real time.
                </p>
                <p className="text-xs text-[#6B7280] font-medium">
                  Ask me about cost, carbon, reliability, forecasting or energy dispatch.
                </p>
              </div>
            )}

            {/* Chat Conversation Messages */}
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "user" ? (
                  <div className="max-w-[80%] rounded-3xl rounded-br-sm bg-[#1B4D3E] text-white px-5 py-3 text-xs sm:text-sm font-medium shadow-xs">
                    {msg.text}
                  </div>
                ) : (
                  <div className="max-w-[90%] rounded-3xl rounded-bl-sm bg-[#FAF8F5] border border-[#E6E1D7] p-5 text-xs sm:text-sm text-[#1F2937] space-y-4 shadow-xs">
                    <div className="whitespace-pre-line leading-relaxed font-normal">
                      {msg.text}
                    </div>

                    {/* Decision Breakdown Grid */}
                    {msg.decision && (
                      <div className="rounded-2xl bg-white border border-[#E6E1D7] p-3.5 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                          Optimal Source Dispatch:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                          <div className="rounded-xl bg-[#FAF8F5] p-2 border border-[#E6E1D7]">
                            <span className="text-[10px] text-[#6B7280] block">GRID</span>
                            <span className="font-bold text-[#2563EB]">{msg.decision.grid} MW</span>
                          </div>
                          <div className="rounded-xl bg-[#FAF8F5] p-2 border border-[#E6E1D7]">
                            <span className="text-[10px] text-[#6B7280] block">SOLAR</span>
                            <span className="font-bold text-amber-600">{msg.decision.solar} MW</span>
                          </div>
                          <div className="rounded-xl bg-[#FAF8F5] p-2 border border-[#E6E1D7]">
                            <span className="text-[10px] text-[#6B7280] block">WIND</span>
                            <span className="font-bold text-sky-600">{msg.decision.wind} MW</span>
                          </div>
                          <div className="rounded-xl bg-[#FAF8F5] p-2 border border-[#E6E1D7]">
                            <span className="text-[10px] text-[#6B7280] block">BATTERY</span>
                            <span className="font-bold text-emerald-600">{msg.decision.battery} MW</span>
                          </div>
                          <div className="rounded-xl bg-[#FAF8F5] p-2 border border-[#E6E1D7]">
                            <span className="text-[10px] text-[#6B7280] block">GENSET</span>
                            <span className="font-bold text-rose-600">{msg.decision.generator} MW</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expected Impact Pills */}
                    {msg.impact && (
                      <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-[#E6E1D7]">
                        <span className="font-bold text-[#1B4D3E] bg-[#E8F5E9] px-2.5 py-1 rounded-xl">
                          Cost: {msg.impact.costSaved}
                        </span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                          CO₂: {msg.impact.co2Avoided}
                        </span>
                        <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl">
                          Reliability: {msg.impact.reliability}
                        </span>
                        <span className="font-bold text-[#6B7280] bg-white border border-[#E6E1D7] px-2.5 py-1 rounded-xl">
                          Confidence: {msg.impact.confidence}%
                        </span>
                      </div>
                    )}

                    {/* Action Link Button */}
                    {msg.actionLink && (
                      <button
                        onClick={() => {
                          if (msg.actionLink?.route) {
                            navigate({ to: msg.actionLink.route as any });
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4D3E] hover:underline pt-1 cursor-pointer"
                      >
                        <span>{msg.actionLink.label}</span>
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            {/* AI Multi-Step Thinking Indicator */}
            {thinkingStep && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2.5 text-xs font-semibold text-[#1B4D3E] bg-[#E8F5E9] p-3 rounded-2xl border border-emerald-200 w-fit"
              >
                <Sparkles className="h-4 w-4 animate-spin text-emerald-600" />
                <span>{thinkingStep}</span>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sticky Bottom Input Section */}
          <div className="p-4 border-t border-[#F3F0EA] bg-[#FAF8F5] space-y-3">
            
            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendMessage(q)}
                  className="rounded-full bg-white border border-[#E6E1D7] px-3 py-1.5 text-xs text-[#4B5563] hover:text-[#1B4D3E] hover:border-[#1B4D3E] transition-all cursor-pointer shadow-2xs font-medium"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Textarea Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2 rounded-2xl border border-[#E6E1D7] bg-white p-2.5 shadow-xs focus-within:border-[#1B4D3E] focus-within:ring-1 focus-within:ring-[#1B4D3E] transition-all"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder="Ask IntelliGrid anything about your plant's energy..."
                className="flex-1 resize-none bg-transparent px-2 py-1 text-xs sm:text-sm outline-none placeholder:text-[#9CA3AF] text-[#1F2937]"
              />

              <div className="flex items-center gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`grid h-9 w-9 place-items-center rounded-xl border transition-all cursor-pointer ${
                    isListening
                      ? "bg-rose-50 text-rose-600 border-rose-200 animate-pulse"
                      : "bg-[#FAF8F5] text-[#6B7280] border-[#E6E1D7] hover:text-[#1F2937]"
                  }`}
                  aria-label="Voice input"
                >
                  <Mic className="h-4 w-4" />
                </button>

                <button
                  type="submit"
                  disabled={!input.trim() || !!thinkingStep}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-[#1B4D3E] text-white hover:bg-[#133E32] disabled:opacity-40 transition-all cursor-pointer shadow-xs"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4 fill-white" />
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: EXPLAINABLE RECOMMENDATIONS (32% width) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-[#6B7280]">
              Explainable Recommendations
            </h3>
            <span className="text-[10px] font-bold text-[#1B4D3E] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
              Live Optimized
            </span>
          </div>

          <div className="space-y-4">
            {smartRecommendations.slice(0, 3).map((rec, i) => (
              <ExplainableCard key={rec.id} rec={rec} delay={0.1 + i * 0.05} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
