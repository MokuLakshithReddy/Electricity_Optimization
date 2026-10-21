import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, Sparkles, Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
};

export interface FloatingAIAssistantProps {
  onOpenAssistant?: () => void;
}

const defaultSuggestions = [
  "Why is the battery discharging?",
  "Why are we using grid power?",
  "What is today's optimal energy mix?",
  "What happens if the grid fails?",
  "How much CO₂ did we avoid?",
  "Run a 50% solar drop simulation",
];

export function answerQuery(query: string): string {
  const s = query.toLowerCase();

  if (s.includes("mix") || s.includes("optimal energy mix") || s.includes("today's optimal")) {
    return `**Current Industrial Energy Mix across Jamshedpur Works (520 MW total load):**

• **Solar PV:** 145 MW (28.0%) — marginal cost ₹2.10/kWh
• **Wind Farm:** 104 MW (20.0%) — marginal cost ₹2.60/kWh
• **BESS (118 MWhusable):** 62 MW discharge (12.0%) — peak arbitrage value ₹11.80/kWh
• **Grid Import (132 kV Feeder):** 156 MW (30.0%) — shoulder tariff ₹8.10/kWh
• **Captive Thermal:** 43 MW (8.0%) — ₹5.40/kWh
• **Diesel Gensets:** 10 MW (2.0%) — standby reserve

**Status:** Overall renewables fraction is **48.0%**, grid dependency is reduced by 62 MW, and real-time power factor holds at **0.997**.`;
  }

  if (s.includes("battery") && (s.includes("discharg") || s.includes("why"))) {
    return `**BESS Discharge Strategy Active (BESS-1 & BESS-2):**

The battery is currently discharging **62 MW** into the plant sub-bus because we are in the **peak ToD tariff window (6:00 PM – 8:00 PM)** where grid power prices jump to **₹11.80/kWh**.

• **Arbitrage Spread:** Energy banked during solar surplus at ₹2.10/kWh is replacing ₹11.80/kWh grid import.
• **Daily Value:** Saves **₹42,000** during this 2-hour window and avoids **18 tCO₂**.
• **Reserve Cushion:** Discharge is capped at 60% depth to retain a **40% SoC reserve** (26 min ride-through) for N-1 grid contingencies.`;
  }

  if (s.includes("grid") && (s.includes("using") || s.includes("why"))) {
    return `**Grid Import Status (156 MW at ₹8.10/kWh):**

We are currently importing 156 MW (30% of load) from the 132 kV regional grid to serve baseload thermal demand for Blast Furnace #4. 

• **Constraint:** Captive Thermal Unit 2 is running at its maximum 43 MW thermal limit.
• **Optimization:** As soon as wind generation ramps up (+55 MW expected at 7:30 PM), grid import will automatically throttle down to **101 MW**, saving **₹31,000**.`;
  }

  if (s.includes("grid") && s.includes("fail")) {
    return `**N-1 Grid Outage Emergency Response Plan:**

• **Fast Ride-Through:** BESS-1 bridges 70 MW instantly (<20 ms).
• **Captive Ramp:** Captive Units 1-3 ramp from 43 MW to 107 MW at 2.8 MW/min.
• **Diesel Reserve:** DG-1 to DG-4 auto-start at T+90s to cover remaining deficit.
• **Critical Safeguard:** 100% protection guaranteed for Blast Furnace, BOF, and Continuous Caster. Power reliability holds at **99.97%**.`;
  }

  if (s.includes("carbon") || s.includes("co2") || s.includes("avoid")) {
    return `**Carbon & Sustainability Summary:**

• **Avoided Today:** **412 tCO₂** vs FY24 grid intensity baseline (+12.4% vs last month).
• **Avoided Month-to-Date:** **4,820 tCO₂** (on track for 5,000 t monthly target).
• **Renewable Share:** **48.2%** of total plant energy consumption.
• **Equivalent Impact:** Equivalent to planting **112,400 trees** or taking 1,040 cars off the road this month.`;
  }

  if (s.includes("solar drop") || s.includes("50% solar")) {
    return `**50% Solar Drop Simulation Activated:**

• **Solar Loss:** Output drops from 145 MW → 72.5 MW (-72.5 MW).
• **AI Auto-Response:** BESS-1 discharges +27.5 MW additional stored energy, and grid import covers +45 MW at shoulder rate.
• **Impact:** Incremental cost is **+₹82,000/hour**, carbon intensity rises +18.4 t/hour. Reliability holds at **99.99%**.`;
  }

  return `I have analyzed real-time plant telemetry across solar, wind, battery storage, captive thermal, and 132 kV grid import. 

Current plant operating status is **STABLE** (520 MW demand, 48.2% renewable). Feel free to ask about battery discharge rationale, grid dependency, carbon savings, or stress-test simulations!`;
}

