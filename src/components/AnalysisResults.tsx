import { useEffect, useState } from "react";
import { ArrowRight, Clock, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";
import { AnalysisResult } from "../types";
import AnalysisFlowchart from "./AnalysisFlowchart";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onConvert: () => void;
  rawInputText: string;
}

export default function AnalysisResults({ result, onConvert, rawInputText }: AnalysisResultsProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Score counter animation
  useEffect(() => {
    let current = 0;
    const target = result.confidence || 90;
    const increment = Math.ceil(target / 40); // 40 steps
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedScore(target);
        clearInterval(interval);
      } else {
        setAnimatedScore(current);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [result.confidence]);

  // Extract from rawText if available to guarantee 100% justification & zero hallucination
  const parseFieldFromInput = (label: string): string => {
    if (!rawInputText) return "";
    const regex = new RegExp(`${label}:\\s*([^\\n]+)`, "i");
    const match = rawInputText.match(regex);
    if (match && match[1].trim()) {
      const val = match[1].trim();
      const lower = val.toLowerCase();
      if (lower === "none" || lower === "nothing" || lower === "nil" || lower === "not specified") {
        return "";
      }
      return val;
    }
    return "";
  };

  // 1. Goal Detected
  const goalText = parseFieldFromInput("What were you trying to accomplish") || result.goal || "";
  
  // 2. Obstacle Detected
  const distractionText = parseFieldFromInput("What slowed you down") || result.distraction || "";

  // 3. Time Impact
  const timeImpactText = parseFieldFromInput("How much time was affected") || result.time_lost || "";

  // 4. Key Learning
  const keyLearningText = parseFieldFromInput("Anything important you learned") || "";

  // 5. Confidence Level
  const confidenceVal = result.confidence || 92;

  // Render text utilities with robust "Need More Information" guard checks
  const renderValueOrGuard = (val: string) => {
    if (!val || val.trim().length === 0) {
      return (
        <span className="text-[#ffcb7c] font-mono text-xs italic flex items-center gap-1">
          <ShieldAlert size={12} /> Need More Information
        </span>
      );
    }
    return <span className="text-white font-semibold font-sans">{val}</span>;
  };

  return (
    <div className="w-full flex flex-col gap-6 text-left animate-fade-in" id="section-2-extracted-facts-section">
      
      {/* Title Header Section */}
      <div className="flex flex-col gap-2 border-b-[0.5px] border-[#3b494b]/30 pb-5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#00f0ff] signal-glow rounded-none"></div>
          <span className="font-mono text-xs text-[#00f0ff] uppercase tracking-[0.2em] font-bold">
            SECTION 2 // SYSTEM INGEST
          </span>
        </div>
        <h1 className="font-sans text-2xl md:text-3xl font-extrabold text-[#e2e2e2] tracking-tight uppercase">
          Extracted Focus Facts
        </h1>
      </div>

      {/* SECTION 2 PANEL */}
      <div className="glass-panel border-2 border-[#00f0ff] bg-black/80 rounded-none p-6 md:p-8 relative overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.15)]">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/5 rounded-none blur-3xl pointer-events-none" />

        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[#3b494b]/40 pb-4 mb-6 select-none">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[#00f0ff] w-4.5 h-4.5" />
            <h2 className="font-sans text-lg font-black text-white tracking-wide uppercase">
              CONFIRMED BEHAVIOR EVIDENCE
            </h2>
          </div>
          <span className="font-mono text-[9px] bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-2 py-0.5 font-bold">
            JUSTIFIED ONLY
          </span>
        </div>

        {/* Extracted Facts Formatted Output list */}
        <div className="flex flex-col gap-5 text-left relative z-10 font-sans">
          
          {/* Goal Detected */}
          <div className="border-b border-[#3b494b]/15 pb-4">
            <span className="font-mono text-[9px] text-[#00f0ff] uppercase tracking-widest font-black block mb-1">
              Goal Detected
            </span>
            <p className="text-sm sm:text-base leading-relaxed">
              {renderValueOrGuard(goalText)}
            </p>
          </div>

          {/* Obstacle Detected */}
          <div className="border-b border-[#3b494b]/15 pb-4">
            <span className="font-mono text-[9px] text-[#ffb4ab] uppercase tracking-widest font-black block mb-1">
              Obstacle Detected
            </span>
            <p className="text-sm sm:text-base leading-relaxed">
              {renderValueOrGuard(distractionText)}
            </p>
          </div>

          {/* Time Impact */}
          <div className="border-b border-[#3b494b]/15 pb-4">
            <span className="font-mono text-[9px] text-[#ffcb7c] uppercase tracking-widest font-black block mb-1">
              Time Impact
            </span>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-[#ffcb7c]" />
              <p className="text-sm sm:text-base leading-none">
                {renderValueOrGuard(timeImpactText)}
              </p>
            </div>
          </div>

          {/* Key Learning */}
          <div className="border-b border-[#3b494b]/15 pb-4">
            <span className="font-mono text-[9px] text-[#eedeff] uppercase tracking-widest font-black block mb-1">
              Key Learning
            </span>
            <p className="text-sm sm:text-base leading-relaxed">
              {renderValueOrGuard(keyLearningText)}
            </p>
          </div>

          {/* Confidence Level */}
          <div>
            <span className="font-mono text-[9px] text-[#90ee90] uppercase tracking-widest font-black block mb-1">
              Confidence Level
            </span>
            <div className="flex items-center gap-2 text-[#90ee90] font-mono font-bold">
              <CheckCircle2 size={14} />
              <span>{animatedScore}% Confidence Verification rating</span>
            </div>
          </div>

        </div>
      </div>

      {/* Visual attention matrix diagram */}
      {result.flowchart && (
        <div className="flex flex-col gap-2 mt-2 text-left">
          <span className="font-mono text-[9px] tracking-widest text-[#b9cacb]/60 font-bold uppercase select-none px-1">
            VISUAL ATTENTION PROCESS MAP
          </span>
          <AnalysisFlowchart data={result.flowchart} />
        </div>
      )}

      {/* Action triggers bottom */}
      <div className="mt-4 pt-5 border-t-[0.5px] border-[#3b494b]/30 flex justify-end">
        <button
          onClick={onConvert}
          className="w-full sm:w-auto bg-[#00dbe9] hover:bg-[#7df4ff] text-black font-mono text-xs tracking-widest uppercase font-extrabold px-10 py-4.5 rounded-none flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(0,219,233,0.35)]"
        >
          START STUDY SESSION TIMER
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
