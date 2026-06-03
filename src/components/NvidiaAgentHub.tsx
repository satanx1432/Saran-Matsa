import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { Bot, X, Send, Cpu, Sliders, RefreshCw, AlertCircle, Sparkles, Check, Paperclip, Image as ImageIcon, FileImage } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
  model?: string;
}

export default function NvidiaAgentHub() {
  const [isOpen, setIsOpen] = useState(false);
  const [showKeysConfig, setShowKeysConfig] = useState(false);
  const [embeddingKey, setEmbeddingKey] = useState(() => localStorage.getItem("rag_embedding_key") || "");
  const [vectorDbKey, setVectorDbKey] = useState(() => localStorage.getItem("rag_vector_db_key") || "");
  const [llmKey, setLlmKey] = useState(() => localStorage.getItem("rag_llm_key") || "");
  const [activeMode, setActiveMode] = useState<"brainstorm" | "journal" | "code" | "research" | "fast">("brainstorm");
  const [showModelMatrix, setShowModelMatrix] = useState(false);

  // Cognitive image & file/document attachment support states
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const [attachedDocContent, setAttachedDocContent] = useState<string | null>(null);
  const [attachedDocName, setAttachedDocName] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("rag_embedding_key", embeddingKey);
  }, [embeddingKey]);

  useEffect(() => {
    localStorage.setItem("rag_vector_db_key", vectorDbKey);
  }, [vectorDbKey]);

  useEffect(() => {
    localStorage.setItem("rag_llm_key", llmKey);
  }, [llmKey]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `### HASEX AI // ONLINE

I am HASEX AI, an execution-first intelligence designed to maximize clarity and direct action.

Select your mode above (Brainstorm or Journal) and state your immediate task or challenge below. Let's begin.`
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isPending, setIsPending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleImageUploadChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
        setAttachedImageName(file.name);
        setAttachedDocContent(null);
        setAttachedDocName(null);
        setShowAttachmentMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocUploadChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedDocContent(reader.result as string);
        setAttachedDocName(file.name);
        setAttachedImage(null);
        setAttachedImageName(null);
        setShowAttachmentMenu(false);
      };
      reader.readAsText(file);
    }
  };

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isPending) return;

    const documentAttached = !!attachedDocContent;

    const userMessageContent = attachedDocContent
      ? `${inputValue}\n\n[ATTACHED FILE: ${attachedDocName}]\n\`\`\`\n${attachedDocContent}\n\`\`\``
      : inputValue;

    const userMessage: Message = { 
      role: "user", 
      content: userMessageContent,
      image: attachedImage || undefined
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setAttachedImage(null);
    setAttachedImageName(null);
    setAttachedDocContent(null);
    setAttachedDocName(null);
    setShowAttachmentMenu(false);
    setIsPending(true);

    try {
      const response = await fetch("/api/nvidia-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          rag_embedding_key: embeddingKey,
          rag_vector_db_key: vectorDbKey,
          rag_llm_key: llmKey,
          mode: activeMode,
          hasImage: !!userMessage.image,
          hasDoc: documentAttached
        })
      });

      if (!response.ok) {
        throw new Error(`Uplink fault: ${response.statusText}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.content, model: data.model }
      ]);

      // SMS background dispatch removed
    } catch (err: any) {
      console.error("HASEX_OS // Error communicating with NVIDIA NIM endpoint:", err);
      const errorContent = `### [SYSTEM DECRYPTION FAULT] // CORRUPTED VALUE
          
Failed to complete handshake transaction with the NVIDIA NIM API.

* **Trigger:** \`${err?.message || "CONN_TIMEOUT"}\`
* **Local Fallback:** Please check if your \`NVIDIA_API_KEY\` is accurately registered in the AI Studio environment variables panel.`;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorContent
        }
      ]);

      // SMS background dispatch removed
    } finally {
      setIsPending(false);
    }
  };

  const handleResetHandshake = () => {
    setMessages([
      {
        role: "assistant",
        content: `### [NEXUS CORE RESET] // REBOOTED

Handshake renegotiated. Network cache flushed. Ready to stream cognitive vectors.`
      }
    ]);
  };

  return (
    <div className="fixed z-90 bottom-24 right-5 sm:bottom-28 sm:right-8" id="nvidia-agent-container">
      {/* 
        ========================================================================
        EXACT SPECIFICATION BOUNDS ENFORCED BY THE OPERATOR:
        ========================================================================
        - Desktop:
          * Outer visible circle: 64px x 64px (w-16 h-16)
          * Inner active icon area: 24px (size={24})
          * Hit area (invisible): at least 72px x 72px (w-[72px] h-[72px])
        - Mobile:
          * 56px x 56px (w-14 h-14)
          * Inner active icon area: 24px (size={24})
        ========================================================================
      */}
      <div className="relative group flex items-center justify-center">
        {/* Invisible Hit Area Container - guarantees at least 72px x 72px for elite touch target experience */}
        <div className="w-[72px] h-[72px] flex items-center justify-center select-none pointer-events-auto">
          <button
            onClick={() => setIsOpen(!isOpen)}
            id="nvidia-agent-trigger-node"
            aria-label="Toggle NVIDIA AI Agent Node"
            className="rounded-full bg-[#111111] hover:bg-[#161617] border-[0.5px] border-[#00f0ff]/50 hover:border-[#00f0ff] text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center relative
              w-14 h-14 md:w-16 md:h-16" 
          >
            {/* Ambient holographic pulse wave decorator ring */}
            <div className="absolute inset-0 rounded-full border border-[#00f0ff]/10 animate-ping duration-1000 opacity-60 pointer-events-none" />

            {/* Neural center core active icon strictly set to 24px */}
            <Cpu size={24} className={`transition-transform duration-500 ${isOpen ? "rotate-90 text-[#ffb4ab]" : "animate-pulse"}`} />

            {/* Micro active indicator badge */}
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#00f0ff] border border-[#111] animate-pulse rounded-full" />
          </button>
        </div>

        {/* Hover tooltips */}
        {!isOpen && (
          <span className="absolute right-[80px] bg-[#0c0c0e] border-[0.5px] border-[#00f0ff]/30 text-[#00f0ff] font-mono text-[10px] tracking-widest px-3 py-1.5 whitespace-nowrap shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none uppercase">
            HASEX_ASSISTANT
          </span>
        )}
      </div>

      {/* Cyberpunk Slide-out Drawer Panel Console */}
      {isOpen && (
        <div 
          className="fixed bottom-[104px] right-4 sm:right-8 w-[calc(100vw-32px)] sm:w-[420px] h-[550px] max-h-[70vh] bg-[#070708]/95 border-[0.5px] border-[#00f0ff]/40 shadow-[0_10px_50px_rgba(0,0,0,0.95)] flex flex-col z-100 animate-scale-up"
          id="nvidia-agent-drawer-panel"
        >
          {/* Interface Header */}
          <div className="p-4 bg-[#111112] border-b-[0.5px] border-[#3b494b]/40 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#00f0ff]/10 border-[0.5px] border-[#00f0ff]/30 text-[#00f0ff]">
                <Cpu size={14} className="animate-spin duration-5000" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] tracking-widest text-[#00f0ff] font-bold uppercase leading-none">
                  HASEX ASSISTANT
                </span>
                <span className="font-sans text-xs font-semibold text-white mt-1 leading-none">
                  Beta v0.1
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetHandshake}
                title="Reset conversation stream"
                className="p-1.5 text-[#b9cacb]/50 hover:text-white hover:bg-[#1f1f21] border-[0.5px] border-transparent transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw size={13} />
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#b9cacb]/50 hover:text-[#ffb4ab] hover:bg-[#1f1f21] border-[0.5px] border-transparent transition-all cursor-pointer active:scale-95"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Mode Selection Switcher */}
          <div className="px-4 py-3 bg-[#0d0d0f] border-b-[0.5px] border-[#3b494b]/30 flex flex-col gap-2.5">
            {/* Horizontal Scrollable Mode Selector Switcher */}
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-[#3b494b]/40 scrollbar-track-transparent select-none font-mono text-[9px] w-full">
              <button
                type="button"
                onClick={() => setActiveMode("brainstorm")}
                className={`py-1 px-2 border-[0.5px] transition-all uppercase rounded-none text-center font-bold cursor-pointer flex flex-col items-center justify-center gap-0.5 w-[125px] h-[48px] flex-shrink-0 ${
                  activeMode === "brainstorm"
                    ? "bg-[#ffcb7c]/10 text-[#ffcb7c] border-[#ffcb7c]"
                    : "bg-[#0c0c0d] text-[#b9cacb]/50 border-transparent hover:border-[#ffcb7c]/30 hover:text-white"
                }`}
              >
                <span className="font-bold tracking-wider">BRAINSTORM</span>
                <span className="text-[7px] font-sans lowercase leading-none opacity-80 font-normal">strategy & idea</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("journal")}
                className={`py-1 px-2 border-[0.5px] transition-all uppercase rounded-none text-center font-bold cursor-pointer flex flex-col items-center justify-center gap-0.5 w-[125px] h-[48px] flex-shrink-0 ${
                  activeMode === "journal"
                    ? "bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]"
                    : "bg-[#0c0c0d] text-[#b9cacb]/50 border-transparent hover:border-[#00f0ff]/30 hover:text-white"
                }`}
              >
                <span className="font-bold tracking-wider">JOURNAL</span>
                <span className="text-[7px] font-sans lowercase leading-none opacity-80 font-normal">focus & reflection</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("code")}
                className={`py-1 px-2 border-[0.5px] transition-all uppercase rounded-none text-center font-bold cursor-pointer flex flex-col items-center justify-center gap-0.5 w-[125px] h-[48px] flex-shrink-0 ${
                  activeMode === "code"
                    ? "bg-[#ff7c7c]/10 text-[#ff7c7c] border-[#ff7c7c]"
                    : "bg-[#0c0c0d] text-[#b9cacb]/50 border-transparent hover:border-[#ff7c7c]/30 hover:text-white"
                }`}
              >
                <span className="font-bold tracking-wider">CODE MODE</span>
                <span className="text-[7px] font-sans lowercase leading-none opacity-80 font-normal">coding assistant</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("research")}
                className={`py-1 px-2 border-[0.5px] transition-all uppercase rounded-none text-center font-bold cursor-pointer flex flex-col items-center justify-center gap-0.5 w-[125px] h-[48px] flex-shrink-0 ${
                  activeMode === "research"
                    ? "bg-[#c57cff]/10 text-[#c57cff] border-[#c57cff]"
                    : "bg-[#0c0c0d] text-[#b9cacb]/50 border-[#3b494b]/10 hover:border-[#c57cff]/30 hover:text-white"
                }`}
              >
                <span className="font-bold tracking-wider">RESEARCH</span>
                <span className="text-[7px] font-sans lowercase leading-none opacity-80 font-normal">deep intelligence</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMode("fast")}
                className={`py-1 px-2 border-[0.5px] transition-all uppercase rounded-none text-center font-bold cursor-pointer flex flex-col items-center justify-center gap-0.5 w-[125px] h-[48px] flex-shrink-0 ${
                  activeMode === "fast"
                    ? "bg-[#7cff82]/10 text-[#7cff82] border-[#7cff82]"
                    : "bg-[#0c0c0d] text-[#b9cacb]/50 border-[#3b494b]/10 hover:border-[#7cff82]/30 hover:text-white"
                }`}
              >
                <span className="font-bold tracking-wider">FAST & LITE</span>
                <span className="text-[7px] font-sans lowercase leading-none opacity-80 font-normal">lightweight chat</span>
              </button>
            </div>

            {/* System Model Routing & Escalation Matrix HUD Widget */}
            <div className="flex flex-col gap-1.5 mt-0.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowModelMatrix(!showModelMatrix)}
                className="w-full py-1.5 border-[0.5px] border-[#3b494b]/40 hover:border-[#00f0ff] bg-black/40 hover:bg-[#00f0ff]/5 text-[#b9cacb]/80 hover:text-white transition-all text-[8.5px] font-mono tracking-widest uppercase flex items-center justify-center gap-1.5 cursor-pointer leading-none"
              >
                <Sliders size={10} className={showModelMatrix ? "text-[#00f0ff] rotate-90 transition-transform duration-300" : "transition-transform duration-300"} />
                <span>{showModelMatrix ? "HIDE" : "SHOW"} COGNITIVE MODEL MATRIX</span>
              </button>

              {showModelMatrix && (
                <div 
                  className="p-3 bg-[#050506] border-[0.5px] border-[#00f0ff]/25 text-left font-mono text-[8.5px] text-[#b9cacb]/90 max-h-[180px] overflow-y-auto flex flex-col gap-2.5 scrollbar-thin select-none animate-fade-in"
                  id="system-model-matrix-hud"
                >
                  <div className="text-[#00f0ff] font-bold border-b border-[#3b494b]/20 pb-1 flex items-center justify-between">
                    <span className="tracking-wider">SYS_HANDSHAKE // MODEL_MAP</span>
                    <span className="text-[7.5px] opacity-75">STATUS: ONLINE</span>
                  </div>
                  
                  {/* Brainstorm Mode */}
                  <div className="flex flex-col gap-0.5 border-l-[1px] border-[#ffcb7c]/30 pl-2">
                    <span className="text-[#ffcb7c] font-black tracking-wide">🧠 BRAINSTORM MODE</span>
                    <span className="text-[8px] text-[#b9cacb]">
                      Primary AI: <strong className="text-white">DeepSeek Pro (R1)</strong>
                    </span>
                    <span className="text-[7.5px] text-[#b9cacb]/50">
                      Escalation cascade: LLaMA 17B &rarr; Nemotron Nano 12B &rarr; Nemotron 120B &rarr; gpt-oss-120b &rarr; LLaMA 90B &rarr; Mistral Large 3
                    </span>
                  </div>

                  {/* Journal Mode */}
                  <div className="flex flex-col gap-0.5 border-l-[1px] border-[#00f0ff]/30 pl-2">
                    <span className="text-[#00f0ff] font-black tracking-wide">📓 JOURNAL MODE</span>
                    <span className="text-[8px] text-[#b9cacb]">
                      Primary AI: <strong className="text-white">Flash (LLaMA 3.1 8B)</strong>
                    </span>
                    <span className="text-[7.5px] text-[#b9cacb]/50">
                      Escalation cascade: LLaMA 11B &rarr; Nemotron Nano 12B &rarr; DeepSeek Pro &rarr; Nemotron 120B &rarr; gpt-oss-120b &rarr; Mistral Large 3
                    </span>
                  </div>

                  {/* Research Mode */}
                  <div className="flex flex-col gap-0.5 border-l-[1px] border-[#c57cff]/30 pl-2">
                    <span className="text-[#c57cff] font-black tracking-wide">🔍 RESEARCH MODE</span>
                    <span className="text-[8px] text-[#b9cacb]">
                      Primary AI: <strong className="text-white">Kimi K2.6</strong>
                    </span>
                    <span className="text-[7.5px] text-[#b9cacb]/50">
                      Escalation cascade: LLaMA 90B &rarr; DeepSeek Pro &rarr; Nemotron 120B &rarr; gpt-oss-120b &rarr; Mistral Large 3
                    </span>
                  </div>

                  {/* File Mode */}
                  <div className="flex flex-col gap-0.5 border-l-[1px] border-[#ff7c7c]/30 pl-2">
                    <span className="text-[#ff7c7c] font-black tracking-wide">📂 FILE / DOCUMENT MODE</span>
                    <span className="text-[8px] text-[#b9cacb]">
                      Primary AI: <strong className="text-white">Kimi K2.6</strong>
                    </span>
                    <span className="text-[7.5px] text-[#b9cacb]/50">
                      Escalation cascade: DeepSeek Pro &rarr; Nemotron 120B &rarr; Mistral Large 3
                    </span>
                  </div>

                  {/* Lightweight/Fast Mode */}
                  <div className="flex flex-col gap-0.5 border-l-[1px] border-[#7cff82]/30 pl-2">
                    <span className="text-[#7cff82] font-black tracking-wide">⚡ LIGHTWEIGHT / FAST MODE</span>
                    <span className="text-[8px] text-[#b9cacb]">
                      Primary AI: <strong className="text-white">Flash (LLaMA 3.1 8B)</strong>
                    </span>
                    <span className="text-[7.5px] text-[#ff7c7c] font-bold">
                      Escalation cascade: LLaMA 11B &rarr; Nemotron Nano 12B <span className="opacity-95 text-[#ff7c7c]">[⚠️ END OF CASCADE - NO FALLBACKS]</span>
                    </span>
                  </div>

                  {/* Chat Mode */}
                  <div className="flex flex-col gap-0.5 border-l-[1px] border-[#b9cacb]/30 pl-2">
                    <span className="text-[#b9cacb] font-black tracking-wide">💬 CHAT MODE (BASIC CHAT)</span>
                    <span className="text-[8px] text-[#b9cacb]">
                      Primary AI: <strong className="text-white">Flash (LLaMA 3.1 8B)</strong>
                    </span>
                    <span className="text-[7.5px] text-[#b9cacb]/50">
                      Escalation cascade: LLaMA 11B &rarr; LLaMA 17B &rarr; DeepSeek Flash &rarr; DeepSeek Pro &rarr; Mistral Large 3
                    </span>
                  </div>

                  {/* Speech Mode */}
                  <div className="flex flex-col gap-0.5 border-l-[1px] border-white/30 pl-2">
                    <span className="text-white font-black tracking-wide">🎙️ SPEECH MODE (STT)</span>
                    <span className="text-[8px] text-white">
                      Primary AI: <strong className="text-white">Whisper v3</strong>
                    </span>
                    <span className="text-[7.5px] text-[#b9cacb]/50">
                      Escalation cascade: Flash &rarr; DeepSeek Pro
                    </span>
                  </div>

                  {/* Embedding Mode */}
                  <div className="flex flex-col gap-0.5 border-l-[1px] border-[#00f0ff]/30 pl-2 font-bold">
                    <span className="text-[#00f0ff] font-black tracking-wide">🧠 EMBEDDING / MEMORY MODE</span>
                    <span className="text-[8px] text-white">
                      Primary AI: <strong className="text-white font-black">BGE-M3 (Primary only)</strong>
                    </span>
                    <span className="text-[7.5px] text-[#b9cacb]/55 font-normal">
                      Escalation cascade: LLaMA 17B &rarr; DeepSeek Pro
                    </span>
                  </div>

                  <div className="text-[7.5px] border-t border-[#3b494b]/20 pt-1 text-center text-[#ff7c7c]/90 tracking-wide select-none font-bold">
                    ⚠️ CRITICAL SYSTEM LAW: Always escalate only when needed. Never jump to highest model immediately.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Messages Registry */}
          <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 text-left font-sans text-xs scrollbar-thin">
            {messages.map((message, idx) => {
              const isAssistant = message.role === "assistant";
              return (
                <div 
                  key={idx}
                  className={`flex flex-col gap-1.5 max-w-[88%] ${isAssistant ? "self-start" : "self-end"}`}
                >
                  <span className="font-mono text-[8.5px] text-[#b9cacb]/50 uppercase tracking-widest self-start px-1 select-none">
                    {message.role === "assistant" ? "SYSTEM_ADVISOR" : "OPERATOR"}
                  </span>
                  
                  <div className={`p-3.5 border-[0.5px] leading-relaxed relative ${
                    isAssistant 
                      ? "bg-[#0b0c0d] border-[#3b494b]/30 text-white rounded-none" 
                      : "bg-[#00f0ff]/5 border-[#00f0ff]/30 text-[#00f0ff] rounded-none font-medium ml-auto"
                  }`}>
                    {message.image && (
                      <div className="mb-2.5 border border-[#00f0ff]/30 bg-black/45 p-1 select-none">
                        <img 
                          src={message.image} 
                          alt="Attached cognitive diagnostic scan" 
                          className="max-w-full max-h-[160px] object-cover rounded-none mx-auto block" 
                          referrerPolicy="no-referrer" 
                        />
                        <span className="block font-mono text-[7.5px] text-[#00f0ff] opacity-75 mt-1 uppercase tracking-widest text-center">
                          [ATTACHED DIAGNOSTIC GRID FILE]
                        </span>
                      </div>
                    )}
                    {/* Render message parse format or raw lines */}
                    {message.content.split("\n").map((line, lIdx) => {
                      if (line.startsWith("### ")) {
                        return <h4 key={lIdx} className="font-mono text-xs font-black text-[#00dbe9] mt-2 mb-1.5 uppercase tracking-wide">{line.replace("### ", "")}</h4>;
                      }
                      if (line.startsWith("* ")) {
                        return (
                          <div key={lIdx} className="flex items-start gap-1 font-sans text-xs text-[#b9cacb]/90 pl-1 mt-1">
                            <span className="text-[#00f0ff]">•</span>
                            <span>{line.replace("* ", "")}</span>
                          </div>
                        );
                      }
                      if (line.match(/^\d+\.\s/)) {
                        return <div key={lIdx} className="font-sans text-xs text-[#b9cacb]/90 pl-1 mt-1 font-semibold text-glow-subtle">{line}</div>;
                      }
                      return <p key={lIdx} className={`mb-1 ${isAssistant ? "text-[#b9cacb]/95" : "text-[#00dbe9]"}`}>{line}</p>;
                    })}
                  </div>
                </div>
              );
            })}
            
            {isPending && (
              <div className="flex flex-col gap-1.5 max-w-[80%] self-start animate-pulse">
                <span className="font-mono text-[8px] text-[#00dbe9] uppercase tracking-widest">
                  SYS // STREAMING DATA_FLOW...
                </span>
                <div className="p-3 bg-[#0b0c0d] border border-[#00f0ff]/20 text-[#b9cacb]">
                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <div className="w-1.5 h-1.5 bg-[#00f0ff] rounded-none animate-ping" />
                    <span>REALIGNING VECTORS FROM NVIDIA NIM GATEWAY...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Hidden file selectors */}
          <input 
            type="file" 
            ref={imageInputRef} 
            onChange={handleImageUploadChange} 
            accept="image/*" 
            className="hidden" 
          />
          <input 
            type="file" 
            ref={docInputRef} 
            onChange={handleDocUploadChange} 
            accept=".txt,.log,.json,.csv,.md,.js,.ts,.tsx,.py,.html,.css" 
            className="hidden" 
          />

          {/* Attachment Menu Drawer overlay / block */}
          {showAttachmentMenu && (
            <div className="p-3 bg-[#0d0d10] border-t-[0.5px] border-[#3b494b]/50 border-b-[0.5px] border-b-[#3b494b]/20 flex flex-col gap-2.5 text-left transition-all duration-300 animate-fade-in">
              <div className="flex justify-between items-center select-none">
                <span className="font-mono text-[8.5px] uppercase font-black text-[#00f0ff] tracking-widest flex items-center gap-1.5 animate-pulse">
                  <Cpu size={10} /> ATTACH IMAGE / LOG STREAM
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowAttachmentMenu(false)}
                  className="text-[#b9cacb]/50 hover:text-white transition-colors p-0.5"
                >
                  <X size={12} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Image Upload */}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 border-[0.5px] border-[#00f0ff]/30 bg-black/40 hover:bg-[#00f0ff]/10 text-[#00f0ff] font-mono text-[9px] uppercase font-bold p-3 transition-all cursor-pointer hover:border-[#00f0ff]"
                >
                  <ImageIcon size={16} />
                  <span>UPLOAD IMAGE</span>
                </button>

                {/* Document/File Upload */}
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 border-[0.5px] border-[#00f0ff]/30 bg-black/40 hover:bg-[#00f0ff]/10 text-[#00f0ff] font-mono text-[9px] uppercase font-bold p-3 transition-all cursor-pointer hover:border-[#00f0ff]"
                >
                  <FileImage size={16} className="text-[#ffcb7c]" />
                  <span className="text-[#ffcb7c]">UPLOAD FILE / LOGS</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Attached Image preview banner */}
          {attachedImage && (
            <div className="px-3.5 py-2.5 bg-[#050506] border-t-[0.5px] border-[#3b494b]/30 border-b-[0.5px] border-b-[#3b494b]/15 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2.5 w-3/4">
                <div className="w-10 h-10 border border-[#00f0ff]/30 bg-black overflow-hidden flex items-center justify-center shrink-0">
                  <img src={attachedImage} alt="Attached miniature thumbnail preview" className="w-full h-full object-cover" />
                </div>
                <div className="text-left w-full overflow-hidden">
                  <span className="block font-mono text-[8.5px] text-[#00f0ff] font-bold uppercase tracking-wider truncate">
                    {attachedImageName || "DIAGNOSTIC_CAPACITY_SCAN.PNG"}
                  </span>
                  <span className="block font-sans text-[8px] text-[#b9cacb]/40 uppercase truncate">
                    SYSTEM ATTACHED // ROUTING VIA LLAMA-3.2-VISION-INSTRUCT
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAttachedImage(null);
                  setAttachedImageName(null);
                }}
                className="p-1 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-mono uppercase font-black tracking-widest cursor-pointer transition-all shrink-0"
              >
                UNLINK
              </button>
            </div>
          )}

          {/* Active Attached Document preview banner */}
          {attachedDocContent && (
            <div className="px-3.5 py-2.5 bg-[#050506] border-t-[0.5px] border-[#3b494b]/30 border-b-[0.5px] border-b-[#3b494b]/15 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2.5 w-3/4">
                <div className="w-10 h-10 border border-[#ffcb7c]/30 bg-black overflow-hidden flex items-center justify-center shrink-0">
                  <FileImage size={18} className="text-[#ffcb7c]" />
                </div>
                <div className="text-left w-full overflow-hidden">
                  <span className="block font-mono text-[8.5px] text-[#ffcb7c] font-bold uppercase tracking-wider truncate">
                    {attachedDocName || "DIAGNOSTIC_REPORT.TXT"}
                  </span>
                  <span className="block font-sans text-[8px] text-[#b9cacb]/40 uppercase truncate">
                    DOCUMENT INJECTED // {attachedDocContent.length} BYTES
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAttachedDocContent(null);
                  setAttachedDocName(null);
                }}
                className="p-1 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-mono uppercase font-black tracking-widest cursor-pointer transition-all shrink-0"
              >
                UNLINK
              </button>
            </div>
          )}

          {/* Interactive input stream footer form */}
          <form 
            onSubmit={handleSendMessage}
            className="p-3 border-t-[0.5px] border-[#3b494b]/40 bg-[#0c0c0d] flex gap-2"
          >
            {/* Paperclip button trigger */}
            <button
              type="button"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className={`border-[0.5px] px-2.5 rounded-none transition-all flex items-center justify-center cursor-pointer ${
                showAttachmentMenu 
                  ? "bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]" 
                  : "bg-[#111112] border-[#3b494b]/30 hover:border-[#00f0ff]/50 text-[#b9cacb] hover:text-white"
              }`}
              title="Attach diagnostic vector image log"
            >
              <Paperclip size={13} />
            </button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                activeMode === "journal"
                  ? "Stream logs, or analyze diagnostic images..."
                  : activeMode === "code"
                  ? "Compile development streams, debug logs, or write algorithms..."
                  : "Brainstorm strategy & ideas or developer query sequence..."
              }
              disabled={isPending}
              className="flex-grow bg-[#111112] border-[0.5px] border-[#3b494b]/30 focus:border-[#00f0ff] focus:outline-none text-white font-mono text-xs px-3 py-2.5 rounded-none transition-colors"
            />
            
            <button
              type="submit"
              disabled={isPending || !inputValue.trim()}
              className="bg-[#00f0ff] hover:bg-[#5cf2fb] text-black hover:shadow-[0_0_10px_rgba(0,219,233,0.4)] disabled:opacity-30 disabled:hover:shadow-none p-2.5 rounded-none transition-all flex items-center justify-center cursor-pointer"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
