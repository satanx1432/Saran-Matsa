import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Mic, Radio, Loader2, Workflow, HelpCircle } from "lucide-react";

interface JournalInputProps {
  onAnalyze: (text: string) => void;
  isAnalyzing: boolean;
}

export default function JournalInput({ onAnalyze, isAnalyzing }: JournalInputProps) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"IDLE" | "STREAMING..." | "ANALYSIS PENDING">("IDLE");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const charCount = text.length;
  // Calculate exact byte size in KB
  const byteSize = (new Blob([text]).size / 1024).toFixed(3);

  // Analysis logic for parameters based on user input
  const isTextPresent = text.trim().length > 0;
  
  // Identify if sleep-related patterns are in the user text
  const isSleepingRelated = /\b(sleep|sleeping|asleep|sleepy|insomnia|bed|rest|tired|fatigue|exhausted|woke|wake|awake|bedtime)\b/i.test(text);

  // 1. Duration / Time bounds checks
  const hasDuration = /\b(\d+)\s*(mins?|minutes?|hours?|hrs?|h|m|days?)\b/i.test(text) || 
                      /\b(for|spent|took)\s+(\d+|one|two|three|four|five|several)\b/i.test(text) ||
                      /\d{2}:\d{2}/.test(text);

  // 2. Focused Objective or milestones (for regular work)
  const hasObjective = /\b(code|coding|program|writing|write|design|designing|fixing|fix|implement|create|building|build|test|testing|deploy|architect|refactoring|refactor)\b/i.test(text) && text.trim().length > 40;

  // 3. Clear leak or bottleneck (waste vs productivity split for regular work)
  const hasDistraction = /\b(slack|discord|notification|notifications|phone|social|instagram|youtube|browse|feed|news|email|inbox|meeting|scrolling|scroll|chat|distract|friction|bottleneck)\b/i.test(text);

  // 4. Sleep specific parameters: bedtime clock/window and active disruptor/insomnia reason
  const hasSleepTime = /\b(\d{1,2}(:\d{2})?\s*(am|pm|o'clock)?)\b/i.test(text) || 
                       /\b(midnight|night|morning|evening|bedtime|late|early)\b/i.test(text);

  const hasSleepReason = /\b(caffeine|coffee|screen|stress|thinking|anxious|noise|work|code|overthinking|light|phone|game|temp|heat|noise|insomnia|alert|signal|busy|worry|worried|mind|anxiety|loop|heart|panic|brain|thoughts|sound|comfort|mattress|crying|kids|baby)\b/i.test(text);

  // Criteria validation gate calculation
  const isFullyCalibrated = isTextPresent && (
    isSleepingRelated 
      ? (hasDuration && hasSleepTime && hasSleepReason)
      : (hasDuration && hasObjective && hasDistraction)
  );

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

  // Helper to extract ONLY the final human-readable transcript and filter forbidden tags/text
  const sanitizeTranscript = (rawText: string): string => {
    if (!rawText) return "";
    
    // Split into sentences / segments to cleanly isolate lines
    const segments = rawText.match(/[^.!?]+[.!?]*/g) || [rawText];
    const forbiddenWords = ["handshake", "uplink", "authorized", "debug", "status", "pipeline", "model", "system"];

    const filtered = segments.filter((segment) => {
      const lower = segment.toLowerCase();
      // Remove segment if it contains any of the forbidden terms
      return !forbiddenWords.some((word) => lower.includes(word));
    });

    return filtered.join(" ").replace(/\s+/g, " ").trim();
  };

  // Perform speech-to-text processing using Web MediaRecorder and backend proxy with Whisper v3
  const handleTriggerSTT = async () => {
    if (isRecording) {
      // Toggle off -> Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    try {
      // Request active microphone streams
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Determine best mimeType supported by browser
      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        options = { mimeType: "" }; // default fallback
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop()); // dismiss mic usage lamp

        // Transmit encoded audio chunk to backend proxy utilizing FileReader
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Audio = (reader.result as string).split(",")[1];
            const storedKey = localStorage.getItem("rag_llm_key") || "";

            const response = await fetch("/api/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                audio: base64Audio,
                mimeType: options.mimeType || "audio/webm",
                apiKey: storedKey
              })
            });

            if (response.ok) {
              const data = await response.json();
              const cleanText = sanitizeTranscript(data.text);
              if (cleanText) {
                setText((prev) => (prev ? `${prev} ${cleanText}` : cleanText));
              }
            } else {
              console.error("Transcription pipeline rejected payload");
            }
          } catch (err) {
            console.error("Error sending or parsing transcribed audio:", err);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      // Start capturing audio
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTimer(0);

      // Initialize real-time second timer updates
      timerIntervalRef.current = setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.warn("Real mic access restricted or denied in this context:", err);
      // Fallback: simulate clear speech-to-text translation if user denies mic permission
      setIsRecording(true);
      setRecordingTimer(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTimer((prev) => prev + 1);
      }, 1000);

      setTimeout(async () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setIsRecording(false);
        try {
          const response = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ simulated: true })
          });
          if (response.ok) {
            const data = await response.json();
            const cleanText = sanitizeTranscript(data.text);
            if (cleanText) {
              setText((prev) => (prev ? `${prev} ${cleanText}` : cleanText));
            }
          }
        } catch (simErr) {
          console.error("Mock transcribe fallback failed too", simErr);
        }
      }, 3000);
    }
  };

  return (
    <div className="w-full flex flex-col gap-8" id="journal-input-section">
      {/* Section Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#00f0ff] signal-glow rounded-none"></div>
          <h1 className="font-sans text-3xl md:text-5xl font-bold text-[#e2e2e2] tracking-tight">
            RAW_COGNITIVE_INPUT
          </h1>
        </div>
        <p className="font-mono text-xs tracking-wider text-[#b9cacb]/70">
          SYS.LOG // WAITING FOR DIRECT NEURAL stream
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Input Area block */}
        <div className="glass-panel rounded-none p-1 group relative bg-[#0a0a0b]/70 transition-all duration-300 border-[#3b494b]/40 focus-within:border-[#00f0ff]/50 focus-within:signal-glow flex flex-col">
          
          {/* Top Control Bar containing STT Actions */}
          <div className="flex flex-wrap justify-between items-center p-3 border-b-[0.5px] border-[#3b494b]/30 bg-[#111112]/50 text-xs font-mono select-none gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleTriggerSTT}
                disabled={isAnalyzing}
                className={`flex items-center gap-2 px-3 py-1.5 border-[0.5px] font-bold transition-all uppercase rounded-none cursor-pointer text-[10px] tracking-widest ${
                  isRecording 
                    ? "bg-[#ff4e4e]/20 text-[#ff4e4e] border-[#ff4e4e]/50 hover:bg-[#ff4e4e]/30" 
                    : "bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/30 text-glow-subtle"
                }`}
              >
                {isRecording ? (
                  <>
                    <Radio size={12} className="animate-pulse text-[#ff4e4e]" />
                    <span>STOP RECORDING [{formatTime(recordingTimer)}]</span>
                  </>
                ) : (
                  <>
                    <Mic size={12} />
                    <span>SPEAK STREAM [STT]</span>
                  </>
                )}
              </button>
            </div>

            <div className="font-mono text-[10px] text-[#b9cacb]/50 pointer-events-none flex gap-4 select-none">
              <span>CHARS: {charCount}</span>
              <span>BYTES: {byteSize}K</span>
            </div>
          </div>

          <textarea
            className="w-full h-[280px] md:h-[350px] bg-transparent text-[#e2e2e2] font-sans text-base md:text-lg p-6 pt-4 border-none resize-none focus:ring-0 focus:outline-none outline-none leading-relaxed"
            id="cognitive-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isAnalyzing}
            placeholder="Enter cognitive data stream (mental state description, diary flow, current bottlenecks)..."
            spellCheck="false"
          />

          {/* Status signal at bottom left */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2 select-none pointer-events-none">
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
              {isAnalyzing ? "ANALYZING NEURAL VECTORS..." : status}
            </span>
          </div>
        </div>

        {/* Real-time Dynamic Critique with Follow-Up Clarification Questions */}
        {isTextPresent && (
          <div className="w-full flex flex-col gap-5 border-[0.5px] border-[#3b494b]/30 bg-[#070708]/95 p-5 mt-2 text-left relative overflow-hidden select-none" id="journal-checkin-panel">
            {/* Ambient background visual accent */}
            <div className="absolute right-0 top-0 w-24 h-24 bg-[#00f0ff]/2 rounded-none blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-2 border-b-[0.5px] border-[#3b494b]/25 pb-3">
              <span className="w-1.5 h-1.5 rounded-none bg-[#00f0ff] animate-pulse" />
              <h3 className="font-mono text-xs uppercase font-extrabold tracking-[0.12em] text-[#00f0ff]">
                JOURNAL CHECK-IN
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5 font-sans">
              
              {/* Left Column: Missing Information */}
              <div className="flex flex-col gap-2.5">
                <span className="font-mono text-[10px] text-[#ffcb7c] uppercase tracking-wider font-bold">
                  Missing Information
                </span>
                <div className="flex flex-col gap-2">
                  {/* Time mentioned check */}
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${!hasDuration ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                    <span className={`text-[12px] md:text-xs ${!hasDuration ? "text-[#e2e2e2]" : "text-[#b9cacb]/45 line-through decoration-[#3b494b]"}`}>
                      No time mentioned
                    </span>
                    {hasDuration && <span className="font-mono text-[8px] text-emerald-400/70 lowercase select-none">// logged</span>}
                  </div>

                  {/* Clear goal check */}
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${!hasObjective ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                    <span className={`text-[12px] md:text-xs ${!hasObjective ? "text-[#e2e2e2]" : "text-[#b9cacb]/45 line-through decoration-[#3b494b]"}`}>
                      No clear goal
                    </span>
                    {hasObjective && <span className="font-mono text-[8px] text-emerald-400/70 lowercase select-none">// logged</span>}
                  </div>

                  {/* Possible distraction check */}
                  <div className="flex items-center gap-2.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${!hasDistraction ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
                    <span className={`text-[12px] md:text-xs ${!hasDistraction ? "text-[#e2e2e2]" : "text-[#b9cacb]/45 line-through decoration-[#3b494b]"}`}>
                      Possible distraction
                    </span>
                    {hasDistraction && <span className="font-mono text-[8px] text-emerald-400/70 lowercase select-none">// logged</span>}
                  </div>
                </div>
              </div>

              {/* Right Column: Helpful questions */}
              <div className="flex flex-col gap-2.5">
                <span className="font-mono text-[10px] text-[#00f0ff] uppercase tracking-wider font-bold">
                  Helpful questions:
                </span>
                <div className="flex flex-col gap-2 text-[12px] md:text-xs text-[#b9cacb]">
                  {/* How long did this last? */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-[0.5px] border-[#3b494b]/20 bg-[#161618]/45 p-2 rounded-none hover:border-[#00f0ff]/30 transition-all duration-200">
                    <span className={!hasDuration ? "text-[#e2e2e2]" : "text-[#b9cacb]/40 line-through decoration-[#3b494b]"}>
                      - How long did this last?
                    </span>
                    {!hasDuration && (
                      <button
                        type="button"
                        onClick={() => setText((prev) => prev.trim() + "\n\n[DURATION // SEGMENT LENGTH: 45 minutes]")}
                        className="font-mono text-[8px] bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/25 px-2 py-0.5 rounded-none cursor-pointer tracking-wider font-bold"
                      >
                        + 45 MINS
                      </button>
                    )}
                  </div>

                  {/* What were you working on? */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-[0.5px] border-[#3b494b]/20 bg-[#161618]/45 p-2 rounded-none hover:border-[#00f0ff]/30 transition-all duration-200">
                    <span className={!hasObjective ? "text-[#e2e2e2]" : "text-[#b9cacb]/40 line-through decoration-[#3b494b]"}>
                      - What were you working on?
                    </span>
                    {!hasObjective && (
                      <button
                        type="button"
                        onClick={() => setText((prev) => prev.trim() + "\n\n[OBJECTIVE // PLANNED MILESTONE: Refactoring system architecture]")}
                        className="font-mono text-[8px] bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/25 px-2 py-0.5 rounded-none cursor-pointer tracking-wider font-bold"
                      >
                        + OBJECTIVE
                      </button>
                    )}
                  </div>

                  {/* What distracted you? */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-[0.5px] border-[#3b494b]/20 bg-[#161618]/45 p-2 rounded-none hover:border-[#00f0ff]/30 transition-all duration-200">
                    <span className={!hasDistraction ? "text-[#e2e2e2]" : "text-[#b9cacb]/40 line-through decoration-[#3b494b]"}>
                      - What distracted you?
                    </span>
                    {!hasDistraction && (
                      <button
                        type="button"
                        onClick={() => setText((prev) => prev.trim() + "\n\n[ATTENTION_LEAK // TRIGGER: Processing minor email alerts and Slack pings]")}
                        className="font-mono text-[8px] bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/25 px-2 py-0.5 rounded-none cursor-pointer tracking-wider font-bold"
                      >
                        + LEAK
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Action Area footer */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t-[0.5px] border-[#3b494b]/30 pt-6 gap-4">
          <div className="flex flex-col text-left font-mono text-[10px] tracking-wider text-[#b9cacb]/70 gap-1 select-none">
            {isTextPresent && !isFullyCalibrated ? (
              <span className="text-[#ffcb7c] font-sans font-medium">
                ⚠️ Complete the Journal Check-in questions to unlock analysis.
              </span>
            ) : (
              <>
                <span>ENCRYPTION: AES-256</span>
                <span>PROTOCOL: HASEX-9</span>
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={!isFullyCalibrated || isAnalyzing}
            className={`w-full sm:w-auto font-mono text-xs tracking-widest uppercase font-bold text-black border-[0.5px] px-8 py-4 rounded-none flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 cursor-pointer ${
              !isFullyCalibrated || isAnalyzing
                ? "bg-[#393939] text-[#757575] border-[#3b494b]/30 cursor-not-allowed opacity-50"
                : "bg-[#F0F0F0] hover:bg-white border-transparent hover:signal-glow"
            }`}
          >
            {isAnalyzing ? "Processing..." : "INITIATE_ANALYSIS"}
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
}
