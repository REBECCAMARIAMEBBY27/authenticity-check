import { motion } from "framer-motion";

const ScanningOverlay = () => {
  return (
    <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-10">
      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-0.5 bg-primary"
        style={{ boxShadow: "0 0 20px 4px hsl(180 100% 45% / 0.5)" }}
        initial={{ top: "0%" }}
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      {/* Corner brackets */}
      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary opacity-60" />
      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary opacity-60" />
      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary opacity-60" />
      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary opacity-60" />
      {/* Overlay tint */}
      <div className="absolute inset-0 bg-primary/5" />
    </div>
  );
};

export default ScanningOverlay;
