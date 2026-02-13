import { motion } from "framer-motion";

interface ConfidenceGaugeProps {
  confidence: number; // 0 = human, 100 = AI
  verdict: string;
}

const ConfidenceGauge = ({ confidence, verdict }: ConfidenceGaugeProps) => {
  const isAI = confidence >= 60;
  const isHuman = confidence <= 40;

  const getColor = () => {
    if (isHuman) return "hsl(160, 100%, 40%)";
    if (isAI) return "hsl(0, 80%, 55%)";
    return "hsl(45, 100%, 50%)";
  };

  const circumference = 2 * Math.PI * 70;
  const progress = (confidence / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-48 h-48">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="hsl(200, 20%, 18%)"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <motion.circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 8px ${getColor()})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-mono font-bold"
            style={{ color: getColor() }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {confidence}%
          </motion.span>
          <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            AI Probability
          </span>
        </div>
      </div>
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <span
          className="text-lg font-mono font-semibold px-4 py-1.5 rounded-full border"
          style={{
            color: getColor(),
            borderColor: getColor(),
            backgroundColor: `${getColor()}15`,
          }}
        >
          {verdict}
        </span>
      </motion.div>
    </div>
  );
};

export default ConfidenceGauge;
