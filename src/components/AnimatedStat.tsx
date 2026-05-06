import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface AnimatedStatProps {
  value: number;
  label: string;
  suffix?: string;
  color?: string;
  delay?: number;
}

export default function AnimatedStat({
  value,
  label,
  suffix = "",
  color = "#d4af37",
  delay = 0,
}: AnimatedStatProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v).toLocaleString());
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const controls = animate(count, value, {
      duration: 1.8,
      delay,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [value, delay, count]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-1"
    >
      <div className="flex items-end gap-0.5">
        <motion.span
          className="text-4xl font-bold tabular-nums tracking-tight"
          style={{ color, fontFamily: "'JetBrains Mono', monospace" }}
        >
          {rounded}
        </motion.span>
        {suffix && (
          <span className="text-xl mb-1 font-bold" style={{ color }}>
            {suffix}
          </span>
        )}
      </div>
      <span className="text-xs uppercase tracking-[0.2em] text-white/40 font-medium">
        {label}
      </span>
    </motion.div>
  );
}
