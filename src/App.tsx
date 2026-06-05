import { useState, useEffect } from "react";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import JournalInput from "./components/JournalInput";
import AnalysisResults from "./components/AnalysisResults";
import MissionAssignment from "./components/MissionAssignment";
import ActiveExecution from "./components/ActiveExecution";
import CockpitDashboard from "./components/CockpitDashboard";
import NvidiaAgentHub from "./components/NvidiaAgentHub";
import FirebaseChat from "./components/FirebaseChat";
import OperatorProfile from "./components/OperatorProfile";
import LandingPortal from "./components/LandingPortal";
import { AnalysisResult, CognitiveLog, CompletedMission, Mission } from "./types";
import { Loader2, Zap, ArrowRight, X } from "lucide-react";

export default function App() {
  const [isEntered, setIsEntered] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("radar");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [rawText, setRawText] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Mission Flow States
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [isAssigningMission, setIsAssigningMission] = useState<boolean>(false);
  const [isInMissionExecution, setIsInMissionExecution] = useState<boolean>(false);

  // Persistence stats
  const [logs, setLogs] = useState<CognitiveLog[]>([]);
  const [completedMissions, setCompletedMissions] = useState<CompletedMission[]>([]);

  // Telemetry custom loading states text loops
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const loadingPhrases = [
    "UPLINK // READING RAW COGNITIVE STREAM...",
    "DECIPHERING SEMANTIC VECTOR SPACE...",
    "CORRELATING ATTENTION DENSITY SHIFTS...",
    "ISOLATING CONTEXT-SWITCHING FRICTION LABELS...",
    "COMPILING TACTICAL ACTION OBJECTIVES..."
  ];

  // Overlay congratulatory modal
  const [completionOverlay, setCompletionOverlay] = useState<CompletedMission | null>(null);

  // Initialize and load from local storage
  useEffect(() => {
    try {
      const persistedLogs = localStorage.getItem("hasex_logs");
      if (persistedLogs) {
        setLogs(JSON.parse(persistedLogs));
      }
      
      const persistedMissions = localStorage.getItem("hasex_missions");
      if (persistedMissions) {
        setCompletedMissions(JSON.parse(persistedMissions));
      }

      const cachedActiveMission = localStorage.getItem("hasex_cached_active_mission");
      if (cachedActiveMission) {
        setActiveMission(JSON.parse(cachedActiveMission));
        setIsInMissionExecution(true);
        setActiveTab("core");
      }
    } catch (err) {
      console.error("HASEX_OS // Error reading operational registers from localStorage:", err);
    }
  }, []);

  // Set cycling load status intervals
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 1200);
    } else {
      setLoadingTextIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnalyzing]);

  // Submit action proxy request to backend
  const handleAnalyzeCognitiveInput = async (text: string) => {
    setIsAnalyzing(true);
    setRawText(text);
    setAnalysisResult(null);
    setIsAssigningMission(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rawText: text })
      });

      if (!response.ok) {
        throw new Error(`Decoder transaction fault: ${response.statusText}`);
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);
      
      // Save logs history registry
      const newLogVal: CognitiveLog = {
        id: Math.random().toString(36).substring(2, 9).toUpperCase(),
        rawText: text,
        title: result.title,
        confidence: result.confidence,
        bottleneckTitle: result.bottleneck_title,
        createdAt: new Date().toISOString()
      };

      const updatedLogs = [newLogVal, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem("hasex_logs", JSON.stringify(updatedLogs));

    } catch (error: any) {
      console.error("HASEX_OS // Decryption pipeline failure:", error);
      // Let standard browser flow resolve or show safe notification feedback
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddSyntheticLogs = (newSyntheticLogs: CognitiveLog[]) => {
    const updated = [...newSyntheticLogs, ...logs];
    setLogs(updated);
    localStorage.setItem("hasex_logs", JSON.stringify(updated));
  };

  // Select historical scan card logs callback
  const handleSelectHistoricalLog = (logId: string) => {
    const selected = logs.find(l => l.id === logId);
    if (!selected) return;

    // Build standard structure to re-load visual bento grid
    setRawText(selected.rawText);
    
    // Create static cached object matching structure to jump straight to review screens
    const simulatedResult: AnalysisResult = {
      title: selected.title,
      confidence: selected.confidence,
      bottleneck_title: selected.bottleneckTitle,
      bottleneck_points: [
        "> Persistent focus load verified in historic records.",
        "> Logical system context locked for review logs."
      ],
      actionable_title: "Review Static Vectors",
      actionable_desc: "This dataset was decrypted at an earlier stage. Reviewing previous cognitive streams allows you to correlate long-term attention leakage vectors and confirm system behavior improvements over elapsed missions.",
      target: "Scanned Archive Window",
      action_required: "Analyze improvement rate in completed registry",
      mission: {
        title: `RESTORE ${selected.title.toUpperCase()}`,
        code: `MSG-${selected.id}-ALFA`,
        sector: "STATED_LOGS",
        objective: `Re-run action buffer logic evaluated in log #${selected.id}.`,
        difficulty: "CLASS II",
        reward: 300,
        time_est_m: 10,
        loop_status: "REPEAT",
        phases: ["Read historic diagnostic stream", "Double-check attention metrics load", "Execute mental calibration reset", "Secured archive logs check"]
      }
    };

    setAnalysisResult(simulatedResult);
    setActiveTab("data");
    setIsAssigningMission(false);
  };

  // Convert analysis outcome to mission structure
  const handleConvertAnalysisToMission = () => {
    if (!analysisResult) return;
    setIsAssigningMission(true);
  };

  // Start executing the countdown mission
  const handleAuthorizeExecuteMission = () => {
    if (!analysisResult) return;
    const missionPayload = analysisResult.mission;
    setActiveMission(missionPayload);
    setIsInMissionExecution(true);
    setIsAssigningMission(false);
    
    // Cache the active mission in local storage so page refreshes don't lose progress!
    localStorage.setItem("hasex_cached_active_mission", JSON.stringify(missionPayload));

    // Focus shift to Core operational loop directly as requested
    setActiveTab("core");
  };

  // Complete tactical mission checklist callbacks
  const handleMissionCompletedSecured = (completedOp: CompletedMission) => {
    const updatedMissions = [completedOp, ...completedMissions];
    setCompletedMissions(updatedMissions);
    localStorage.setItem("hasex_missions", JSON.stringify(updatedMissions));

    // Clear active mission states completely
    setActiveMission(null);
    setIsInMissionExecution(false);
    setAnalysisResult(null);
    setRawText("");
    
    localStorage.removeItem("hasex_cached_active_mission");

    // Open overlay celebrations
    setCompletionOverlay(completedOp);

    // Navigate to radar dashboard home cockpit
    setActiveTab("radar");
  };

  // Abort assignments callback resetters
  const handleAbortMissionOperationalFlow = () => {
    setActiveMission(null);
    setIsInMissionExecution(false);
    setIsAssigningMission(false);
    setAnalysisResult(null);
    setRawText("");
    localStorage.removeItem("hasex_cached_active_mission");
    setActiveTab("radar");
  };

  // Clear current active decryption vector to enter a brand new stream
  const handleClearDecoderInputGrid = () => {
    setAnalysisResult(null);
    setRawText("");
  };

  // Header dynamic subtitle mapper
  const getHeaderSubtitle = () => {
    if (isAnalyzing) return "DECRYPTION_IN_PROGRESS";
    if (isInMissionExecution) return "TACTICAL_LOCKDOWN";
    switch (activeTab) {
      case "radar": return "TODAY_COCKPIT";
      case "data": return analysisResult ? "INTELLIGENCE_DECIPHERED" : "JOURNAL_ENTRY";
      case "core": return "TASKS_ACTIVE_LOOP";
      case "chat": return "SECURE_COMMS_LINK";
      case "profile": return "OPERATOR_REGISTRY";
      default: return "";
    }
  };

  if (!isEntered) {
    return <LandingPortal onEnter={() => setIsEntered(true)} />;
  }

  return (
    <div className="min-h-screen bg-black text-[#e2e2e2] flex flex-col font-sans relative antialiased select-none pb-28">
      {/* Absolute top grid background decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.02)_0%,transparent_75%)] pointer-events-none select-none z-0" />

      {/* Top Header App bar */}
      <Header 
        currentTab={activeTab} 
        onNavigate={(tab) => {
          if (!isInMissionExecution) {
            setActiveTab(tab);
          }
        }} 
        titleSuffix={getHeaderSubtitle()}
      />

      {/* Main Container Canvas */}
      <main className="flex-grow pt-24 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col items-center justify-center z-10 relative">
        <div className="w-full">
          {/* VISUAL LOADING STATES SCRIBE */}
          {isAnalyzing ? (
            <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center py-20 text-center gap-6 glass-panel rounded-none border-[#00f0ff]/20 bg-[#0a0a0b]/90" id="analyser-loading-screen">
              <div className="p-4 bg-[#00dbe9]/5 border-[0.5px] border-[#00dbe9]/30 rounded-none animate-spin text-[#00f0ff] duration-3000">
                <Loader2 size={36} className="animate-pulse" />
              </div>

              <div className="flex flex-col gap-2">
                <p className="font-mono text-sm font-bold text-[#00f0ff] tracking-widest uppercase">
                  {loadingPhrases[loadingTextIndex]}
                </p>
                <span className="font-mono text-[9px] text-[#b9cacb]/40 uppercase tracking-widest select-none">
                  INTELLIGENCE COG TRANSACTING VIA SECURE UPLINK GATEWAY
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* RADAR HUB TAB */}
              {activeTab === "radar" && (
                <CockpitDashboard 
                  completedMissions={completedMissions}
                  logs={logs}
                  onSelectLog={handleSelectHistoricalLog}
                  onNavigateToAnalyze={() => setActiveTab("data")}
                  onAddSyntheticLogs={handleAddSyntheticLogs}
                />
              )}

              {/* DATA JOURNAL TABLE TAB */}
              {activeTab === "data" && (
                <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
                  {analysisResult ? (
                    isAssigningMission ? (
                      <MissionAssignment 
                        mission={analysisResult.mission}
                        onExecute={handleAuthorizeExecuteMission}
                        onAbort={handleAbortMissionOperationalFlow}
                      />
                    ) : (
                      <div className="flex flex-col gap-4">
                        {/* Upper state reset shortcut */}
                        <div className="flex justify-start text-left">
                          <button
                            onClick={handleClearDecoderInputGrid}
                            className="font-mono text-[10px] tracking-widest text-[#00f0ff] border-[0.5px] border-[#00f0ff]/30 bg-[#0a0a0b]/70 hover:bg-[#00f0ff]/10 py-1.5 px-4.5 rounded-none font-bold select-none cursor-pointer active:scale-95 transition-all duration-200"
                          >
                            [+] ENTER NEW COGNITIVE STREAM
                          </button>
                        </div>
                        
                        <AnalysisResults 
                          result={analysisResult}
                          onConvert={handleConvertAnalysisToMission}
                          rawInputText={rawText}
                        />
                      </div>
                    )
                  ) : (
                    <JournalInput 
                      onAnalyze={handleAnalyzeCognitiveInput}
                      isAnalyzing={isAnalyzing}
                    />
                  )}
                </div>
              )}

              {/* ACTIVE EXECUTION / CORE TAB */}
              {activeTab === "core" && (
                <div className="w-full max-w-4xl mx-auto">
                  {isInMissionExecution && activeMission ? (
                    <ActiveExecution 
                      mission={activeMission}
                      onComplete={handleMissionCompletedSecured}
                      onAbort={handleAbortMissionOperationalFlow}
                    />
                  ) : (
                    <div className="py-20 text-center glass-panel p-8 rounded-none border-[#3b494b]/30 bg-[#0a0a0b]/70">
                      <Zap size={32} className="text-[#b9cacb]/40 mx-auto mb-3" />
                      <h3 className="font-sans text-lg font-bold text-[#e2e2e2]">No Tasks Yet</h3>
                      <p className="font-sans text-xs text-[#b9cacb]/70 max-w-sm mx-auto mt-1 mb-6 leading-relaxed">
                        Create a journal entry to generate personalized tasks.
                      </p>
                      <button
                        onClick={() => setActiveTab("data")}
                        className="bg-[#e5e2e3] hover:bg-white text-black font-mono text-xs tracking-widest uppercase font-bold py-3 px-6 rounded-none cursor-pointer transition-colors active:scale-95"
                      >
                        CREATE JOURNAL ENTRY
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* COGNITIVE NETLINK CHAT TAB */}
              {activeTab === "chat" && (
                <div className="w-full">
                  <FirebaseChat />
                </div>
              )}

              {/* OPERATOR PROFILE REGISTRY TAB */}
              {activeTab === "profile" && (
                <div className="w-full select-none">
                  <OperatorProfile />
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Persistent Bottom Nav - Suppressed on transactional focus screen as per cyberpunk interface rules */}
      {!isInMissionExecution && (
        <BottomNav 
          activeTab={activeTab} 
          onTabChange={(tab) => setActiveTab(tab)} 
          activeMissionCount={activeMission ? 1 : 0}
        />
      )}

      {/* Completion congratulations overlay modal */}
      {completionOverlay && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-100 flex items-center justify-center p-4" id="success-celebration-dialog">
          <div className="glass-panel max-w-md w-full p-6 sm:p-8 rounded-none bg-[#0a0a0b] text-left border-[#00f0ff]/40 shadow-[0_0_25px_rgba(0,240,255,0.2)] animate-scale-up relative">
            
            {/* Close button indicator */}
            <button 
              onClick={() => setCompletionOverlay(null)}
              className="absolute top-4 right-4 text-[#b9cacb]/60 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center gap-4 mb-6 pt-2 select-none">
              <div className="p-4 bg-[#00dbe9]/10 border-[0.5px] border-[#00dbe9]/40 rounded-none text-[#00f0ff] signal-glow">
                <Zap size={32} className="fill-current animate-pulse" />
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[9px] tracking-widest text-[#00dbe9] font-black uppercase">
                  OBJECTIVE SECURED SUCCESSFULLY
                </span>
                <h2 className="font-sans text-2xl font-black text-white uppercase tracking-tight">
                  MISSION ACCOMPLISHED
                </h2>
              </div>
            </div>

            <div className="border-t-[0.5px] border-b-[0.5px] border-[#3b494b]/30 py-4.5 my-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-[#b9cacb]/60">MISSION:</span>
                <span className="text-white font-bold">{completionOverlay.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#b9cacb]/60">CODE_TAG:</span>
                <span className="text-white font-bold">{completionOverlay.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#b9cacb]/60">SECTOR REALIGNED:</span>
                <span className="text-white font-bold uppercase">{completionOverlay.sector}</span>
              </div>
              <div className="flex justify-between text-[#00f0ff] font-bold">
                <span>REWARD ACQUIRED:</span>
                <span className="flex items-center gap-1">
                  <Zap size={11} className="fill-current" />
                  +{completionOverlay.reward} SIG
                </span>
              </div>
            </div>

            <button
              onClick={() => setCompletionOverlay(null)}
              className="w-full bg-[#00f0ff] hover:bg-[#7df4ff] text-black font-mono text-xs tracking-widest uppercase font-bold py-3.5 px-4 rounded-none transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95 select-none"
            >
              <span>DISMISS UPLINK REGISTERS</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* NVIDIA AI AGENT HUB COMPONENT */}
      <NvidiaAgentHub />
    </div>
  );
}
