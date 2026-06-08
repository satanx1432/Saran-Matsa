import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Check, AlertCircle, Award, X, Radio, Terminal, Timer, GripHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FocusSessionLog {
  id: string;
  task: string;
  duration: number; // in mins
  completedStatus: "yes" | "partially" | "no";
  timestamp: string;
}

// 3D Cylinder Mechanical Scroll Drum Component
function ScrollWheel({ 
  value, 
  label, 
  maxRange, 
  onChange 
}: { 
  value: number; 
  label: string; 
  maxRange: number; 
  onChange: (val: number) => void; 
}) {
  const prevVal = (value - 1 + maxRange) % maxRange;
  const nextVal = (value + 1) % maxRange;

  return (
    <div className="flex flex-col items-center flex-1" id={`wheel-container-${label}`}>
      <div 
        className="relative h-20 w-14 bg-neutral-950/90 border border-[#3b494b]/30 overflow-hidden flex flex-col items-center justify-center rounded-none shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]"
        style={{ perspective: "400px" }}
        id={`wheel-${label}`}
      >
        {/* Curving 3D shadow depth overlay layers */}
        <div className="absolute top-0 left-0 w-full h-5 bg-gradient-to-b from-neutral-950 via-neutral-950/60 to-transparent z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-5 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent z-20 pointer-events-none" />
        
        {/* Horizontal glowing indicator cursor bars */}
        <div className="absolute top-[27px] left-0 w-full h-6 border-t border-b border-[#00f0ff]/25 bg-[#00f0ff]/4 pointer-events-none z-10" />

        <div className="flex flex-col items-center justify-center gap-0.5 select-none z-0 w-full h-full">
          {/* Top Dial element (Click to decrement) */}
          <button
            type="button"
            onClick={() => onChange(prevVal)}
            className="w-full text-center hover:text-white transition-colors cursor-pointer text-[10px] flex items-center justify-center h-5 overflow-hidden outline-none"
            style={{ color: "#4f6567", opacity: 0.35 }}
          >
            {prevVal.toString().padStart(2, "0")}
          </button>

          {/* Current dial element */}
          <div
            className="w-full text-center font-mono text-base font-black transition-all duration-300 ease-out flex items-center justify-center h-6"
            style={{
              color: "#00f0ff",
              textShadow: "0 0 10px rgba(0,240,255,0.4)",
            }}
          >
            {value.toString().padStart(2, "0")}
          </div>

          {/* Bottom Dial element (Click to increment) */}
          <button
            type="button"
            onClick={() => onChange(nextVal)}
            className="w-full text-center hover:text-white transition-colors cursor-pointer text-[10px] flex items-center justify-center h-5 overflow-hidden outline-none"
            style={{ color: "#4f6567", opacity: 0.35 }}
          >
            {nextVal.toString().padStart(2, "0")}
          </button>
        </div>
      </div>
      <span className="text-[7.5px] font-mono font-bold text-neutral-500 uppercase tracking-widest mt-1">{label}</span>
    </div>
  );
}

