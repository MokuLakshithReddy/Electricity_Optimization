import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Wind, BatteryCharging, Zap, Factory, Flame, Cpu } from "lucide-react";

export interface EnergyNode {
  id: string;
  name: string;
  category: string;
  x: number; // Percentage coordinate inside SVG viewBox (0..100)
  y: number;
  output: string;
  status: "Optimized" | "Active" | "Standby";
  icon: typeof Sun;
}

const NODES: EnergyNode[] = [
  {
    id: "solar",
    name: "Solar PV Array",
    category: "Renewable Generation",
    x: 50,
    y: 12,
    output: "4.2 MW",
    status: "Optimized",
    icon: Sun,
  },
  {
    id: "wind",
    name: "Wind Turbine",
    category: "Renewable Generation",
    x: 85,
    y: 35,
    output: "2.8 MW",
    status: "Active",
    icon: Wind,
  },
  {
    id: "battery",
    name: "BESS Battery Storage",
    category: "Energy Storage",
    x: 85,
    y: 75,
    output: "5.0 MWh (84%)",
    status: "Optimized",
    icon: BatteryCharging,
  },
  {
    id: "grid",
    name: "Main Utility Grid",
    category: "Grid Interconnect",
    x: 50,
    y: 92,
    output: "1.1 MW Subscribed",
    status: "Active",
    icon: Zap,
  },
  {
    id: "captive",
    name: "Captive Power Plant",
    category: "Thermal Cogeneration",
    x: 15,
    y: 75,
    output: "3.5 MW",
    status: "Active",
    icon: Factory,
  },
  {
    id: "generator",
    name: "Backup Diesel Generator",
    category: "Emergency Reserve",
    x: 15,
    y: 35,
    output: "0.0 MW (Standby)",
    status: "Standby",
    icon: Flame,
  },
];

// Central AI Hub Node
const CENTRAL_HUB = {
  id: "ai_hub",
  name: "IntelliGrid Copilot Core",
  x: 50,
  y: 52,
  status: "Real-time Dispatching",
};

// Edge connections connecting surrounding nodes to the AI Hub and each other
const CONNECTIONS: [string, string][] = [
  ["solar", "ai_hub"],
  ["wind", "ai_hub"],
  ["battery", "ai_hub"],
  ["grid", "ai_hub"],
  ["captive", "ai_hub"],
  ["generator", "ai_hub"],

  // Outer ring connections
  ["solar", "wind"],
  ["wind", "battery"],
  ["battery", "grid"],
  ["grid", "captive"],
  ["captive", "generator"],
  ["generator", "solar"],
];

export function EnergyNetwork({ className = "" }: { className?: string }) {
  const [activeHoverNode, setActiveHoverNode] = useState<EnergyNode | null>(null);

  const getNodeByPos = (id: string) => {
    if (id === "ai_hub") return CENTRAL_HUB;
    return NODES.find((n) => n.id === id);
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative w-full max-w-sm aspect-square">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#159A72" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#00C9D7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#159A72" stopOpacity="0.6" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Connection Lines */}
          {CONNECTIONS.map(([fromId, toId], idx) => {
            const from = getNodeByPos(fromId);
            const to = getNodeByPos(toId);
            if (!from || !to) return null;

            const isCentral = fromId === "ai_hub" || toId === "ai_hub";

            return (
              <g key={`edge-${idx}`}>
                {/* Background static line */}
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={isCentral ? "url(#edgeGradient)" : "#1E3A34"}
                  strokeWidth={isCentral ? "0.8" : "0.5"}
                  strokeDasharray={isCentral ? "none" : "1.5,1.5"}
                  opacity={isCentral ? 0.75 : 0.45}
                />

                {/* Animated subtle pulse particle traveling along central edges */}
                {isCentral && (
                  <motion.circle
                    r="0.75"
                    fill="#00C9D7"
                    filter="url(#glow)"
                    initial={{ offsetDistance: "0%" }}
                    animate={{
                      cx: [from.x, to.x],
                      cy: [from.y, to.y],
                      opacity: [0, 0.9, 0],
                    }}
                    transition={{
                      duration: 3 + (idx % 3) * 0.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: idx * 0.4,
                    }}
                  />
                )}
              </g>
            );
          })}

          {/* Central AI Hub Node */}
          <g>
            <motion.circle
              cx={CENTRAL_HUB.x}
              cy={CENTRAL_HUB.y}
              r="4.5"
              fill="#0F6B53"
              stroke="#00C9D7"
              strokeWidth="0.8"
              filter="url(#glow)"
              animate={{
                r: [4.5, 5.2, 4.5],
                strokeWidth: [0.8, 1.2, 0.8],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle cx={CENTRAL_HUB.x} cy={CENTRAL_HUB.y} r="2" fill="#00C9D7" />
          </g>

          {/* Surrounding Energy Asset Nodes */}
          {NODES.map((node) => {
            const isHovered = activeHoverNode?.id === node.id;
            return (
              <g
                key={node.id}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setActiveHoverNode(node)}
                onMouseLeave={() => setActiveHoverNode(null)}
              >
                {/* Pulse outer ring */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r="3.2"
                  fill="#00C9D7"
                  opacity={0.2}
                  animate={{
                    scale: isHovered ? [1, 1.8, 1] : [1, 1.3, 1],
                    opacity: isHovered ? [0.3, 0.6, 0.3] : [0.15, 0.35, 0.15],
                  }}
                  transition={{
                    duration: isHovered ? 1.5 : 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Node outer border circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="2.6"
                  fill="#031019"
                  stroke={isHovered ? "#00C9D7" : "#159A72"}
                  strokeWidth={isHovered ? "0.9" : "0.6"}
                />

                {/* Core illuminated dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="1.4"
                  fill={node.status === "Standby" ? "#64748B" : isHovered ? "#00C9D7" : "#159A72"}
                  filter="url(#glow)"
                />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip on Hover */}
        <AnimatePresence>
          {activeHoverNode && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute pointer-events-none z-20 px-3 py-2 rounded-xl bg-slate-900/95 border border-emerald-500/30 text-white text-xs shadow-xl backdrop-blur-md"
              style={{
                left: `${activeHoverNode.x}%`,
                top: `${activeHoverNode.y}%`,
                transform: "translate(-50%, -125%)",
              }}
            >
              <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
                <activeHoverNode.icon className="w-3.5 h-3.5" />
                <span>{activeHoverNode.name}</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">{activeHoverNode.category}</div>
              <div className="mt-1 flex items-center justify-between gap-3 text-[11px] font-mono border-t border-slate-800 pt-1">
                <span className="text-slate-400">Output:</span>
                <span className="text-white font-medium">{activeHoverNode.output}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend / Hover instruction note */}
      <div className="mt-2 text-[11px] text-slate-400 tracking-wide flex items-center gap-1.5">
        <Cpu className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        <span>Multi-asset Orchestration (Hover nodes to inspect)</span>
      </div>
    </div>
  );
}
