import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Mic } from "lucide-react";
import { useEnergyState } from "@/context/EnergyContext";
import { ExplainableCard } from "@/components/ExplainableCard";
import { smartRecommendations } from "@/lib/intel";
import { analyzeCopilotQuery } from "@/lib/copilotEngine";

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
        content: "Enterprise AI control assistant for industrial plant energy management.",
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

  const getAIResponse = (query: string): ChatMessage => {
    const analysis = analyzeCopilotQuery(query, {
      demandMW: energyState.totalDemandMW,
      solarMW: energyState.solarMW,
      windMW: energyState.windMW,
      batteryMW: energyState.batteryMW,
      batterySOC: energyState.batterySOC,
      gridMW: energyState.gridMW,
      captiveMW: energyState.captiveMW,
      generatorMW: energyState.generatorMW,
      tariffTier: energyState.currentTariffTier || "Peak",
      hourlySavings: energyState.hourlySavings,
      activeConstraints: energyState.activeConstraints,
    });

    if (analysis.executableAction?.actionType === "TRIGGER_SIMULATION") {
      runSimulationScenario(String(analysis.executableAction.payload));
    }

    return {
      id: Date.now().toString(),
      role: "assistant",
      text: analysis.responseMarkdown,
      decision: {
        grid: analysis.decisionSetpoints.gridMW,
        solar: analysis.decisionSetpoints.solarMW,
        wind: analysis.decisionSetpoints.windMW,
        battery: analysis.decisionSetpoints.batteryMW,
        generator: analysis.decisionSetpoints.generatorMW,
      },
      impact: {
        costSaved: analysis.impact.costSavedFormatted,
        co2Avoided: analysis.impact.co2AvoidedFormatted,
        reliability: analysis.impact.reliabilityFormatted,
        confidence: analysis.calibratedConfidence,
      },
      ...(analysis.executableAction
        ? {
            actionLink: {
              label: analysis.executableAction.label,
              ...(analysis.executableAction.actionType === "TRIGGER_SIMULATION"
                ? { scenarioId: String(analysis.executableAction.payload) }
                : {}),
              route: "/app/scenarios",
            },
          }
        : {}),
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

      <div className="grid grid-cols-1 xl:grid-cols-[68%_32%] gap-6 items-start">
        <div className="rounded-3xl bg-white border border-[#E6E1D7] shadow-xs flex flex-col h-[740px] overflow-hidden">
          <div className="border-b border-[#F3F0EA] p-4 bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1B4D3E] text-white">
                <Sparkles className="h-5 w-5 fill-white" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-[#1F2937]">
                  IntelliGrid Copilot
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Online · Industrial Reasoning Engine Active
                </p>
              </div>
            </div>

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

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {messages.length === 0 && (
              <div className="my-6 rounded-3xl bg-[#FAF8F5] border border-[#E6E1D7] p-6 space-y-3">
                <h3 className="font-display text-xl font-bold text-[#1F2937]">
                  Good evening. I'm your IntelliGrid Copilot.
                </h3>
                <p className="text-xs sm:text-sm text-[#4B5563]">
                  I'm monitoring your plant's energy demand, solar, wind, battery, grid and backup
                  generation in real time.
                </p>
                <p className="text-xs text-[#6B7280] font-medium">
                  Ask me about cost, carbon, reliability, forecasting or energy dispatch.
                </p>
              </div>
            )}

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
                            <span className="font-bold text-amber-600">
                              {msg.decision.solar} MW
                            </span>
                          </div>
                          <div className="rounded-xl bg-[#FAF8F5] p-2 border border-[#E6E1D7]">
                            <span className="text-[10px] text-[#6B7280] block">WIND</span>
                            <span className="font-bold text-sky-600">{msg.decision.wind} MW</span>
                          </div>
                          <div className="rounded-xl bg-[#FAF8F5] p-2 border border-[#E6E1D7]">
                            <span className="text-[10px] text-[#6B7280] block">BATTERY</span>
                            <span className="font-bold text-emerald-600">
                              {msg.decision.battery} MW
                            </span>
                          </div>
                          <div className="rounded-xl bg-[#FAF8F5] p-2 border border-[#E6E1D7]">
                            <span className="text-[10px] text-[#6B7280] block">GENSET</span>
                            <span className="font-bold text-rose-600">
                              {msg.decision.generator} MW
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

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

                    {msg.actionLink && (
                      <button
                        onClick={() => {
                          if (msg.actionLink?.route) {
                            navigate({ to: msg.actionLink.route as never });
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

          <div className="p-4 border-t border-[#F3F0EA] bg-[#FAF8F5] space-y-3">
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
