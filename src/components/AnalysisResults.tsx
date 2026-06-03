import { useEffect, useState } from "react";
import { ArrowRight, RefreshCw, Brain, CornerDownRight } from "lucide-react";
import { AnalysisResult } from "../types";
import AnalysisFlowchart from "./AnalysisFlowchart";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onConvert: () => void;
  rawInputText: string;
}

export default function AnalysisResults({ result, onConvert, rawInputText }: AnalysisResultsProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [glitchText, setGlitchText] = useState(rawInputText);

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

  // Subtle cyberpunk text glitch effect in raw stream
  useEffect(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*[]:;?";
    const interval = setInterval(() => {
      if (!rawInputText) return;
      const originalLines = rawInputText.split(" ");
      if (originalLines.length < 3) return;

      // Randomly glitch a couple of words
      const glitched = originalLines.map((word) => {
        if (Math.random() > 0.95 && word.length > 2) {
          // Replace it with random symbols
          return Array.from({ length: word.length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
        }
        return word;
      }).join(" ");

      setGlitchText(glitched);

      // Revert quickly
      setTimeout(() => {
        setGlitchText(rawInputText);
      }, 150);
    }, 4000); // Glitch once every 4s

    return () => clearInterval(interval);
  }, [rawInputText]);

  return (
    <div className="w-full flex flex-col gap-8" id="analysis-results-section">
      {/* Page Context Header */}
      <div className="flex flex-col gap-2 border-b-[0.5px] border-[#3b494b]/30 pb-6 text-left">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#00dbe9] signal-glow rounded-none animate-ping"></div>
          <h1 className="font-mono text-xs text-[#00dbe9] uppercase tracking-[0.2em] font-bold">
            HASEX // AI_INSIGHT_LOGIC
          </h1>
        </div>
        <p className="font-sans text-2xl md:text-3.5xl font-bold text-[#e2e2e2] tracking-tight antialiased">
          {result.title || "Decrypting Semantic Vectors"}
        </p>
      </div>

      {result.usingFallback && (
        <div className="border-[0.5px] border-[#3b494b]/40 bg-[#1b1b1b]/30 text-left px-5 py-3 text-xs font-mono text-[#b9cacb]/80 flex flex-col gap-1 rounded-none leading-relaxed">
          <div className="flex items-center gap-2 text-[#00f0ff] font-bold">
            <span className="w-1.5 h-1.5 bg-[#00f0ff] animate-pulse"></span>
            SYS_NOTICE // DEMO DECRYPTER ENGAGED
          </div>
          <div>No active process key loaded in AI Studio Secrets tab. Initializing fallback logic analyzer mapping input structures.</div>
        </div>
      )}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
        {/* Left Column: Raw Data Stream (Span 4) */}
        <div className="md:col-span-4 flex flex-col gap-2">
          <div className="flex items-center justify-between px-2">
            <span className="font-mono text-[10px] tracking-widest text-[#b9cacb]/70 font-semibold uppercase">
              INPUT_STREAM [RAW]
            </span>
            <RefreshCw size={12} className="text-[#b9cacb]/60 animate-spin" style={{ animationDuration: "5s" }} />
          </div>

          <div className="glass-panel rounded-none p-6 h-[250px] md:h-full min-h-[220px] overflow-y-auto relative group bg-[#0a0a0b]/80 border-[#3b494b]/30">
            {/* Top/Bottom Fade effects */}
            <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-[#000000] to-transparent opacity-40 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-[#000000] to-transparent opacity-40 pointer-events-none"></div>

            <p className="font-mono text-xs text-[#b9cacb]/90 break-words leading-relaxed leading-6 whitespace-pre-line select-text">
              {glitchText || rawInputText}
            </p>
          </div>
        </div>

        {/* Right Column: Structured Insights (Span 8) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Top Row: Quick Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Confidence score indicator */}
            <div className="glass-panel border-[#3b494b]/30 rounded-none p-6 flex flex-col justify-between relative overflow-hidden bg-[#0a0a0b]/70 min-h-[140px]">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#00dbe9]/5 rounded-none blur-xl pointer-events-none"></div>
              <span className="font-mono text-[10px] tracking-widest text-[#b9cacb]/70 font-semibold block mb-4 uppercase">
                CONFIDENCE_SCORE
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-sans text-5xl md:text-6xl font-bold text-[#00dbe9] tracking-tighter tabular-nums text-glow">
                  {animatedScore}
                </span>
                <span className="font-sans text-xl font-medium text-[#00dbe9]">%</span>
              </div>
              <div className="w-full h-[1px] bg-[#3b494b]/30 mt-4 relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-[#00dbe9] transition-all duration-1000" 
                  style={{ width: `${animatedScore}%` }}
                />
              </div>
            </div>

            {/* Detected bottleneck block */}
            <div className="glass-panel border-[#93000a]/50 bg-[#93000a]/5 rounded-none p-6 flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] tracking-widest text-[#ffb4ab] font-bold uppercase">
                  DETECTED_BOTTLENECK
                </span>
                <div className="w-1.5 h-1.5 bg-[#ffb4ab] animate-pulse"></div>
              </div>
              <div>
                <h4 className="font-sans text-lg md:text-xl font-bold text-[#e2e2e2] mb-2 leading-tight">
                  {result.bottleneck_title}
                </h4>
                <div className="flex flex-col gap-1 font-mono text-[11px] text-[#b9cacb]/80">
                  {result.bottleneck_points.map((point, index) => (
                    <span key={index} className="block leading-relaxed">
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: AI Actionable Insight Vector */}
          <div className="glass-panel border-[#3b494b]/30 rounded-none p-6 sm:p-8 flex-grow relative group bg-[#0a0a0b]/70 hover:border-[#00dbe9]/50 transition-all duration-500">
            <div className="flex items-start gap-4 mb-6">
              <div className="mt-1 flex-shrink-0 bg-[#00dbe9]/10 p-2 border-[0.5px] border-[#00dbe9]/20">
                <Brain size={20} className="text-[#00dbe9]" />
              </div>
              <div className="text-left">
                <span className="font-mono text-[10px] tracking-widest text-[#00dbe9] font-bold block mb-1 uppercase">
                  AI_INSIGHT // ACTIONABLE_VECTOR
                </span>
                <h3 className="font-sans text-xl md:text-2xl font-semibold text-[#e2e2e2] tracking-tight">
                  {result.actionable_title}
                </h3>
              </div>
            </div>

            <p className="font-sans text-sm md:text-md text-[#b9cacb] leading-relaxed mb-6 max-w-2xl select-text">
              {result.actionable_desc}
            </p>

            {/* Step targets */}
            <div className="space-y-3.5 border-t-[0.5px] border-[#3b494b]/30 pt-6">
              <div className="flex items-center gap-3">
                <CornerDownRight size={14} className="text-[#b9cacb]/60" />
                <span className="font-mono text-xs text-[#e2e2e2]">
                  <strong className="text-[#b9cacb]">Target:</strong> {result.target}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CornerDownRight size={14} className="text-[#b9cacb]/60" />
                <span className="font-mono text-xs text-[#e2e2e2]">
                  <strong className="text-[#b9cacb]">Action:</strong> {result.action_required}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual attention analysis flowchart map */}
      {result.flowchart && (
        <AnalysisFlowchart data={result.flowchart} />
      )}

      {/* Convert to Mission action button */}
      <div className="mt-4 pt-6 border-t-[0.5px] border-[#3b494b]/30 flex justify-end">
        <button
          onClick={onConvert}
          className="w-full sm:w-auto bg-[#00dbe9] hover:bg-[#7df4ff] text-black font-mono text-xs tracking-widest uppercase font-bold px-8 py-4 rounded-none flex items-center justify-center gap-2 group transition-all duration-300 active:scale-95 cursor-pointer hover:signal-glow-active"
        >
          CONVERT TO MISSION
          <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
        </button>
      </div>
    </div>
  );
}
