import { useEffect, useState, useRef } from "react";
import { Timer, ArrowRight, CheckSquare, Square, Play, Pause } from "lucide-react";
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

  // Verification state (Section 6)
  const [showVerification, setShowVerification] = useState(false);
  const [verificationExplanation, setVerificationExplanation] = useState("");
  const [verificationEvidence, setVerificationEvidence] = useState("");
  const [verificationReflection, setVerificationReflection] = useState("");
  const [verificationResult, setVerificationResult] = useState("");
  const [validationError, setValidationError] = useState("");

  const [logCount, setLogCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load count of logs
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
    if (isTicking && secondsRemaining > 0 && !showVerification) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      setIsTicking(false);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTicking, secondsRemaining, showVerification]);

  // Format countdown string in MM:SS (or HH:MM:SS if hours exist)
  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSecs % 60).toString().padStart(2, "0");
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m}:${s}`;
    }
    return `${m}:${s}`;
  };

  // Progress metrics calculation
  const calculatedProgressPercent = Math.round(
    ((totalSeconds - secondsRemaining) / totalSeconds) * 100
  );

  // Helper to rename scary words to very simple, understandable words
  const cleanPhaseText = (phase: string) => {
    if (!phase) return "";
    let clean = phase.trim();
    const lower = clean.toLowerCase();

    // Strict requirements translations
    if (lower === "mute study phone" || lower.includes("mute study phone") || lower.includes("mute phone") || lower.includes("mute notifications")) {
      return "Mute notifications";
    }
    if (lower === "enable focus mode" || lower.includes("enable focus mode") || lower.includes("turn on focus mode")) {
      return "Turn on focus mode";
    }
    if (lower === "execute study block" || lower.includes("execute study block") || lower.includes("start studying")) {
      return "Start studying";
    }
    if (lower === "secured archive logs check" || lower.includes("archive logs check") || lower.includes("review study materials")) {
      return "Review study materials";
    }

    // fallback re-namers to plain human phrases
    if (lower.includes("journal cycle") || lower.includes("j-")) {
      return "Prepare study workspace";
    }
    if (lower.includes("align neural buffer")) {
      return "Get ready and clear your head";
    }
    if (lower.includes("verify synapse")) {
      return "Double check task list";
    }
    if (lower.includes("complete structural reset")) {
      return "Relax and take a break";
    }
    if (lower.includes("dump system register")) {
      return "Close distracting tabs";
    }

    return clean;
  };

  // Dynamic Expected Finish Time calculation
  const getExpectedFinishTime = () => {
    const now = new Date();
    const finishDate = new Date(now.getTime() + secondsRemaining * 1000);
    let hours = finishDate.getHours();
    const minutes = finishDate.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // first hour is 12
    return `${hours}:${minutes} ${ampm}`;
  };

  const expectedFinishText = getExpectedFinishTime();

  // Mark current phase complete
  const handleMarkComplete = () => {
    const nextCompleted = [...completedPhases];
    nextCompleted[currentPhaseIndex] = true;
    setCompletedPhases(nextCompleted);

    if (currentPhaseIndex < mission.phases.length - 1) {
      setCurrentPhaseIndex(prev => prev + 1);
    } else {
      // Initiate Section 6 verification
      setShowVerification(true);
      setIsTicking(false);
    }
  };

  // Verify and submit tasks
  const handleVerifySubmit = () => {
    if (
      verificationExplanation.trim().length < 5 ||
      verificationEvidence.trim().length < 5 ||
      verificationReflection.trim().length < 5 ||
      verificationResult.trim().length < 5
    ) {
      setValidationError("All verification fields require at least 5 characters. Please prove task completion with actual work details.");
      return;
    }

    setValidationError("");
    const timeSpent = totalSeconds - secondsRemaining;
    onComplete({
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      title: mission.title,
      code: mission.code,
      sector: mission.sector,
      objective: mission.objective,
      reward: mission.reward,
      time_spent_s: timeSpent > 0 ? timeSpent : 1,
      completed_at: new Date().toISOString(),
      verification_explanation: verificationExplanation.trim(),
      verification_evidence: verificationEvidence.trim(),
      verification_reflection: verificationReflection.trim(),
      verification_result: verificationResult.trim(),
    });
  };

  const nextPhaseLabel = completedPhases.every(v => v) 
    ? "All Steps Done!" 
    : cleanPhaseText(mission.phases[currentPhaseIndex]);

  return (
    <div className="w-full flex flex-col gap-8 animate-fade-in" id="active-execution-section">
      {/* Upper header controls with beautiful crisp labels */}
      <div className="flex flex-col gap-unit mb-2 border-b-[0.5px] border-[#3b494b]/30 pb-4 text-left">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2 text-[#00dbe9] font-mono text-xs select-none">
            <span className="w-1.5 h-1.5 bg-[#00f0ff] signal-glow rounded-none"></span>
            FOCUS SESSION ONGOING
          </div>
          
          <button 
            onClick={onAbort}
            className="font-mono text-[10px] tracking-widest text-[#ffb4ab] border-[0.5px] border-[#93000a]/50 bg-[#1b1b1b]/35 px-4 py-1.5 hover:bg-[#93000a]/10 hover:text-white rounded-none transition-all duration-200 active:scale-95 cursor-pointer uppercase font-bold"
          >
            Stop Session
          </button>
        </div>

        <h1 className="font-sans text-3xl md:text-5xl font-black text-white tracking-tight uppercase mt-3 select-none">
          CURRENT STUDY SESSION
        </h1>
        
        <p className="font-sans text-xs text-[#b9cacb]/80 mt-1 select-none">
          GOAL: <span className="font-bold text-[#00f0ff] font-mono uppercase">{cleanPhaseText(mission.title)}</span>
        </p>
      </div>

      {/* Main Grid structures */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
        {/* Left Column: Core Focus Dashboard or Verification Form */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {showVerification ? (
            <div className="glass-panel p-6 sm:p-8 bg-[#0a0a0b]/95 border-2 border-[#00f0ff] rounded-none flex flex-col gap-6 relative shadow-[0_0_25px_rgba(0,240,255,0.15)]" id="section-6-verification-container">
              <div className="border-b border-[#3b494b]/30 pb-4 mb-2">
                <span className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-widest font-black block mb-1">SESSION COMPLETION VERIFICATION</span>
                <h2 className="font-sans text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Prove Demonstrated Work</h2>
                <p className="font-sans text-xs text-[#b9cacb]/80 mt-1">
                  We reward verified progress. Please complete the following 4 fields about your session to lock in your score and unlock your reward.
                </p>
              </div>

              {validationError && (
                <div className="bg-[#590009]/30 border-[0.5px] border-[#ff7c7c]/40 text-[#ffb4ab] p-3.5 text-xs font-mono font-medium leading-relaxed">
                  {validationError}
                </div>
              )}

              <div className="flex flex-col gap-5 text-left">
                {/* 1. Explanation */}
                <div className="flex flex-col gap-1.5 animate-fade-in" id="verify-field-explanation">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-[#00f0ff] font-extrabold">
                    1. Explanation (What did you actually accomplish?) *
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-[#111112] text-[#e2e2e2] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] focus:outline-none p-3 text-xs font-sans placeholder-[#b9cacb]/25 transition-colors"
                    placeholder="e.g. Finished reading Chapter 3 on quantum theory and summarized potential exam questions."
                    value={verificationExplanation}
                    onChange={(e) => setVerificationExplanation(e.target.value)}
                  />
                </div>

                {/* 2. Evidence */}
                <div className="flex flex-col gap-1.5" id="verify-field-evidence">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-[#00f0ff] font-extrabold">
                    2. Evidence (Provide specific proof of physical or digital outcome) *
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-[#111112] text-[#e2e2e2] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] focus:outline-none p-3 text-xs font-sans placeholder-[#b9cacb]/25 transition-colors"
                    placeholder="e.g. Wrote down answers to review questions 1-5 in notebook. Reviewed class presentation notes."
                    value={verificationEvidence}
                    onChange={(e) => setVerificationEvidence(e.target.value)}
                  />
                </div>

                {/* 3. Reflection */}
                <div className="flex flex-col gap-1.5" id="verify-field-reflection">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-[#00f0ff] font-extrabold">
                    3. Reflection (How did you stay focused or what was challenging?) *
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-[#111112] text-[#e2e2e2] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] focus:outline-none p-3 text-xs font-sans placeholder-[#b9cacb]/25 transition-colors"
                    placeholder="e.g. Keeping the social feed tab closed was difficult, but I stayed offline using focus boundaries."
                    value={verificationReflection}
                    onChange={(e) => setVerificationReflection(e.target.value)}
                  />
                </div>

                {/* 4. Result */}
                <div className="flex flex-col gap-1.5" id="verify-field-result">
                  <label className="font-mono text-[9px] uppercase tracking-wider text-[#00f0ff] font-extrabold">
                    4. Result (What is the final direct result of this focus block?) *
                  </label>
                  <textarea
                    rows={2}
                    className="w-full bg-[#111112] text-[#e2e2e2] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] focus:outline-none p-3 text-xs font-sans placeholder-[#b9cacb]/25 transition-colors"
                    placeholder="e.g. Saved 4 pages of quantum summary notes and feel 100% prepared for class quiz."
                    value={verificationResult}
                    onChange={(e) => setVerificationResult(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-[#3b494b]/30 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowVerification(false)}
                  className="font-mono text-[9.5px] text-[#b9cacb] hover:text-white px-2 py-1.5 cursor-pointer uppercase font-bold"
                >
                  &lt; Back to Clock
                </button>

                <button
                  onClick={handleVerifySubmit}
                  className="w-full sm:w-auto bg-[#00f0ff] hover:bg-white text-black font-sans font-black text-xs px-8 py-3.5 border border-transparent shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all duration-300 rounded-none flex items-center justify-center gap-2 pointer-events-auto cursor-pointer active:scale-95"
                >
                  <span>PROVE WORK & FINALISE</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Main Visual Clock Dashboard */}
              <div className="glass-panel p-6 md:p-10 flex flex-col items-center justify-center min-h-[300px] border-[#00f0ff]/20 bg-[#0a0a0b]/80 rounded-none relative overflow-hidden group">
                {/* Ambient subtle light glows */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/5 rounded-none blur-2xl pointer-events-none" />

                {/* Left label: Time Remaining */}
                <div className="absolute top-4 left-4 flex items-center gap-2 font-mono text-[10px] text-[#b9cacb]/60 select-none">
                  <Timer size={12} className="text-[#00f0ff]" />
                  <span className="font-bold">TIME REMAINING</span>
                </div>

                {/* Right label: Simple Live Status Indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2 select-none">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f0ff] opacity-75 ${isTicking ? "block" : "hidden"}`}></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f0ff]"></span>
                  </span>
                  <span className="font-mono text-[9.5px] text-[#00f0ff] tracking-wider font-extrabold pb-0.5">Focus Session Active</span>
                </div>

                {/* Clean Digital Countdown Clock */}
                <div className="font-mono text-5xl sm:text-7xl md:text-8xl text-[#00dbe9] text-glow tracking-tighter tabular-nums leading-none mb-6 mt-4 select-text">
                  {formatTime(secondsRemaining)}
                </div>

                {/* Interactive play pause controller */}
                <button
                   onClick={() => setIsTicking(!isTicking)}
                   className="font-mono text-[9.5px] tracking-widest text-[#b9cacb]/80 border-[0.5px] border-[#b9cacb]/30 bg-[#161618]/60 hover:bg-[#00f0ff]/10 hover:text-[#00f0ff] hover:border-[#00f0ff]/40 px-3.5 py-1.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95 mb-1"
                >
                  {isTicking ? (
                    <>
                      <Pause size={10} />
                      <span>PAUSE TIMER</span>
                    </>
                  ) : (
                    <>
                      <Play size={10} className="fill-current" />
                      <span>RESUME TIMER</span>
                    </>
                  )}
                </button>

                {/* Modern Proportional Progress Section */}
                <div className="w-full max-w-md mt-6 pt-5 border-t border-[#3b494b]/20">
                  <div className="flex justify-between font-mono text-[10px] text-[#b9cacb]/70 mb-2 font-black select-none">
                    <span>Session Progress</span>
                    <span>{calculatedProgressPercent}%</span>
                  </div>
                  <div className="h-[2px] bg-[#222] w-full relative">
                    <div 
                      className="absolute top-0 left-0 h-full bg-[#00dbe9] signal-glow transition-all duration-1000" 
                      style={{ width: `${calculatedProgressPercent}%` }}
                    />
                  </div>
                </div>

                {/* 3-Column Real-world Study Metrics HUD */}
                <div className="grid grid-cols-3 gap-2 w-full max-w-md mt-6 pt-5 border-t border-[#3b494b]/15 select-none text-center">
                  <div className="flex flex-col gap-1 border-r border-[#3b494b]/10">
                    <span className="text-[9px] text-[#b9cacb]/45 uppercase font-medium tracking-wide">Time Remaining</span>
                    <span className="text-xs sm:text-sm font-bold text-white font-mono">{formatTime(secondsRemaining)}</span>
                  </div>
                  <div className="flex flex-col gap-1 border-r border-[#3b494b]/10">
                    <span className="text-[9px] text-[#b9cacb]/45 uppercase font-medium tracking-wide">Progress</span>
                    <span className="text-xs sm:text-sm font-bold text-[#00f0ff] font-mono">{calculatedProgressPercent}%</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-[#b9cacb]/45 uppercase font-medium tracking-wide">Expected Finish</span>
                    <span className="text-xs sm:text-sm font-bold text-white font-mono">{expectedFinishText}</span>
                  </div>
                </div>
              </div>

              {/* Simple step checklist: Before You Start */}
              <div className="glass-panel p-6 rounded-none bg-[#0a0a0b]/70 border-[#3b494b]/30">
                <span className="font-mono text-[10px] tracking-widest text-[#00f0ff] font-extrabold block mb-4 uppercase select-none">
                  Before You Start
                </span>
                
                <div className="flex flex-col gap-2.5">
                  {mission.phases.map((phase, idx) => {
                    const isCurrent = idx === currentPhaseIndex;
                    const isDone = completedPhases[idx];
                    return (
                      <div 
                        key={idx}
                        className={`flex items-start gap-4 p-3.5 transition-all duration-300 ${
                          isCurrent 
                            ? "border-[0.5px] border-[#00f0ff]/40 bg-[#00f0ff]/5" 
                            : "border-[0.5px] border-transparent"
                        }`}
                      >
                        <div className="mt-0.5 select-none flex-shrink-0">
                          {isDone ? (
                            <CheckSquare size={16} className="text-[#00f0ff] filter drop-shadow-[0_0_4px_rgba(0,219,233,0.5)] cursor-pointer" />
                          ) : (
                            <Square size={16} className={isCurrent ? "text-[#00f0ff] cursor-pointer" : "text-[#b9cacb]/30 cursor-pointer"} />
                          )}
                        </div>
                        
                        <div className="flex-grow">
                          <span className={`font-sans text-xs md:text-sm ${
                            isDone 
                              ? "line-through text-[#b9cacb]/30 font-medium" 
                              : isCurrent 
                                ? "text-[#00f0ff] font-bold" 
                                : "text-[#b9cacb]/80 font-medium"
                          }`}>
                            {cleanPhaseText(phase)}
                          </span>
                        </div>

                        {isCurrent && (
                         <span className="font-mono text-[8px] bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/35 px-1.5 py-0.5 uppercase font-extrabold tracking-wider rounded-none leading-none select-none">
                            Next Action
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Humble Action Trigger Bar */}
              <div className="glass-panel p-6 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-none bg-[#0a0a0b]/70 border-[#3b494b]/30">
                <div className="flex flex-col gap-1 text-left w-full sm:w-auto">
                  <span className="font-mono text-[9px] tracking-widest text-[#b9cacb]/55 uppercase font-bold select-none">
                    NEXT TASK TO COMPLETE
                  </span>
                  <span className="font-sans text-sm md:text-base font-semibold text-white">
                    {nextPhaseLabel}
                  </span>
                </div>

                <button
                  onClick={handleMarkComplete}
                  className="w-full sm:w-auto bg-white hover:bg-neutral-100 text-black font-sans font-bold text-sm px-8 py-3.5 border border-transparent shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 rounded-none flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
                >
                  <span>{currentPhaseIndex === mission.phases.length - 1 ? "FINISH WORK" : "I DID IT! NEXT STEP"}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Dynamic helper card / alarms sidebar */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <StudyAlarmSection />
        </div>

      </div>
    </div>
  );
}
