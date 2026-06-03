import { useEffect, useState, useRef } from "react";
import { Timer, ArrowRight, Zap, RefreshCw, Cpu, CheckSquare, Square } from "lucide-react";
import { Mission, CompletedMission } from "../types";

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

  // Signal Strength dynamic simulation state
  const [signalValue, setSignalValue] = useState(-42);
  const [signalBars, setSignalBars] = useState<number[]>(
    Array.from({ length: 20 }, () => Math.floor(Math.random() * 80) + 20)
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Simulate real-time signal telemetry noise walk
  useEffect(() => {
    const interval = setInterval(() => {
      setSignalBars((prev) => {
        const nextBars = [...prev.slice(1)];
        const newValue = Math.floor(Math.random() * 100);
        nextBars.push(newValue);
        
        // Match standard dbm range
        const dbm = -100 + Math.floor(newValue * 0.8);
        setSignalValue(dbm);
        
        return nextBars;
      });
    }, 450);

    return () => clearInterval(interval);
  }, []);

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
    ? "All Objectives Secured" 
    : mission.phases[currentPhaseIndex];

  return (
    <div className="w-full flex flex-col gap-8" id="active-execution-section">
      {/* Upper header controls */}
      <div className="flex flex-col gap-unit mb-4 border-b-[0.5px] border-[#3b494b]/30 pb-4 text-left">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2 text-[#00dbe9] font-mono text-xs">
            <span className="w-1.5 h-1.5 bg-[#00f0ff] signal-glow rounded-none"></span>
            SYS.OP // ACTIVE_DIRECTIVE
          </div>
          
          <button 
            onClick={onAbort}
            className="font-mono text-[10px] tracking-widest text-[#ffb4ab] border-[0.5px] border-[#93000a]/50 bg-[#1b1b1b]/35 px-4 py-1.5 hover:bg-[#93000a]/10 hover:text-white rounded-none transition-all duration-200 active:scale-95 cursor-pointer"
          >
            ABORT OPERATION
          </button>
        </div>

        <h1 className="font-sans text-3xl md:text-5xl font-bold text-[#e2e2e2] tracking-tight antialiased uppercase mt-3">
          MISSION_EXECUTION
        </h1>
        
        <p className="font-mono text-xs text-[#b9cacb]/80 mt-1 select-none">
          TARGET: SECURE DATA NODE ALFA-7 <span className="cursor-blink text-[#00f0ff] font-bold">_</span>
        </p>
      </div>

      {/* Grid structure layouts */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
        {/* Left column taking up 8 grid spaces */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Main timer clock telemetry panel */}
          <div className="glass-panel p-6 md:p-10 flex flex-col items-center justify-center min-h-[300px] border-[#00f0ff]/20 bg-[#0a0a0b]/80 rounded-none relative overflow-hidden group">
            {/* Absolute background decoration grids */}
            <div className="absolute top-4 left-4 flex items-center gap-2 font-mono text-[10px] text-[#b9cacb]/50 select-none">
              <Timer size={12} className="text-[#00f0ff]" />
              <span>T-MINUS</span>
            </div>

            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-none bg-[#00f0ff] animate-ping" />
              <span className="font-mono text-[9px] text-[#00f0ff] tracking-widest font-bold">DYNAMIC SIGNAL UPLINK</span>
            </div>

            {/* Huge display text */}
            <div className="font-mono text-5xl sm:text-7xl md:text-8xl text-[#00dbe9] text-glow tracking-tighter tabular-nums leading-none mb-6 mt-4">
              {formatTime(secondsRemaining)}
            </div>

            {/* Dynamic progression gauge */}
            <div className="w-full max-w-md mt-6">
              <div className="flex justify-between font-mono text-[10px] text-[#b9cacb]/60 mb-2 font-bold select-none">
                <span>TIME ELAPSED ESTIMATE</span>
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

          {/* Core Objectives Completion steps */}
          <div className="glass-panel p-6 rounded-none bg-[#0a0a0b]/70 border-[#3b494b]/30">
            <span className="font-mono text-[10px] tracking-widest text-[#00f0ff] font-bold block mb-4 uppercase">
              ACTIVE PROTOCOLS CHECKARRAY
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
                        PHASE {idx + 1}: {phase}
                      </span>
                    </div>

                    {isCurrent && (
                      <span className="font-mono text-[9px] bg-[#00f0ff] text-black px-1.5 py-0.5 uppercase font-bold tracking-wider rounded-none leading-none select-none">
                        ACTIVE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive operational next phases trigger button */}
          <div className="glass-panel p-6 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-none bg-[#0a0a0b]/70 border-[#3b494b]/30">
            <div className="flex flex-col gap-1 text-left w-full sm:w-auto">
              <span className="font-mono text-[10px] tracking-widest text-[#b9cacb]/60 uppercase font-semibold">
                COMMITTING ACTION
              </span>
              <span className="font-sans text-md md:text-lg font-medium text-[#e2e2e2]">
                {nextPhaseLabel}
              </span>
            </div>

            <button
              onClick={handleMarkComplete}
              className="w-full sm:w-auto bg-[#e5e2e3] hover:bg-white text-black font-mono text-xs tracking-widest uppercase font-bold px-8 py-4 border-[0.5px] border-transparent hover:signal-glow transition-all duration-300 rounded-none flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
            >
              <span>{currentPhaseIndex === mission.phases.length - 1 ? "FINALIZE MISSION" : "MARK PHASE COMPLETE"}</span>
              <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Right column taking up 4 spaces */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Signal bars graph telemetry widget */}
          <div className="glass-panel p-6 rounded-none flex flex-col gap-4 bg-[#0a0a0b]/80 border-[#3b494b]/30 select-none">
            <div className="flex items-center justify-between font-mono text-[10px] text-[#b9cacb]/70 border-b-[0.5px] border-[#3b494b]/30 pb-2.5 font-bold uppercase select-none">
              <span>SIGNAL STRENGTH</span>
              <span className={signalValue > -70 ? "text-[#00dbe9]" : "text-[#ffb4ab]"} id="signal-value-label">
                {signalValue} dBm
              </span>
            </div>

            {/* Graphs render bars */}
            <div className="flex items-end justify-between h-28 gap-0.5 pt-4">
              {signalBars.map((height, idx) => {
                let colorClass = "bg-[#b9cacb]/30";
                
                // Color codes
                if (idx === signalBars.length - 1) {
                  colorClass = "bg-[#00f0ff] signal-glow";
                } else if (height > 75) {
                  colorClass = "bg-[#00dbe9]/80";
                } else if (height < 35) {
                  colorClass = "bg-[#ffb4ab]/40 border-t-[1px] border-[#ffb4ab]";
                } else {
                  colorClass = "bg-[#b9cacb]/50";
                }

                return (
                  <div
                    key={idx}
                    className={`w-full transition-all duration-300 rounded-none ${colorClass}`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>

            <div className="flex justify-between font-mono text-[9px] text-[#b9cacb]/40 uppercase mt-1 select-none">
              <span>T-60s</span>
              <span>NOW</span>
            </div>
          </div>

          {/* Telemetries connection settings items list */}
          <div className="glass-panel p-6 rounded-none flex flex-col flex-grow bg-[#0a0a0b]/80 border-[#3b494b]/30">
            <div className="font-mono text-[10px] tracking-widest text-[#b9cacb]/70 border-b-[0.5px] border-[#3b494b]/30 pb-2.5 mb-4 font-bold uppercase select-none">
              SYSTEM_PARAMETERS
            </div>

            <div className="flex flex-col">
              <div className="flex justify-between py-3 border-b-[0.5px] border-[#3b494b]/20 font-mono text-xs">
                <span className="text-[#b9cacb]/60">UPLINK_FREQ</span>
                <span className="text-[#e2e2e2] font-semibold">144.05 MHz</span>
              </div>
              
              <div className="flex justify-between py-3 border-b-[0.5px] border-[#3b494b]/20 font-mono text-xs">
                <span className="text-[#b9cacb]/60">ENCRYPTION</span>
                <span className="text-[#e2e2e2] font-semibold">AES-256-GCM</span>
              </div>

              <div className="flex justify-between py-3 border-b-[0.5px] border-[#3b494b]/20 font-mono text-xs">
                <span className="text-[#b9cacb]/60">CHANNELS</span>
                <span className="text-[#e2e2e2] font-semibold">ALFA-7 // MAIN</span>
              </div>

              <div className="flex justify-between py-3 border-b-[0.5px] border-[#3b494b]/20 font-mono text-xs">
                <span className="text-[#b9cacb]/60">NODE_STATUS</span>
                <span className="text-[#00dbe9] font-bold flex items-center gap-1.5 leading-none">
                  <span className="w-1.5 h-1.5 rounded-none bg-[#00dbe9] signal-glow inline-block"></span>
                  ONLINE
                </span>
              </div>

              <div className="flex justify-between py-3 font-mono text-xs">
                <span className="text-[#b9cacb]/60">HOSTILE_INTRUSIONS</span>
                <span className="text-[#ffb4ab] font-bold animate-pulse uppercase">NEGATIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
