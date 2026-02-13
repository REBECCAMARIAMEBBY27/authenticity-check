import { motion } from "framer-motion";
import { Bot, User, Minus } from "lucide-react";

interface Indicator {
  label: string;
  detail: string;
  signal: "ai" | "human" | "neutral";
}

const AnalysisIndicator = ({ indicator, index }: { indicator: Indicator; index: number }) => {
  const signalConfig = {
    ai: { icon: Bot, color: "hsl(0, 80%, 55%)", label: "AI Signal" },
    human: { icon: User, color: "hsl(160, 100%, 40%)", label: "Human Signal" },
    neutral: { icon: Minus, color: "hsl(45, 100%, 50%)", label: "Neutral" },
  };

  const config = signalConfig[indicator.signal];
  const Icon = config.icon;

  return (
    <motion.div
      className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
    >
      <div
        className="mt-0.5 p-1.5 rounded-md shrink-0"
        style={{ backgroundColor: `${config.color}20`, color: config.color }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-foreground">{indicator.label}</span>
          <span
            className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ color: config.color, backgroundColor: `${config.color}15` }}
          >
            {config.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{indicator.detail}</p>
      </div>
    </motion.div>
  );
};

export default AnalysisIndicator;
