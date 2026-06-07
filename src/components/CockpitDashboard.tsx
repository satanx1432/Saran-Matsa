import React, { useState } from "react";
import { Zap, Clock, Terminal, CheckCircle2, FileText, ArrowRight, Activity, Search, ShieldAlert, Cpu, Sparkles, Loader2, Brain, Compass, HelpCircle } from "lucide-react";
import { CompletedMission, CognitiveLog } from "../types";

interface CockpitDashboardProps {
  completedMissions: CompletedMission[];
  logs: CognitiveLog[];
  onSelectLog: (logId: string) => void;
  onNavigateToAnalyze: () => void;
  onAddSyntheticLogs?: (newLogs: CognitiveLog[]) => void;
}

interface RagResult {
  title: string;
  content: string;
  score: number;
  source: string;
}

export default function CockpitDashboard({ 
  completedMissions, 
  logs, 
  onSelectLog, 
  onNavigateToAnalyze,
  onAddSyntheticLogs
}: CockpitDashboardProps) {

  // Total statistics calculations
  const totalSig = completedMissions.reduce((acc, m) => acc + m.reward, 0);
  const totalSecondsCompleted = completedMissions.reduce((acc, m) => acc + m.time_spent_s, 0);
  const totalMinSpent = Math.round(totalSecondsCompleted / 60);

  // Assistant selection states
  const [assistantMode, setAssistantMode] = useState<"learn" | "create" | null>(() => {
    return (localStorage.getItem("hasex_assistant_mode") as "learn" | "create") || null;
  });

  // RAG Query states
  const [ragQuery, setRagQuery] = useState("");
  const [systemIndex, setSystemIndex] = useState("1");
  const [ragResults, setRagResults] = useState<RagResult[]>([]);
  const [isRagPending, setIsRagPending] = useState(false);
  const [ragStatus, setRagStatus] = useState<string | null>(null);

  // Synthetic states
  const [isSynthPending, setIsSynthPending] = useState(false);
  const [synthStatus, setSynthStatus] = useState<string | null>(null);

  const handleSelectAssistant = (mode: "learn" | "create") => {
    setAssistantMode(mode);
    localStorage.setItem("hasex_assistant_mode", mode);
    // Instant trigger interactive assistant load on click!
    window.dispatchEvent(new CustomEvent("open-hasex-ai", { detail: { mode } }));
  };

  // Run RAG Search
  const handleRagSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim() || isRagPending) return;

    setIsRagPending(true);
    setRagStatus(`Retrieving augmented guidelines vector from System ${systemIndex}...`);

    try {
      const response = await fetch("/api/rag-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: ragQuery, activeLogs: logs, systemIndex })
      });

      if (response.ok) {
        const data = await response.json();
        setRagResults(data.results || []);
        if (data.requiresApiKey) {
          setRagStatus(`EMULATED HANDSHAKE: Local fallback simulated for ${data.systemName || "RAG engine"}. Configure key in Secrets to activate live search.`);
        } else {
          setRagStatus(`ACTIVE DECODE: ${data.systemName || "RAG gateway"} returned secure telemetry streams.`);
        }
      } else {
        throw new Error("Handshake connection fault");
      }
    } catch (err: any) {
      setRagStatus(`FAULT: ${err?.message || "TRANSACTION_FAIL"}`);
    } finally {
      setIsRagPending(false);
    }
  };

  // Run Synthetic Generation
  const handleGenerateSyntheticData = async () => {
    if (isSynthPending) return;
    setIsSynthPending(true);
    setSynthStatus("Calibrating synthetic focus log generator...");

    try {
      const response = await fetch("/api/generate-synthetic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateName: "COG_FOCAL", count: 2 })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.logs && onAddSyntheticLogs) {
          const mappedLogs: CognitiveLog[] = data.logs.map((sl: any) => ({
            id: `SYN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            rawText: sl.rawText,
            title: sl.title,
            confidence: sl.confidence,
            bottleneckTitle: sl.bottleneck_title,
            createdAt: new Date().toISOString()
          }));
          onAddSyntheticLogs(mappedLogs);
          setSynthStatus(`INJECTED: 2 Synthetic logs populated via ${data.source}`);
        }
      } else {
        throw new Error("Generation failure inside proxy");
      }
    } catch (err: any) {
      setSynthStatus(`ERROR: ${err?.message || "Handshake rejected"}`);
    } finally {
      setIsSynthPending(false);
    }
  };

  const currentFocusChallenge = logs.length > 0 
    ? logs[0].bottleneckTitle 
    : "No major focus distractions logged yet today.";

  const latestInsightText = logs.length > 0 
    ? logs[0].title 
    : "Your mind is currently perfectly fresh. Ready to begin your first workflow!";

  return (
    <div className="w-full flex flex-col gap-8 text-left" id="cockpit-radar-dashboard">
      
      {/* Top Header Block Redesign - Clarity First, Branding Second, Lore Third */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#00f0ff] signal-glow"></div>
          <h1 className="font-sans text-3xl md:text-5xl font-bold text-[#e2e2e2] tracking-tight antialiased uppercase">
            Your Personal AI Operating System
          </h1>
        </div>
        <p className="font-sans text-sm tracking-normal text-[#b9cacb] font-medium">
          Learn faster, stay organized, track progress, and build projects with AI assistance.
          <span className="font-mono text-[10px] text-[#00f0ff] opacity-60 ml-2.5 select-none">(HASEX OS v0.1)</span>
        </p>
      </div>

      {/* Onboarding Wizard Checklist: Choose Your Assistant */}
      {!assistantMode ? (
        <div className="glass-panel p-6 bg-[#0c0c0e]/95 border-2 border-[#00f0ff]/50 rounded-none text-left relative overflow-hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/10 rounded-none blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-2 border-b border-[#3b494b]/30 pb-3 mb-4">
            <Sparkles className="text-[#00f0ff] w-4 h-4 animate-spin-slow" />
            <span className="font-mono text-[10px] tracking-widest text-[#00f0ff] font-extrabold uppercase">
              CHOOSE YOUR ASSISTANT
            </span>
          </div>

          <p className="text-xs text-[#b9cacb] mb-5 font-sans leading-relaxed">
            Select the primary mode of AI assistance you require to optimize your focus and operations today:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Learn Block */}
            <div 
              onClick={() => handleSelectAssistant("learn")}
              className="border-[1.5px] border-[#00f0ff]/30 hover:border-[#00f0ff] bg-black/40 hover:bg-[#00f0ff]/5 p-5 cursor-pointer transition-all duration-300 flex flex-col gap-2.5 rounded-none group"
            >
              <div className="flex justify-between items-center">
                <span className="font-sans text-lg font-bold text-white group-hover:text-[#00f0ff]">
                  📚 Learn Assistant
                </span>
                <span className="font-mono text-[8px] bg-[#00f0ff]/10 text-[#00f0ff] px-2 py-0.5 rounded-none font-bold">MODE: STUDY</span>
              </div>
              <p className="text-xs text-[#b9cacb]/85 leading-relaxed">
                Understand difficult concepts, solve heavy equation problems, synthesize workspace data, and learn anything faster with dedicated educational guides.
              </p>
              <span className="text-[10px] font-mono text-[#00f0ff] group-hover:opacity-100 opacity-75 mt-2 transition-opacity flex items-center gap-1">
                Activate Assistant <ArrowRight size={11} />
              </span>
            </div>

            {/* Creator Block */}
            <div 
              onClick={() => handleSelectAssistant("create")}
              className="border-[1.5px] border-[#c57cff]/30 hover:border-[#c57cff] bg-black/40 hover:bg-[#c57cff]/5 p-5 cursor-pointer transition-all duration-300 flex flex-col gap-2.5 rounded-none group"
            >
              <div className="flex justify-between items-center">
                <span className="font-sans text-lg font-bold text-white group-hover:text-[#c57cff]">
                  🧠 Creator Assistant
                </span>
                <span className="font-mono text-[8px] bg-[#c57cff]/10 text-[#c57cff] px-2 py-0.5 rounded-none font-bold">MODE: BUILD</span>
              </div>
              <p className="text-xs text-[#b9cacb]/85 leading-relaxed">
                Build physical ideas/blueprints, write code scripts, design dynamic visual mockups, structure agendas, and ship projects with AI assistance.
              </p>
              <span className="text-[10px] font-mono text-[#c57cff] group-hover:opacity-100 opacity-75 mt-2 transition-opacity flex items-center gap-1">
                Activate Assistant <ArrowRight size={11} />
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Statistics Block */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Progress Score (ACCUMULATED_SIGNALS) */}
        <div className="glass-panel p-6 rounded-none relative overflow-hidden bg-[#0a0a0b]/80 border-[#3b494b]/40">
          <div className="absolute top-4 right-4 text-[#00dbe9]/20 font-mono text-[9px] uppercase font-bold select-none">ACCUMULATED_SIGNALS</div>
          <span className="font-mono text-[10px] tracking-widest text-[#b9cacb]/60 block mb-2 font-bold uppercase">
            Signal Score
          </span>
          <div className="flex items-center gap-2 text-[#00dbe9] text-glow">
            <Zap size={20} className="fill-current" />
            <span className="font-sans text-4xl sm:text-5xl font-black">{totalSig}</span>
            <span className="font-mono text-xs font-bold self-end pb-1 ml-0.5">SIG</span>
          </div>
        </div>

        {/* Tasks Completed (MISSIONS_COMPLETED) */}
        <div className="glass-panel p-6 rounded-none relative overflow-hidden bg-[#0a0a0b]/80 border-[#3b494b]/40">
          <div className="absolute top-4 right-4 text-[#00dbe9]/20 font-mono text-[9px] uppercase font-bold select-none">MISSIONS_COMPLETED</div>
          <span className="font-mono text-[10px] tracking-widest text-[#b9cacb]/60 block mb-2 font-bold uppercase">
            Tasks Completed
          </span>
          <div className="flex items-center gap-2 text-[#e2e2e2]">
            <CheckCircle2 size={22} className="text-[#00f0ff] filter drop-shadow-[0_0_4px_rgba(0,219,233,0.5)]" />
            <span className="font-sans text-4xl sm:text-5xl font-black">{completedMissions.length}</span>
            <span className="font-mono text-xs font-bold self-end pb-1 ml-0.5">OPS</span>
          </div>
        </div>

        {/* Focus Time Today (FOCUS_TIME_ESTIMATE) */}
        <div className="glass-panel p-6 rounded-none relative overflow-hidden bg-[#0a0a0b]/80 border-[#3b494b]/40">
          <div className="absolute top-4 right-4 text-[#00dbe9]/20 font-mono text-[9px] uppercase font-bold select-none">FOCUS_TIME_ESTIMATE</div>
          <span className="font-mono text-[10px] tracking-widest text-[#b9cacb]/60 block mb-2 font-bold uppercase">
            Focus Time Today
          </span>
          <div className="flex items-center gap-2 text-[#e2e2e2]">
            <Clock size={20} className="text-[#ffb4ab]" />
            <span className="font-sans text-4xl sm:text-5xl font-black">{totalMinSpent}</span>
            <span className="font-mono text-xs font-bold self-end pb-1 ml-0.5">MIN</span>
          </div>
        </div>
      </div>

      {/* Main split sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left pane: Action Launchers & Focus Challenge */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Main call-to-action dashboard focus launcher */}
          <div className="glass-panel p-6 rounded-none bg-[#0a0a0b]/85 border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,219,233,0.05)] flex flex-col gap-5 text-center items-center justify-center min-h-[224px] relative overflow-hidden">
            {/* Design accents */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00dbe9]/80 to-transparent" />
            <div className="absolute right-0 top-0 w-16 h-16 bg-[#00f0ff]/2 rounded-none blur-xl pointer-events-none" />
            
            <div className="bg-[#00f0ff]/10 p-3 border-[0.5px] border-[#00f0ff]/25 rounded-none select-none animate-pulse">
              <Activity size={32} className="text-[#00f0ff]" />
            </div>
            
            <div className="flex flex-col gap-1 text-center">
              <h3 className="font-sans text-base font-extrabold text-white tracking-wide uppercase">
                Work Session Launcher
              </h3>
              <p className="font-sans text-xs text-[#b9cacb]/85 max-w-sm leading-relaxed">
                Log distractions or clear system context switching traps, and generate optimized learning schedules.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={onNavigateToAnalyze}
                className="w-full bg-[#00f0ff] hover:bg-[#7df4ff] text-black font-mono text-xs tracking-widest uppercase font-bold py-3.5 px-4 rounded-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,219,233,0.2)] hover:shadow-[0_0_20px_rgba(0,219,233,0.35)] active:scale-95 text-glow-subtle animate-bounce"
              >
                <span>START YOUR FIRST SESSION</span>
                <ArrowRight size={13} className="stroke-[2.5px]" />
              </button>
            </div>
          </div>

          {/* Attention Array Degradation / Focus Challenge card */}
          <div className="glass-panel p-5 rounded-none bg-[#0a0a0b]/75 border-[#ffb4ab]/30 relative overflow-hidden">
            <div className="absolute top-2 right-2 font-mono text-[7px] text-[#ffb4ab]/30 select-none">ATTENTION_ARRAY_DEGRADATION</div>
            <span className="font-mono text-[9px] tracking-widest text-[#ffb4ab] font-bold block mb-1 uppercase">
              Focus Challenge
            </span>
            <div className="flex items-center gap-2.5 border-b border-[#3b494b]/20 pb-2 mb-3">
              <ShieldAlert className="text-[#ffb4ab] w-4 h-4 animate-pulse" />
              <span className="font-sans text-sm font-semibold text-white">YOUR ACCUMULATED OBSTACLES</span>
            </div>
            <p className="font-sans text-xs text-[#b9cacb]/85 leading-relaxed italic">
              {currentFocusChallenge}
            </p>
          </div>
        </div>

        {/* Right pane: list of past scanned logs decryption (Recent Insights) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#00dbe9]" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#e2e2e2]">
                Recent Insights
              </h3>
            </div>
            
            <p className="font-sans text-xs text-[#b9cacb]/70 leading-relaxed -mt-1.5 mb-1 bg-[#101012]/40 p-3 border-l-2 border-[#3b494b]/30">
              Review saved mental clarity insights and focus bottlenecks logged from your previous entries.
            </p>

            <div className="glass-panel bg-[#0a0a0b]/70 border-[#3b494b]/40 rounded-none overflow-hidden flex flex-col min-h-[220px]">
              {logs.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-[#b9cacb]/50 select-none">
                  <FileText size={32} className="opacity-30 mb-2.5 text-[#00f0ff]" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#e2e2e2]">No Insights Recorded Yet</span>
                  <span className="font-sans text-[11.5px] max-w-sm mt-1.5 leading-relaxed text-[#b9cacb]/70">
                    Your completed focus work sessions and cognitive checks will show metrics and suggestions here.
                  </span>
                </div>
              ) : (
                <div className="divide-y-[0.5px] divide-[#3b494b]/30">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => onSelectLog(log.id)}
                      className="p-4 hover:bg-[#00f0ff]/5 transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="flex-grow flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="font-sans text-sm font-semibold text-[#e2e2e2] group-hover:text-[#00f0ff] transition-colors truncate">
                            {log.title}
                          </span>
                          <span className="font-mono text-[9px] bg-[#00f0ff]/10 border-[0.5px] border-[00f0ff]/20 px-1.5 py-0.5 text-[#00f0ff] uppercase rounded-none font-bold select-none whitespace-nowrap">
                            Clarity: {log.confidence}%
                          </span>
                        </div>
                        
                        <p className="font-sans text-xs text-[#b9cacb]/70 truncate max-w-xl italic">
                          &quot;{log.rawText}&quot;
                        </p>
                        
                        <span className="font-mono text-[8.5px] text-[#b9cacb]/40 select-none">
                          Log Entry #{log.id} • Saved on {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                        </span>
                      </div>

                      <div className="flex-shrink-0 text-[#b9cacb]/40 group-hover:text-[#00f0ff] transition-all transform group-hover:translate-x-1 select-none">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
