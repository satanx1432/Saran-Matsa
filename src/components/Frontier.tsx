import { useState, useEffect } from "react";
import { motion } from "motion/react";

export default function Frontier({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [currentDate, setCurrentDate] = useState<string>("");
  const [performanceScore, setPerformanceScore] = useState<string>("--");

  const loadLatestScore = () => {
    try {
      const savedLogs = localStorage.getItem("maverick_journal_history");
      if (savedLogs) {
        const historyList = JSON.parse(savedLogs);
        if (historyList && historyList.length > 0) {
          // Look for today's log or fallback to the most recent log
          const latestLog = historyList[0];
          if (latestLog && latestLog.performanceScore !== undefined) {
            setPerformanceScore(`${latestLog.performanceScore}`);
            return;
          }
        }
      }
      setPerformanceScore("--");
    } catch (err) {
      console.warn("HASEX_OS [FRONTIER STATE WARN] // Error reading history log:", err);
    }
  };

  useEffect(() => {
    // Elegant system time clock with real-time minutes
    const updateDateTime = () => {
      const today = new Date();
      const datePart = today.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const timePart = today.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      setCurrentDate(`${datePart}, ${timePart}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    // Initial load
    loadLatestScore();

    // Set up reactive event listeners
    window.addEventListener("maverick_history_updated", loadLatestScore);
    window.addEventListener("storage", loadLatestScore);

    return () => {
      clearInterval(interval);
      window.removeEventListener("maverick_history_updated", loadLatestScore);
      window.removeEventListener("storage", loadLatestScore);
    };
  }, []);

  return (
    <div 
      className="w-full max-w-lg mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center px-4 font-sans select-none"
      id="frontier-container"
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-12 py-12"
      >
        {/* Simple elegant date rendering */}
        <div className="space-y-2">
          <p className="text-[11px] font-mono tracking-[0.3em] text-[#00f0ff]/60 uppercase">CHRONICLE DATE</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none text-glow font-sans">
            {currentDate || "LOADING CHRONOLOGY..."}
          </h1>
        </div>

        {/* Minimal High-Contrast Performance Score */}
        <div className="space-y-3">
          <p className="text-[11px] font-mono tracking-[0.3em] text-[#00f0ff]/60 uppercase">DAILY PERFORMANCE SCORE</p>
          <div className="relative inline-flex items-baseline justify-center">
            <span className="text-8xl md:text-9xl font-black font-mono text-white tracking-tighter drop-shadow-[0_0_30px_rgba(0,240,255,0.15)]">
              {performanceScore}
            </span>
            {performanceScore !== "--" && (
              <span className="text-lg md:text-xl font-mono text-[#b9cacb]/40 ml-1">/100</span>
            )}
          </div>
        </div>

        {/* Dynamic Launch Maverick AI Navigation Button */}
        <div className="pt-6">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate("hasex")}
            className="inline-flex items-center gap-2.5 px-6 py-3 border border-[#00f0ff]/40 hover:border-[#00f0ff] bg-black/40 hover:bg-[#00f0ff]/10 text-[#00f0ff] hover:text-white font-mono text-xs tracking-widest uppercase font-black cursor-pointer transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_25px_rgba(0,240,255,0.25)] rounded-none"
            id="launch-maverick-btn"
          >
            <span>LAUNCH MAVERICK AI</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
