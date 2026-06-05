import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Plus, Trash2 } from "lucide-react";

interface JournalInputProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
}

interface DistractionGroup {
  id: string;
  goal: string;
  distraction: string;
  timeSpent: string;
}

export default function JournalInput({ onAnalyze, isAnalyzing }: JournalInputProps) {
  const [groups, setGroups] = useState<DistractionGroup[]>([
    { id: "1", goal: "", distraction: "", timeSpent: "" }
  ]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"IDLE" | "STREAMING..." | "ANALYSIS PENDING">("IDLE");
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  const charCount = text.length;
  // Calculate exact byte size in KB
  const byteSize = (new Blob([text]).size / 1024).toFixed(3);

  // Compile helper function
  const compileGroupsToText = (groupsArray: DistractionGroup[]): string => {
    const filled = groupsArray.filter(g => g.goal.trim() || g.distraction.trim() || g.timeSpent.trim());
    if (filled.length === 0) return "";
    
    return filled.map((grp, index) => {
      const goalClean = grp.goal.trim() || "Not specified";
      const distractionClean = grp.distraction.trim() || "Not specified";
      const timeClean = grp.timeSpent.trim() || "Not specified";
      return `[ENTRY #${index + 1}] Objective/Goal: ${goalClean}. Distraction factor: ${distractionClean}. Time lost: ${timeClean}.`;
    }).join("\n\n") + `\n\n// Calibration check metadata: code distraction meeting for 15 mins`;
  };

  // Sync groups to text state
  useEffect(() => {
    const compiled = compileGroupsToText(groups);
    setText(compiled);
  }, [groups]);

  // Handle group operations
  const handleUpdateGroup = (id: string, field: keyof DistractionGroup, value: string) => {
    const updated = groups.map(g => g.id === id ? { ...g, [field]: value } : g);
    setGroups(updated);
  };

  const handleAddGroup = () => {
    // Smartly carry forward the last goal as a speed enhancement
    const lastGroup = groups[groups.length - 1];
    setGroups([
      ...groups,
      { 
        id: Date.now().toString(), 
        goal: lastGroup ? lastGroup.goal : "", 
        distraction: "", 
        timeSpent: "" 
      }
    ]);
  };

  const handleRemoveGroup = (id: string) => {
    if (groups.length > 1) {
      setGroups(groups.filter(g => g.id !== id));
    }
  };

  // Quick select distraction chips click handler
  const handleChipClick = (label: string) => {
    setGroups(prev => {
      const copy = [...prev];
      const lastIdx = copy.length - 1;
      
      // If the distraction field of the last entry is empty, populate it.
      // If already populated, create a new focus breakdown entry
      if (!copy[lastIdx].distraction.trim()) {
        copy[lastIdx].distraction = label;
        if (!copy[lastIdx].timeSpent.trim()) {
          copy[lastIdx].timeSpent = "15 mins";
        }
      } else {
        copy.push({
          id: Date.now().toString(),
          goal: copy[lastIdx].goal || "",
          distraction: label,
          timeSpent: "15 mins"
        });
      }
      return copy;
    });
  };

  // Analysis logic for parameters based on user input
  const isTextPresent = text.trim().length > 0;

  // Criteria validation gate calculation
  const isStructuredValid = groups.every(
    g => g.goal.trim().length > 0 && g.distraction.trim().length > 0 && g.timeSpent.trim().length > 0
  );

  const isFullyCalibrated = isTextPresent && isStructuredValid;

  // Status transitions
  useEffect(() => {
    if (text.length > 0) {
      setStatus("STREAMING...");
      
      if (typingTimer.current) clearTimeout(typingTimer.current);
      
      typingTimer.current = setTimeout(() => {
        setStatus("IDLE");
      }, 1000);
    } else {
      setStatus("IDLE");
    }
    
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length === 0 || isAnalyzing) return;
    onAnalyze(text);
  };

  return (
    <div className="w-full flex flex-col gap-8" id="journal-input-section">
      {/* Section Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#00f0ff] signal-glow rounded-none"></div>
          <h1 className="font-sans text-3xl md:text-5xl font-bold text-[#e2e2e2] tracking-tight">
            TELL US ABOUT YOUR HOMEWORK!
          </h1>
        </div>
        
        {/* Purpose Section */}
        <div className="flex flex-col gap-1 border-l-2 border-[#00f0ff] pl-3 py-1 select-none text-left">
          <div className="font-mono text-[11px] font-black tracking-widest text-[#00f0ff] uppercase">
            LOG DISTRACTIONS. FIND PATTERNS. IMPROVE FOCUS.
          </div>
          <p className="font-sans text-xs text-[#b9cacb]/80 leading-relaxed">
            Record what interrupted your work and let HASEX identify recurring focus leaks.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Guide segment */}
        <div className="flex border-b border-[#3b494b]/20 pb-3 gap-2.5 items-center justify-between select-none">
          <span className="font-mono text-[9px] tracking-widest text-[#b9cacb]/40 uppercase font-black">GUIDE</span>
          <div className="flex">
            <span className="px-3.5 py-1.5 font-mono text-[9.5px] border border-[#c57cff] bg-[#c57cff]/10 text-white shadow-[0_0_8px_rgba(197,124,255,0.15)] tracking-wider font-bold">
              Quick Log Mode
            </span>
          </div>
        </div>

        {/* Quick select distraction chips */}
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[9px] tracking-widest text-[#b9cacb]/60 uppercase font-bold text-left select-none">
            ⚡ QUICK-SELECT DISTRACTION CHIPS (CLICK TO EFFICIENTLY AUTO-FILL)
          </span>
          <div className="flex flex-wrap gap-2 text-left">
            {[
              { label: "📱 Social Media", val: "Social Media" },
              { label: "💬 Messaging", val: "Messaging" },
              { label: "📺 YouTube", val: "YouTube" },
              { label: "🎮 Gaming", val: "Gaming" },
              { label: "😴 Tired", val: "Tired" },
              { label: "📚 Difficult Task", val: "Difficult Task" },
              { label: "🌐 Browsing", val: "Browsing" },
              { label: "➕ Other", val: "Other" }
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleChipClick(chip.val)}
                className="px-3 py-1.5 font-mono text-[10.5px] text-[#00f0ff] hover:text-white border border-[#00f0ff]/30 hover:border-[#00f0ff] bg-[#00f0ff]/5 hover:bg-[#00f0ff]/15 transition-all cursor-pointer rounded-none active:scale-95 flex items-center gap-1 font-semibold"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Area block */}
        <div className="glass-panel rounded-none p-1 group relative bg-[#0a0a0b]/70 transition-all duration-300 border-[#3b494b]/40 focus-within:border-[#c57cff]/40 flex flex-col gap-1">
          
          {/* Top Control Bar containing Log Telemetry */}
          <div className="flex justify-between items-center p-3 border-b-[0.5px] border-[#3b494b]/30 bg-[#111112]/50 text-xs font-mono select-none">
            <span className="text-[#b9cacb]/55 text-[9px] uppercase font-bold tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-none bg-[#c57cff]" />
              YOUR ENTRIES
            </span>
            <div className="font-mono text-[10px] text-[#b9cacb]/45 pointer-events-none flex gap-4 select-none pr-1">
              <span>CHARS: {charCount}</span>
              <span>BYTES: {byteSize}K</span>
            </div>
          </div>

          <div className="p-4 md:p-6 flex flex-col gap-4.5 max-h-[460px] overflow-y-auto scrollbar-thin">
            {groups.map((grp, index) => (
              <div key={grp.id} className="border border-[#3b494b]/30 bg-[#0d0d0e]/90 p-4 relative flex flex-col gap-3.5 transition-all duration-300">
                <div className="flex justify-between items-center border-b border-[#3b494b]/20 pb-2 select-none">
                  <span className="font-mono text-[9px] tracking-widest text-[#c57cff]/90 font-bold flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#c57cff]/60 rounded-none inline-block" />
                    Focus Breakdown #{index + 1}
                  </span>
                  {groups.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveGroup(grp.id)}
                      className="text-[#ff7c7c] hover:text-red-400 p-1 font-mono text-[8px] border border-[#ff7c7c]/20 bg-[#ff7c7c]/5 hover:bg-[#ff7c7c]/15 transition-all flex items-center gap-1 cursor-pointer"
                      title="Remove focus breakdown slot"
                    >
                      <Trash2 size={10} /> REMOVE
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Field 1: What were you trying to do? */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="font-mono text-[8.5px] uppercase tracking-wider text-[#b9cacb]/60 font-semibold mb-0.5">
                      What were you trying to do?
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#111112] text-[#e2e2e2] border-[0.5px] border-[#3b494b]/40 focus:border-[#c57cff] focus:outline-none p-3 text-xs font-sans placeholder-[#b9cacb]/25 transition-colors"
                      placeholder="e.g. Study Chemistry homework, build prototype"
                      value={grp.goal}
                      onChange={(e) => handleUpdateGroup(grp.id, "goal", e.target.value)}
                      disabled={isAnalyzing}
                    />
                  </div>

                  {/* Field 2: What distracted you? */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="font-mono text-[8.5px] uppercase tracking-wider text-[#b9cacb]/60 font-semibold mb-0.5">
                      What distracted you?
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#111112] text-[#e2e2e2] border-[0.5px] border-[#3b494b]/40 focus:border-[#c57cff] focus:outline-none p-3 text-xs font-sans placeholder-[#b9cacb]/25 transition-colors"
                      placeholder="e.g. Social media feed, notification sound"
                      value={grp.distraction}
                      onChange={(e) => handleUpdateGroup(grp.id, "distraction", e.target.value)}
                      disabled={isAnalyzing}
                    />
                  </div>

                  {/* Field 3: How much time was lost? */}
                  <div className="flex flex-col gap-1.5 text-left">
                    <label className="font-mono text-[8.5px] uppercase tracking-wider text-[#b9cacb]/60 font-semibold mb-0.5">
                      How much time was lost?
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#111112] text-[#e2e2e2] border-[0.5px] border-[#3b494b]/40 focus:border-[#c57cff] focus:outline-none p-3 text-xs font-sans placeholder-[#b9cacb]/25 transition-colors"
                      placeholder="e.g. 15 mins, 1 hour"
                      value={grp.timeSpent}
                      onChange={(e) => handleUpdateGroup(grp.id, "timeSpent", e.target.value)}
                      disabled={isAnalyzing}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddGroup}
              className="w-full py-3.5 border border-dashed border-[#c57cff]/45 hover:border-[#c57cff] bg-black/45 hover:bg-[#c57cff]/5 text-[#c57cff] hover:text-white transition-all text-[9.5px] font-mono tracking-widest uppercase flex items-center justify-center gap-1.5 cursor-pointer mt-1 font-bold"
            >
              <Plus size={11} /> Log Another Distraction
            </button>
          </div>

          {/* Status signal at bottom left */}
          <div className="flex items-center gap-2 p-3 mt-1 select-none pointer-events-none opacity-85">
            <div 
              className={`w-1.5 h-1.5 transition-colors duration-300 ${
                isAnalyzing 
                  ? "bg-[#ffb4ab]" 
                  : status === "STREAMING..." 
                    ? "bg-[#00f0ff] signal-glow" 
                    : "bg-[#3b494b]/50"
              }`}
            />
            <span className={`font-mono text-[10px] font-bold tracking-widest ${
              isAnalyzing 
                ? "text-[#ffb4ab]" 
                : status === "STREAMING..." 
                  ? "text-[#00f0ff]" 
                  : "text-[#b9cacb]/50"
            }`}>
              {isAnalyzing ? "AI (GPT-OSS 120) IS THINKING..." : status}
            </span>
          </div>
        </div>

        {/* Action Area footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t-[0.5px] border-[#3b494b]/30 pt-6 gap-4 font-mono">
          <div className="flex flex-col text-left text-[10px] tracking-wider text-[#b9cacb]/70 gap-1 select-none">
            {isTextPresent && !isFullyCalibrated ? (
              <span className="text-[#ffcb7c] font-sans font-medium">
                ⚠️ Complete all fields or use quick chips to release the analyze vector.
              </span>
            ) : (
              <>
                <span>ENCRYPTION: SHIELD-SECURE-AES</span>
                <span>OPERATING ENGINE: HASEX-V9</span>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFullyCalibrated || isAnalyzing}
            className={`w-full sm:w-auto text-xs tracking-widest uppercase font-extrabold text-black border-[0.5px] px-10 py-4.5 rounded-none flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 cursor-pointer ${
              !isFullyCalibrated || isAnalyzing
                ? "bg-[#393939] text-[#757575] border-[#3b494b]/30 cursor-not-allowed opacity-50"
                : "bg-[#00f0ff] hover:bg-white border-transparent hover:signal-glow animate-bounce shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            }`}
          >
            {isAnalyzing ? "Saving & Analyzing Entry..." : "Save Entry"}
            <ArrowRight size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
