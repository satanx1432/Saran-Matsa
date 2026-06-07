import React, { useState } from "react";
import { ArrowRight, Sparkles, HelpCircle } from "lucide-react";

interface JournalInputProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
}

export default function JournalInput({ onAnalyze, isAnalyzing }: JournalInputProps) {
  const [goal, setGoal] = useState("");
  const [distraction, setDistraction] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [learning, setLearning] = useState("");
  const [validationError, setValidationError] = useState("");

  // Compile individual inputs to a highly structured raw format for the analyzer
  const compileToText = (): string => {
    return `What were you trying to accomplish: ${goal.trim()}
What slowed you down: ${distraction.trim()}
How much time was affected: ${timeSpent.trim()}
Anything important you learned: ${learning.trim()}`;
  };

  const compiledText = compileToText();
  const charCount = compiledText.length;
  const byteSize = (new Blob([compiledText]).size / 1024).toFixed(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      goal.trim().length === 0 ||
      distraction.trim().length === 0 ||
      timeSpent.trim().length === 0 ||
      learning.trim().length === 0
    ) {
      setValidationError("All reflection fields are mandatory. Please fill in each question to save.");
      return;
    }

    setValidationError("");
    onAnalyze(compiledText);
  };

  const isFormValid =
    goal.trim().length > 0 &&
    distraction.trim().length > 0 &&
    timeSpent.trim().length > 0 &&
    learning.trim().length > 0;

  return (
    <div className="w-full flex flex-col gap-6" id="section-1-daily-reflection-input">
      {/* Redesigned Section 1: Daily Reflection Header */}
      <div className="flex flex-col gap-3 py-1 text-left">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#00f0ff] signal-glow rounded-none"></div>
          <span className="font-mono text-xs text-[#00f0ff] font-extrabold uppercase tracking-widest block">
            SECTION 1 // DAILY REFLECTION
          </span>
        </div>
        <h1 className="font-sans text-2xl md:text-4xl font-extrabold text-white tracking-tight">
          WORK REFLECTION JOURNAL
        </h1>
        <p className="font-sans text-xs text-[#b9cacb]/85 leading-relaxed max-w-2xl mt-0.5">
          Record what you were aiming to do versus what actual barriers interrupted your progress. HASEX builds a long-term behavioral model based on these facts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
        {validationError && (
          <div className="bg-[#590009]/30 border-[0.5px] border-[#ff7c7c]/40 text-[#ffb4ab] p-3 text-xs font-mono">
            {validationError}
          </div>
        )}

        {/* Outer panel container */}
        <div className="glass-panel rounded-none p-5 md:p-6 bg-[#0a0a0b]/80 border-[#3b494b]/30 flex flex-col gap-5">
          
          {/* Metadata banner */}
          <div className="flex justify-between items-center border-b-[0.5px] border-[#3b494b]/20 pb-3 font-mono text-[9px] text-[#b9cacb]/45 select-none pr-1">
            <span className="text-[#00f0ff] uppercase font-bold tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-none bg-[#00f0ff] animate-pulse" />
              Direct Reflection Feed
            </span>
            <div className="flex gap-4">
              <span>CHARS: {charCount}</span>
              <span>BYTES: {byteSize}K</span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* Question 1: Goal */}
            <div className="flex flex-col gap-2" id="reflection-field-goal">
              <label className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
                <span>1. What were you trying to accomplish? *</span>
              </label>
              <textarea
                rows={2}
                className="w-full bg-[#111112] text-[#e2e2e2] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] focus:outline-none p-3 text-xs sm:text-sm font-sans placeholder-[#b9cacb]/25 transition-colors rounded-none"
                placeholder="e.g. Study physics homework assignment for tomorrows class exam"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>

            {/* Question 2: Distraction */}
            <div className="flex flex-col gap-2" id="reflection-field-distraction">
              <label className="font-sans text-xs font-bold text-white">
                2. What slowed you down? (Obstacles / Distractions) *
              </label>
              <textarea
                rows={2}
                className="w-full bg-[#111112] text-[#e2e2e2] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] focus:outline-none p-3 text-xs sm:text-sm font-sans placeholder-[#b9cacb]/25 transition-colors rounded-none"
                placeholder="e.g. Phone notifications from social chat groups kept chiming"
                value={distraction}
                onChange={(e) => setDistraction(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>

            {/* Question 3: Time Spent */}
            <div className="flex flex-col gap-2" id="reflection-field-timeSpent">
              <label className="font-sans text-xs font-bold text-white">
                3. How much time was affected? (Minutes / Hours) *
              </label>
              <input
                type="text"
                className="w-full bg-[#111112] text-[#e2e2e2] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] focus:outline-none p-3 text-xs sm:text-sm font-sans placeholder-[#b9cacb]/25 transition-colors rounded-none"
                placeholder="e.g. 15 minutes, 30 mins, 1 hour"
                value={timeSpent}
                onChange={(e) => setTimeSpent(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>

            {/* Question 4: Learning */}
            <div className="flex flex-col gap-2" id="reflection-field-learning">
              <label className="font-sans text-xs font-bold text-white">
                4. Anything important you learned? *
              </label>
              <textarea
                rows={2}
                className="w-full bg-[#111112] text-[#e2e2e2] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] focus:outline-none p-3 text-xs sm:text-sm font-sans placeholder-[#b9cacb]/25 transition-colors rounded-none"
                placeholder="e.g. Keeping the phone in a different drawer is mandatory to protect study blocks"
                value={learning}
                onChange={(e) => setLearning(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>
          </div>
        </div>

        {/* Footer actions bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t-[0.5px] border-[#3b494b]/20 pt-5 gap-4">
          <div className="flex flex-col font-mono text-[9px] text-[#b9cacb]/60 leading-normal">
            <span>MODEL ENGINE // HASEX-VECTOR V9</span>
            <span>SECURE OFFLINE SYSTEM DECRYPTION ACTIVE</span>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isAnalyzing}
            className={`w-full sm:w-auto text-xs font-mono tracking-widest uppercase font-extrabold px-10 py-4.2 cursor-pointer transition-all duration-300 rounded-none flex items-center justify-center gap-2 active:scale-95 ${
              !isFormValid || isAnalyzing
                ? "bg-[#252528] text-neutral-600 border border-[#3b494b]/30 cursor-not-allowed opacity-50"
                : "bg-[#00f0ff] hover:bg-white text-black hover:signal-glow shadow-[0_0_15px_rgba(0,240,255,0.35)]"
            }`}
          >
            {isAnalyzing ? "Saving Reflection..." : "Save Reflection"}
            <ArrowRight size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}
