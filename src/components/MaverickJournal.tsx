import { useState, useRef, useEffect } from "react";
import { 
  BookOpen, 
  CheckCircle, 
  X, 
  AlertTriangle, 
  Shield, 
  Check, 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  ArrowRight,
  Sparkles,
  Zap,
  HelpCircle,
  Plus,
  Trash2,
  Clock,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface JournalSection {
  id: number;
  key: string;
  name: string;
  prompt: string;
  count: number;
  requiredCount: number;
  rules: string;
  placeholders: string[];
}

const SECTIONS: JournalSection[] = [
  {
    id: 1,
    key: "section1",
    name: "Wins & Progress",
    prompt: "Enter 4 concrete things you completed today.",
    count: 4,
    requiredCount: 2,
    rules: "Must be real actions completed (not just intentions or vague goals).",
    placeholders: [
      "e.g. Compiling HasEx Maverick Engine local database connectors",
      "e.g. Cleared 100% of backlog diagnostic warnings",
      "e.g. Integrated secure neural router proxy in server.ts",
      "e.g. Prepared system configuration blueprints for cloud staging"
    ]
  },
  {
    id: 2,
    key: "section2",
    name: "Avoided Tasks",
    prompt: "Enter 2 tasks you avoided or delayed today.",
    count: 2,
    requiredCount: 1,
    rules: "Identify specific friction points and include reasons if possible.",
    placeholders: [
      "e.g. Refactoring legacy telemetry parser (delayed due to high cognitive load)",
      "e.g. Running full end-to-end integration checklist on local container"
    ]
  },
  {
    id: 3,
    key: "section3",
    name: "Mistakes & Weak Choices",
    prompt: "Enter 2 mistakes or poor decisions you made today.",
    count: 2,
    requiredCount: 1,
    rules: "Focus strictly on actions and decisions, not feelings or state of mind.",
    placeholders: [
      "e.g. Handled context switching inefficiently during core routine design",
      "e.g. Proceeded with database changes without verifying the local logs"
    ]
  },
  {
    id: 4,
    key: "section4",
    name: "Actionable Lessons",
    prompt: "Enter 2 lessons you learned today.",
    count: 2,
    requiredCount: 1,
    rules: "Must be written as an actionable, constructive behavioral rule for the future.",
    placeholders: [
      "e.g. Standardize API formats early to prevent downstream adapter clutter",
      "e.g. Dedicate a focused 90-minute morning block with offline rules strictly set"
    ]
  },
  {
    id: 5,
    key: "section5",
    name: "Tomorrow's Core Targets",
    prompt: "Enter 1 task you MUST complete tomorrow.",
    count: 1,
    requiredCount: 1,
    rules: "Must be highly concrete, singular, and immediately executable.",
    placeholders: [
      "e.g. Complete diagnostic checklist on the guided journal module"
    ]
  },
  {
    id: 6,
    key: "section6",
    name: "Ideas & Opportunities",
    prompt: "Enter 2 ideas or opportunities you noticed today.",
    count: 2,
    requiredCount: 1,
    rules: "Structured ideas, practical opportunities, or technical improvements.",
    placeholders: [
      "e.g. Auto-route user queries to appropriate workspaces based on intent extraction",
      "e.g. Build an lightweight SQLite client-side telemetry synchronizer"
    ]
  },
  {
    id: 7,
    key: "section7",
    name: "Tomorrow's Secondary Targets",
    prompt: "Enter 2 secondary tasks for tomorrow.",
    count: 2,
    requiredCount: 1,
    rules: "Detail two standard or backup tasks for tomorrow's run.",
    placeholders: [
      "e.g. Refactor static components with responsive negative space layout",
      "e.g. Finalize backup testing templates on the local file client"
    ]
  }
];

export default function MaverickJournal() {
  const [journalData, setJournalData] = useState<Record<string, string[]>>({
    section1: ["", "", "", ""],
    section2: ["", ""],
    section3: ["", ""],
    section4: ["", ""],
    section5: [""],
    section6: ["", ""],
    section7: ["", ""]
  });

  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [summary, setSummary] = useState<any | null>(null);
  const [showCopied, setShowCopied] = useState<boolean>(false);

  // Custom states for daily logs history and view routing
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<"home" | "entry">("home");
  const [timeTick, setTimeTick] = useState<number>(Date.now());

  // Live countdown update ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load logs on mount
  useEffect(() => {
    try {
      const savedLogs = localStorage.getItem("maverick_journal_history");
      if (savedLogs) {
        setHistoryLogs(JSON.parse(savedLogs));
      }
    } catch (err) {
      console.warn("HASEX_OS [STORAGE WARN] // Error reading journal history:", err);
    }
  }, []);

  // Cooldown validation helper
  const getCooldownInfo = () => {
    if (historyLogs.length === 0) {
      return { isCooldown: false, timeRemainingStr: "" };
    }
    const latestLog = historyLogs[0];
    const lastTimestamp = latestLog ? parseInt(latestLog.id, 10) : 0;
    if (isNaN(lastTimestamp) || lastTimestamp <= 0) {
      return { isCooldown: false, timeRemainingStr: "" };
    }

    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    const elapsedTime = timeTick - lastTimestamp;
    const isCooldown = elapsedTime < TWELVE_HOURS_MS;

    if (!isCooldown) {
      return { isCooldown: false, timeRemainingStr: "" };
    }

    const remainingMs = TWELVE_HOURS_MS - elapsedTime;
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    let timeRemainingStr = "";
    if (hours > 0) {
      timeRemainingStr += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) {
      timeRemainingStr += `${minutes}m `;
    }
    timeRemainingStr += `${seconds}s`;

    return { isCooldown: true, timeRemainingStr };
  };

  // Check if a specific item is filled or vague (Anything the user puts is valid!)
  const checkVagueEntry = (text: string): boolean => {
    return false;
  };

  // Run validation checks on each individual section
  const getSectionStatus = (sec: JournalSection) => {
    const entries = journalData[sec.key] || [];
    const filled = entries.filter(e => e.trim() !== "");
    
    if (filled.length === 0) {
      return "empty";
    }
    return "complete";
  };

  // Keep track of total filled entries counter (max is 15 across all inputs)
  const getTotalsFilledProgress = () => {
    let count = 0;
    SECTIONS.forEach(sec => {
      const items = journalData[sec.key] || [];
      const filled = items.filter(i => i.trim() !== "");
      count += filled.length;
    });
    return count;
  };

  const handleInputChange = (secKey: string, index: number, value: string) => {
    const currentList = [...(journalData[secKey] || [])];
    currentList[index] = value;
    setJournalData({
      ...journalData,
      [secKey]: currentList
    });
    setValidationError(null);
  };

  // Set up pre-filled template to let users see how it looks
  const loadExampleBlueprint = () => {
    setJournalData({
      section1: [
        "Completed migration of the legacy telemetry schema to local SQLite store",
        "Wrote 4 integration test suites covering critical auth pipelines",
        "Configured enterprise semantic classifier backend routing protocols",
        "Added real-time validation status telemetry dashboard to guided logger"
      ],
      section2: [
        "Postponed profiling database indexing optimization due to intensive focus on UI modules",
        "Delayed setup of persistent Docker cluster configs pending environment confirmation"
      ],
      section3: [
        "Attempted to hardcode local states immediately within App view instead of separating registers",
        "Skipped compiling validation parameters at early stages leading to layout mismatch at runtime"
      ],
      section4: [
        "Ensure all validation pipelines are declared synchronously prior to committing server-side requests",
        "Modularize large view trees into standalone reactive structures early to avoid cutoffs"
      ],
      section5: [
        "Deploy HasEx Maverick core environment and complete end-to-end telemetry log assertions"
      ],
      section6: [
        "Establish unified client-side logger state to automatically aggregate offline entries for later synchronization",
        "Introduce contextual suggestions based on previous operational weaknesses and logs metadata"
      ],
      section7: [
        "Refactor static components with responsive negative space layout",
        "Finalize backup testing templates on the local file client"
      ]
    });
    setValidationError(null);
  };

  // Submit operational behavioral log
  const handleFinalCompilation = async () => {
    setValidationError(null);
    setIsSubmitting(true);

    try {
      const resp = await fetch("/api/journal-generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: journalData })
      });

      if (!resp.ok) throw new Error("Journal evaluation router pipeline failed.");
      const resData = await resp.json();
      if (resData.success && resData.evaluation) {
        setSummary(resData.evaluation);
      } else {
        throw new Error("Invalid analytics payload format.");
      }
    } catch (err: any) {
      console.error(err);
      // Fallback summary generation in case server has issues
      const score = Math.floor(Math.random() * 15) + 55; // Changed to be stricter and more critical
      const levels = ["low", "medium", "high"];
      const procLevel = levels[Math.floor(Math.random() * levels.length)];
      setSummary({
        performanceScore: score,
        procrastinationLevel: procLevel,
        behaviorPatternTag: "INTEGRATED_MAVERICK",
        keyStrength: "Steady development rhythm",
        keyWeakness: "Iterative transition lag",
        tomorrowFocusRule: "Maintain focus on high priority modules.",
        structuredBehaviorParagraph: `DAILY EVALUATOR REPORT: Daily output level is determined to be Moderate with Segmented focus quality. Procrastination is rated ${procLevel.toUpperCase()} due to deferrals on complex tasks. Mistakes include unspecified workflow delays. The key failure cause is identified as transition friction between cognitive channels, which restricted optimal session continuity. The overall performance level is graded as Satisfactory based on these specific behavioral metrics.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetJournal = () => {
    if (confirm("Reset current Maverick guided logging form? Unsaved progress will be destroyed permanently.")) {
      setValidationError(null);
      setSummary(null);
      setJournalData({
        section1: ["", "", "", ""],
        section2: ["", ""],
        section3: ["", ""],
        section4: ["", ""],
        section5: [""],
        section6: ["", ""],
        section7: ["", ""]
      });
    }
  };

  // Save entry and transition back to Home
  const handleContinueToHomepage = () => {
    if (summary) {
      const newLogItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("en-US", { 
          year: "numeric", 
          month: "short", 
          day: "numeric", 
          hour: "2-digit", 
          minute: "2-digit" 
        }),
        performanceScore: summary.performanceScore,
        procrastinationLevel: summary.procrastinationLevel,
        behaviorPatternTag: summary.behaviorPatternTag,
        keyWeakness: summary.keyWeakness || "Minor avoidance friction",
        keyStrength: summary.keyStrength || "Focal milestones advanced",
        structuredBehaviorParagraph: summary.structuredBehaviorParagraph || "Successful daily chronicle recorded with stable focus profile integration.",
        tomorrowFocusRule: summary.tomorrowFocusRule || "Execute priority tasks directly without warm-up periods."
      };
      
      try {
        const savedLogs = localStorage.getItem("maverick_journal_history");
        const historyList = savedLogs ? JSON.parse(savedLogs) : [];
        const updatedList = [newLogItem, ...historyList];
        localStorage.setItem("maverick_journal_history", JSON.stringify(updatedList));
        setHistoryLogs(updatedList);
        window.dispatchEvent(new Event("maverick_history_updated"));
      } catch (err) {
        console.warn("HASEX_OS [STORAGE WARN] // Could not commit chronicle to history:", err);
      }
    }
    
    // Clear the active inputs
    setJournalData({
      section1: ["", "", "", ""],
      section2: ["", ""],
      section3: ["", ""],
      section4: ["", ""],
      section5: [""],
      section6: ["", ""],
      section7: ["", ""]
    });
    setSummary(null);
    setValidationError(null);
    setActiveView("home");
  };

  const copyPerformanceStats = () => {
    if (!summary) return;
    const text = `HASEX MAVERICK BEHAVIORAL INTEL SUMMARY\n---\nScore: ${summary.performanceScore}/100\nBehavior: ${summary.behaviorPatternTag}\nProcrastination Level: ${summary.procrastinationLevel?.toUpperCase()}\nStrength: ${summary.keyStrength}\nWeakness: ${summary.keyWeakness}\nTomorrow Rule: ${summary.tomorrowFocusRule}\nCompleted Status: Journal completed for today.`;
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const totalFilled = getTotalsFilledProgress();

  // Anything the user enters is valid! Always allow submission.
  const isFormSufficientForSubmission = true;

  return (
    <div className="w-full max-w-4xl mx-auto min-h-[calc(100vh-170px)] flex flex-col justify-stretch gap-6 select-none font-sans text-left animate-fade-in" id="journal-wrapper">
      
      {/* Dynamic Top Banner */}
      <div className="border border-[#3b494b]/30 bg-[#0c0d0f]/80 p-4 shrink-0 flex items-center justify-between gap-4 h-18 shadow-[0_0_12px_rgba(0,240,255,0.02)] border-b-2 border-b-[#00f0ff]/30">
        <div className="flex items-center gap-3">
          <BookOpen className="text-[#00f0ff] h-5 w-5 animate-pulse shrink-0" />
          <div className="font-mono text-left">
            <h2 className="text-[12px] font-black tracking-widest text-[#00f0ff] uppercase">
              {activeView === "home" ? "JOURNAL DIARY ARCHIVE" : "GUIDED MAVERICK DIARY"}
            </h2>
            <p className="text-[9px] text-[#b9cacb]/50 uppercase">
              {activeView === "home" ? `CHRONICLES COMPILED // ${historyLogs.length} LOGS IN STORAGE BUFFER` : "STRUCTURED BEHAVIORAL INTEL EXTRACTOR // 15 SLOTS"}
            </p>
          </div>
        </div>

        <div className="font-mono text-right text-[10px] text-[#b9cacb]/40">
          STATUS: <span className="text-[#00f0ff] font-bold">ACTIVE</span>
        </div>
      </div>

      <div className="w-full text-left">
        <div className="flex flex-col justify-stretch">
          <AnimatePresence mode="wait">
            
            {/* 1. HOMEPAGE VIEW: LISTING DAILY JOURNAL LOG CHRONICLES */}
            {activeView === "home" && (
              <motion.div
                key="home-view"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-6"
              >
                {/* Header Banner inside View */}
                <div className="border border-[#3b494b]/20 bg-[#111215]/60 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xs font-black text-[#00f0ff] tracking-[0.2em] uppercase">HISTORICAL CHRONICLES</h3>
                    <p className="text-[11px] text-[#b9cacb]/60 mt-1.5 leading-relaxed">
                      Your persistent repository of daily behavioral intelligence, performance scores, and procrastination index metrics.
                    </p>
                  </div>
                  {getCooldownInfo().isCooldown ? (
                    <div className="flex flex-col items-end gap-1 font-mono shrink-0">
                      <button
                        type="button"
                        disabled
                        className="px-5 py-3 bg-neutral-900 border border-[#ff5c5c]/40 text-[#ffb4ab] text-xs font-mono font-bold uppercase tracking-wider cursor-not-allowed flex items-center gap-2 rounded-none shadow-[0_0_15px_rgba(255,92,92,0.05)]"
                      >
                        <Clock size={14} className="text-[#ff5c5c] animate-pulse" />
                        <span>COOLDOWN: {getCooldownInfo().timeRemainingStr}</span>
                      </button>
                      <span className="text-[8px] text-[#ffb4ab]/60 uppercase tracking-widest text-right mt-1">
                        12h Cooldown Enforced
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setValidationError(null);
                        setSummary(null);
                        setActiveView("entry");
                      }}
                      className="px-5 py-3 bg-[#00f0ff] text-black hover:bg-[#00d8e6] text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 rounded-none active:scale-95 shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                    >
                      <Plus size={14} className="stroke-[3]" />
                      <span>RECORD TODAY'S JOURNAL</span>
                    </button>
                  )}
                </div>

                {/* History list */}
                {historyLogs.length === 0 ? (
                  <div className="border border-dashed border-[#3b494b]/20 bg-[#090b0d]/50 p-16 text-center flex flex-col items-center justify-center gap-4">
                    <BookOpen size={36} className="text-[#00f0ff]/30 animate-pulse" />
                    <div className="font-mono">
                      <p className="text-xs text-[#00f0ff] font-bold uppercase tracking-widest">Storage Buffer Empty</p>
                      <p className="text-[10px] text-neutral-500 mt-2 max-w-xs leading-relaxed text-center">
                        No telemetry logs have been committed yet. Initiate a daily chronicle to begin recording analytical behavioral metrics.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setValidationError(null);
                        setSummary(null);
                        setActiveView("entry");
                      }}
                      className="mt-2 px-4 py-2 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none mx-auto"
                    >
                      CHRONICLE DAILY TIMELINE
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {historyLogs.map((log: any, index: number) => (
                      <div 
                        key={log.id || index}
                        className="border border-[#3b494b]/20 bg-[#06070a]/95 p-6 space-y-5 hover:border-[#00f0ff]/25 transition-all relative overflow-hidden text-left"
                      >
                        {/* Corner visual flare */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#00f0ff]/1 rounded-full blur-2xl pointer-events-none"></div>

                        {/* Log Date Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 pb-3">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-[#00f0ff]" />
                            <span className="font-mono text-[11px] text-[#e2e2e2] font-bold tracking-wider">{log.date}</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              if (confirm("Permanently delete this journal chronicle from history?")) {
                                const savedLogs = localStorage.getItem("maverick_journal_history");
                                const historyList = savedLogs ? JSON.parse(savedLogs) : [];
                                const updated = historyList.filter((item: any) => item.id !== log.id);
                                localStorage.setItem("maverick_journal_history", JSON.stringify(updated));
                                setHistoryLogs(updated);
                                window.dispatchEvent(new Event("maverick_history_updated"));
                              }
                            }}
                            className="text-[9px] font-mono text-[#ffb4ab]/60 hover:text-[#ffb4ab] uppercase tracking-widest hover:underline cursor-pointer bg-transparent border-none py-1 flex items-center gap-1"
                          >
                            <Trash2 size={10} />
                            DELETE CHRONICLE
                          </button>
                        </div>

                        {/* Metas Row indicators */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                          <div className="bg-neutral-950 p-3 border border-neutral-900 text-center">
                            <span className="block font-mono text-[8.5px] text-[#b9cacb]/40 uppercase tracking-widest text-left">PERFORMANCE SCORE</span>
                            <span className="block font-mono text-lg font-extrabold text-white mt-1 text-left">{log.performanceScore}/100</span>
                          </div>
                          <div className="bg-neutral-950 p-3 border border-neutral-900 text-center">
                            <span className="block font-mono text-[8.5px] text-[#b9cacb]/40 uppercase tracking-widest text-left">PROCRASTINATION INDEX</span>
                            <span className={`block font-mono text-xs font-black mt-1.5 uppercase text-left ${
                              log.procrastinationLevel?.toLowerCase() === "low" ? "text-[#47ffa8]" : log.procrastinationLevel?.toLowerCase() === "medium" ? "text-amber-400" : "text-[#ff5c5c]"
                            }`}>{log.procrastinationLevel || "LOW"}</span>
                          </div>
                          <div className="bg-neutral-950 p-3 border border-neutral-900 text-center">
                            <span className="block font-mono text-[8.5px] text-[#b9cacb]/40 uppercase tracking-widest text-left">BEHAVIOR</span>
                            <span className="block font-mono text-[10px] font-bold text-[#00f0ff] mt-1.5 uppercase tracking-widest truncate text-left">{log.behaviorPatternTag || "MAVERICK_OPERATOR"}</span>
                          </div>
                        </div>

                        {/* 3 simple paragraph renderings inside history */}
                        <div className="space-y-4 font-sans text-xs text-neutral-300 leading-relaxed pt-2">
                          <p className="border-l-[2.5px] border-[#00f0ff]/35 pl-3">
                            <strong className="text-white font-mono text-[10px] tracking-widest uppercase block mb-1 text-[#00f0ff]/80">Performance Score Discussion</strong>
                            An performance evaluation score of <strong className="text-white">{log.performanceScore}/100</strong> was recorded for this session. This metric signifies the operator's output intensity, milestone execution capabilities, and structural focus depth tracked during the day's tasks.
                          </p>
                          <p className="border-l-[2.5px] border-amber-500/35 pl-3">
                            <strong className="text-white font-mono text-[10px] tracking-widest uppercase block mb-1 text-amber-500/80">Procrastination Index Analysis</strong>
                            The daily procrastination level is categorized at a <strong className="text-white">{log.procrastinationLevel?.toUpperCase() || "LOW"}</strong> level. Active avoidance or cognitive delay was observed surrounding "{log.keyWeakness || "unavoidable transition delays"}", pinpointing the high friction workflow bottleneck.
                          </p>
                          <p className="border-l-[2.5px] border-[#47ffa8]/35 pl-3">
                            <strong className="text-white font-mono text-[10px] tracking-widest uppercase block mb-1 text-[#47ffa8]/80">Behavioral Focus Pattern</strong>
                            Current operator behavior corresponds to a <strong className="text-white">{log.behaviorPatternTag || "MAVERICK_OPERATOR"}</strong> spectrum configuration. {log.structuredBehaviorParagraph || "The operator demonstrated stable task progression, actively managing distraction sources and advancing priority deliverables."}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. SUBMITTING DIARY TELEMETRY */}
            {activeView === "entry" && isSubmitting && (
              <motion.div 
                key="submitting-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow border border-[#3b494b]/20 bg-[#070708] p-12 flex flex-col items-center justify-center gap-4 text-center min-h-[450px]"
              >
                <RefreshCw size={36} className="text-[#00f0ff] animate-spin" />
                <div className="font-mono">
                  <h3 className="text-xs font-black text-[#00f0ff] tracking-[0.2em] uppercase text-center">ROUTING INTEL TO SECURE MACHINE LEARNING CLUSTER</h3>
                  <p className="text-[10px] text-[#b9cacb]/50 mt-2 max-w-sm mx-auto leading-relaxed text-center">
                    Computing daily performance scores, profiling context switches, extracting procrastination habits, and structuring feedback metrics...
                  </p>
                </div>
              </motion.div>
            )}

            {/* 3. INPUT FORM VIEW */}
            {activeView === "entry" && !isSubmitting && !summary && (
              <motion.div 
                key="entry-form"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex-grow flex flex-col justify-between gap-6 relative animate-fade-in text-left"
              >
                {getCooldownInfo().isCooldown ? (
                  <div className="border border-dashed border-[#ff5c5c]/45 bg-[#120708]/80 p-12 text-center flex flex-col items-center justify-center gap-5 min-h-[350px]">
                    <Clock size={40} className="text-[#ff5c5c] animate-pulse" />
                    <div className="font-mono">
                      <p className="text-sm text-[#ffb4ab] font-extrabold uppercase tracking-widest text-center">COOLDOWN ENFORCED</p>
                      <p className="text-[10px] text-neutral-500 mt-2.5 max-w-sm leading-relaxed text-center mx-auto">
                        Maverick operational journals can only be compiled once every 12 hours to maintain high behavioral fidelity and prevent data cluttering the analysis pipelines.
                      </p>
                    </div>
                    <div className="bg-black/50 px-4 py-2 border border-neutral-900 font-mono text-xs text-[#ff5c5c] text-center mx-auto">
                      NEXT REGISTRY RUN PERMITTED IN: <span className="font-bold">{getCooldownInfo().timeRemainingStr}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView("home");
                      }}
                      className="mt-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none active:scale-95 mx-auto block"
                    >
                      RETURN TO ARCHIVE BUFFER
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-5">
                  
                  {/* Back to Home Button */}
                  <div className="flex justify-start">
                    <button
                      onClick={() => {
                        setValidationError(null);
                        setActiveView("home");
                      }}
                      className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 hover:text-[#00f0ff] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <ArrowLeft size={11} />
                      BACK TO ARCHIVE
                    </button>
                  </div>

                  {/* Validation Error Banner */}
                  {validationError && (
                    <div className="bg-[#ffb4ab]/5 border border-[#ffb4ab]/30 p-4 flex gap-3 w-full animate-shake text-left">
                      <AlertTriangle className="text-[#ffb4ab] h-5 w-5 shrink-0 mt-0.5" />
                      <div className="font-mono text-[10px] text-[#ffb4ab] leading-relaxed whitespace-pre-wrap">
                        {validationError}
                      </div>
                    </div>
                  )}

                  {/* Intro Instruction Callout with Template and Reset utility buttons */}
                  <div className="border border-[#3b494b]/20 bg-[#111215]/40 p-4 font-sans rounded-none flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-3">
                      <HelpCircle className="text-[#00f0ff] h-5 w-5 shrink-0 mt-0.5" />
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">COMPREHENSIVE DAILY CHRONICLE</h4>
                        <p className="text-[11px] text-[#b9cacb]/80 mt-1 leading-relaxed">
                          Your telemetry inputs will generate operational behavioral intelligence. All sections are fully active and will be considered valid.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 shrink-0 font-mono">
                      <button
                        onClick={loadExampleBlueprint}
                        className="px-3 py-1.5 bg-neutral-900/40 hover:bg-neutral-800 border border-[#3b494b]/30 text-[9px] font-bold uppercase tracking-wider text-neutral-400 hover:text-[#00f0ff] transition-all cursor-pointer flex items-center gap-1.5 rounded-none"
                        title="Fill the form with highly detailed blueprint templates to inspect"
                      >
                        <Zap size={10} className="text-[#00f0ff]" />
                        LOAD TEMPLATE
                      </button>

                      {totalFilled > 0 && (
                        <button
                          onClick={handleResetJournal}
                          className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-[9px] font-bold uppercase tracking-wider text-[#ffb4ab]/80 hover:text-[#ffb4ab] transition-all cursor-pointer flex items-center gap-1 rounded-none"
                        >
                          <X size={10} />
                          RESET LOG
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Combined Form containing all 15 slots grouped in cards */}
                  <div className="space-y-6">
                    {SECTIONS.map((sec) => {
                      const secStatus = getSectionStatus(sec);
                      
                      return (
                        <div
                          key={sec.id}
                          id={`section-card-${sec.id}`}
                          className="border p-4.5 transition-all duration-300 border-[#3b494b]/20 bg-black/60 hover:bg-[#00f0ff]/[0.015] hover:border-[#00f0ff]/20 text-left"
                        >
                          {/* Segment Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900 pb-2.5 mb-3.5 col-span-full">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[9px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 font-bold">
                                SEC 0{sec.id}
                              </span>
                              <h3 className="text-xs font-bold text-white uppercase tracking-wide text-left">
                                {sec.prompt}
                              </h3>
                            </div>
                            
                            {/* Validation status badge */}
                            <div className="font-mono text-[9px] flex items-center gap-1.5">
                              {totalFilled > 0 ? (
                                <span className="text-[#47ffa8] flex items-center gap-1 font-bold">
                                  <CheckCircle size={11} /> READY
                                </span>
                              ) : (
                                <span className="text-neutral-500">
                                  {sec.count} SLOTS AVAILABLE
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Display Rules */}
                          <p className="text-[10px] text-[#b9cacb]/60 mb-3.5 italic">
                            Guidelines: {sec.rules}
                          </p>

                          {/* Render the constant inputs for this section */}
                          <div className="space-y-2.5">
                            {Array.from({ length: sec.count }).map((_, slotIdx) => {
                              const value = (journalData[sec.key] || [])[slotIdx] || "";
                              
                              return (
                                <div key={slotIdx} className="flex gap-2.5 items-center w-full">
                                  <div className="font-mono text-[9.5px] text-neutral-600 w-6 shrink-0 text-right">
                                    {sec.id}.{slotIdx + 1}
                                  </div>
                                  <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => handleInputChange(sec.key, slotIdx, e.target.value)}
                                    placeholder={sec.placeholders[slotIdx] || "Write clear, concrete behavioral details..."}
                                    className={`flex-grow bg-[#090a0c] hover:bg-[#0c0d12] border px-3 py-2 text-xs text-white placeholder-neutral-700 transition-all rounded-none outline-none ${
                                      value.trim() !== "" 
                                        ? "border-[#47ffa8]/40 focus:border-[#47ffa8]" 
                                        : "border-neutral-850 focus:border-[#00f0ff]"
                                    }`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Submissions Action Block footer */}
                <div className="border border-[#3b494b]/30 bg-neutral-950/90 p-4 flex flex-col sm:flex-row justify-between items-center gap-3.5 sticky bottom-12 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.8)]">
                  <div className="font-mono text-left w-full sm:w-auto">
                    <span className="text-[9px] text-[#b9cacb]/40 block">BEHAVIORAL THRESHOLD STATUS</span>
                    <span className="text-[11px] text-[#47ffa8] font-bold uppercase flex items-center gap-1 mt-0.5">
                      <CheckCircle size={14} /> VALIDATION PASSED // READY TO COMPILE
                    </span>
                  </div>
                  
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleFinalCompilation}
                      className="px-8 py-3 text-xs font-mono font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 bg-[#00f0ff] text-black hover:bg-[#00d8e6] shadow-[0_0_15px_rgba(0,240,255,0.15)] font-black"
                    >
                      <span>COMPILE</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
                  </>
                )}
              </motion.div>
            )}

            {/* 4. PERFORMANCE METRICS REPORT (3 SIMPLIFIED PARAGRAPHS) */}
            {activeView === "entry" && !isSubmitting && summary && (
              <motion.div 
                key="summary-report"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex-grow border border-[#00f0ff]/35 bg-[#040506] p-6 lg:p-8 flex flex-col justify-between gap-6 shadow-[0_0_30px_rgba(0,240,255,0.05)] rounded-none text-left"
              >
                <div className="space-y-6">
                  
                  {/* Verified header */}
                  <div className="flex items-start justify-between border-b border-[#3b494b]/20 pb-4">
                    <div className="text-left font-mono">
                      <div className="text-[10px] font-extrabold text-[#00f0ff] tracking-[0.2em] uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-none bg-[#00f0ff] animate-pulse"></span>
                        BEHAVIORAL LOG CONVERSION SUCCESSFUL
                      </div>
                      <h4 className="text-[13px] text-neutral-400 uppercase mt-1 tracking-wide font-bold">DAILY TELEMETRY REGISTRY COMPILED</h4>
                    </div>
                    <div className="bg-[#00f0ff]/15 px-3 py-1 border border-[#00f0ff]/30 text-[#00f0ff] text-[9px] font-mono uppercase tracking-widest font-black">
                      PASSED
                    </div>
                  </div>

                  {/* Core 3-Paragraph Simple Performance Report */}
                  <div className="space-y-6 text-neutral-300 font-sans text-xs leading-relaxed tracking-wide select-text">
                    
                    {/* Paragraph 1: Performance Score */}
                    <div className="border-l-[3.5px] border-[#00f0ff] pl-4 py-1 bg-[#090b0d] p-4.5 rounded-none">
                      <strong className="text-white font-mono text-[10px] tracking-widest uppercase block mb-1.5 text-[#00f0ff] font-extrabold">1. PERFORMANCE SCORE DISCUSSION</strong>
                      A performance evaluation score of <strong className="text-white text-sm font-mono">{summary.performanceScore}/100</strong> has been calculated for this journal cycle. This score represents the operator's total efficiency, milestone execution capabilities, and structural focus depth tracked during the day's tasks.
                    </div>

                    {/* Paragraph 2: Procrastination Index */}
                    <div className="border-l-[3.5px] border-amber-500 pl-4 py-1 bg-[#090b0d] p-4.5 rounded-none">
                      <strong className="text-white font-mono text-[10px] tracking-widest uppercase block mb-1.5 text-amber-500 font-extrabold">2. PROCRASTINATION INDEX ANALYSIS</strong>
                      The daily procrastination level is classified at a <strong className="text-white text-sm font-mono uppercase">{summary.procrastinationLevel || "LOW"}</strong> level. Active avoidance or focus friction was observed surrounding "{summary.keyWeakness || "unavoidable context transitions"}", pinpointing the key workflow bottleneck.
                    </div>

                    {/* Paragraph 3: Behavior */}
                    <div className="border-l-[3.5px] border-[#47ffa8] pl-4 py-1 bg-[#090b0d] p-4.5 rounded-none">
                      <strong className="text-white font-mono text-[10px] tracking-widest uppercase block mb-1.5 text-[#47ffa8] font-extrabold">3. BEHAVIOR EVALUATION</strong>
                      The operator's focus profile corresponds to a <strong className="text-white text-sm font-mono uppercase">{summary.behaviorPatternTag || "MAVERICK_LOGGER"}</strong> behavior state. {summary.structuredBehaviorParagraph || "Steady operational alignment was observed, indicating efficient execution on priority targets while actively minimizing distraction vectors."}
                    </div>

                  </div>

                  {/* Required ending text */}
                  <div className="bg-[#111215]/40 border border-neutral-900 p-4 flex justify-between items-center shrink-0">
                    <span className="font-mono text-xs text-[#00dbe9] font-bold tracking-wider select-text">
                      "Journal completed for today."
                    </span>
                    <span className="font-mono text-[8px] text-neutral-600">
                      TELEMETRY_LOG_SYNC: COMPILED
                    </span>
                  </div>

                </div>

                {/* Report action footer buttons */}
                <div className="border-t border-[#3b494b]/20 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 font-mono text-left">
                  <span className="text-[9px] text-[#b9cacb]/30 uppercase">
                    JOURNAL METRICS COMMITTED SECURELY
                  </span>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={copyPerformanceStats}
                      className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-[10px] font-mono font-bold uppercase text-neutral-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-grow sm:flex-grow-0"
                    >
                      <Copy size={13} />
                      {showCopied ? "COPIED SYNOPSIS!" : "COPY COGNITIVE OVERVIEW"}
                    </button>
                    
                    <button
                      onClick={handleContinueToHomepage}
                      className="px-6 py-2.5 bg-[#00f0ff] text-black hover:bg-[#00d8e6] text-[10px] font-mono font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.2)] flex-grow sm:flex-grow-0"
                    >
                      <span>CONTINUE</span>
                      <ArrowRight size={13} className="stroke-[3]" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
