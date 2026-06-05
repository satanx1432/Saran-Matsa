import { useEffect, useState } from "react";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
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
    const target = result.confidence;
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

  // Robust parse function to calculate exact minutes or hours lost in current entry
  const calculateTimeLost = (text: string): string => {
    if (!text) return "30 minutes";
    // Check for "Time lost: X mins" or "time: X"
    const matches = [...text.matchAll(/(?:time lost|lost|duration):\s*([0-9.]+)\s*(min|hour|hr|h|m)/gi)];
    let totalMinutes = 0;
    for (const match of matches) {
      const val = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit.startsWith("h")) {
        totalMinutes += val * 60;
      } else {
        totalMinutes += val;
      }
    }
    
    if (totalMinutes === 0) {
      // General broad scan for numbers followed by time metrics
      const numbers = text.match(/\b([0-9.]+)\s*(min|hour|hr|h)/gi);
      if (numbers) {
        for (const numStr of numbers) {
          const val = parseFloat(numStr);
          const unit = numStr.toLowerCase();
          if (unit.includes("h") || unit.includes("hr")) {
            totalMinutes += val * 60;
          } else {
            totalMinutes += val;
          }
        }
      }
    }
    
    if (totalMinutes > 0) {
      if (totalMinutes >= 60) {
        const hrs = (totalMinutes / 60).toFixed(1);
        return `${hrs} hours (${totalMinutes} mins total)`;
      }
      return `${totalMinutes} minutes`;
    }
    return "30 minutes"; // Clean default
  };

  const detectedTimeLost = calculateTimeLost(rawInputText);

  // Extract a beautiful recurring trigger
  const detectedTrigger = result.bottleneck_points && result.bottleneck_points.length > 0
    ? result.bottleneck_points[0].replace(/^>\s*/, "") // Strip cyber chevron
    : "Intermittent context shift triggers";

  const suggestedImprovement = result.actionable_desc || "Initiate a focused workspace cleanup block.";

  return (
    <div className="w-full flex flex-col gap-8 text-left animate-fade-in" id="analysis-results-section">
      
      {/* Title Header Section */}
      <div className="flex flex-col gap-2 border-b-[0.5px] border-[#3b494b]/30 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 bg-[#00f0ff] signal-glow rounded-none animate-ping"></div>
          <span className="font-mono text-xs text-[#00f0ff] uppercase tracking-[0.2em] font-bold">
            HASEX // DECODED COGNITIVE STREAM
          </span>
        </div>
        <h1 className="font-sans text-2xl md:text-4xl font-bold text-[#e2e2e2] tracking-tight">
          {result.title || "Clarity Matrix Initialized"}
        </h1>
      </div>

      {result.usingFallback && (
        <div className="border-[0.5px] border-[#3b494b]/40 bg-[#1b1b1b]/30 px-5 py-3.5 text-xs font-mono text-[#b9cacb]/80 flex flex-col gap-1 rounded-none leading-relaxed">
          <div className="flex items-center gap-2 text-[#00f0ff] font-bold">
            <span className="w-1.5 h-1.5 bg-[#00f0ff] animate-pulse"></span>
            SYS_NOTICE // REAL-TIME COGNITIVE SIMULATOR ENGAGED
          </div>
          <div>Evaluating distraction categories and calibrating tailored work recommendations.</div>
        </div>
      )}

      {/* RETHINK / ACTION WORKFLOW REWARD PANEL: FOCUS ANALYSIS */}
      <div className="glass-panel border-2 border-[#00f0ff] bg-black/80 rounded-none p-6 md:p-8 relative overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.15)]">
        {/* Abstract cyber decoration background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#00f0ff]/10 rounded-none blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#c57cff]/5 rounded-none blur-2xl pointer-events-none" />
        
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-[#3b494b]/40 pb-4 mb-6 select-none">
          <div className="flex items-center gap-2.5">
            <Sparkles className="text-[#00f0ff] w-4.5 h-4.5 animate-spin-slow" />
            <h2 className="font-sans text-xl md:text-2xl font-black text-white tracking-wide uppercase">
              FOCUS ANALYSIS
            </h2>
          </div>
          <span className="font-mono text-[9px] bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-2.5 py-1 font-extrabold select-none">
            REWARD ACCESSED // LIVE INSIGHT
          </span>
        </div>

        {/* Focus analysis keys mapped inside a beautiful visual grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left">
          
          {/* Top Distraction */}
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[11.5px] text-[#b9cacb]/60 uppercase font-black tracking-wider block">
              Top Distraction:
            </span>
            <p className="font-sans text-base md:text-lg font-bold text-[#e2e2e2] leading-tight pr-2">
              {result.bottleneck_title}
            </p>
          </div>

          {/* Time Lost */}
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[11.5px] text-[#b9cacb]/60 uppercase font-black tracking-wider block">
              Time Lost This Week:
            </span>
            <div className="flex items-center gap-2 text-[#ffb4ab]">
              <Clock size={18} className="animate-pulse" />
              <p className="font-sans text-base md:text-lg font-bold leading-tight">
                {detectedTimeLost}
              </p>
            </div>
          </div>

          {/* Recurring Trigger */}
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[11.5px] text-[#b9cacb]/60 uppercase font-black tracking-wider block">
              Recurring Trigger:
            </span>
            <p className="font-sans text-sm text-[#e2e2e2] font-semibold leading-relaxed">
              {detectedTrigger}
            </p>
          </div>

          {/* Suggested Improvement */}
          <div className="flex flex-col gap-1">
            <span className="font-sans text-[11.5px] text-[#b9cacb]/60 uppercase font-black tracking-wider block">
              Suggested Improvement:
            </span>
            <div className="bg-[#c57cff]/5 border-[0.5px] border-[#c57cff]/30 p-3.5 rounded-none">
              <p className="font-sans text-xs text-[#eedeff] leading-relaxed select-text">
                {suggestedImprovement}
              </p>
            </div>
          </div>
        </div>

        {/* Micro-score and status footer */}
        <div className="mt-6 pt-5 border-t border-[#3b494b]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-[10px] text-[#b9cacb]/55 select-none text-left">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#00f0ff] rounded-none inline-block" />
            <span>CONFIDENCE ACCURACY rating: {animatedScore}%</span>
          </div>
          <span>Reflected with HASEX Neural Protocol streams</span>
        </div>
      </div>

      {/* Standard Cyberpunk Bento Details for deep dive (Process Flowchart & Raw logs review) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
        
        {/* Left Column: Raw Ingest Review */}
        <div className="lg:col-span-4 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1 select-none">
            <span className="font-mono text-[9px] tracking-widest text-[#b9cacb]/60 font-bold uppercase">
              JOURNAL_LOG [ENCRYPTED_STREAM]
            </span>
          </div>
          <div className="glass-panel p-5 bg-[#09090a]/85 border-[#3b494b]/30 h-[200px] md:h-auto max-h-[300px] overflow-y-auto font-mono text-[11px] text-[#b9cacb]/70 leading-relaxed whitespace-pre-wrap rounded-none text-left select-text">
            {rawInputText}
          </div>
        </div>

        {/* Right Column: Focus Map Flowchart and detailed corrective actions */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {result.flowchart && (
            <div className="flex flex-col gap-2">
              <span className="font-mono text-[9px] tracking-widest text-[#b9cacb]/60 font-bold uppercase select-none px-1">
                VISUAL ATTENTION MATRIX PROCESS
              </span>
              <AnalysisFlowchart data={result.flowchart} />
            </div>
          )}
        </div>
      </div>

      {/* Convert to tactical timed focus countdown loop */}
      <div className="mt-4 pt-6 border-t-[0.5px] border-[#3b494b]/30 flex justify-end">
        <button
          onClick={onConvert}
          className="w-full sm:w-auto bg-[#00dbe9] hover:bg-[#7df4ff] text-black font-mono text-xs tracking-widest uppercase font-extrabold px-10 py-4.5 rounded-none flex items-center justify-center gap-2 group transition-all duration-300 active:scale-95 cursor-pointer hover:signal-glow shadow-[0_0_15px_rgba(0,219,233,0.35)] animate-bounce"
        >
          START WORK TIMER! (LET'S GO!)
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
