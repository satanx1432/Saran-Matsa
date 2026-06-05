import { useEffect, useState, useRef } from "react";
import { Timer, ArrowRight, Zap, RefreshCw, Cpu, CheckSquare, Square } from "lucide-react";
import { Mission, CompletedMission } from "../types";
import StudyAlarmSection from "./StudyAlarmSection";

interface ActiveExecutionProps {
  mission: Mission;
  onComplete: (completed: CompletedMission) => void;
  onAbort: () => void;
}

export default function ActiveExecution({ mission, onComplete, onAbort }: ActiveExecutionProps) {
  // Timer state
  const totalSeconds = mission.time_est_m * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isTicking, setIsTicking] = useState(true);

  // Phases checklist state
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [completedPhases, setCompletedPhases] = useState<boolean[]>(
    new Array(mission.phases.length).fill(false)
  );

  const [logCount, setLogCount] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load count of logs to name the journal cycles dynamically!
  useEffect(() => {
    try {
      const raw = localStorage.getItem("hasex_logs");
      if (raw) {
        setLogCount(JSON.parse(raw).length);
      }
    } catch (e) {
      console.error("Error reading logs count:", e);
    }
  }, []);

  // Tick the countdown timer
  useEffect(() => {
    if (isTicking && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      setIsTicking(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTicking, secondsRemaining]);

  // Format countdown string
  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSecs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Progress metrics calculation
  const calculatedProgressPercent = Math.round(
    ((totalSeconds - secondsRemaining) / totalSeconds) * 100
  );

  // Helper to rename a phase to very simple words
  const cleanPhaseText = (phase: string) => {
    if (!phase) return "";
    const cycleNum = logCount + 1;
    let clean = phase;
    
    // Check if contains "Journal Cycle" or "J-89" patterns
    clean = clean.replace(/Initiate Journal Cycle J-\d+/gi, `Initiate journal cycle j ${cycleNum}`);
    clean = clean.replace(/Journal Cycle J-\d+/gi, `journal cycle j ${cycleNum}`);
    clean = clean.replace(/J-\d+/gi, `j ${cycleNum}`);
    clean = clean.replace(/journal cycle j \d+/gi, `journal cycle j ${cycleNum}`);

    // If it's a first, second, etc. name it simple
    if (clean.toLowerCase().includes("journal cycle")) {
      return `journal cycle j ${cycleNum}`;
    }

    // Simplify other complex terms to make it easy for a 4 year old to understand
    clean = clean.replace(/Align Neural Buffer Arrays/gi, "Get ready and clear your head");
    clean = clean.replace(/Verify Synapse Signals/gi, "Double check your homework task list");
    clean = clean.replace(/Complete Structural Reset/gi, "Relax and take a deep breath");
    clean = clean.replace(/Dump System Registers/gi, "Clear all open tabs on your screen");
    clean = clean.replace(/Identify Stray Sub-processes/gi, "Find things that stop your focus");
    clean = clean.replace(/Commit Residual Context Out/gi, "Write down your last thoughts");
    clean = clean.replace(/Acknowledge Memory Clean/gi, "Celebrate that your workspace is clean");
    clean = clean.replace(/Map External Signal Influx/gi, "Block social media and phone bells");
    clean = clean.replace(/Construct Barrier Variables/gi, "Put your phone in the other room");
    clean = clean.replace(/Apply Bandwidth Dampeners/gi, "Turn off noisy computer alerts");
    clean = clean.replace(/Establish Secure Uplink Gate/gi, "You are now beautifully focused");

    return clean;
  };

  // Mark current phase complete
  const handleMarkComplete = () => {
    const nextCompleted = [...completedPhases];
    nextCompleted[currentPhaseIndex] = true;
    setCompletedPhases(nextCompleted);

    if (currentPhaseIndex < mission.phases.length - 1) {
      setCurrentPhaseIndex(prev => prev + 1);
    } else {
      // All phases completed! Trigger final submit
      const timeSpent = totalSeconds - secondsRemaining;
      onComplete({
        id: Math.random().toString(36).substring(2, 9).toUpperCase(),
        title: mission.title,
        code: mission.code,
        sector: mission.sector,
        objective: mission.objective,
        reward: mission.reward,
        time_spent_s: timeSpent > 0 ? timeSpent : 1,
        completed_at: new Date().toISOString()
      });
    }
  };

  const nextPhaseLabel = completedPhases.every(v => v) 
    ? "All Steps Done!" 
    : cleanPhaseText(mission.phases[currentPhaseIndex]);

  return (
    <div className="w-full flex flex-col gap-8" id="active-execution-section">
      {/* Upper header controls with simple text */}
      <div className="flex flex-col gap-unit mb-4 border-b-[0.5px] border-[#3b494b]/30 pb-4 text-left">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2 text-[#00dbe9] font-mono text-xs select-none">
            <span className="w-1.5 h-1.5 bg-[#00f0ff] signal-glow rounded-none"></span>
            COMPLETING YOUR GOAL WORK SESSION
          </div>
          
          <button 
            onClick={onAbort}
            className="font-mono text-[10px] tracking-widest text-[#ffb4ab] border-[0.5px] border-[#93000a]/50 bg-[#1b1b1b]/35 px-4 py-1.5 hover:bg-[#93000a]/10 hover:text-white rounded-none transition-all duration-200 active:scale-95 cursor-pointer"
          >
            STOP AND QUIT
          </button>
        </div>

        <h1 className="font-sans text-3xl md:text-5xl font-bold text-[#e2e2e2] tracking-tight antialiased uppercase mt-3 select-none">
          WORK WORK TIME!
        </h1>
        
        <p className="font-sans text-xs text-[#b9cacb]/80 mt-1 select-none">
          CURRENT GOAL: <span className="font-bold text-[#00f0ff] font-mono uppercase">{cleanPhaseText(mission.title)}</span>
        </p>
      </div>

      {/* Grid structure layouts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
        {/* Left column: main work timer */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Main timer display */}
          <div className="glass-panel p-6 md:p-10 flex flex-col items-center justify-center min-h-[300px] border-[#00f0ff]/20 bg-[#0a0a0b]/80 rounded-none relative overflow-hidden group">
            {/* Simple Top Indicators - T-Minus is replaced with TIME REMAINING */}
            <div className="absolute top-4 left-4 flex items-center gap-2 font-mono text-[10px] text-[#b9cacb]/50 select-none">
              <Timer size={12} className="text-[#00f0ff]" />
              <span>TIME REMAINING</span>
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-none bg-[#00f0ff] animate-ping" />
              <span className="font-mono text-[9px] text-[#00f0ff] tracking-widest font-bold select-none">ACTIVE TIMER STATUS: YES</span>
            </div>

            {/* Huge clock */}
            <div className="font-mono text-5xl sm:text-7xl md:text-8xl text-[#00dbe9] text-glow tracking-tighter tabular-nums leading-none mb-6 mt-4">
              {formatTime(secondsRemaining)}
            </div>

            {/* Simple Progress Bar */}
            <div className="w-full max-w-md mt-6">
              <div className="flex justify-between font-mono text-[10px] text-[#b9cacb]/60 mb-2 font-bold select-none">
                <span>HOW MUCH TIME IS DONE</span>
                <span>{calculatedProgressPercent}%</span>
              </div>
              <div className="h-[2px] bg-[#353535] w-full relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-[#00dbe9] signal-glow transition-all duration-1000" 
                  style={{ width: `${calculatedProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Simple step checklist */}
          <div className="glass-panel p-6 rounded-none bg-[#0a0a0b]/70 border-[#3b494b]/30">
            <span className="font-mono text-[10px] tracking-widest text-[#00f0ff] font-bold block mb-4 uppercase select-none">
              YOUR EASY TASK LIST
            </span>
            
            <div className="flex flex-col gap-2.5">
              {mission.phases.map((phase, idx) => {
                const isCurrent = idx === currentPhaseIndex;
                const isDone = completedPhases[idx];
                return (
                  <div 
                    key={idx}
                    className={`flex items-start gap-3.5 p-3.5 transition-all duration-300 ${
                      isCurrent 
                        ? "border-[0.5px] border-[#00f0ff]/40 bg-[#00f0ff]/5" 
                        : "border-[0.5px] border-transparent"
                    }`}
                  >
                    <div className="mt-0.5 select-none">
                      {isDone ? (
                        <CheckSquare size={16} className="text-[#00f0ff] filter drop-shadow-[0_0_4px_rgba(0,219,233,0.5)]" />
                      ) : (
                        <Square size={16} className={isCurrent ? "text-[#00f0ff]" : "text-[#b9cacb]/40"} />
                      )}
                    </div>
                    
                    <div className="flex-grow">
                      <span className={`font-mono text-xs ${
                        isDone 
                          ? "line-through text-[#b9cacb]/40" 
                          : isCurrent 
                            ? "text-[#00f0ff] font-bold" 
                            : "text-[#b9cacb]/80"
                      }`}>
                        STEP {idx + 1}: {cleanPhaseText(phase)}
                      </span>
                    </div>

                    {isCurrent && (
                      <span className="font-mono text-[9px] bg-[#00f0ff] text-black px-1.5 py-0.5 uppercase font-bold tracking-wider rounded-none leading-none select-none">
                        NOW
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Core action block */}
          <div className="glass-panel p-6 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-none bg-[#0a0a0b]/70 border-[#3b494b]/30">
            <div className="flex flex-col gap-1 text-left w-full sm:w-auto">
              <span className="font-mono text-[10px] tracking-widest text-[#b9cacb]/60 uppercase font-semibold select-none">
                NEXT TASK TO COMPLETE
              </span>
              <span className="font-sans text-md md:text-lg font-medium text-[#e2e2e2]">
                {nextPhaseLabel}
              </span>
            </div>

            <button
              onClick={handleMarkComplete}
              className="w-full sm:w-auto bg-[#e5e2e3] hover:bg-white text-black font-mono text-xs tracking-widest uppercase font-bold px-8 py-4 border-[0.5px] border-transparent hover:signal-glow transition-all duration-300 rounded-none flex items-center justify-center gap-2 group cursor-pointer active:scale-95 animate-pulse"
            >
              <span>{currentPhaseIndex === mission.phases.length - 1 ? "FINISH WORK" : "I DID IT! NEXT STEP"}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Right column: Interactive Study Planner & Alarms Section */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <StudyAlarmSection />
        </div>
      </div>
    </div>
  );
}
