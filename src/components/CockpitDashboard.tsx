import React, { useState } from "react";
import { Zap, Clock, Terminal, CheckCircle2, FileText, ArrowRight, Activity, Search, ShieldAlert, Cpu, Sparkles, Loader2 } from "lucide-react";
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

  // RAG Query states
  const [ragQuery, setRagQuery] = useState("");
  const [systemIndex, setSystemIndex] = useState("1");
  const [ragResults, setRagResults] = useState<RagResult[]>([]);
  const [isRagPending, setIsRagPending] = useState(false);
  const [ragStatus, setRagStatus] = useState<string | null>(null);

  // Synthetic states
  const [isSynthPending, setIsSynthPending] = useState(false);
  const [synthStatus, setSynthStatus] = useState<string | null>(null);

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

  return (
    <div className="w-full flex flex-col gap-8 text-left" id="cockpit-radar-dashboard">
      {/* Top Welcome Title Grid */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#00f0ff] signal-glow"></div>
          <h1 className="font-sans text-3xl md:text-5xl font-bold text-[#e2e2e2] tracking-tight antialiased uppercase">
            COGNITIVE_RADAR_HUB
          </h1>
        </div>
        <p className="font-mono text-xs tracking-wider text-[#b9cacb]/80">
          SYS.LOG // ACTIVE COGNITIVE INTELLIGENCE & METRIC OVERVIEW
        </p>
      </div>

      {/* Statistics Block */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-none relative overflow-hidden bg-[#0a0a0b]/80 border-[#3b494b]/40">
          <div className="absolute top-4 right-4 text-[#00dbe9]/20 font-mono text-[9px] uppercase font-bold select-none">NET_GAIN</div>
          <span className="font-mono text-[10px] tracking-widest text-[#b9cacb]/60 block mb-2 font-bold uppercase">
            ACCUMULATED_SIGNALS
          </span>
          <div className="flex items-center gap-2 text-[#00dbe9] text-glow">
            <Zap size={20} className="fill-current" />
            <span className="font-sans text-4xl sm:text-5xl font-black">{totalSig}</span>
            <span className="font-mono text-xs font-bold self-end pb-1 ml-0.5">SIG</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-none relative overflow-hidden bg-[#0a0a0b]/80 border-[#3b494b]/40">
          <div className="absolute top-4 right-4 text-[#00dbe9]/20 font-mono text-[9px] uppercase font-bold select-none">RESOLVED</div>
          <span className="font-mono text-[10px] tracking-widest text-[#b9cacb]/60 block mb-2 font-bold uppercase">
            MISSIONS_COMPLETED
          </span>
          <div className="flex items-center gap-2 text-[#e2e2e2]">
            <CheckCircle2 size={22} className="text-[#00f0ff] filter drop-shadow-[0_0_4px_rgba(0,219,233,0.5)]" />
            <span className="font-sans text-4xl sm:text-5xl font-black">{completedMissions.length}</span>
            <span className="font-mono text-xs font-bold self-end pb-1 ml-0.5">OPS</span>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-none relative overflow-hidden bg-[#0a0a0b]/80 border-[#3b494b]/40">
          <div className="absolute top-4 right-4 text-[#00dbe9]/20 font-mono text-[9px] uppercase font-bold select-none">COMMITTED</div>
          <span className="font-mono text-[10px] tracking-widest text-[#b9cacb]/60 block mb-2 font-bold uppercase">
            FOCUS_TIME_ESTIMATE
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
        {/* Left pane: Quick actions and signal log details */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-none bg-[#0a0a0b]/85 border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,219,233,0.05)] flex flex-col gap-5 text-center items-center justify-center min-h-[224px] relative overflow-hidden">
            {/* Design accents */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00dbe9]/80 to-transparent" />
            <div className="absolute right-0 top-0 w-16 h-16 bg-[#00f0ff]/2 rounded-none blur-xl pointer-events-none" />
            
            <div className="bg-[#00f0ff]/10 p-3 border-[0.5px] border-[#00f0ff]/25 rounded-none select-none">
              <Activity size={32} className="text-[#00f0ff] animate-pulse" />
            </div>
            
            <div className="flex flex-col gap-1 text-center">
              <h3 className="font-sans text-base font-extrabold text-white tracking-wide uppercase">
                Focus Dashboard
              </h3>
              <p className="font-sans text-xs text-[#b9cacb]/80 max-w-sm leading-relaxed">
                Analyze your cognitive reflections to discover productivity insights and personalized goals.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                onClick={onNavigateToAnalyze}
                className="w-full bg-[#00f0ff] hover:bg-[#7df4ff] text-black font-mono text-xs tracking-widest uppercase font-bold py-3.5 px-4 rounded-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,219,233,0.2)] hover:shadow-[0_0_20px_rgba(0,219,233,0.35)] active:scale-95 text-glow-subtle"
              >
                <span>START FOCUS ANALYSIS</span>
                <ArrowRight size={13} className="stroke-[2.5px]" />
              </button>

              <button
                onClick={onNavigateToAnalyze}
                className="w-full bg-transparent hover:bg-white/5 text-white border-[0.5px] border-[#3b494b]/60 hover:border-white font-mono text-xs tracking-widest uppercase py-3 px-4 rounded-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>CHECK TODAY'S STATUS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right pane: list of past scanned logs decryption */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#00dbe9]" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#e2e2e2]">
                INSIGHTS
              </h3>
            </div>
            <p className="font-sans text-xs text-[#b9cacb]/70 leading-relaxed -mt-1.5 mb-1 bg-[#101012]/40 p-3 border-l-2 border-[#3b494b]/30">
              Review saved mental clarity insights and chronic focus bottlenecks logged from your previous entries.
            </p>

            <div className="glass-panel bg-[#0a0a0b]/70 border-[#3b494b]/40 rounded-none overflow-hidden flex flex-col min-h-[220px]">
              {logs.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center text-[#b9cacb]/50 select-none">
                  <FileText size={32} className="opacity-30 mb-2.5 text-[#00f0ff]" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#e2e2e2]">No Insights Recorded Yet</span>
                  <span className="font-sans text-[11.5px] max-w-sm mt-1.5 leading-relaxed text-[#b9cacb]/70">Your completed focus analyses and cognitive metrics will keep track of focus bottlenecks and productivity metrics here.</span>
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
                          <span className="font-mono text-[9px] bg-[#00f0ff]/10 border-[0.5px] border-[#00f0ff]/20 px-1.5 py-0.5 text-[#00f0ff] uppercase rounded-none font-bold select-none whitespace-nowrap">
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