export default function FocusTimerPlugin() {
  const [taskName, setTaskName] = useState("Maverick Study Session");
  const [isExpanded, setIsExpanded] = useState(false);

  // Live countdown remaining states
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);

  // Status controls
  const [sessionState, setSessionState] = useState<"idle" | "running" | "ended">("idle");
  const [completedStatus, setCompletedStatus] = useState<"yes" | "partially" | "no" | null>(null);
  
  // Stats tracker
  const [focusStats, setFocusStats] = useState<{ totalSessions: number; completedCount: number }>({
    totalSessions: 0,
    completedCount: 0
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize stats & Cache restoration on mount
  useEffect(() => {
    try {
      const savedStats = localStorage.getItem("maverick_focus_sessions");
      if (savedStats) {
        const parsed: FocusSessionLog[] = JSON.parse(savedStats);
        const completed = parsed.filter(s => s.completedStatus === "yes").length;
        setFocusStats({
          totalSessions: parsed.length,
          completedCount: completed
        });
      }
    } catch (err) {
      console.warn("MAVERICK WALLET // Focus statistics error:", err);
    }

    // Restore running state across refresh/routing transitions
    try {
      const savedTimer = localStorage.getItem("maverick_saved_timer");
      if (savedTimer) {
        const parsed = JSON.parse(savedTimer);
        const { 
          timeLeft: cachedTimeLeft, 
          totalSeconds: cachedTotal, 
          isActive: cachedIsActive, 
          sessionState: cachedState, 
          taskName: cachedTask, 
          lastSavedTimestamp 
        } = parsed;

        if (cachedIsActive && lastSavedTimestamp) {
          const elapsed = Math.floor((Date.now() - lastSavedTimestamp) / 1000);
          const remaining = Math.max(0, cachedTimeLeft - elapsed);
          
          if (remaining > 0) {
            setTimeLeft(remaining);
            setTotalSeconds(cachedTotal || 25 * 60);
            setIsActive(true);
            setSessionState(cachedState || "running");
            setTaskName(cachedTask || "Maverick Study Session");
            setIsExpanded(true); // auto open to draw attention which is active!
          } else {
            setTimeLeft(0);
            setTotalSeconds(cachedTotal || 25 * 60);
            setIsActive(false);
            setSessionState("ended");
            setTaskName(cachedTask || "Maverick Study Session");
            setIsExpanded(true);
            playCompletionChime();
          }
        } else {
          setTimeLeft(cachedTimeLeft !== undefined ? cachedTimeLeft : 25 * 60);
          setTotalSeconds(cachedTotal !== undefined ? cachedTotal : 25 * 60);
          setIsActive(false);
          setSessionState(cachedState || "idle");
          setTaskName(cachedTask || "Maverick Study Session");
        }
      }
    } catch (err) {
      console.warn("MAVERICK // Error restoring cached timer state:", err);
    }
  }, []);

  // Write changes to cache whenever timer changes to stay persistent
  useEffect(() => {
    try {
      const stateToSave = {
        timeLeft,
        totalSeconds,
        isActive,
        sessionState,
        taskName,
        lastSavedTimestamp: Date.now()
      };
      localStorage.setItem("maverick_saved_timer", JSON.stringify(stateToSave));
    } catch (err) {
      // safe bypass
    }
  }, [timeLeft, totalSeconds, isActive, sessionState, taskName]);

  // Sync state machine listener from Maverick AI triggers
  useEffect(() => {
    const handleMaverickCommand = (e: any) => {
      console.log("FOCUS TIMER // COMMAND RECEIVED:", e.detail);
      const { action, totalSeconds: requestedSecs, task } = e.detail || {};

      if (action === "start") {
        setTaskName(task || "Maverick Directed Block");
        const targetSecs = requestedSecs || 25 * 60;
        setTimeLeft(targetSecs);
        setTotalSeconds(targetSecs);
        setIsActive(true);
        setSessionState("running");
        setCompletedStatus(null);
        setIsExpanded(true); // auto expand on AI trigger!
      } else if (action === "pause") {
        setIsActive(false);
      } else if (action === "reset") {
        setIsActive(false);
        setSessionState("idle");
        setTimeLeft(25 * 60);
        setCompletedStatus(null);
      }
    };

    window.addEventListener("maverick_timer_command", handleMaverickCommand);
    return () => {
      window.removeEventListener("maverick_timer_command", handleMaverickCommand);
    };
  }, []);

  // Audio completion signal chime
  const playCompletionChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, start: number, duration: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + start);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime + start);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
        oscillator.start(audioCtx.currentTime + start);
        oscillator.stop(audioCtx.currentTime + start + duration);
      };
      playTone(523.25, 0, 0.6);   // C5
      playTone(659.25, 0.15, 0.6); // E5
      playTone(783.99, 0.3, 0.8);  // G5
    } catch (e) {
      console.warn("Audio Context init bypass:", e);
    }
  };

  // Live countdown ticker
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            setSessionState("ended");
            playCompletionChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setSessionState("ended");
      playCompletionChime();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleStart = () => {
    setIsActive(true);
    setSessionState("running");
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setSessionState("idle");
    setTimeLeft(25 * 60);
    setTotalSeconds(25 * 60);
    setCompletedStatus(null);
  };

  // Preset quick selectors
  const applyPreset = (mins: number) => {
    const secs = mins * 60;
    setTimeLeft(secs);
    setTotalSeconds(secs);
    setSessionState("idle");
    setIsActive(false);
  };

  // Convert seconds remaining to variables
  const hoursLeft = Math.floor(timeLeft / 3600);
  const minutesLeft = Math.floor((timeLeft % 3600) / 60);
  const secondsLeft = timeLeft % 60;

  // Custom dial updates
  const handleWheelChange = (type: "h" | "m" | "s", newVal: number) => {
    let h = hoursLeft;
    let m = minutesLeft;
    let s = secondsLeft;

    if (type === "h") h = newVal;
    if (type === "m") m = newVal;
    if (type === "s") s = newVal;

    const calcSecs = h * 3600 + m * 60 + s;
    setTimeLeft(calcSecs);
    setTotalSeconds(calcSecs || 25 * 60); // fallback if all zeroed
  };

  const handleScorecardSubmit = (status: "yes" | "partially" | "no") => {
    setCompletedStatus(status);
    const activeMins = Math.round(totalSeconds / 60) || 1;
    const newLog: FocusSessionLog = {
      id: `session-${Date.now()}`,
      task: taskName,
      duration: activeMins,
      completedStatus: status,
      timestamp: new Date().toISOString()
    };

    try {
      const saved = localStorage.getItem("maverick_focus_sessions");
      const currentList: FocusSessionLog[] = saved ? JSON.parse(saved) : [];
      const updatedList = [newLog, ...currentList];
      localStorage.setItem("maverick_focus_sessions", JSON.stringify(updatedList));

      const completed = updatedList.filter(s => s.completedStatus === "yes").length;
      setFocusStats({
        totalSessions: updatedList.length,
        completedCount: completed
      });

      // Award or deduct scores in Journal Stats
      const savedLogs = localStorage.getItem("maverick_journal_history");
      if (savedLogs) {
        const historyList = JSON.parse(savedLogs);
        if (historyList && historyList.length > 0) {
          const latestLog = historyList[0];
          let bonus = 0;
          if (status === "yes") bonus = 5;
          if (status === "partially") bonus = 2;
          if (status === "no") bonus = -2;

          latestLog.performanceScore = Math.max(0, Math.min(100, (latestLog.performanceScore || 70) + bonus));
          localStorage.setItem("maverick_journal_history", JSON.stringify(historyList));
          window.dispatchEvent(new Event("maverick_history_updated"));
        }
      }
    } catch (err) {
      console.error("MAVERICK WALLET // Error committing status:", err);
    }
  };

  // Visual SVG Progress Ring geometry parameters
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = totalSeconds > 0 ? (totalSeconds - timeLeft) / totalSeconds : 0;
  const strokeDashoffset = circumference - (progressPercent * circumference);

  const formattedTime = `${hoursLeft > 0 ? hoursLeft + ":" : ""}${minutesLeft.toString().padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`;

  return (
    <div className="absolute right-4 bottom-[72px] z-50 flex flex-col items-end pointer-events-none select-none">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            drag
            dragMomentum={false}
            dragElastic={0.08}
            className="w-80 bg-[#0d0d10]/95 backdrop-blur-md border border-[#3b494b]/40 shadow-2xl p-4 flex flex-col gap-3 text-left pointer-events-auto"
            id="floating-focus-timer-panel"
            style={{ touchAction: "none" }}
          >
            {/* Header drag-bar handle */}
            <div className="flex justify-between items-center border-b border-[#3b494b]/20 pb-2">
              <div className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing text-[#00f0ff]">
                <GripHorizontal size={14} className="text-neutral-500 hover:text-[#00f0ff] transition-colors" />
                <span className="text-[10px] font-mono tracking-wider uppercase font-black">
                  MAVERICK FOCUS
                </span>
                {isActive && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping ml-1" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                title="Minimize panel"
              >
                <X size={14} />
              </button>
            </div>

            {sessionState === "idle" && (
              <div className="space-y-3">
                {/* 1. Presets Row */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset(25)}
                    className="py-1 border border-[#3b494b]/25 hover:border-[#00f0ff] hover:bg-[#00f0ff]/5 text-[#00f0ff] hover:text-white text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-all"
                  >
                    25 Min
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(45)}
                    className="py-1 border border-[#3b494b]/25 hover:border-[#00f0ff] hover:bg-[#00f0ff]/5 text-[#00f0ff] hover:text-white text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-all"
                  >
                    45 Min
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(90)}
                    className="py-1 border border-[#3b494b]/25 hover:border-[#00f0ff] hover:bg-[#00f0ff]/5 text-[#00f0ff] hover:text-white text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-all"
                  >
                    90 Min
                  </button>
                </div>

                {/* 2. Dials Input Panel */}
                <div className="flex items-center justify-between gap-2.5 bg-[#050507] p-2.5 border border-neutral-900">
                  <ScrollWheel value={hoursLeft} label="hours" maxRange={24} onChange={(v) => handleWheelChange("h", v)} />
                  <div className="font-mono text-base text-[#3b494b] font-bold select-none h-20 flex items-center justify-center pt-1">:</div>
                  <ScrollWheel value={minutesLeft} label="minutes" maxRange={60} onChange={(v) => handleWheelChange("m", v)} />
                  <div className="font-mono text-base text-[#3b494b] font-bold select-none h-20 flex items-center justify-center pt-1">:</div>
                  <ScrollWheel value={secondsLeft} label="seconds" maxRange={60} onChange={(v) => handleWheelChange("s", v)} />
                </div>

                <div className="bg-[#050507] p-2 border border-neutral-900 flex flex-col gap-0.5">
                  <span className="text-[7px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Active Focus Task:</span>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="bg-transparent text-[11px] font-sans font-medium text-neutral-300 border-none outline-none focus:ring-0 w-full"
                    placeholder="Enter focus target..."
                  />
                </div>

                {/* Just Start button */}
                <button
                  type="button"
                  onClick={handleStart}
                  className="w-full bg-[#00f0ff] hover:bg-[#5cf2fb] text-black font-mono text-[10px] tracking-widest uppercase font-black py-2 cursor-pointer transition-all border-none"
                >
                  START
                </button>
              </div>
            )}

            {sessionState === "running" && (
              <div className="space-y-4 flex flex-col items-center py-1">
                {/* Active Info block */}
                <div className="w-full text-center">
                  <span className="text-[7.5px] font-mono font-black text-[#00f0ff] uppercase tracking-widest flex items-center justify-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-[#00f0ff] animate-ping" />
                    LIVE SPRINT LOCKDOWN
                  </span>
                  <p className="text-white text-[11px] font-semibold truncate max-w-[260px] mx-auto mt-0.5 font-sans">
                    "{taskName}"
                  </p>
                </div>

                {/* Circular Countdown Progress SVG Display */}
                <div className="relative w-36 h-36 flex items-center justify-center select-none">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background Circle Frame */}
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      stroke="#161e23"
                      strokeWidth="5"
                      fill="transparent"
                    />
                    {/* Glowing Active Progress Ring */}
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      stroke="#00f0ff"
                      strokeWidth="5.5"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-300 ease-out"
                      style={{
                        filter: "drop-shadow(0 0 4px rgba(0,240,255,0.45))",
                      }}
                    />
                  </svg>
                  {/* Inside Text Centerpiece */}
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-bold font-mono text-white tracking-widest text-glow">
                      {formattedTime}
                    </span>
                    <span className="text-[7px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
                      remaining
                    </span>
                  </div>
                </div>

                {/* Action Controllers */}
                <div className="flex gap-2 w-full justify-center">
                  {isActive ? (
                    <button
                      type="button"
                      onClick={handlePause}
                      className="flex items-center justify-center gap-1 border border-red-500/30 hover:border-red-400 bg-red-500/5 text-red-400 hover:text-white px-4 py-1.5 font-mono text-[9px] tracking-widest uppercase font-bold cursor-pointer transition-all"
                    >
                      <Pause size={10} />
                      <span>PAUSE</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsActive(true)}
                      className="flex items-center justify-center gap-1 border border-emerald-500/30 hover:border-emerald-400 bg-emerald-500/5 text-emerald-400 hover:text-white px-4 py-1.5 font-mono text-[9px] tracking-widest uppercase font-bold cursor-pointer transition-all"
                    >
                      <Play size={10} />
                      <span>RESUME</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center justify-center gap-1 border border-neutral-800 hover:border-white text-neutral-400 hover:text-white px-4 py-1.5 font-mono text-[9px] tracking-widest uppercase font-bold cursor-pointer transition-all"
                  >
                    <RotateCcw size={10} />
                    <span>RESET</span>
                  </button>
                </div>
              </div>
            )}

            {sessionState === "ended" && (
              <div className="space-y-3">
                <div className="p-3 bg-[#00f0ff]/5 border border-[#00f0ff]/20 flex flex-col items-center gap-1.5 text-center">
                  <Award className="text-[#00f0ff] w-6 h-6 animate-bounce" />
                  <h3 className="font-mono text-[10px] font-bold text-white tracking-widest uppercase">
                    FOCUS BLOCK ENDED
                  </h3>
                  <p className="text-neutral-400 text-[10px] font-sans italic max-w-xs truncate w-full">
                    Finished: "{taskName}"
                  </p>
                </div>

                {completedStatus === null ? (
                  <div className="space-y-2">
                    <span className="text-[8px] font-mono font-bold tracking-wider text-neutral-400 uppercase block text-center">
                      DID YOU SUCCESSFULLY COMPLETE THIS FOCUS TARGET?
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleScorecardSubmit("yes")}
                        className="py-1.5 px-0.5 border border-emerald-500/25 hover:border-emerald-400 hover:bg-emerald-500/10 text-emerald-400 text-center text-[9px] font-mono uppercase font-black cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5"
                      >
                        <Check size={10} />
                        <span>YES</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScorecardSubmit("partially")}
                        className="py-1.5 px-0.5 border border-yellow-500/25 hover:border-yellow-400 hover:bg-yellow-500/10 text-yellow-400 text-center text-[9px] font-mono uppercase font-black cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5"
                      >
                        <AlertCircle size={10} />
                        <span>PARTIAL</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleScorecardSubmit("no")}
                        className="py-1.5 px-0.5 border border-red-500/25 hover:border-red-400 hover:bg-red-500/10 text-red-400 text-center text-[9px] font-mono uppercase font-black cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5"
                      >
                        <X size={10} />
                        <span>NO</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="p-2.5 bg-neutral-950 border border-neutral-900 text-neutral-300 font-sans text-[10px] md:text-xs flex flex-col gap-1 z-10">
                      {completedStatus === "yes" && (
                        <>
                          <p className="text-[#5cf2fb] font-mono font-bold text-[9px] uppercase">✓ METRICS COMMITTED</p>
                          <p className="leading-relaxed">Excellent execution. Standard focus multiplier has scaled +5 to today's performance quotient.</p>
                        </>
                      )}
                      {completedStatus === "partially" && (
                        <>
                          <p className="text-yellow-400 font-mono font-bold text-[9px] uppercase">⚠ PARTIAL PROGRESS</p>
                          <p className="leading-relaxed">Good persistence. Dedicate another short sprint block to finish remaining items.</p>
                        </>
                      )}
                      {completedStatus === "no" && (
                        <>
                          <p className="text-red-400 font-mono font-bold text-[9px] uppercase">🗙 SHUTDOWN DETECTED</p>
                          <p className="leading-relaxed">Decompose the goal into smaller, granular actions before committing a new timer.</p>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full bg-[#00f0ff] hover:bg-[#5cf2fb] text-black font-mono text-[9px] tracking-widest uppercase font-black py-2 cursor-pointer transition-all border-none"
                    >
                      START NEW FOCUS CYCLE
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Collapsed Circular Button State - Always stays perfectly floating above the Send button */}
      <motion.button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-10 h-10 rounded-full border border-[#00f0ff]/40 bg-[#07070a]/95 text-[#00f0ff] hover:text-white flex items-center justify-center shadow-lg cursor-pointer pointer-events-auto hover:bg-[#00f0ff]/10 hover:border-[#00f0ff] transition-all relative outline-none"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        id="floating-focus-trigger"
        title="Open Focus Timer Dashboard"
      >
        <Timer size={18} className={isActive ? "animate-spin" : ""} style={{ animationDuration: isActive ? "8s" : "" }} />
        
        {isActive && (
          <>
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-pulse pointer-events-none" />
          </>
        )}
      </motion.button>
    </div>
  );
}
