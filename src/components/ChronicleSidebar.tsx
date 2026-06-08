import { useEffect, useState, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Clock, FolderHeart, MessageSquare, Trash2, Plus, Terminal } from "lucide-react";

interface ChronicleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

interface ChronicleLog {
  id: string;
  date: string;
  performanceScore: number;
}

interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  channel: "diagnostic" | "cascade";
  mode: "learn" | "code" | "brainstorm" | "journal";
  messages: any[];
}

export default function ChronicleSidebar({ isOpen, onClose, onNavigate }: ChronicleSidebarProps) {
  const [activeTab, setActiveTab] = useState<"journals" | "chats">("journals");
  const [logs, setLogs] = useState<ChronicleLog[]>([]);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");

  const loadHistoryLogs = () => {
    try {
      const savedLogs = localStorage.getItem("maverick_journal_history");
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("HASEX_OS [SIDEBAR WARN] // Error loading history:", err);
    }
  };

  const loadChatThreads = () => {
    try {
      const savedThreads = localStorage.getItem("maverick_chat_threads_unified") || localStorage.getItem("maverick_chat_threads");
      if (savedThreads) {
        setThreads(JSON.parse(savedThreads));
      } else {
        setThreads([]);
      }
      const activeId = localStorage.getItem("maverick_unified_active_thread_id");
      if (activeId) {
        setActiveThreadId(activeId);
      }
    } catch (err) {
      console.error("HASEX_OS [SIDEBAR WARN] // Error loading chat threads:", err);
    }
  };

  const syncAll = () => {
    loadHistoryLogs();
    loadChatThreads();
  };

  useEffect(() => {
    if (isOpen) {
      syncAll();
    }
  }, [isOpen]);

  useEffect(() => {
    syncAll();
    window.addEventListener("maverick_history_updated", syncAll);
    window.addEventListener("storage", syncAll);

    return () => {
      window.removeEventListener("maverick_history_updated", syncAll);
      window.removeEventListener("storage", syncAll);
    };
  }, []);

  const handleSelectThread = (threadId: string) => {
    localStorage.setItem("maverick_unified_active_thread_id", threadId);
    setActiveThreadId(threadId);
    
    // Notify MaverickEngine components
    window.dispatchEvent(new Event("maverick_history_updated"));
    
    // Close sidebar and navigate to Maverick interface
    onClose();
    if (onNavigate) {
      onNavigate("hasex");
    }
  };

  const handleDeleteThread = (threadId: string, e: MouseEvent) => {
    e.stopPropagation();
    try {
      const filtered = threads.filter(t => t.id !== threadId);
      setThreads(filtered);
      localStorage.setItem("maverick_chat_threads_unified", JSON.stringify(filtered));
      localStorage.setItem("maverick_chat_threads", JSON.stringify(filtered));

      if (activeThreadId === threadId && filtered.length > 0) {
        localStorage.setItem("maverick_unified_active_thread_id", filtered[0].id);
        setActiveThreadId(filtered[0].id);
      } else if (filtered.length === 0) {
        localStorage.removeItem("maverick_unified_active_thread_id");
        setActiveThreadId("");
      }

      window.dispatchEvent(new Event("maverick_history_updated"));
    } catch (err) {
      console.error("HASEX_OS [SIDEBAR WARN] // Error deleting thread:", err);
    }
  };

  const handleCreateNewThread = () => {
    try {
      const defaultMsg = {
        id: `msg-${Date.now()}-init-unified`,
        role: "assistant",
        content: "System initialized. Welcome to HASEX OS // MAVERICK Command Intel.\n\nI am MAVERICK AI, your execution-oriented guide vector. Ready to analyze messy logs, scan schemas, or discuss strategic optimization. Input your instructions:",
        timestamp: new Date().toISOString()
      };
      const newThread: ChatThread = {
        id: `thread-${Date.now()}`,
        title: `Attention Session ${threads.length + 1}`,
        createdAt: new Date().toISOString(),
        channel: "cascade",
        mode: "learn",
        messages: [defaultMsg]
      };
      const updated = [newThread, ...threads];
      setThreads(updated);
      localStorage.setItem("maverick_chat_threads_unified", JSON.stringify(updated));
      localStorage.setItem("maverick_chat_threads", JSON.stringify(updated));
      localStorage.setItem("maverick_unified_active_thread_id", newThread.id);
      setActiveThreadId(newThread.id);

      // Notify MaverickEngine
      window.dispatchEvent(new Event("maverick_history_updated"));
      
      onClose();
      if (onNavigate) {
        onNavigate("hasex");
      }
    } catch (err) {
      console.error("HASEX_OS [SIDEBAR WARN] // Error starting new thread:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden" id="chronicle-sidebar-wrapper">
          {/* Dark backing overlay with glowing blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            id="sidebar-overlay"
          />

          <div className="absolute inset-y-0 left-0 flex max-w-full">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-80 md:w-96 max-w-md bg-[#090a0c] border-r border-[#3b494b]/45 h-full flex flex-col shadow-[0_0_50px_rgba(0,240,255,0.08)] relative"
              id="sidebar-panel"
            >
              {/* Outer micro cyberline */}
              <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-[#00f0ff]/40 via-transparent to-[#00f0ff]/10" />

              {/* Sidebar Header */}
              <div className="p-5 border-b border-[#3b494b]/20 bg-[#0c0d10] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#00f0ff] animate-pulse" />
                  <div className="font-mono text-left">
                    <h2 className="text-[11px] font-black tracking-widest text-[#00f0ff] uppercase">SYSTEM CONSOLE</h2>
                    <p className="text-[8px] text-[#b9cacb]/40 uppercase">INTELLIGENCE TERMINAL BUFFER</p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white transition-all cursor-pointer rounded-none active:scale-95"
                  id="close-sidebar-btn"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Dynamic TAB toggle bar */}
              <div className="grid grid-cols-2 bg-[#0c0c0e] border-b border-[#3b494b]/15 shrink-0 select-none">
                <button
                  onClick={() => setActiveTab("journals")}
                  className={`py-3 text-[9px] font-black tracking-wider uppercase font-mono flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === "journals"
                      ? "border-[#00f0ff] text-[#00f0ff] bg-black/60 font-black"
                      : "border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <FolderHeart size={11} />
                  <span>JOURNAL REGISTER</span>
                </button>

                <button
                  onClick={() => setActiveTab("chats")}
                  className={`py-3 text-[9px] font-black tracking-wider uppercase font-mono flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                    activeTab === "chats"
                      ? "border-[#00f0ff] text-[#00f0ff] bg-black/60 font-black"
                      : "border-transparent text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  <MessageSquare size={11} />
                  <span>CHAT sessions</span>
                </button>
              </div>

              {/* Sidebar Body list representing selected tab payload */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans select-none custom-scrollbar text-left">
                
                {/* 1. JOURNALS LIST TAB CONTENT */}
                {activeTab === "journals" && (
                  <>
                    {logs.length === 0 ? (
                      <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                        <Clock size={24} className="text-[#00f0ff]/20 animate-pulse" />
                        <p className="font-mono text-[10px] text-[#00f0ff]/60 uppercase tracking-widest">Registry Empty</p>
                        <p className="text-[9px] text-neutral-500 max-w-[200px] leading-relaxed mx-auto">
                          No chronicles completed today yet. Write an operational journal entry to log statistics.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="font-mono text-[8.5px] text-neutral-500 tracking-widest uppercase mb-1">
                          LISTING {logs.length} REGISTERED ENTRIES
                        </div>
                        {logs.map((log, index) => (
                          <div
                            key={log.id || index}
                            className="p-4 bg-black/60 border border-[#3b494b]/15 hover:border-[#00f0ff]/30 transition-all duration-200 group relative overflow-hidden"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00f0ff]/30 group-hover:bg-[#00f0ff] transition-all" />

                            <div className="flex flex-col gap-2.5">
                              {/* Chronological Date */}
                              <div className="flex items-center gap-1.5">
                                <Clock size={11} className="text-[#00f0ff]/70" />
                                <span className="font-mono text-[11px] text-[#e2e2e2] font-semibold tracking-wide">
                                  {log.date}
                                </span>
                              </div>

                              {/* Performance Score row */}
                              <div className="flex items-center justify-between border-t border-neutral-950 pt-2">
                                <span className="font-mono text-[8.5px] text-neutral-500 uppercase tracking-widest">
                                  PERFORMANCE SCORE
                                </span>
                                <div className="flex items-center gap-1 font-mono">
                                  <span className="text-white text-xs font-bold">
                                    {log.performanceScore}
                                  </span>
                                  <span className="text-[9px] text-neutral-600">/100</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* 2. CHATS SESSIONS LIST LIST TAB CONTENT */}
                {activeTab === "chats" && (
                  <div className="space-y-4">
                    {/* Launcher new attention thread */}
                    <button
                      type="button"
                      onClick={handleCreateNewThread}
                      className="w-full py-2.5 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/45 text-[#00f0ff] text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 select-none shrink-0 cursor-pointer"
                    >
                      <Plus size={12} />
                      <span>NEW ATTENTION STREAM</span>
                    </button>

                    <div className="border-b border-[#3b494b]/10 pb-1" />

                    {threads.length === 0 ? (
                      <div className="py-14 text-center flex flex-col items-center justify-center gap-2">
                        <MessageSquare size={20} className="text-[#00f0ff]/10" />
                        <span className="font-mono text-[8px] text-neutral-600 uppercase tracking-widest">No Active Streams</span>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <div className="font-mono text-[8.5px] text-neutral-500 tracking-widest uppercase mb-1">
                          LISTING {threads.length} ACTIVE STREAMS
                        </div>
                        {threads.map((t) => {
                          const isActive = t.id === activeThreadId;
                          return (
                            <div
                              key={t.id}
                              onClick={() => handleSelectThread(t.id)}
                              className={`p-3 cursor-pointer text-left transition-all flex items-center justify-between gap-3 relative group border border-neutral-900/60 ${
                                isActive 
                                  ? "bg-[#00f0ff]/5 border-[#00f0ff]/30" 
                                  : "bg-[#07080a] hover:bg-neutral-900/40 hover:border-[#3b494b]/15"
                              }`}
                            >
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-800 group-hover:bg-[#00f0ff] transition-all" />
                              
                              <div className="min-w-0 flex flex-col gap-1 pl-1">
                                <span className={`text-[10.5px] font-bold block truncate ${isActive ? "text-[#00f0ff]" : "text-neutral-300"}`}>
                                  {t.title || "Attention Session"}
                                </span>
                                <span className="text-[7.5px] text-neutral-500 uppercase tracking-widest block font-mono">
                                  {new Date(t.createdAt).toLocaleDateString()}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleDeleteThread(t.id, e)}
                                className="p-1 px-2 text-neutral-600 hover:text-red-400 opacity-25 group-hover:opacity-100 transition-opacity rounded-none cursor-pointer"
                                title="Delete Session"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar Footer status metrics check */}
              <div className="p-4 border-t border-[#3b494b]/15 bg-[#090a0c] font-mono text-[9px] text-[#b9cacb]/35 flex justify-between items-center select-none">
                <span>SYSTEM STATUS: ACTIVE</span>
                <span className="text-[#00f0ff]/60">HASEX // V1.1.0</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
