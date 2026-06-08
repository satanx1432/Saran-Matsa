import { useState, useEffect, useRef, FormEvent, ChangeEvent, MouseEvent } from "react";
import { 
  Cpu, 
  HelpCircle, 
  Play, 
  Pause, 
  RotateCcw, 
  Compass, 
  ArrowRight, 
  Zap, 
  CheckCircle, 
  ListTodo, 
  ShieldAlert,
  Sparkles,
  Terminal,
  MessageSquare,
  History,
  Plus,
  Trash2,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  Clock,
  Send,
  Loader2,
  Paperclip,
  Image as ImageIcon,
  FileImage,
  RefreshCw,
  Search,
  FileText,
  X,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import FocusTimerPlugin from "./FocusTimerPlugin";
import MaverickLogo from "./MaverickLogo";

interface Traits {
  action: number;
  persistence: number;
  discipline: number;
  awareness: number;
  courage: number;
  learning: number;
}

interface Node {
  id: string;
  label: string;
  type: "source" | "productive" | "distraction" | "bottleneck" | "action";
  time_spent: string;
  description: string;
}

interface Edge {
  from: string;
  to: string;
  label: string;
}

interface Flowchart {
  nodes: Node[];
  edges: Edge[];
}

interface QuestionOption {
  text: string;
  trait: keyof Traits;
  weight: number;
}

interface EngineResult {
  noiseCleaned: string;
  intentDetected: string;
  entities: string[];
  outputType: "clarified_action" | "clarifying_questions" | "structured_breakdown" | "micro_reflection" | "diagnostic_question" | "learn_concept";
  responseText: string;
  steps: string[];
  actionItem: string;
  actionEstimate: string;
  invisibleToolUsed: string | null;
  traitUpdates: Partial<Traits>;
  options?: QuestionOption[];
  flowchart?: Flowchart;
  usingFallback?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  logoSvg?: string; // Creative Brand badge generated inline
  image?: string; // Captured scan preview data
  engineResult?: EngineResult;
}

interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  channel: "diagnostic" | "cascade";
  mode: "learn" | "code" | "brainstorm" | "journal";
  messages: ChatMessage[];
}

// Maverick Engine Component definition