export function FloatingAIAssistant({ onOpenAssistant }: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      role: "assistant",
      text: "Hello! I'm IntelliGrid Copilot. How can I help with your energy operations?",
      timestamp: "Just now",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isThinking]);

  // Handle keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleOpen = () => {
    if (onOpenAssistant) {
      onOpenAssistant();
    }
    setIsOpen(true);
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isThinking) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsThinking(true);

    setTimeout(() => {
      const responseText = answerQuery(query);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);
    }, 700);
  };

  return (
    <>
      {/* Floating Speech-Bubble Launcher Widget */}
      <div
        className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6 z-[9999] pointer-events-auto select-none"
        aria-label="IntelliGrid AI Assistant Launcher"
      >
        <button
          onClick={handleOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpen();
            }
          }}
          tabIndex={0}
          aria-label="Open IntelliGrid AI Assistant"
          title="Ask IntelliGrid AI"
          className={cn(
            "group relative flex items-center justify-center sm:justify-start gap-3",
            "w-14 h-14 sm:w-[156px] sm:h-[64px]",
            "rounded-2xl sm:rounded-2xl p-2.5 sm:px-4 sm:py-3",
            "bg-white backdrop-blur-xl border-2 border-[#1B4D3E]/30",
            "shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_12px_rgba(27,77,62,0.15)]",
            "hover:shadow-[0_12px_40px_rgba(27,77,62,0.25)]",
            "hover:border-[#1B4D3E] hover:scale-[1.04]",
            "active:scale-95 transition-all duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]",
          )}
        >
          {/* AI Icon with status pulse */}
          <div className="relative shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1B4D3E] shadow-md text-white">
            <Bot className="w-5 h-5 text-white group-hover:rotate-6 transition-transform duration-200" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>

          {/* Text Labels (Desktop / Tablet) */}
          <div className="hidden sm:flex flex-col text-left leading-none min-w-0 z-10">
            <span className="font-display font-bold text-[12px] tracking-wider text-[#1F2937] uppercase group-hover:text-[#1B4D3E] transition-colors duration-200">
              ASK INTELLIGRID
            </span>
            <span className="text-[10px] font-semibold tracking-widest text-[#1B4D3E] uppercase mt-1">
              AI ASSISTANT
            </span>
          </div>

          {/* Speech Bubble Tail */}
          <svg
            className="absolute -bottom-[9px] right-4 sm:right-5 h-3 w-4 text-white pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
            viewBox="0 0 16 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 0C4 0 14 2 16 12C12 7 8 3 0 0Z" fill="currentColor" />
            <path
              d="M0 0C4 0 14 2 16 12"
              stroke="rgba(27,77,62,0.3)"
              strokeWidth="1.2"
              fill="none"
            />
          </svg>

          {/* Hover Tooltip */}
          <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold text-[#1F2937] bg-white border border-[#E6E1D7] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap hidden sm:block">
            Ask IntelliGrid AI
          </span>
        </button>
      </div>

      {/* Right-Side Drawer (IntelliGrid Copilot) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Slide-over Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 240 }}
              role="dialog"
              aria-modal="true"
              aria-label="IntelliGrid Copilot"
              className={cn(
                "fixed inset-y-0 right-0 z-[9999] w-full sm:w-[440px] max-w-full",
                "bg-white backdrop-blur-2xl border-l border-[#E6E1D7] shadow-2xl",
                "flex flex-col min-h-screen text-[#1F2937] select-text",
              )}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6E1D7] bg-[#FAF8F5]">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#1B4D3E] text-white shadow-md">
                    <Zap className="h-5 w-5 fill-white" />
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-[#1F2937] flex items-center gap-2">
                      IntelliGrid Copilot
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-semibold text-emerald-800">Online</span>
                      <span className="text-[10px] text-[#6B7280] ml-1">· Energy Assistant</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close assistant"
                  className="rounded-xl p-2 text-[#6B7280] hover:text-[#1F2937] hover:bg-[#E8F5E9] transition-colors focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Body - Messages Container */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "flex flex-col max-w-[90%]",
                      m.role === "user" ? "ml-auto items-end" : "mr-auto items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-[#1B4D3E] text-white rounded-br-xs font-medium shadow-sm"
                          : "bg-[#FAF8F5] border border-[#E6E1D7] text-[#1F2937] rounded-bl-xs shadow-xs",
                      )}
                    >
                      {m.role === "assistant" ? (
                        <div className="whitespace-pre-line">
                          {m.text.split("**").map((chunk, i) =>
                            i % 2 === 1 ? (
                              <strong key={i} className="text-[#1B4D3E] font-bold">
                                {chunk}
                              </strong>
                            ) : (
                              <span key={i}>{chunk}</span>
                            ),
                          )}
                        </div>
                      ) : (
                        <span>{m.text}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#6B7280] mt-1 px-1">{m.timestamp}</span>
                  </motion.div>
                ))}

                {/* Thinking Indicator */}
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-xs text-[#1B4D3E] bg-[#E8F5E9] border border-emerald-200 rounded-2xl px-4 py-2.5 w-fit font-medium"
                  >
                    <Sparkles className="h-4 w-4 animate-spin text-[#1B4D3E]" />
                    <span>Analyzing live plant telemetry & grid tariffs...</span>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Suggestion Chips */}
              <div className="px-4 py-3 border-t border-[#E6E1D7] bg-[#FAF8F5]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-2 px-1">
                  Quick Prompts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {defaultSuggestions.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      disabled={isThinking}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-xl border border-[#E6E1D7] bg-white hover:bg-[#E8F5E9]",
                        "text-[#1F2937] hover:text-[#1B4D3E] hover:border-[#1B4D3E]/40 transition-colors",
                        "font-medium shadow-2xs disabled:opacity-50 text-left",
                      )}
                    >
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Drawer Footer - Input Form */}
              <div className="p-4 border-t border-[#E6E1D7] bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-[#E6E1D7] bg-[#FAF8F5] p-2 focus-within:border-[#1B4D3E] focus-within:ring-1 focus-within:ring-[#1B4D3E] transition-all"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything..."
                    disabled={isThinking}
                    className="flex-1 bg-transparent px-3 py-1 text-sm outline-none placeholder:text-[#9CA3AF] text-[#1F2937]"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    aria-label="Send message"
                    className={cn(
                      "flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold tracking-wide",
                      "bg-[#1B4D3E] text-white shadow-sm transition-all",
                      "hover:bg-[#133E32] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed",
                    )}
                  >
                    <span>Send</span>
                    <ArrowRight className="h-3.5 w-3.5 -rotate-45" />
                  </button>
                </form>
                <p className="mt-2 text-center text-[10px] text-[#6B7280]">
                  IntelliGrid AI Industrial Copilot v4.2
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
