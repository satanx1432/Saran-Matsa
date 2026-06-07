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
  Sliders,
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
  SlidersHorizontal,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

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

// Custom Cyberpunk Vector Logo Generator
const generateCyberpunkLogoSvg = (concept: string, color: string, style: string): string => {
  const hexColor = color;
  const strokeWidth = 2;
  let paths = "";
  
  if (style === "eye") {
    paths = `
      <circle cx="60" cy="60" r="48" stroke="${hexColor}" stroke-width="1" stroke-dasharray="3,3" fill="none" opacity="0.3" />
      <circle cx="60" cy="60" r="42" stroke="${hexColor}" stroke-width="1.5" fill="none" opacity="0.6" />
      <circle cx="60" cy="60" r="28" stroke="${hexColor}" stroke-width="0.8" stroke-dasharray="1,2" fill="none" />
      <path d="M 18,60 C 35,26 85,26 102,60 C 85,94 35,94 18,60 Z" stroke="${hexColor}" stroke-width="${strokeWidth}" fill="none" />
      <circle cx="60" cy="60" r="14" stroke="${hexColor}" stroke-width="2" fill="none" />
      <circle cx="60" cy="60" r="6" fill="${hexColor}" />
      <line x1="60" y1="5" x2="60" y2="15" stroke="${hexColor}" stroke-width="2" />
      <line x1="60" y1="105" x2="60" y2="115" stroke="${hexColor}" stroke-width="2" />
      <line x1="5" y1="60" x2="15" y2="60" stroke="${hexColor}" stroke-width="2" />
      <line x1="105" y1="60" x2="115" y2="60" stroke="${hexColor}" stroke-width="2" />
      <path d="M 8,20 L 8,8 L 20,8" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <path d="M 112,20 L 112,8 L 100,8" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <path d="M 8,100 L 8,112 L 20,112" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <path d="M 112,100 L 112,112 L 100,112" stroke="${hexColor}" stroke-width="1.5" fill="none" />
    `;
  } else if (style === "wolf") {
    paths = `
      <polygon points="60,20 40,50 60,65" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <polygon points="60,20 80,50 60,65" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <polygon points="40,50 22,42 30,68" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <polygon points="80,50 98,42 90,68" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <polygon points="40,50 60,65 30,68" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <polygon points="80,50 60,65 90,68" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <polygon points="30,68 60,65 60,95" stroke="${hexColor}" stroke-width="2" fill="none" />
      <polygon points="90,68 60,65 60,95" stroke="${hexColor}" stroke-width="2" fill="none" />
      <polygon points="30,68 15,60 10,85 18,98 30,68" stroke="${hexColor}" stroke-width="1" fill="none" opacity="0.4" />
      <polygon points="90,68 105,60 110,85 102,98 90,68" stroke="${hexColor}" stroke-width="1" fill="none" opacity="0.4" />
      <polygon points="40,50 25,12 45,35" stroke="${hexColor}" stroke-width="1.8" fill="none" />
      <polygon points="80,50 95,12 75,35" stroke="${hexColor}" stroke-width="1.8" fill="none" />
      <polygon points="47,48 55,52 45,54" fill="${hexColor}" />
      <polygon points="73,48 65,52 75,54" fill="${hexColor}" />
      <circle cx="60" cy="95" r="2.5" fill="${hexColor}" />
    `;
  } else if (style === "shield") {
    paths = `
      <polygon points="60,10 105,32 105,88 60,110 15,88 15,32" stroke="${hexColor}" stroke-width="2.5" fill="none" />
      <polygon points="60,18 97,36 97,84 60,102 23,84 23,36" stroke="${hexColor}" stroke-width="1" fill="none" opacity="0.4" stroke-dasharray="2,2" />
      <line x1="60" y1="25" x2="60" y2="55" stroke="${hexColor}" stroke-width="2" />
      <circle cx="60" cy="55" r="4" fill="${hexColor}" />
      <line x1="60" y1="55" x2="40" y2="70" stroke="${hexColor}" stroke-width="1.8" />
      <circle cx="40" cy="70" r="3" fill="${hexColor}" />
      <line x1="60" y1="55" x2="80" y2="70" stroke="${hexColor}" stroke-width="1.8" />
      <circle cx="80" cy="70" r="3" fill="${hexColor}" />
      <line x1="40" y1="70" x2="40" y2="92" stroke="${hexColor}" stroke-width="1.5" />
      <circle cx="40" cy="92" r="2" fill="${hexColor}" />
      <line x1="80" y1="70" x2="80" y2="92" stroke="${hexColor}" stroke-width="1.5" />
      <circle cx="80" cy="92" r="2" fill="${hexColor}" />
      <rect x="52" y="73" width="16" height="12" rx="1" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <path d="M 56,73 L 56,69 C 56,66 64,66 64,69 L 64,73" stroke="${hexColor}" stroke-width="1.5" fill="none" />
    `;
  } else if (style === "node") {
    paths = `
      <ellipse cx="60" cy="60" rx="46" ry="16" stroke="${hexColor}" stroke-width="1.5" fill="none" transform="rotate(30 60 60)" />
      <ellipse cx="60" cy="60" rx="46" ry="16" stroke="${hexColor}" stroke-width="1.5" fill="none" transform="rotate(-30 60 60)" />
      <ellipse cx="60" cy="60" rx="46" ry="16" stroke="${hexColor}" stroke-width="1" fill="none" transform="rotate(90 60 60)" opacity="0.4" />
      <rect x="42" y="42" width="36" height="36" stroke="${hexColor}" stroke-width="2.5" fill="#070708" />
      <rect x="48" y="48" width="24" height="24" stroke="${hexColor}" stroke-width="1" stroke-dasharray="2,1" fill="none" />
      <line x1="60" y1="12" x2="60" y2="42" stroke="${hexColor}" stroke-width="1" stroke-dasharray="2,2" />
      <line x1="60" y1="78" x2="60" y2="108" stroke="${hexColor}" stroke-width="1" stroke-dasharray="2,2" />
      <line x1="12" y1="60" x2="42" y2="60" stroke="${hexColor}" stroke-width="1" stroke-dasharray="2,2" />
      <line x1="78" y1="60" x2="108" y2="60" stroke="${hexColor}" stroke-width="1" stroke-dasharray="2,2" />
      <circle cx="60" cy="60" r="5" fill="${hexColor}" />
      <circle cx="60" cy="12" r="4" fill="${hexColor}" />
      <circle cx="60" cy="108" r="4" fill="${hexColor}" />
      <circle cx="12" cy="60" r="4" fill="${hexColor}" />
      <circle cx="108" cy="60" r="4" fill="${hexColor}" />
      <text x="60" y="64" font-family="monospace" font-size="5" fill="#ffffff" font-weight="bold" text-anchor="middle">CPU</text>
    `;
  } else {
    // Default Iconic HASEX Operational Crest
    paths = `
      <circle cx="60" cy="60" r="52" stroke="${hexColor}" stroke-width="2.5" fill="none" />
      <circle cx="60" cy="60" r="46" stroke="${hexColor}" stroke-width="0.8" stroke-dasharray="3,1" fill="none" opacity="0.7" />
      <path d="M 30,42 L 90,42 M 30,78 L 90,78" stroke="${hexColor}" stroke-width="1" opacity="0.3" stroke-dasharray="2,2" />
      <path d="M 42,30 L 42,90 M 78,30 L 78,90" stroke="${hexColor}" stroke-width="1" opacity="0.3" stroke-dasharray="2,2" />
      <path d="M 35,46 L 35,74 M 47,46 L 47,74 M 35,60 L 47,60" stroke="${hexColor}" stroke-width="3" stroke-linecap="square" />
      <path d="M 54,74 L 59,46 L 66,74 M 55,64 L 64,64" stroke="${hexColor}" stroke-width="3" stroke-linecap="square" fill="none" />
      <path d="M 72,49 C 76,45 83,45 87,49 C 91,53 88,58 82,60 C 76,62 73,67 77,71 C 81,75 88,75 92,71" stroke="${hexColor}" stroke-width="3" stroke-linecap="square" fill="none" />
      <rect x="42" y="86" width="36" height="8" fill="${hexColor}" rx="1" />
      <text x="60" y="93" font-family="monospace" font-size="6" fill="#000000" font-weight="black" text-anchor="middle">MVK_v1.0</text>
      <circle cx="60" cy="18" r="1.5" fill="${hexColor}" />
      <circle cx="48" cy="20" r="1.5" fill="${hexColor}" />
      <circle cx="72" cy="20" r="1.5" fill="${hexColor}" />
    `;
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" style="width:100%; height:100%;">
    <rect width="120" height="120" fill="#070708" rx="4" />
    ${paths}
  </svg>`;
};

export default function MaverickEngine() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [userInput, setUserInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelinePhase, setPipelinePhase] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [collapseTraits, setCollapseTraits] = useState(false);
  
  // RAG / NIM API configuration keys
  const [showKeysConfig, setShowKeysConfig] = useState(false);
  const [embeddingKey, setEmbeddingKey] = useState(() => localStorage.getItem("rag_embedding_key") || "");
  const [vectorDbKey, setVectorDbKey] = useState(() => localStorage.getItem("rag_vector_db_key") || "");
  const [llmKey, setLlmKey] = useState(() => localStorage.getItem("rag_llm_key") || "");

  // Channel selections & modes
  const [activeChannel, setActiveChannel] = useState<"diagnostic" | "cascade">("diagnostic");
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

  // Logo Maker States
  const [showLogoMaker, setShowLogoMaker] = useState(false);
  const [logoConcept, setLogoConcept] = useState("");
  const [logoColor, setLogoColor] = useState("#00f0ff");
  const [logoStyle, setLogoStyle] = useState("logo");
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [logoLogMessage, setLogoLogMessage] = useState("");

  // Google Forms Deployer States
  const [showFormsMaker, setShowFormsMaker] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBlockerQuestion, setFormBlockerQuestion] = useState("What was your primary focal bottleneck today?");
  const [formQuizQuestion, setFormQuizQuestion] = useState("On a scale of 1-10, how clear is your execution target?");
  const [isDeployingForm, setIsDeployingForm] = useState(false);
  const [deployedFormLink, setDeployedFormLink] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
              setActiveChannel(activeThr.channel || "diagnostic");
              setActiveMode(activeThr.mode || "learn");
            }
          } else {
            setActiveThreadId(parsed[0].id);
            setActiveChannel(parsed[0].channel || "diagnostic");
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
    scrollToBottom();
  }, [threads, activeThreadId, isProcessing, showAttachmentMenu, showLogoMaker, showFormsMaker]);

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
      content: "System initialized. Welcome to HASEX OS // MAVERICK Command Intel.\n\nI am MAVERICK AI, your execution-oriented guide vector. Toggle between the 'DIAGNOSTIC ASSESSMENT' channel to build your cognitive profile and traits, or use 'CASCADE ALGORITHM CHANNELS' to consult specialized neural cascades.",
      timestamp: new Date().toISOString()
    };
    const newThread: ChatThread = {
      id: `thr-${Date.now()}`,
      title: "Diagnostic Connection 01",
      createdAt: new Date().toISOString(),
      channel: "diagnostic",
      mode: "learn",
      messages: [defaultMsg]
    };
    const combined = [newThread];
    setThreads(combined);
    setActiveThreadId(newThread.id);
    setActiveChannel("diagnostic");
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
        : `Autonomous Maverick Cascade activated in mode: **${selMode.toUpperCase()}**.\n\nReady to analyze messy logs, scan schemas, construct layouts, and compile models using selective cascading parameters. Input your instructions:`,
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

  // Google Forms real deploy implementation
  const handleDeployGoogleForm = async () => {
    setIsDeployingForm(true);
    setDeployError(null);
    setDeployedFormLink(null);

    const token = localStorage.getItem("hasex_google_access_token");
    if (!token) {
      setDeployError("Authorized Access Token missing. Complete Google Sign-In on the PROFILE page.");
      setIsDeployingForm(false);
      return;
    }

    try {
      const createResponse = await fetch("https://forms.googleapis.com/v1/forms", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          info: {
            title: formTitle || "MAVERICK Mental Friction Audit Survey",
            documentTitle: "MAVERICK OS Dynamic Form"
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Google Form Rejected: ${createResponse.statusText}`);
      }

      const formObj = await createResponse.json();
      const formId = formObj.formId;
      const responderUri = formObj.responderUri;

      const updateResponse = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              createItem: {
                item: {
                  title: formBlockerQuestion,
                  questionItem: {
                    question: {
                      required: true,
                      textQuestion: {}
                    }
                  }
                },
                location: { index: 0 }
              }
            },
            {
              createItem: {
                item: {
                  title: formQuizQuestion,
                  questionItem: {
                    question: {
                      required: true,
                      textQuestion: {}
                    }
                  }
                },
                location: { index: 1 }
              }
            }
          ]
        })
      });

      if (!updateResponse.ok) {
        throw new Error(`Fields update failed: ${updateResponse.statusText}`);
      }

      setDeployedFormLink(responderUri);
      
      // Inject details into the chat thread
      const formSuccessMsg: ChatMessage = {
        id: `form-${Date.now()}-assistant`,
        role: "assistant",
        content: `### [GOOGLE FORMS DEPLOYED SUCCESS]\n\nA cognitive survey form has been mapped and deployed straight into your Google Workspace account.\n\n* **Form Title:** "${formTitle || "MAVERICK Audit Survey"}"\n* **Form URL:** [Access Deployed Google Form](${responderUri})\n* **Direct Action:** Distribute this questionnaire link to your team or complete the checkpoint report yourself. Outputs are saved in secure Drive spreadsheets instantly!`,
        timestamp: new Date().toISOString()
      };

      const updatedMessages = [...(activeThread?.messages || []), formSuccessMsg];
      const updatedThreads = threads.map(t => {
        if (t.id === activeThreadId) {
          return { ...t, messages: updatedMessages };
        }
        return t;
      });
      setThreads(updatedThreads);
      saveThreadsToStorage(updatedThreads, activeThreadId);

      setShowFormsMaker(false);
      setShowAttachmentMenu(false);
    } catch (err: any) {
      setDeployError(err.message || "Failed to establish Google API authorization channel.");
    } finally {
      setIsDeployingForm(false);
    }
  };

  // SVG Logo builder dispatch
  const handleTriggerLogoBuild = () => {
    if (isGeneratingLogo) return;
    setIsGeneratingLogo(true);
    setLogoLogMessage("INIT_VECTOR_SEED // Connecting branding core...");
    
    setTimeout(() => {
      setLogoLogMessage("GRID_ALIGN // Aligning HUD coordinate tables...");
      setTimeout(() => {
        setLogoLogMessage("GLYPH_INJECT // Overlaying custom color lasers...");
        setTimeout(() => {
          const finalSvg = generateCyberpunkLogoSvg(logoConcept, logoColor, logoStyle);
          const conceptText = logoConcept.trim() || "MAVERICK CREST";

          const userMsg: ChatMessage = {
            role: "user",
            content: `Engage Creative Vector Machine. Construct professional agent branding logo insignia for conceptual seed "${conceptText}" using ${logoStyle.toUpperCase()} layout pattern with Accent: ${logoColor}.`,
            id: `logo-user-${Date.now()}`,
            timestamp: new Date().toISOString()
          };

          const asstMsg: ChatMessage = {
            role: "assistant",
            content: `### [MAVERICK CREATIVE VECTOR INSIGNIA] // COMPILED\nYour custom visual agent credential badge is built and ready for telemetry download.\n\n* **Seed Concept:** "${conceptText}"\n* **Vector Structural Style:** ${logoStyle.toUpperCase()}\n* **Accent Tone:** ${logoColor}\n* **Status:** Operational Integrity Secure (100% vector mapping)`,
            logoSvg: finalSvg,
            id: `logo-asst-${Date.now()}`,
            timestamp: new Date().toISOString()
          };

          const updatedMessages = [...(activeThread?.messages || []), userMsg, asstMsg];
          const updatedThreads = threads.map(t => {
            if (t.id === activeThreadId) {
              return { ...t, messages: updatedMessages };
            }
            return t;
          });
          setThreads(updatedThreads);
          saveThreadsToStorage(updatedThreads, activeThreadId);

          setIsGeneratingLogo(false);
          setLogoLogMessage("");
          setShowLogoMaker(false);
          setShowAttachmentMenu(false);
          setLogoConcept("");
        }, 800);
      }, 700);
    }, 700);
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

  // Submit standard chat message
  const handleSendChatMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const promptToSend = userInput.trim();
    if (!promptToSend || isProcessing) return;

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
        const assistMsg: ChatMessage = {
          id: assistMsgId,
          role: "assistant",
          content: data.responseText,
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

        // Reward study/coding action points in cascade
        const incremental = { ...traits };
        if (activeMode === "code") {
          incremental.action = Math.min(1.0, incremental.action + 0.02);
          incremental.discipline = Math.min(1.0, incremental.discipline + 0.01);
        } else if (activeMode === "learn") {
          incremental.learning = Math.min(1.0, incremental.learning + 0.03);
          incremental.awareness = Math.min(1.0, incremental.awareness + 0.01);
        } else if (activeMode === "journal") {
          incremental.awareness = Math.min(1.0, incremental.awareness + 0.03);
          incremental.persistence = Math.min(1.0, incremental.persistence + 0.01);
        } else if (activeMode === "brainstorm") {
          incremental.courage = Math.min(1.0, incremental.courage + 0.02);
          incremental.learning = Math.min(1.0, incremental.learning + 0.01);
        }
        saveTraitsRegistry(incremental);

        const assistMsg: ChatMessage = {
          id: `asst-cascade-${Date.now()}`,
          role: "assistant",
          content: data.content || "Neural gateway returned blank connection response.",
          timestamp: new Date().toISOString()
        };

        const finalizedMsgs = [...updatedThreadMessages, assistMsg];
        const finalizedThreads = threads.map(t => {
          if (t.id === activeThreadId) {
            return { ...t, messages: finalizedMsgs };
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
        content: `### [MAVERICK UPLINK ERROR]\n\nYour telemetry router reports a core pipeline socket exception. Let's isolate active objectives manually:\n\n* **Mode:** ${activeMode.toUpperCase()}\n* **Vector Channel:** ${activeChannel.toUpperCase()}\n\nState clearly: what single operational click or function gets you forward now?`,
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
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col font-mono text-xs select-none relative bg-[#070708]">
      
      {/* HEADER HUD COAX CONTROL LAYOUT PANEL */}
      <div className="flex flex-col md:flex-row justify-between items-stretch border-b border-[#3b494b]/30 bg-[#0c0c0e] shrink-0 relative z-30 select-none">
        
        {/* Core Channel toggle selectors */}
        <div className="flex flex-grow border-b md:border-b-0 border-[#3b494b]/15">
          <button
            onClick={() => {
              setActiveChannel("diagnostic");
              const currentT = threads.find(t => t.id === activeThreadId);
              if (currentT) {
                const updated = threads.map(t => t.id === activeThreadId ? { ...t, channel: "diagnostic" as const } : t);
                setThreads(updated);
                saveThreadsToStorage(updated, activeThreadId);
              }
            }}
            className={`flex-grow py-3 px-4 font-bold tracking-widest text-[9.5px] uppercase transition-all cursor-pointer text-center ${
              activeChannel === "diagnostic"
                ? "bg-[#00f0ff]/10 text-[#00f0ff] border-b-2 border-b-[#00f0ff] font-black"
                : "text-[#b9cacb]/40 hover:text-white hover:bg-[#111]"
            }`}
          >
            🛠️ Profiler Evaluator
          </button>
          <button
            onClick={() => {
              setActiveChannel("cascade");
              const currentT = threads.find(t => t.id === activeThreadId);
              if (currentT) {
                const updated = threads.map(t => t.id === activeThreadId ? { ...t, channel: "cascade" as const } : t);
                setThreads(updated);
                saveThreadsToStorage(updated, activeThreadId);
              }
            }}
            className={`flex-grow py-3 px-4 font-bold tracking-widest text-[9.5px] uppercase transition-all cursor-pointer text-center ${
              activeChannel === "cascade"
                ? "bg-[#c57cff]/10 text-[#c57cff] border-b-2 border-b-[#c57cff] font-black"
                : "text-[#b9cacb]/40 hover:text-white hover:bg-[#111]"
            }`}
          >
            🎓 Cascade Canals
          </button>
        </div>

        {/* Sync Controls / Config drawers */}
        <div className="flex items-center justify-between md:justify-end px-3 py-2 md:py-0 gap-3 border-t md:border-t-0 border-[#3b494b]/15 shrink-0 bg-black/40">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-[#b9cacb] hover:text-[#00f0ff] hover:border-[#00f0ff]/40 text-[8.5px] font-bold uppercase select-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <History size={10} />
            <span>CHATS LOGS ({threads.length})</span>
          </button>

          <button
            onClick={() => handleCreateNewThread(activeChannel, activeMode)}
            className="px-2.5 py-1 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 border border-[#00f0ff]/45 text-[#00f0ff] text-[8.5px] font-black uppercase transition-all"
            title="Launch brand new attention thread"
          >
            <Plus size={9} />
          </button>
        </div>
      </div>

      {/* CASCADE SPECIFIC SUBMODE TABS ROW */}
      {activeChannel === "cascade" && (
        <div className="bg-[#0b0c0d] border-b border-[#3b494b]/20 px-4 py-2 flex items-center gap-1.5 shrink-0 overflow-x-auto select-none">
          <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest shrink-0 mr-2">CASCADE VECTOR:</span>
          {[
            { id: "learn", label: "🎓 Learn / Study", color: "hover:border-[#00f0ff] text-[#00f0ff]", border: "border-[#00f0ff]/40 bg-[#00f0ff]/5 text-[#ffcb7c]" },
            { id: "code", label: "💻 Create Code", color: "hover:border-[#c57cff] text-[#c57cff]", border: "border-[#c57cff]/40 bg-[#c57cff]/5 text-[#c57cff]" },
            { id: "brainstorm", label: "🧠 Brainstorm", color: "hover:border-[#ff9f1c] text-[#ff9f1c]", border: "border-[#ff9f1c]/40 bg-[#ff9f1c]/5 text-[#ff9f1c]" },
            { id: "journal", label: "📓 Experience Journal", color: "hover:border-[#1ca8ff] text-[#1ca8ff]", border: "border-[#1ca8ff]/40 bg-[#1ca8ff]/5 text-[#1ca8ff]" }
          ].map(m => {
            const isSel = activeMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveMode(m.id as any);
                  const thread = threads.find(t => t.id === activeThreadId);
                  if (thread) {
                    const updated = threads.map(t => t.id === activeThreadId ? { ...t, mode: m.id as any } : t);
                    setThreads(updated);
                    saveThreadsToStorage(updated, activeThreadId);
                  }
                }}
                className={`px-3 py-1 border text-[9px] font-extrabold uppercase transition-all tracking-wider cursor-pointer ${
                  isSel ? m.border : "border-[#3b494b]/30 bg-black/40 text-neutral-400 group hover:bg-neutral-900"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      )}

      {/* PERSISTED ATTENTION LOGS SIDEBAR */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="absolute inset-0 bg-black z-40"
            />
            <motion.div 
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "tween", duration: 0.25 }}
              className="absolute right-0 top-0 bottom-0 w-[280px] sm:w-[330px] bg-[#09090b] border-l border-[#3b494b]/40 z-50 flex flex-col text-left select-none"
            >
              <div className="p-4 border-b border-[#3b494b]/30 bg-[#0d0d10] flex justify-between items-center shrink-0">
                <span className="font-extrabold text-[9.5px] uppercase tracking-widest text-[#00f0ff] flex items-center gap-1.5">
                  <FolderOpen size={11} /> HISTORIC CHANNELS REGISTERED
                </span>
                <button onClick={() => setShowHistory(false)} className="text-neutral-500 hover:text-neutral-300 text-[10px] font-bold uppercase cursor-pointer">CLOSE</button>
              </div>

              <div className="flex-grow overflow-y-auto divide-y divide-neutral-900 bg-[#070708]">
                {threads.length === 0 ? (
                  <div className="p-8 text-center text-neutral-600">Empty.</div>
                ) : (
                  threads.map(t => {
                    const isActive = t.id === activeThreadId;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          setActiveThreadId(t.id);
                          setActiveChannel(t.channel || "diagnostic");
                          setActiveMode(t.mode || "learn");
                          saveThreadsToStorage(threads, t.id);
                          setShowHistory(false);
                        }}
                        className={`p-3.5 cursor-pointer text-left transition-all flex items-center justify-between gap-3 group ${
                          isActive ? "bg-[#00f0ff]/5 border-r-2 border-r-[#00f0ff]" : "hover:bg-neutral-900/60"
                        }`}
                      >
                        <div className="min-w-0 flex flex-col gap-1">
                          <span className={`text-[10.5px] font-bold block truncate ${isActive ? "text-[#00f0ff]" : "text-neutral-300"}`}>
                            {t.title}
                          </span>
                          <span className="text-[7.5px] text-neutral-500 uppercase tracking-wider block">
                            {t.channel === "diagnostic" ? "🛠️ PROFILER" : `🎓 CASCADE: ${t.mode?.toUpperCase()}`} • {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteThread(t.id, e)}
                          className="p-1 text-neutral-700 hover:text-red-400 opacity-20 group-hover:opacity-100 transition-opacity rounded-none cursor-pointer"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CORE SPLIT WORKSPACE: LEFT CHAT PANEL + RIGHT TRAITS KPI HUD */}
      <div className="flex-grow flex items-stretch overflow-hidden relative">
        
        {/* LEADING INTERACTION CHAT BOX */}
        <div className="flex-grow flex flex-col bg-black/10 overflow-hidden relative border-r border-[#3b494b]/15">
          
          {/* MESSAGES LIST SCROLLER */}
          <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-5 select-text">
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
                    {isAsst ? <Bot size={13} /> : <User size={13} />}
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

                          {/* Inline delta changes report */}
                          <div className="border-t border-[#3b494b]/10 pt-2 flex flex-wrap gap-1.5 items-center text-[7px] text-neutral-500 select-none">
                            <span className="uppercase font-bold tracking-wider">TELEMETRY DELTAS:</span>
                            {msg.engineResult.traitUpdates && Object.entries(msg.engineResult.traitUpdates).some(([_, v]) => v !== 0) ? (
                              Object.entries(msg.engineResult.traitUpdates).map(([k, v]) => {
                                const delta = v as number;
                                if (delta === 0) return null;
                                return (
                                  <span key={k} className={`px-1 rounded-none font-bold uppercase bg-neutral-900 border ${delta > 0 ? "border-[#00f0ff]/20 text-[#00f0ff]" : "border-red-500/20 text-red-400"}`}>
                                    {k} {delta > 0 ? "+" : ""}{delta.toFixed(2)}
                                  </span>
                                );
                              })
                            ) : (
                              <span>NO DELTA SHIFTED</span>
                            )}
                          </div>

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

          {/* ACTIVE UTILITIES DRAWERS (Logo Maker or google Forms) */}
          {showAttachmentMenu && (
            <div className="p-3 bg-[#0d0d10] border-t border-[#3b494b]/50 border-b border-[#3b494b]/15 flex flex-col gap-2.5 text-left transition-all font-mono z-30">
              <div className="flex justify-between items-center select-none">
                <span className="text-[8.5px] uppercase font-black text-[#00f0ff] tracking-widest flex items-center gap-1.5 animate-pulse">
                  <Cpu size={10} /> MAVERICK SUBSYSTEM ATTACHMENTS
                </span>
                <button type="button" onClick={() => setShowAttachmentMenu(false)} className="text-neutral-500 hover:text-white"><X size={12} /></button>
              </div>

              {!showLogoMaker && !showFormsMaker ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    
                    <button
                      type="button"
                      onClick={() => handleCreateNewThread("cascade", "code")}
                      className={`flex flex-col items-center justify-center gap-1 border bg-black/45 p-1 cursor-pointer transition-all h-[54px] ${
                        activeMode === "code" && activeChannel === "cascade"
                          ? "border-[#c57cff] text-[#c57cff] bg-[#c57cff]/5"
                          : "border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <Terminal size={11} className="text-[#c57cff]" />
                      <span className="text-[6.5px] font-bold tracking-widest mt-1">CODE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCreateNewThread("cascade", "learn")}
                      className={`flex flex-col items-center justify-center gap-1 border bg-black/45 p-1 cursor-pointer transition-all h-[54px] ${
                        activeMode === "learn" && activeChannel === "cascade"
                          ? "border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/5"
                          : "border-neutral-800 text-neutral-400 hover:border-neutral-700"
                      }`}
                    >
                      <Search size={11} className="text-[#00f0ff]" />
                      <span className="text-[6.5px] font-bold tracking-widest mt-1">RESEARCH</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLogoMaker(true)}
                      className="flex flex-col items-center justify-center gap-1 border border-neutral-800 hover:border-[#ff9f1c] bg-black/45 text-neutral-400 hover:text-[#ff9f1c] p-1 cursor-pointer transition-all h-[54px]"
                    >
                      <Sparkles size={11} className="text-[#ff9f1c]" />
                      <span className="text-[6.5px] font-bold tracking-widest mt-1">CREATIVE BADGE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowFormsMaker(true)}
                      className="flex flex-col items-center justify-center gap-1 border border-neutral-800 hover:border-[#1ca8ff] bg-black/45 text-neutral-400 hover:text-[#1ca8ff] p-1 cursor-pointer transition-all h-[54px]"
                    >
                      <FileText size={11} className="text-[#1ca8ff]" />
                      <span className="text-[6.5px] font-bold tracking-widest mt-1">FORMS</span>
                    </button>

                  </div>

                  <div className="border-t border-[#3b494b]/15 my-0.5" />

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
              ) : showLogoMaker ? (
                // SVG Vector builder Form
                <div className="flex flex-col gap-2 bg-neutral-950 p-2.5 border border-[#ff9f1c]/30">
                  {isGeneratingLogo ? (
                    <div className="py-4 flex flex-col items-center justify-center gap-2">
                      <Loader2 size={16} className="text-[#ff9f1c] animate-spin" />
                      <span className="text-[9px] text-[#ff9f1c] uppercase tracking-widest animate-pulse">{logoLogMessage}</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-[7.5px] text-neutral-500 uppercase tracking-widest font-black flex items-center gap-1 select-none">
                        <Sparkles size={10} className="text-[#ff9f1c]" /> BRAND IDENTITY VECTOR INSIGNIA GENERATION
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                        <div className="flex flex-col gap-1">
                          <span className="text-[7.5px] text-neutral-500">Seed name text:</span>
                          <input
                            type="text"
                            value={logoConcept}
                            onChange={(e) => setLogoConcept(e.target.value)}
                            placeholder="Enter insignia text..."
                            className="bg-[#111] border border-neutral-800 focus:border-[#ff9f1c] focus:outline-none p-1.5 text-[10px] text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[7.5px] text-neutral-500">Insignia design style:</span>
                          <div className="grid grid-cols-5 gap-1">
                            {[
                              { id: "eye", label: "EYE" },
                              { id: "wolf", label: "WOLF" },
                              { id: "shield", label: "SHIELD" },
                              { id: "node", label: "CPU" },
                              { id: "logo", label: "OS" }
                            ].map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setLogoStyle(item.id)}
                                className={`py-1 border text-[7.5px] font-bold cursor-pointer uppercase text-center transition-all ${
                                  logoStyle === item.id ? "bg-[#ff9f1c]/10 text-[#ff9f1c] border-[#ff9f1c]" : "border-neutral-800 bg-neutral-900"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[7.5px] text-neutral-500">Neon highlight tone:</span>
                        <div className="flex gap-1.5">
                          {[
                            { hex: "#00f0ff", label: "CYAN" },
                            { hex: "#ff4e4e", label: "RED" },
                            { hex: "#ffcb7c", label: "AMBER" },
                            { hex: "#c57cff", label: "PURPLE" },
                            { hex: "#7cff82", label: "GREEN" }
                          ].map(color => (
                            <button
                              key={color.hex}
                              type="button"
                              onClick={() => setLogoColor(color.hex)}
                              className="flex items-center gap-1 py-1 border rounded-none cursor-pointer text-[7px] font-bold uppercase bg-neutral-900 flex-grow justify-center transition-all"
                              style={{ borderColor: logoColor === color.hex ? color.hex : "rgba(38,38,38,1)", color: logoColor === color.hex ? color.hex : "rgba(115,115,115,1)" }}
                            >
                              <span className="w-1.5 h-1.5 shrink-0" style={{ backgroundColor: color.hex }} />
                              <span>{color.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2.5 mt-2 border-t border-neutral-900 pt-2">
                        <button type="button" onClick={() => setShowLogoMaker(false)} className="px-3.5 py-1.5 border border-red-500/25 text-red-500 text-[8.5px] uppercase font-bold cursor-pointer">CANCEL</button>
                        <button type="button" onClick={handleTriggerLogoBuild} className="flex-grow py-1.5 bg-[#ff9f1c] text-black text-[8.5px] font-black uppercase tracking-wider cursor-pointer text-center">COMPILED DIGITAL INSIGNIA</button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Google Forms compiler Form
                <div className="flex flex-col gap-2 bg-neutral-950 p-3 border border-[#1ca8ff]/30 text-left">
                  {isDeployingForm ? (
                    <div className="py-5 flex flex-col items-center justify-center gap-2">
                      <Loader2 size={16} className="text-[#1ca8ff] animate-spin" />
                      <span className="text-[9px] text-[#1ca8ff] uppercase tracking-widest animate-pulse">ESTABLISHING GOOGLE API TRANSACTION PIPELINE...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-[8px] text-neutral-500 uppercase tracking-widest font-black select-none flex items-center gap-1">
                        <FileText size={10} className="text-[#1ca8ff]" /> AUTONOMOUS WORKSPACE SURVEY CREATOR
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[7.5px] text-neutral-500 uppercase">Survey header Title:</span>
                          <input
                            type="text"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="Mental Friction Audit"
                            className="bg-[#111] border border-neutral-800 focus:border-[#1ca8ff] focus:outline-none p-1.5 text-[10px] text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[7.5px] text-neutral-500 uppercase">First Text Question:</span>
                          <input
                            type="text"
                            value={formBlockerQuestion}
                            onChange={(e) => setFormBlockerQuestion(e.target.value)}
                            className="bg-[#111] border border-neutral-800 focus:border-[#1ca8ff] focus:outline-none p-1.5 text-[10px] text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[7.5px] text-neutral-500 uppercase">Second Text Question:</span>
                          <input
                            type="text"
                            value={formQuizQuestion}
                            onChange={(e) => setFormQuizQuestion(e.target.value)}
                            className="bg-[#111] border border-neutral-800 focus:border-[#1ca8ff] focus:outline-none p-1.5 text-[10px] text-white"
                          />
                        </div>
                      </div>

                      {deployError && <div className="p-2 border border-red-500/20 bg-red-950/10 text-red-400 text-[8px] uppercase tracking-wide leading-normal font-sans">{deployError}</div>}

                      <div className="flex gap-2 mt-2 pt-2 border-t border-neutral-900">
                        <button type="button" onClick={() => setShowFormsMaker(false)} className="px-3 py-1.5 border border-red-500/25 text-red-500 text-[8.5px] uppercase font-bold cursor-pointer">BACK</button>
                        <button type="button" onClick={handleDeployGoogleForm} className="flex-grow py-1.5 bg-[#1ca8ff] text-black text-[8.5px] font-black uppercase tracking-wider cursor-pointer select-none">DEPLOY TO MY WORKSPACE</button>
                      </div>
                    </>
                  )}
                </div>
              )}
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
            
            <div className="flex justify-between items-center text-[8.5px] text-[#b9cacb]/45 uppercase font-black px-0.5">
              <span className="flex items-center gap-1.5"><Cpu size={10} className="text-[#00f0ff]" /> MAVERICK INTERACTION VECTOR STREAM</span>
              <span>CURRENT LEVEL: {activeChannel === "diagnostic" ? "🛠️ PROFILER ONBOARDING" : `🎓 CASCADE: ${activeMode.toUpperCase()}`}</span>
            </div>

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
                  setShowLogoMaker(false);
                  setShowFormsMaker(false);
                }}
                className={`border px-2.5 rounded-none transition-all flex items-center justify-center cursor-pointer bg-neutral-900 border-neutral-800 ${
                  showAttachmentMenu ? "border-[#00f0ff] text-[#00f0ff]" : "text-neutral-500 hover:text-white hover:border-neutral-700"
                }`}
                title="Google forms surveys, SVG logo insignia generator, attachments"
              >
                <Plus size={14} className={showAttachmentMenu ? "rotate-45 transition-transform duration-300" : "transition-transform duration-300"} />
              </button>

              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                disabled={isProcessing}
                placeholder={
                  activeChannel === "diagnostic"
                    ? "Explain messy workload bottlenecks, procrastination, or state vectors..."
                    : activeMode === "code"
                    ? "Input programming tasks, compile errors, or styling algorithms..."
                    : activeMode === "learn"
                    ? "Input conceptual study questions, academic equations, or theories..."
                    : "Structure roadmap blueprints, strategic sequences, or review experience logs..."
                }
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
          </div>

        </div>

        {/* TRAITS ANALYSIS BAR SIDEBAR OR PANEL HUD */}
        <div className={`hidden lg:flex w-72 shrink-0 bg-[#0c0c0e]/80 border-r border-[#3b494b]/10 p-4 select-none text-left flex-col justify-between`}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-1.5 text-[9px] font-black tracking-widest text-[#00f0ff] uppercase select-none pb-2 border-b border-[#3b494b]/20">
              <Sliders size={12} /> Trait Telemetry Profile
            </div>

            <div className="flex flex-col gap-3.5 mt-2">
              {[
                { key: "action", label: "🎯 Execution Action", value: traits.action, desc: "Frictionless task startup startup speed" },
                { key: "persistence", label: "🔋 Continuity Persistence", value: traits.persistence, desc: "Resilience over cognitive exhaustion loops" },
                { key: "discipline", label: "🔒 Focus Discipline", value: traits.discipline, desc: "Suppression of phone/reddit notifications" },
                { key: "awareness", label: "👁️ State Awareness", value: traits.awareness, desc: "Isolate precise workflow blocker leakages" },
                { key: "courage", label: "⚡ Career Courage", value: traits.courage, desc: "Engaging strategic challenges with conviction" },
                { key: "learning", label: "📚 Concept Learning", value: traits.learning, desc: "Simplifying academic & programming principles" }
              ].map((tr) => (
                <div key={tr.key} className="flex flex-col gap-1 transition-all duration-300">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="font-extrabold text-[#b9cacb]/80 uppercase tracking-wide">{tr.label}</span>
                    <span className="font-mono font-bold text-white">{(tr.value * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-1 bg-neutral-900 border border-neutral-800 flex rounded-none relative">
                    <div 
                      className={`h-full transition-all duration-500 relative`} 
                      style={{ 
                        width: `${tr.value * 100}%`,
                        backgroundColor: tr.value >= 0.75 ? "#00f0ff" : tr.value >= 0.50 ? "#c57cff" : "#ef4444"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-neutral-950/80 border border-neutral-900 font-sans text-[10px] text-neutral-500 leading-normal gap-1.5 flex flex-col">
            <span className="font-mono text-[8px] font-black text-[#c57cff] uppercase tracking-wider block">Telemetry HUD info:</span>
            <p className="italic">Traits update dynamically during Diagnostic profiling evaluations or when completing focus block checklists in cascade channels.</p>
          </div>
        </div>

      </div>

    </div>
  );
}