export default function MaverickEngine() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelinePhase, setPipelinePhase] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [collapseTraits, setCollapseTraits] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  
  // RAG / NIM API configuration keys
  const [showKeysConfig, setShowKeysConfig] = useState(false);
  const [embeddingKey, setEmbeddingKey] = useState(() => localStorage.getItem("rag_embedding_key") || "");
  const [vectorDbKey, setVectorDbKey] = useState(() => localStorage.getItem("rag_vector_db_key") || "");
  const [llmKey, setLlmKey] = useState(() => localStorage.getItem("rag_llm_key") || "");

  // Channel selections & modes
  const [activeChannel, setActiveChannel] = useState<"diagnostic" | "cascade">("cascade");
  const [activeMode, setActiveMode] = useState<"learn" | "code" | "brainstorm" | "journal">("learn");

  // Adaptive Traits State
  const [traits, setTraits] = useState<Traits>({
    action: 0.50,
    persistence: 0.50,
    discipline: 0.50,
    awareness: 0.50,
    courage: 0.50,
    learning: 0.50
  });

  // Attached media/scan items
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const [attachedDocContent, setAttachedDocContent] = useState<string | null>(null);
  const [attachedDocName, setAttachedDocName] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Checklists and reflections
  const [checkedSteps, setCheckedSteps] = useState<Record<string, Record<number, boolean>>>({});
  const [reflectionAnswers, setReflectionAnswers] = useState<Record<string, string>>({});
  const [submittedReflections, setSubmittedReflections] = useState<Record<string, boolean>>({});

  // Operational Focus timers
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [timerTotal, setTimerTotal] = useState(15 * 60);
  const [activeTimerMsgId, setActiveTimerMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (force = false) => {
    if (!chatContainerRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const container = chatContainerRef.current;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    
    if (force || isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Sync API Keys
  useEffect(() => {
    localStorage.setItem("rag_embedding_key", embeddingKey);
  }, [embeddingKey]);

  useEffect(() => {
    localStorage.setItem("rag_vector_db_key", vectorDbKey);
  }, [vectorDbKey]);

  useEffect(() => {
    localStorage.setItem("rag_llm_key", llmKey);
  }, [llmKey]);

  // Global sync-up event handler for thread selection from sidebar
  const reloadThreadsFromLocalStorage = () => {
    try {
      const savedThreads = localStorage.getItem("maverick_chat_threads_unified") || localStorage.getItem("maverick_chat_threads");
      if (savedThreads) {
        const parsed: ChatThread[] = JSON.parse(savedThreads);
        if (parsed.length > 0) {
          setThreads(parsed);
          const savedActiveId = localStorage.getItem("maverick_unified_active_thread_id");
          if (savedActiveId && parsed.some(t => t.id === savedActiveId)) {
            const activeThr = parsed.find(t => t.id === savedActiveId);
            setActiveThreadId(savedActiveId);
            if (activeThr) {
              setActiveChannel(activeThr.channel || "cascade");
              setActiveMode(activeThr.mode || "learn");
            }
          } else {
            setActiveThreadId(parsed[0].id);
            setActiveChannel(parsed[0].channel || "cascade");
            setActiveMode(parsed[0].mode || "learn");
          }
        }
      }
    } catch (err) {
      console.error("MAVERICK // Synchronizing threads error:", err);
    }
  };

  useEffect(() => {
    window.addEventListener("maverick_history_updated", reloadThreadsFromLocalStorage);
    window.addEventListener("storage", reloadThreadsFromLocalStorage);
    return () => {
      window.removeEventListener("maverick_history_updated", reloadThreadsFromLocalStorage);
      window.removeEventListener("storage", reloadThreadsFromLocalStorage);
    };
  }, []);

  // Load components & local sessions from storage
  useEffect(() => {
    try {
      const savedTraits = localStorage.getItem("maverick_adaptive_traits") || localStorage.getItem("hasex_adaptive_traits");
      if (savedTraits) {
        setTraits(JSON.parse(savedTraits));
      }

      const savedThreads = localStorage.getItem("maverick_chat_threads_unified") || localStorage.getItem("maverick_chat_threads");
      if (savedThreads) {
        const parsed: ChatThread[] = JSON.parse(savedThreads);
        if (parsed.length > 0) {
          setThreads(parsed);
          const savedActiveId = localStorage.getItem("maverick_unified_active_thread_id");
          if (savedActiveId && parsed.some(t => t.id === savedActiveId)) {
            const activeThr = parsed.find(t => t.id === savedActiveId);
            setActiveThreadId(savedActiveId);
            if (activeThr) {
              setActiveChannel(activeThr.channel || "cascade");
              setActiveMode(activeThr.mode || "learn");
            }
          } else {
            setActiveThreadId(parsed[0].id);
            setActiveChannel(parsed[0].channel || "cascade");
            setActiveMode(parsed[0].mode || "learn");
          }
        } else {
          initializeDefaultThread();
        }
      } else {
        initializeDefaultThread();
      }
    } catch (err) {
      console.error("MAVERICK // Loading sessions matrix error:", err);
      initializeDefaultThread();
    }
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [threads, isProcessing, showAttachmentMenu]);

  useEffect(() => {
    scrollToBottom(true);
  }, [activeThreadId]);

  // Focus Timer Clock update ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      const newTraits = {
        ...traits,
        persistence: Math.min(1.0, traits.persistence + 0.05),
        action: Math.min(1.0, traits.action + 0.04),
        discipline: Math.min(1.0, traits.discipline + 0.03)
      };
      saveTraitsRegistry(newTraits);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft]);

  // Setup default connection session thread
  const initializeDefaultThread = () => {
    const defaultMsg: ChatMessage = {
      id: "init-msg-unified",
      role: "assistant",
      content: "System initialized. Welcome to HASEX OS // MAVERICK Command Intel.\n\nI am MAVERICK AI, your execution-oriented guide vector. Ready to analyze messy logs, scan schemas, construct layouts, and compile models using selective cascading parameters. Input your instructions:",
      timestamp: new Date().toISOString()
    };
    const newThread: ChatThread = {
      id: `thr-${Date.now()}`,
      title: "Cascade Flow 01",
      createdAt: new Date().toISOString(),
      channel: "cascade",
      mode: "learn",
      messages: [defaultMsg]
    };
    const combined = [newThread];
    setThreads(combined);
    setActiveThreadId(newThread.id);
    setActiveChannel("cascade");
    saveThreadsToStorage(combined, newThread.id);
  };

  const saveTraitsRegistry = (updatedTraits: Traits) => {
    setTraits(updatedTraits);
    localStorage.setItem("maverick_adaptive_traits", JSON.stringify(updatedTraits));
    localStorage.setItem("hasex_adaptive_traits", JSON.stringify(updatedTraits));
  };

  const saveThreadsToStorage = (latestThreads: ChatThread[], activeId: string) => {
    localStorage.setItem("maverick_chat_threads_unified", JSON.stringify(latestThreads));
    localStorage.setItem("maverick_chat_threads", JSON.stringify(latestThreads));
    localStorage.setItem("maverick_unified_active_thread_id", activeId);
  };

  const handleCreateNewThread = (channelType: "diagnostic" | "cascade", targetMode?: "learn" | "code" | "brainstorm" | "journal") => {
    const selMode = targetMode || activeMode;
    const defaultMsg: ChatMessage = {
      id: `msg-${Date.now()}-init-unified`,
      role: "assistant",
      content: channelType === "diagnostic"
        ? "Diagnostic Profiling Vector activated. State your immediate bottleneck, or choose one of the options below to evaluate your focus levels."
        : `Autonomous Maverick Cascade activated. Input your instructions, code queries, system layouts, or research topics. I will dynamically route your query using our dual-stream routing pipeline:`,
      timestamp: new Date().toISOString()
    };
    const newThread: ChatThread = {
      id: `thread-${Date.now()}`,
      title: channelType === "diagnostic" ? `Profiler Assessment ${threads.length + 1}` : `Cascade ${selMode.toUpperCase()} Flow`,
      createdAt: new Date().toISOString(),
      channel: channelType,
      mode: selMode,
      messages: [defaultMsg]
    };
    const updated = [newThread, ...threads];
    setThreads(updated);
    setActiveThreadId(newThread.id);
    setActiveChannel(channelType);
    if (channelType === "cascade") setActiveMode(selMode);
    saveThreadsToStorage(updated, newThread.id);
    setShowHistory(false);
  };

  const handleDeleteThread = (idToDelete: string, e: MouseEvent) => {
    e.stopPropagation();
    const filtered = threads.filter(t => t.id !== idToDelete);
    if (filtered.length === 0) {
      initializeDefaultThread();
    } else {
      setThreads(filtered);
      if (activeThreadId === idToDelete) {
        setActiveThreadId(filtered[0].id);
        setActiveChannel(filtered[0].channel || "diagnostic");
        setActiveMode(filtered[0].mode || "learn");
        saveThreadsToStorage(filtered, filtered[0].id);
      } else {
        saveThreadsToStorage(filtered, activeThreadId);
      }
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  // Drag and Drop & file upload handlers
  const handleImageUploadChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedImageName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    setShowAttachmentMenu(false);
  };

  const handleDocUploadChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedDocName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedDocContent(event.target?.result as string);
    };
    reader.readAsText(file);
    setShowAttachmentMenu(false);
  };

  // Submit diagnostic option select
  const handleSelectOption = async (optionText: string, traitName: keyof Traits, scoreValue: number) => {
    if (isProcessing) return;

    const interimTraits = { ...traits };
    if (interimTraits[traitName] !== undefined) {
      interimTraits[traitName] = Math.max(0.0, Math.min(1.0, interimTraits[traitName] + scoreValue));
    }
    saveTraitsRegistry(interimTraits);

    setIsProcessing(true);
    setUserInput("");

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user-opt`,
      role: "user",
      content: optionText,
      timestamp: new Date().toISOString()
    };
    const updatedMessages = [...(activeThread?.messages || []), userMsg];

    const updatedThreads = threads.map(t => {
      if (t.id === activeThreadId) {
        return { ...t, messages: updatedMessages };
      }
      return t;
    });
    setThreads(updatedThreads);
    saveThreadsToStorage(updatedThreads, activeThreadId);

    const phases = [
      "[UPLINK] CAPTURING RESPONDENT SELECTION...",
      "[MAPPING] EVALUATING BEHAVIORAL DEVIATION...",
      "[TRAITS] REALIGNING SYSTEM COEFFICIENTS..."
    ];
    for (const p of phases) {
      setPipelinePhase(p);
      await new Promise(r => setTimeout(r, 300));
    }

    try {
      const response = await fetch("/api/hasex-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: optionText,
          currentTraits: interimTraits,
          messages: updatedMessages
        })
      });

      if (!response.ok) throw new Error("Diagnostics uplink returned failure.");

      const data: EngineResult = await response.json();
      const finalTraits = { ...interimTraits };
      if (data.traitUpdates) {
        Object.entries(data.traitUpdates).forEach(([k, val]) => {
          const key = k as keyof Traits;
          if (finalTraits[key] !== undefined && typeof val === "number") {
            finalTraits[key] = Math.max(0.0, Math.min(1.0, finalTraits[key] + val));
          }
        });
        saveTraitsRegistry(finalTraits);
      }

      const asstMsg: ChatMessage = {
        id: `asst-msg-${Date.now()}`,
        role: "assistant",
        content: data.responseText,
        timestamp: new Date().toISOString(),
        engineResult: data
      };

      const finalizedMsgs = [...updatedMessages, asstMsg];
      const finalizedThreads = threads.map(t => {
        if (t.id === activeThreadId) {
          return { ...t, messages: finalizedMsgs };
        }
        return t;
      });
      setThreads(finalizedThreads);
      saveThreadsToStorage(finalizedThreads, activeThreadId);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to parse and strip timer start commands from Maverick AI responses
  const processAndTriggerAiTimer = (text: string): string => {
    let cleanedText = text;

    // Pattern 1: [START_TIMER: mins, task_name]
    const tagMatch = text.match(/\[START_TIMER:\s*(\d+)\s*,\s*([^\]]+)\]/i);
    if (tagMatch) {
      const mins = parseInt(tagMatch[1], 10);
      const task = tagMatch[2].trim();
      
      // Dispatch the start event so FocusTimerPlugin instantly handles it
      setTimeout(() => {
        console.log("MAVERICK CHAT TRIGGER // Dispatching Start Event for AI response:", mins, "mins, task:", task);
        window.dispatchEvent(new CustomEvent("maverick_timer_command", {
          detail: {
            action: "start",
            totalSeconds: mins * 60,
            task: task || "Maverick Focus Sprint"
          }
        }));
      }, 100);

      // Strip the tag from the text
      cleanedText = cleanedText.replace(/\[START_TIMER:\s*(\d+)\s*,\s*([^\]]+)\]/gi, "").trim();
    } else {
      // Fallback matching if it includes "starting a 25-minute timer" style natural language
      const lower = text.toLowerCase();
      let minsFound = 0;
      let matchedTask = "Maverick Study Session";
      let matched = false;

      if (lower.includes("start a") || lower.includes("starting a") || lower.includes("set a")) {
        const minMatch = lower.match(/(?:start|starting|set)\s+a\s+(\d+)\s*(?:-|\s)?(?:minute|min)\s+timer/);
        const focusMatch = lower.match(/(?:start|starting|set)\s+a\s+(\d+)\s*(?:-|\s)?(?:minute|min)\s+focus/);
        const sessionMatch = lower.match(/(?:start|starting|set)\s+a\s+(\d+)\s*(?:-|\s)?(?:minute|min)\s+session/);
        
        const bestMatch = minMatch || focusMatch || sessionMatch;
        if (bestMatch) {
          minsFound = parseInt(bestMatch[1], 10);
          matched = true;
        }
      }

      if (matched && minsFound > 0) {
        // Let's try to extract task if mentioned
        const forPart = text.split(/\s(?:for|to|on)\s/i);
        if (forPart.length > 1) {
          matchedTask = forPart[forPart.length - 1].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
        }

        setTimeout(() => {
          console.log("MAVERICK CHAT FALLBACK TRIGGER // Dispatching Start Event for AI natural response:", minsFound, "mins");
          window.dispatchEvent(new CustomEvent("maverick_timer_command", {
            detail: {
              action: "start",
              totalSeconds: minsFound * 60,
              task: matchedTask || "Maverick Dynamic Sprint"
            }
          }));
        }, 100);
      }
    }

    return cleanedText;
  };

  // Submit standard chat message
  const handleSendChatMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const promptToSend = userInput.trim();
    if (!promptToSend || isProcessing) return;

    // --- MAVERICK TIMER AI CONTROL ROUTER INTERCEPTOR ---
    const textLower = promptToSend.toLowerCase();
    let secondsCalculated = 0;
    let isTimerInitiation = false;
    let matchedTask = "";

    if (textLower.includes("start") || textLower.includes("set") || textLower.includes("timer") || textLower.includes("focus")) {
      const matchHour = textLower.match(/(\d+)\s*(?:hour|hr|h\b)/);
      const matchMin = textLower.match(/(\d+)\s*(?:minute|min|m\b)/);
      const matchSec = textLower.match(/(\d+)\s*(?:second|sec|s\b)/);

      if (matchHour) {
        secondsCalculated += parseInt(matchHour[1], 10) * 3600;
        isTimerInitiation = true;
      }
      if (matchMin) {
        secondsCalculated += parseInt(matchMin[1], 10) * 60;
        isTimerInitiation = true;
      }
      if (matchSec) {
        secondsCalculated += parseInt(matchSec[1], 10);
        isTimerInitiation = true;
      }

      if (!isTimerInitiation && (textLower.includes("timer") || textLower.includes("focus"))) {
        secondsCalculated = 25 * 60;
        isTimerInitiation = true;
      }

      if (isTimerInitiation) {
        let parsedTask = "";
        const parts = promptToSend.split(/\s(?:for|to|on)\s/i);
        if (parts.length > 1) {
          parsedTask = parts[parts.length - 1].trim();
        } else {
          const splitWord = promptToSend.toLowerCase().includes("session") ? "session" : "timer";
          const subparts = promptToSend.toLowerCase().split(splitWord);
          if (subparts.length > 1) {
            parsedTask = subparts[subparts.length - 1].trim();
          }
        }
        matchedTask = parsedTask || "Maverick Direct Work Stream";
        
        setTimeout(() => {
          console.log("MAVERICK CHAT INTERCEPT // Dispatching Start Event for:", secondsCalculated, "secs, task:", matchedTask);
          window.dispatchEvent(new CustomEvent("maverick_timer_command", {
            detail: {
              action: "start",
              totalSeconds: secondsCalculated,
              task: matchedTask
            }
          }));
        }, 100);
      }
    } else if (textLower === "pause" || textLower === "pause timer" || textLower === "hold timer" || textLower === "stop timer" || textLower === "stop") {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("maverick_timer_command", {
          detail: { action: "pause" }
        }));
      }, 100);
    } else if (textLower === "reset" || textLower === "reset timer" || textLower === "resume timer" || textLower === "resume") {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("maverick_timer_command", {
          detail: { action: textLower.includes("resume") ? "start" : "reset" }
        }));
      }, 100);
    }
    // --- END CONTROL RUN ROUTER ---

    setIsProcessing(true);
    setUserInput("");

    // Create user message object
    const userMsgId = `msg-${Date.now()}-user`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: promptToSend,
      timestamp: new Date().toISOString()
    };

    if (attachedImage) {
      userMsg.image = attachedImage;
      userMsg.content = `[IMAGE ANALYSIS ATTACHEMENT: ${attachedImageName || "SCAN"}]\n\n${userMsg.content}`;
    }
    if (attachedDocContent) {
      userMsg.content = `[DOCUMENT INJECTION: ${attachedDocName || "LOGS"}]\n=== START DOCUMENT ===\n${attachedDocContent}\n=== END DOCUMENT ===\n\n${userMsg.content}`;
    }

    const updatedThreadMessages = [...(activeThread?.messages || []), userMsg];
    
    let threadTitle = activeThread?.title || "Attention Stream";
    if (activeThread?.messages.length <= 1) {
      threadTitle = promptToSend.substring(0, 24) + (promptToSend.length > 24 ? "..." : "");
    }

    const updatedThreads = threads.map(t => {
      if (t.id === activeThreadId) {
        return { 
          ...t, 
          title: threadTitle, 
          messages: updatedThreadMessages,
          channel: activeChannel,
          mode: activeMode
        };
      }
      return t;
    });
    setThreads(updatedThreads);
    saveThreadsToStorage(updatedThreads, activeThreadId);

    // Clear attachments
    setAttachedImage(null);
    setAttachedImageName(null);
    setAttachedDocContent(null);
    setAttachedDocName(null);

    // Animate custom pipeline visual loaders
    const phases = activeChannel === "diagnostic"
      ? [
          "[UPLINK] CLEANING RAW SIGNAL CLUTTER...",
          "[MAPPING] ISOLATING EXECUTION DISCIPLINE PATHS...",
          "[VECTORS] ROUTING PERSISTENCE EVALUATION CYCLES...",
          "[ROUTING] HARMONIZING LOCAL MAVERICK CONTROLS..."
        ]
      : [
          "[ROUTER] RESOLVING SPECIALIZED GATEWAY LINK...",
          "[CASCADE] PARSING ACTIVE MULTIPLEXING CANALS...",
          "[EVAL] ATTEMPTING ALL REGISTERED NVIDIA CASCADE MODELS...",
          "[UPLINK] ASSEMBLING RESPONSE LOG..."
        ];

    for (const p of phases) {
      setPipelinePhase(p);
      await new Promise(r => setTimeout(r, 350));
    }

    try {
      if (activeChannel === "diagnostic") {
        const response = await fetch("/api/hasex-engine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userInput: promptToSend,
            currentTraits: traits,
            messages: updatedThreadMessages
          })
        });

        if (!response.ok) throw new Error("Diagnostic socket returned error.");
        const data: EngineResult = await response.json();

        // Update traits inside the client engine
        const updatedTraits = { ...traits };
        if (data.traitUpdates) {
          Object.entries(data.traitUpdates).forEach(([key, val]) => {
            const k = key as keyof Traits;
            if (updatedTraits[k] !== undefined && typeof val === "number") {
              updatedTraits[k] = Math.max(0.0, Math.min(1.0, updatedTraits[k] + val));
            }
          });
          saveTraitsRegistry(updatedTraits);
        }

        if (data.outputType === "clarified_action" && data.actionEstimate) {
          const match = data.actionEstimate.match(/(\d+)m/);
          const mins = match && match[1] ? parseInt(match[1], 10) : 15;
          setTimeLeft(mins * 60);
          setTimerTotal(mins * 60);
        }

        const assistMsgId = `asst-${Date.now()}`;
        const processedDocReport = processAndTriggerAiTimer(data.responseText);
        const assistMsg: ChatMessage = {
          id: assistMsgId,
          role: "assistant",
          content: processedDocReport,
          timestamp: new Date().toISOString(),
          engineResult: data
        };

        if (data.outputType === "clarified_action") {
          setActiveTimerMsgId(assistMsgId);
        }

        const finalizedMsgs = [...updatedThreadMessages, assistMsg];
        const finalizedThreads = threads.map(t => {
          if (t.id === activeThreadId) {
            return { ...t, messages: finalizedMsgs };
          }
          return t;
        });
        setThreads(finalizedThreads);
        saveThreadsToStorage(finalizedThreads, activeThreadId);
      } else {
        // CASCADING CASCADE API ROUTE DISPATCH via nvidia-agent / server core
        const activeKeysStateLLM = llmKey || localStorage.getItem("rag_llm_key") || "";
        const response = await fetch("/api/nvidia-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedThreadMessages.map(m => ({ role: m.role, content: m.content })),
            mode: activeMode,
            hasImage: !!userMsg.image,
            hasDoc: promptToSend.includes("START DOCUMENT"),
            rag_llm_key: activeKeysStateLLM
          })
        });

        if (!response.ok) throw new Error("Cascade model array failed to respond.");
        const data = await response.json();

        // Dynamically transition workspace mode according to routed GPT-OSS 20B result
        const targetMode = data.detectedMode || activeMode;
        if (data.detectedMode) {
          setActiveMode(data.detectedMode);
        }

        // Reward study/coding action points in cascade
        const incremental = { ...traits };
        if (targetMode === "code") {
          incremental.action = Math.min(1.0, incremental.action + 0.02);
          incremental.discipline = Math.min(1.0, incremental.discipline + 0.01);
        } else if (targetMode === "learn") {
          incremental.learning = Math.min(1.0, incremental.learning + 0.03);
          incremental.awareness = Math.min(1.0, incremental.awareness + 0.01);
        } else if (targetMode === "journal") {
          incremental.awareness = Math.min(1.0, incremental.awareness + 0.03);
          incremental.persistence = Math.min(1.0, incremental.persistence + 0.01);
        } else if (targetMode === "brainstorm") {
          incremental.courage = Math.min(1.0, incremental.courage + 0.02);
          incremental.learning = Math.min(1.0, incremental.learning + 0.01);
        }
        saveTraitsRegistry(incremental);

        const processedCascadeText = processAndTriggerAiTimer(data.content || "Neural gateway returned blank connection response.");
        const assistMsg: ChatMessage = {
          id: `asst-cascade-${Date.now()}`,
          role: "assistant",
          content: processedCascadeText,
          timestamp: new Date().toISOString()
        };

        const finalizedMsgs = [...updatedThreadMessages, assistMsg];
        const finalizedThreads = threads.map(t => {
          if (t.id === activeThreadId) {
            return { 
              ...t, 
              messages: finalizedMsgs,
              mode: targetMode
            };
          }
          return t;
        });
        setThreads(finalizedThreads);
        saveThreadsToStorage(finalizedThreads, activeThreadId);
      }
    } catch (err: any) {
      console.error(err);
      const failMsg: ChatMessage = {
        id: `fail-${Date.now()}`,
        role: "assistant",
        content: `An uplink exception has occurred with the system.
Please outline your current task or target objective below to resume.`,
        timestamp: new Date().toISOString()
      };
      const finalized = [...updatedThreadMessages, failMsg];
      const finalizedThreads = threads.map(t => {
        if (t.id === activeThreadId) {
          return { ...t, messages: finalized };
        }
        return t;
      });
      setThreads(finalizedThreads);
      saveThreadsToStorage(finalizedThreads, activeThreadId);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInlineReflectionSubmit = (msgId: string) => {
    const text = reflectionAnswers[msgId] || "";
    if (!text.trim()) return;

    setSubmittedReflections(e => ({ ...e, [msgId]: true }));
    const upgraded = {
      ...traits,
      awareness: Math.min(1.0, traits.awareness + 0.05),
      learning: Math.min(1.0, traits.learning + 0.03),
      discipline: Math.min(1.0, traits.discipline + 0.02)
    };
    saveTraitsRegistry(upgraded);
  };

  const toggleInlineStep = (msgId: string, idx: number, total: number) => {
    setCheckedSteps(prev => {
      const currentMsgSteps = prev[msgId] || {};
      const nextSteps = { ...currentMsgSteps, [idx]: !currentMsgSteps[idx] };
      const updated = { ...prev, [msgId]: nextSteps };

      if (Object.keys(nextSteps).length === total && Object.values(nextSteps).every(Boolean)) {
        const rewarded = {
          ...traits,
          persistence: Math.min(1.0, traits.persistence + 0.04),
          discipline: Math.min(1.0, traits.discipline + 0.04)
        };
        saveTraitsRegistry(rewarded);
      }
      return updated;
    });
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full h-full flex flex-col font-mono text-xs select-none relative bg-[#070708]">
      
      {/* CORE SPLIT WORKSPACE: LEFT CHAT PANEL + RIGHT TRAITS KPI HUD */}
      <div className="flex-grow flex items-stretch overflow-hidden relative min-h-0">
        
        {/* LEADING INTERACTION CHAT BOX */}
        <div className="flex-grow flex flex-col bg-black/10 overflow-hidden relative min-h-0">
          
          {/* MESSAGES LIST SCROLLER */}
          <div 
            ref={chatContainerRef}
            onScroll={(e) => {
              const el = e.currentTarget;
              setShowScrollToTop(el.scrollTop > 100);
            }}
            className="flex-grow overflow-y-auto p-4 flex flex-col gap-5 select-text min-h-0"
          >
            {activeThread?.messages.map((msg) => {
              const isAsst = msg.role === "assistant";
              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 max-w-[88%] md:max-w-[82%] ${isAsst ? "self-start text-left" : "self-end flex-row-reverse text-right"}`}
                >
                  <div className={`w-7.5 h-7.5 flex-shrink-0 flex items-center justify-center border select-none ${
                    isAsst ? "border-[#00f0ff]/30 bg-[#00f0ff]/5 text-[#00f0ff]" : "border-neutral-700 bg-neutral-900 text-neutral-300"
                  }`}>
                    {isAsst ? <MaverickLogo height={10} className="text-[#00f0ff]" /> : <User size={13} />}
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className={`flex items-center gap-1.5 text-[7.5px] text-neutral-500 select-none ${!isAsst && "justify-end"}`}>
                      <span className="font-extrabold uppercase tracking-wide">{isAsst ? "MAVERICK COGNITION" : "OPERATOR"}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                    </div>

                    <div className={`p-4 border font-sans text-xs leading-relaxed whitespace-pre-line relative transition-all ${
                      isAsst 
                        ? "border-[#3b494b]/30 bg-[#0d0d0f]/90 text-neutral-200 border-l-[3.5px] border-l-[#00f0ff]" 
                        : "border-neutral-800 bg-[#151518] text-white"
                    }`}>
                      {msg.content}

                      {/* Custom logo embedded rendering */}
                      {msg.logoSvg && (
                        <div className="my-3.5 p-3.5 bg-black/70 border border-[#00f0ff]/20 flex flex-col items-center justify-center gap-3 animate-fade-in select-none">
                          <div 
                            className="w-32 h-32 flex items-center justify-center bg-[#070708] border border-[#3b494b]/20 p-2 relative"
                            dangerouslySetInnerHTML={{ __html: msg.logoSvg }} 
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const blob = new Blob([msg.logoSvg || ""], { type: "image/svg+xml" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `maverick-insignia-${Date.now()}.svg`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                            className="px-3.5 py-1.5 bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 text-[#00f0ff] border border-[#00f0ff]/30 text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-all"
                          >
                            DOWNLOAD SVG CREDENTIAL BADGE
                          </button>
                        </div>
                      )}

                      {/* Option cards inside messages */}
                      {isAsst && msg.engineResult?.options && msg.engineResult.options.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2 relative z-10 select-none">
                          {msg.engineResult.options.map((opt, optIdx) => {
                            const isLast = activeThread?.messages[activeThread.messages.length - 1]?.id === msg.id;
                            return (
                              <button
                                key={optIdx}
                                disabled={isProcessing || !isLast}
                                onClick={() => handleSelectOption(opt.text, opt.trait as any, opt.weight)}
                                className={`w-full text-left p-3 border font-sans text-xs flex gap-2.5 items-start rounded-none transition-all ${
                                  isLast
                                    ? "border-[#0dcdff]/20 bg-neutral-950 text-neutral-300 hover:border-[#00f0ff] hover:text-white cursor-pointer"
                                    : "border-neutral-900 bg-[#070708] text-neutral-600 opacity-50 cursor-default"
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center text-[8.5px] font-extrabold ${
                                  isLast ? "border-[#00f0ff] text-[#00f0ff]" : "border-neutral-800 text-neutral-700"
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </div>
                                <span className="flex-grow">{opt.text}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Diagnostic inline sub-panels */}
                      {isAsst && msg.engineResult && (
                        <div className="mt-4 border-t border-[#3b494b]/20 pt-4 font-mono select-none text-[11px] flex flex-col gap-4">
                          
                          {/* 1. Timer embedded actions overlay */}
                          {msg.engineResult.outputType === "clarified_action" && (
                            <div className="p-3 bg-[#00f0ff]/5 border border-[#00f0ff]/20 flex flex-col sm:flex-row justify-between items-center gap-3">
                              <div className="text-left">
                                <span className="font-extrabold text-white text-[8.5px] uppercase tracking-wider block mb-0.5">Execution focus loop</span>
                                <p className="text-neutral-400 text-[10px] font-sans italic">{msg.engineResult.actionItem || "Commence designated session checkpoint"}</p>
                                {msg.engineResult.actionEstimate && (
                                  <span className="text-[#00f0ff] font-bold text-[8px] mt-1 inline-flex items-center gap-1 bg-[#00f0ff]/10 px-1.5 py-0.2 uppercase border border-[#00f0ff]/10">
                                    <Zap size={8} /> Reward: {msg.engineResult.actionEstimate}
                                  </span>
                                )}
                              </div>

                              <div className="bg-neutral-950 p-2 border border-neutral-900 flex items-center gap-3 shrink-0">
                                <div className="flex flex-col items-center">
                                  <span className="text-[7px] text-neutral-500 uppercase tracking-widest leading-none mb-0.5 font-bold">Timer Left</span>
                                  <span className="font-mono text-sm font-black text-white">{formatTimer(timeLeft)}</span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => {
                                      setTimerActive(!timerActive);
                                      setActiveTimerMsgId(msg.id);
                                    }}
                                    className="p-1 border border-neutral-700 hover:border-[#00f0ff] text-white transition-all cursor-pointer bg-neutral-900"
                                  >
                                    {timerActive && activeTimerMsgId === msg.id ? <Pause size={10} /> : <Play size={10} />}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setTimerActive(false);
                                      setTimeLeft(timerTotal);
                                    }}
                                    className="p-1 border border-neutral-700 hover:border-red-400 text-white transition-all cursor-pointer bg-neutral-900"
                                  >
                                    <RotateCcw size={10} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. Structured Checklists */}
                          {msg.engineResult.outputType === "structured_breakdown" && msg.engineResult.steps && msg.engineResult.steps.length > 0 && (
                            <div className="space-y-1.5 mt-1 text-left">
                              <span className="text-[8.5px] font-extrabold text-neutral-400 uppercase tracking-widest block mb-1.5">
                                SEQUENCE TARGET CHECKLIST:
                              </span>
                              {msg.engineResult.steps.map((step, idx) => {
                                const isChecked = !!checkedSteps[msg.id]?.[idx];
                                return (
                                  <div 
                                    key={idx}
                                    onClick={() => toggleInlineStep(msg.id, idx, msg.engineResult?.steps.length || 0)}
                                    className={`flex items-start gap-2.5 p-2 border cursor-pointer transition-all ${
                                      isChecked 
                                        ? "bg-[#00f0ff]/5 border-[#00f0ff]/20 text-white/30 line-through" 
                                        : "bg-[#060607] border-neutral-800 hover:border-neutral-700 text-neutral-200"
                                    }`}
                                  >
                                    <div className={`mt-0.5 w-3.5 h-3.5 border flex items-center justify-center text-[8.5px] font-bold ${
                                      isChecked ? "border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff]" : "border-neutral-800 text-neutral-500"
                                    }`}>
                                      {isChecked ? "✓" : idx + 1}
                                    </div>
                                    <span className="font-sans text-[11px] leading-tight flex-grow">{step}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* 3. Corrective behavior reflections box */}
                          {msg.engineResult.outputType === "micro_reflection" && (
                            <div className="p-3 bg-red-500/5 border border-red-500/15 flex flex-col gap-2 text-left">
                              <div className="flex items-center gap-1 text-red-400 text-[8.5px] font-bold uppercase select-none">
                                <ShieldAlert size={10} /> BEHAVORIAL COGNITIVE RECONQUEST FLIGHT
                              </div>
                              
                              {!submittedReflections[msg.id] ? (
                                <div className="flex flex-col gap-2">
                                  <p className="text-neutral-300 font-sans text-[10.5px]">Isolate failure vector: what specific event triggered focus drift?</p>
                                  <textarea
                                    value={reflectionAnswers[msg.id] || ""}
                                    onChange={(e) => setReflectionAnswers({ ...reflectionAnswers, [msg.id]: e.target.value })}
                                    placeholder="Input sincere breakdown report..."
                                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-400 focus:outline-none text-white font-sans text-[11px] p-2 rounded-none transition-colors h-14 resize-none"
                                  />
                                  <button
                                    onClick={() => handleInlineReflectionSubmit(msg.id)}
                                    disabled={!(reflectionAnswers[msg.id] || "").trim()}
                                    className="self-end px-3 py-1 bg-neutral-900 border border-neutral-700 hover:border-red-400 text-white text-[8.5px] font-bold uppercase rounded-none cursor-pointer"
                                  >
                                    STORE REFLECTION INSIGHT
                                  </button>
                                </div>
                              ) : (
                                <div className="p-2 bg-red-500/10 border border-red-500/20 text-[#ffb4ab] font-sans text-[10.5px]">
                                  ✓ Reflection logged. Traits alignment updated. Focus barriers clear.
                                </div>
                              )}
                            </div>
                          )}

                          {/* 4. Logic flowchart map */}
                          {msg.engineResult.flowchart && msg.engineResult.flowchart.nodes && (
                            <div className="border border-[#3b494b]/20 bg-neutral-950 p-3 mt-1 rounded-none text-left">
                              <div className="text-[8.5px] uppercase tracking-widest text-neutral-500 block mb-2 font-bold">
                                REAL-TIME DYNAMIC LOGIC GRAPHER
                              </div>
                              
                              <div className="flex flex-col gap-3 py-1 overflow-x-auto">
                                {msg.engineResult.flowchart.nodes.map((node, i) => (
                                  <div key={node.id} className="flex flex-col items-start w-full">
                                    <div className={`p-2 border text-left w-full ${
                                      node.type === "productive" ? "border-green-500/30 bg-green-500/5 text-green-300" :
                                      node.type === "distraction" ? "border-red-500/30 bg-red-500/5 text-red-300" :
                                      node.type === "bottleneck" ? "border-orange-500/30 bg-orange-500/5 text-orange-300" :
                                      node.type === "action" ? "border-[#00f0ff]/30 bg-[#00f0ff]/5 text-[#7df4ff]" :
                                      "border-neutral-800 bg-[#0e0e0f]"
                                    }`}>
                                      <div className="flex justify-between items-center mb-0.5 text-[8px]">
                                        <span className="font-extrabold uppercase">{node.label}</span>
                                        <span className="text-neutral-500 font-bold">{node.time_spent}</span>
                                      </div>
                                      <p className="text-[9.5px] text-neutral-400 font-sans leading-tight">{node.description}</p>
                                    </div>

                                    {i < (msg.engineResult?.flowchart?.nodes.length || 0) - 1 && (
                                      <div className="flex items-center gap-1.5 text-neutral-500 px-3 py-1.5 select-none">
                                        <span className="text-[11px] font-black">↓</span>
                                        <span className="text-[7.5px] font-bold tracking-wider uppercase text-neutral-600">
                                          {msg.engineResult?.flowchart?.edges?.[i]?.label || "TRIGGER"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Telemetry deltas display removed */}

                        </div>
                      )}

                    </div>
                  </div>
                </div>
              );
            })}

            {isProcessing && (
              <div className="self-start flex gap-3 text-left max-w-[80%]">
                <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center border border-[#00f0ff]/30 bg-[#00f0ff]/5 text-[#00f0ff] animate-spin">
                  <Cpu size={12} className="animate-pulse" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[7px] text-neutral-500 select-none uppercase font-extrabold">MAVERICK REASONING PIPELINE...</span>
                  <div className="p-3.5 border border-[#00f0ff]/20 bg-[#0d0d0f]/90 text-[#00f0ff] font-mono text-[10px]">
                    <p className="animate-pulse flex items-center gap-1.5">
                      <Loader2 size={11} className="animate-spin text-[#00f0ff]" />
                      {pipelinePhase}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll to Top button */}
          {showScrollToTop && (
            <button
              type="button"
              onClick={() => {
                chatContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="absolute top-4 right-6 z-30 p-2 border border-[#00f0ff]/40 bg-[#0c0c0e]/95 text-[#00f0ff] hover:bg-[#00f0ff]/10 hover:text-white transition-all cursor-pointer flex items-center gap-1 shadow-lg select-none text-[8px] font-bold uppercase tracking-wider"
              title="Scroll to Top"
            >
              <ChevronUp size={11} />
              <span>SCROLL TO TOP</span>
            </button>
          )}

          {/* ACTIVE UTILITIES DRAWERS */}
          {showAttachmentMenu && (
            <div className="p-3 bg-[#0d0d10] border-t border-[#3b494b]/50 border-b border-[#3b494b]/15 flex flex-col gap-2.5 text-left transition-all font-mono z-30">
              <div className="flex justify-between items-center select-none">
                <span className="text-[8.5px] uppercase font-black text-[#00f0ff] tracking-widest flex items-center gap-1.5 animate-pulse">
                  <Cpu size={10} /> MAVERICK SUBSYSTEM ATTACHMENTS
                </span>
                <button type="button" onClick={() => setShowAttachmentMenu(false)} className="text-neutral-500 hover:text-white"><X size={12} /></button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 border border-neutral-800 hover:border-[#00f0ff] bg-neutral-900 text-neutral-400 hover:text-[#00f0ff] text-[8px] py-1.5 transition-all cursor-pointer font-bold"
                >
                  <ImageIcon size={10} className="text-[#00f0ff]" />
                  <span>UPLOAD IMAGE SCAN</span>
                </button>
                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 border border-neutral-800 hover:border-[#ffcb7c] bg-neutral-900 text-neutral-400 hover:text-[#ffcb7c] text-[8px] py-1.5 transition-all cursor-pointer font-bold"
                >
                  <FileImage size={10} className="text-[#ffcb7c]" />
                  <span>INJECT LOG FILES</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Attached scan element headers preview */}
          {attachedImage && (
            <div className="px-3 py-2 bg-[#09090b] border-t border-[#3b494b]/30 border-b border-neutral-900 flex justify-between items-center text-left shrink-0 select-none">
              <div className="flex items-center gap-2 max-w-[80%]">
                <img src={attachedImage} alt="Thumbnail Scan" className="w-8 h-8 object-cover border border-[#00f0ff]/20" />
                <div className="overflow-hidden">
                  <span className="block text-[8.5px] text-[#00f0ff] font-extrabold truncate uppercase">{attachedImageName}</span>
                  <span className="block text-[7.5px] text-neutral-500 uppercase">Routing payload via Llama Vision model series</span>
                </div>
              </div>
              <button onClick={() => { setAttachedImage(null); setAttachedImageName(null); }} className="text-red-400 hover:text-red-500 font-bold uppercase text-[8px] border border-red-500/15 py-1 px-2">REMOVE</button>
            </div>
          )}

          {attachedDocContent && (
            <div className="px-3 py-2 bg-[#09090b] border-t border-[#3b494b]/30 border-b border-neutral-900 flex justify-between items-center text-left shrink-0 select-none">
              <div className="flex items-center gap-2 max-w-[80%]">
                <FileImage size={16} className="text-[#ffcb7c] shrink-0" />
                <div className="overflow-hidden">
                  <span className="block text-[8.5px] text-[#ffcb7c] font-extrabold truncate uppercase">{attachedDocName}</span>
                  <span className="block text-[7.5px] text-neutral-500 uppercase">Injecting text payload ({attachedDocContent.length} bytes)</span>
                </div>
              </div>
              <button onClick={() => { setAttachedDocContent(null); setAttachedDocName(null); }} className="text-red-400 hover:text-red-500 font-bold uppercase text-[8px] border border-red-500/15 py-1 px-2">REMOVE</button>
            </div>
          )}

          {/* INPUT FORM SUBMIT INGESTS */}
          <div className="p-3 bg-[#0c0c0e] border-t border-[#3b494b]/30 relative z-20 shrink-0 flex flex-col gap-1.5 select-none text-left">
            <div className="absolute top-0 left-0 w-[2.5px] h-full bg-[#00f0ff] signal-glow" />
            
            {/* VECTOR STREAM HEADER BAND REMOVED FOR CLEANER LAYOUT */}

            <form onSubmit={handleSendChatMessage} className="flex gap-2.5">
              <input
                type="text"
                hidden
                style={{ display: "none" }}
                className="hidden"
              />
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

              <button
                type="button"
                onClick={() => {
                  setShowAttachmentMenu(!showAttachmentMenu);
                }}
                className={`border px-2.5 rounded-none transition-all flex items-center justify-center cursor-pointer bg-neutral-900 border-neutral-800 ${
                  showAttachmentMenu ? "border-[#00f0ff] text-[#00f0ff]" : "text-neutral-500 hover:text-white hover:border-neutral-700"
                }`}
                title="Log entry files, image scan, attachments"
              >
                <Plus size={14} className={showAttachmentMenu ? "rotate-45 transition-transform duration-300" : "transition-transform duration-300"} />
              </button>

              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isProcessing}
                placeholder="Initiate prompt stream, upload logs, describe bottlenecks, or input code/analytical tasks..."
                className="flex-grow bg-[#111112] border border-[#3b494b]/30 focus:border-[#00f0ff] focus:outline-none text-white font-mono text-xs px-3 py-3 rounded-none placeholder:text-neutral-700 select-text"
              />

              <button
                type="submit"
                disabled={isProcessing || !userInput.trim()}
                className="bg-[#00f0ff] hover:bg-[#5cf2fb] disabled:bg-neutral-950 disabled:border-neutral-900 disabled:text-neutral-700 text-black font-mono text-xs tracking-widest uppercase font-black px-5 rounded-none transition-all active:scale-95 flex items-center justify-center gap-1 shrink-0 border-none cursor-pointer"
              >
                <span>SEND</span>
                <Send size={11} />
              </button>
            </form>
            {/* TELEMETRY BAR SIDEBAR REMOVED TO ADHERE TO LAYOUT INSTRUCTIONS */}
          </div>

          {/* Floating Focus Timer Widget */}
          <FocusTimerPlugin />
        </div>

      </div>

    </div>
  );
}
