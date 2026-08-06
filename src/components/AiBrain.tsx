import { motion } from "framer-motion";

export function AiBrain({ className }: { className?: string }) {
  const nodes = [
    [50, 12],
    [22, 30],
    [78, 30],
    [14, 60],
    [50, 50],
    [86, 60],
    [30, 82],
    [70, 82],
  ] as const;
  const links = [
    [0, 1],
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 4],
    [2, 5],
    [3, 6],
    [4, 6],
    [4, 7],
    [5, 7],
  ] as const;

  return (
    <svg viewBox="0 0 100 100" className={className}>
      <defs>
        <linearGradient id="brainGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="55%" stopColor="var(--cyan)" />
          <stop offset="100%" stopColor="var(--eco)" />
        </linearGradient>
      </defs>
      {links.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke="url(#brainGrad)"
          strokeWidth="0.7"
          strokeLinecap="round"
          initial={{ opacity: 0.15 }}
          animate={{ opacity: [0.15, 0.85, 0.15] }}
          transition={{ duration: 2.6, delay: i * 0.18, repeat: Infinity }}
        />
      ))}
      {nodes.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r="2.6"
          fill="url(#brainGrad)"
          animate={{ r: [2.2, 3.4, 2.2], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2.2, delay: i * 0.2, repeat: Infinity }}
        />
      ))}
    </svg>
  );
}
