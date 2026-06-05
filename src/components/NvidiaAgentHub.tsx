import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { Bot, X, Send, Cpu, Sliders, RefreshCw, AlertCircle, Sparkles, Check, Paperclip, Image as ImageIcon, FileImage, Plus, Terminal, Search, History, FileText, Trash2, ShieldCheck, HelpCircle } from "lucide-react";
import { db, auth, signInWithGooglePortal } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
  model?: string;
  logoSvg?: string; // High-tech custom inline SVG badge
}

// Custom High-Fidelity Cyberpunk Vector Logo Generator
const generateCyberpunkLogoSvg = (concept: string, color: string, style: string): string => {
  const hexColor = color;
  const strokeWidth = 2;
  
  let paths = "";
  
  if (style === "eye") {
    // Optical Hacker / Cyber Eye Symbol
    paths = `
      <!-- Concentric target rings -->
      <circle cx="60" cy="60" r="48" stroke="${hexColor}" stroke-width="1" stroke-dasharray="3,3" fill="none" opacity="0.3" />
      <circle cx="60" cy="60" r="42" stroke="${hexColor}" stroke-width="1.5" fill="none" opacity="0.6" />
      <circle cx="60" cy="60" r="28" stroke="${hexColor}" stroke-width="0.8" stroke-dasharray="1,2" fill="none" />
      
      <!-- Outer eye brackets -->
      <path d="M 18,60 C 35,26 85,26 102,60 C 85,94 35,94 18,60 Z" stroke="${hexColor}" stroke-width="${strokeWidth}" fill="none" />
      
      <!-- Pupil / iris -->
      <circle cx="60" cy="60" r="14" stroke="${hexColor}" stroke-width="2" fill="none" />
      <circle cx="60" cy="60" r="6" fill="${hexColor}" />
      
      <!-- HUD crosshairs & decorations -->
      <line x1="60" y1="5" x2="60" y2="15" stroke="${hexColor}" stroke-width="2" />
      <line x1="60" y1="105" x2="60" y2="115" stroke="${hexColor}" stroke-width="2" />
      <line x1="5" y1="60" x2="15" y2="60" stroke="${hexColor}" stroke-width="2" />
      <line x1="105" y1="60" x2="115" y2="60" stroke="${hexColor}" stroke-width="2" />
      
      <!-- Corner diagnostic corner brackets -->
      <path d="M 8,20 L 8,8 L 20,8" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <path d="M 112,20 L 112,8 L 100,8" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <path d="M 8,100 L 8,112 L 20,112" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <path d="M 112,100 L 112,112 L 100,112" stroke="${hexColor}" stroke-width="1.5" fill="none" />
    `;
  } else if (style === "wolf") {
    // Low-poly Cybernetic Wolf / Panther geometry
    paths = `
      <!-- Low-poly wolf face coordinates centered -->
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
      
      <!-- Wolf ears -->
      <polygon points="40,50 25,12 45,35" stroke="${hexColor}" stroke-width="1.8" fill="none" />
      <polygon points="80,50 95,12 75,35" stroke="${hexColor}" stroke-width="1.8" fill="none" />
      
      <!-- Glowing eyes -->
      <polygon points="47,48 55,52 45,54" fill="${hexColor}" />
      <polygon points="73,48 65,52 75,54" fill="${hexColor}" />
      
      <circle cx="60" cy="95" r="2.5" fill="${hexColor}" />
    `;
  } else if (style === "shield") {
    // Hexagonal Defensive Security Shield / Firewall Array
    paths = `
      <!-- Outer Hex Shield -->
      <polygon points="60,10 105,32 105,88 60,110 15,88 15,32" stroke="${hexColor}" stroke-width="2.5" fill="none" />
      <polygon points="60,18 97,36 97,84 60,102 23,84 23,36" stroke="${hexColor}" stroke-width="1" fill="none" opacity="0.4" stroke-dasharray="2,2" />
      
      <!-- Inner circuit connections -->
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
      
      <!-- Safe lock icon graphic centered -->
      <rect x="52" y="73" width="16" height="12" rx="1" stroke="${hexColor}" stroke-width="1.5" fill="none" />
      <path d="M 56,73 L 56,69 C 56,66 64,66 64,69 L 64,73" stroke="${hexColor}" stroke-width="1.5" fill="none" />
    `;
  } else if (style === "node") {
    // Quantum Intelligence Orbital Processor Nodes
    paths = `
      <!-- Interconnected orbital rings -->
      <ellipse cx="60" cy="60" rx="46" ry="16" stroke="${hexColor}" stroke-width="1.5" fill="none" transform="rotate(30 60 60)" />
      <ellipse cx="60" cy="60" rx="46" ry="16" stroke="${hexColor}" stroke-width="1.5" fill="none" transform="rotate(-30 60 60)" />
      <ellipse cx="60" cy="60" rx="46" ry="16" stroke="${hexColor}" stroke-width="1" fill="none" transform="rotate(90 60 60)" opacity="0.4" />
      
      <!-- Core Chip CPU square -->
      <rect x="42" y="42" width="36" height="36" stroke="${hexColor}" stroke-width="2.5" fill="#070708" />
      <rect x="48" y="48" width="24" height="24" stroke="${hexColor}" stroke-width="1" stroke-dasharray="2,1" fill="none" />
      
      <!-- Connection lanes -->
      <line x1="60" y1="12" x2="60" y2="42" stroke="${hexColor}" stroke-width="1" stroke-dasharray="2,2" />
      <line x1="60" y1="78" x2="60" y2="108" stroke="${hexColor}" stroke-width="1" stroke-dasharray="2,2" />
      <line x1="12" y1="60" x2="42" y2="60" stroke="${hexColor}" stroke-width="1" stroke-dasharray="2,2" />
      <line x1="78" y1="60" x2="108" y2="60" stroke="${hexColor}" stroke-width="1" stroke-dasharray="2,2" />
      
      <!-- Node centers -->
      <circle cx="60" cy="60" r="5" fill="${hexColor}" />
      <circle cx="60" cy="12" r="4" fill="${hexColor}" />
      <circle cx="60" cy="108" r="4" fill="${hexColor}" />
      <circle cx="12" cy="60" r="4" fill="${hexColor}" />
      <circle cx="108" cy="60" r="4" fill="${hexColor}" />
      
      <!-- High-tech processor text code label inline -->
      <text x="60" y="64" font-family="monospace" font-size="5" fill="#ffffff" font-weight="bold" text-anchor="middle">CPU</text>
    `;
  } else {
    // Default Iconic HASEX Operational Crest
    paths = `
      <!-- Double outer shield with tech notches -->
      <circle cx="60" cy="60" r="52" stroke="${hexColor}" stroke-width="2.5" fill="none" />
      <circle cx="60" cy="60" r="46" stroke="${hexColor}" stroke-width="0.8" stroke-dasharray="3,1" fill="none" opacity="0.7" />
      
      <!-- Horizontal diagonal safety hazard lines background -->
      <path d="M 30,42 L 90,42 M 30,78 L 90,78" stroke="${hexColor}" stroke-width="1" opacity="0.3" stroke-dasharray="2,2" />
      <path d="M 42,30 L 42,90 M 78,30 L 78,90" stroke="${hexColor}" stroke-width="1" opacity="0.3" stroke-dasharray="2,2" />
      
      <!-- Bold HASEX stylized logo letters -->
      <path d="M 35,46 L 35,74 M 47,46 L 47,74 M 35,60 L 47,60" stroke="${hexColor}" stroke-width="3" stroke-linecap="square" />
      <path d="M 54,74 L 59,46 L 66,74 M 55,64 L 64,64" stroke="${hexColor}" stroke-width="3" stroke-linecap="square" fill="none" />
      <path d="M 72,49 C 76,45 83,45 87,49 C 91,53 88,58 82,60 C 76,62 73,67 77,71 C 81,75 88,75 92,71" stroke="${hexColor}" stroke-width="3" stroke-linecap="square" fill="none" />
      
      <!-- Dynamic bottom sub-bar code labels -->
      <rect x="42" y="86" width="36" height="8" fill="${hexColor}" rx="1" />
      <text x="60" y="93" font-family="monospace" font-size="6" fill="#000000" font-weight="black" text-anchor="middle">SYS_v0.1</text>
      
      <!-- Circular dot matrix -->
      <circle cx="60" cy="18" r="1.5" fill="${hexColor}" />
      <circle cx="48" cy="20" r="1.5" fill="${hexColor}" />
      <circle cx="72" cy="20" r="1.5" fill="${hexColor}" />
    `;
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" style="width:100%; height:100%;">
    <!-- Outer ambient black shield container backing -->
    <rect width="120" height="120" fill="#070708" rx="4" />
    <!-- Dynamic custom drawing vector path -->
    ${paths}
  </svg>`;
};

export default function NvidiaAgentHub() {
  const [isOpen, setIsOpen] = useState(false);
  const [showKeysConfig, setShowKeysConfig] = useState(false);
  const [embeddingKey, setEmbeddingKey] = useState(() => localStorage.getItem("rag_embedding_key") || "");
  const [vectorDbKey, setVectorDbKey] = useState(() => localStorage.getItem("rag_vector_db_key") || "");
  const [llmKey, setLlmKey] = useState(() => localStorage.getItem("rag_llm_key") || "");
  const [activeMode, setActiveMode] = useState<"learn" | "create">("learn");
  const [createSubMode, setCreateSubMode] = useState<"code" | "research">("code");
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Google Forms creator states
  const [showFormsMaker, setShowFormsMaker] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBlockerQuestion, setFormBlockerQuestion] = useState("What was your primary focal bottleneck today?");
  const [formQuizQuestion, setFormQuizQuestion] = useState("On a scale of 1-10, how clear is your execution target?");
  const [isDeployingForm, setIsDeployingForm] = useState(false);
  const [deployedFormLink, setDeployedFormLink] = useState<string | null>(null);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Cognitive image & file/document attachment support states
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const [attachedDocContent, setAttachedDocContent] = useState<string | null>(null);
  const [attachedDocName, setAttachedDocName] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Custom high-fidelity Interactive Logo Generation states
  const [showLogoMaker, setShowLogoMaker] = useState(false);
  const [logoConcept, setLogoConcept] = useState("");
  const [logoColor, setLogoColor] = useState("#00f0ff");
  const [logoStyle, setLogoStyle] = useState("logo");
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [logoLogMessage, setLogoLogMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("rag_embedding_key", embeddingKey);
  }, [embeddingKey]);

  useEffect(() => {
    localStorage.setItem("rag_vector_db_key", vectorDbKey);
  }, [vectorDbKey]);

  useEffect(() => {
    localStorage.setItem("rag_llm_key", llmKey);
  }, [llmKey]);

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: "learn" | "create" }>;
      setIsOpen(true);
      if (customEvent.detail && customEvent.detail.mode) {
        const targetMode = customEvent.detail.mode;
        setActiveMode(targetMode);
        setMessages([
          {
            role: "assistant",
            content: targetMode === "learn" 
              ? `### HASEX AI // LEARN ONLINE\n\nI am HASEX AI, optimized and ready in **Learn Mode**. I can help you understand concepts, study, simplify homework problems, and learn faster. Ask me anything!`
              : `### HASEX AI // CREATE ENGAGED\n\nI am HASEX AI, optimized and ready in **Creator Mode**. I can help you build ideas, code programs, design graphics, and structure your creative projects. Ask me anything!`
          }
        ]);
      }
    };
    window.addEventListener("open-hasex-ai", handleToggle as EventListener);
    return () => window.removeEventListener("open-hasex-ai", handleToggle as EventListener);
  }, []);

  useEffect(() => {
    if (showHistoryView) {
      fetchHistoryRecords();
    }
  }, [showHistoryView]);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `### HASEX AI // LEARN ONLINE

I am HASEX AI, an execution-first intelligence designed to maximize clarity and direct action.

I am currently in **Learn**. I am fully optimized to help you study, synthesize concepts, brainstorm answers, and simplify complex theoretical models. Keep track of operations or type below to begin.`
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

  const saveSessionHistory = async (modeToSave: string, messagesToSave: Message[]) => {
    if (messagesToSave.length <= 1) return;
    
    const userId = auth.currentUser?.uid || "guest_operator";
    const timestamp = new Date().toISOString();
    const sessionId = "sess_" + Math.random().toString(36).substring(2, 11).toUpperCase();
    
    const firstUserMsg = messagesToSave.find(m => m.role === "user")?.content || "";
    const titleText = firstUserMsg 
      ? (firstUserMsg.substring(0, 50) + (firstUserMsg.length > 50 ? "..." : ""))
      : `${modeToSave.toUpperCase()} Session Log`;
      
    const messagesJson = JSON.stringify(messagesToSave);

    try {
      await fetch("/api/save-mysql-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sessionId,
          userId,
          mode: modeToSave,
          title: titleText,
          messagesJson,
          timestamp
        })
      });
      console.log("HASEX_OS [SQL WRITE] // Completed history synchronization to MySQL logs registry.");
    } catch (mysqlErr) {
      console.error("HASEX_OS [SQL ERROR] // MySQL save fault:", mysqlErr);
    }

    if (auth.currentUser) {
      try {
        const docRef = doc(db, "chat_histories", sessionId);
        await setDoc(docRef, {
          id: sessionId,
          userId,
          mode: modeToSave,
          title: titleText,
          messagesJson,
          timestamp: serverTimestamp()
        });
        console.log("HASEX_OS [FIRESTORE WRITE] // Saved to Firestore successfully.");
      } catch (firestoreErr) {
        console.error("HASEX_OS [FIRESTORE ERROR] // Firestore save fault:", firestoreErr);
      }
    } else {
      try {
        const localHistories = JSON.parse(localStorage.getItem("hasex_guest_histories") || "[]");
        localHistories.push({
          id: sessionId,
          userId,
          mode: modeToSave,
          title: titleText,
          messagesJson,
          timestamp
        });
        localStorage.setItem("hasex_guest_histories", JSON.stringify(localHistories));
      } catch (err) {
        console.error("HASEX_OS // guest storage exception:", err);
      }
    }
  };

  const fetchHistoryRecords = async () => {
    setIsLoadingHistory(true);
    const userId = auth.currentUser?.uid || "guest_operator";
    try {
      const res = await fetch(`/api/mysql-history?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryRecords(data.records || []);
      } else {
        throw new Error("MySQL fetch returned failure");
      }
    } catch (err) {
      console.error("HASEX_OS // Fetch logs from mysql failed, matching with guests", err);
      const localHistories = JSON.parse(localStorage.getItem("hasex_guest_histories") || "[]");
      setHistoryRecords(localHistories);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const deleteSessionHistory = async (id: string) => {
    try {
      await fetch("/api/delete-mysql-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.error("HASEX // MySQL deletion fault", err);
    }

    if (auth.currentUser) {
      try {
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "chat_histories", id));
      } catch (fErr) {
        console.error("HASEX // Firestore deletion fault", fErr);
      }
    } else {
      const localHistories = JSON.parse(localStorage.getItem("hasex_guest_histories") || "[]");
      const filtered = localHistories.filter((h: any) => h.id !== id);
      localStorage.setItem("hasex_guest_histories", JSON.stringify(filtered));
    }

    fetchHistoryRecords();
  };

  const handleLoadSession = (record: any) => {
    try {
      const loadedMessages = JSON.parse(record.messagesJson);
      setMessages(loadedMessages);
      setActiveMode(record.mode as "learn" | "create");
      setShowHistoryView(false);
    } catch (err) {
      console.error("HASEX // Error parsing stored messages mapping", err);
    }
  };

  const handleSwitchMode = async (newMode: "learn" | "create") => {
    if (newMode === activeMode) return;
    
    await saveSessionHistory(activeMode, messages);
    
    setActiveMode(newMode);
    setShowAttachmentMenu(false);
    setShowLogoMaker(false);
    setShowFormsMaker(false);
    
    if (newMode === "learn") {
      setMessages([
        {
          role: "assistant",
          content: `### HASEX AI // LEARN ONLINE

You are currently connected to HASEX AI in **Learn**.

I am optimized and configured to help you study, research complex topics, simplify coding rules (ELI5), and brainstorm challenges. Let me know what concepts you want to analyze.`
        }
      ]);
    } else {
      setMessages([
        {
          role: "assistant",
          content: `### HASEX AI // CREATE ENGAGED

You are connected to HASEX AI in **Create**.

* **Selected Action Sub-mode:** ${createSubMode === "code" ? "CODE MODE (GPT-OSS 120B Cascade)" : "RESEARCH MODE (Kimi K2.6 Cascade)"}

Use the quick action buttons below to toggle sub-modes (Code, Research) or to launch dedicated utilities (Logo Maker, Google Forms Generator)!`
        }
      ]);
    }
  };

  const handleDeployGoogleForm = async () => {
    setIsDeployingForm(true);
    setDeployError(null);
    setDeployedFormLink(null);

    const token = localStorage.getItem("hasex_google_access_token");
    if (!token) {
      setDeployError("Authorized Google Access Token missing. Execute operator Google Sign-In first.");
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
            title: formTitle || "HASEX Mental Friction Audit Questionnaire",
            documentTitle: "HASEX OS Dynamic Form"
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Create Form rejected: ${createResponse.statusText}`);
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
                      choiceQuestion: {
                        type: "RADIO",
                        options: [
                          { value: "Excellent Focus (8-10)" },
                          { value: "Moderate Friction (5-7)" },
                          { value: "Critical Blockers (1-4)" }
                        ]
                      }
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
        throw new Error(`Adding questions rejected: ${updateResponse.statusText}`);
      }

      setDeployedFormLink(responderUri);
    } catch (err: any) {
      console.error("HASEX_OS [GOOGLE FORMS API ERROR] //", err);
      setDeployError(err?.message || "Forms API deployment failure.");
    } finally {
      setIsDeployingForm(false);
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
          mode: activeMode === "create" ? createSubMode : "learn",
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

  const handleTriggerLogoBuild = () => {
    if (isGeneratingLogo) return;
    setIsGeneratingLogo(true);
    setLogoLogMessage("INIT_VECTOR_SEED // Connecting branding core...");
    
    // Simulate interactive cyberpunk-style progress logs
    setTimeout(() => {
      setLogoLogMessage("GRID_ALIGN // Restructuring HUD elements...");
      setTimeout(() => {
        setLogoLogMessage("GLYPH_INJECT // Setting neon highlight style vectors...");
        setTimeout(() => {
          // Complete generation!
          const visualStyle = logoStyle;
          const conceptText = logoConcept.trim() || "HASEX CORE BADGE";
          const generatedSvg = generateCyberpunkLogoSvg(conceptText, logoColor, visualStyle);
          
          const newMsgUser: Message = {
            role: "user",
            content: `Engage Creative Vector Machine. Construct professional agent branding logo insignia for conceptual seed "${conceptText}" using ${visualStyle.toUpperCase()} layout pattern with Accent: ${logoColor}.`
          };
          
          const newMsgAssistant: Message = {
            role: "assistant",
            content: `### [HASEX CREATIVE VECTOR SECTOR] // LOGO COMPILED
Your custom HASEX Agent Badge is ready for download. 

* **Seed Concept:** "${conceptText}"
* **Vector Style:** ${visualStyle.toUpperCase()}
* **Interface Highlighting:** ${logoColor}
* **Status:** Operational Integrity Secure (100%)

You can view it, scale it, or download the full resolution SVG vector format directly below.`,
            logoSvg: generatedSvg
          };
          
          setMessages((prev) => [...prev, newMsgUser, newMsgAssistant]);
          setIsGeneratingLogo(false);
          setLogoLogMessage("");
          setShowLogoMaker(false);
          setShowAttachmentMenu(false);
          setLogoConcept("");
        }, 1000);
      }, 900);
    }, 800);
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
            onClick={() => {
              const nextOpen = !isOpen;
              if (nextOpen) {
                setActiveMode("learn");
                setShowLogoMaker(false);
                setShowFormsMaker(false);
                setShowHistoryView(false);
                setMessages([
                  {
                    role: "assistant",
                    content: `### HASEX AI // LEARN ONLINE

I am HASEX AI, an execution-first intelligence designed to maximize clarity and direct action.

I am currently in **Learn**. I am fully optimized to help you study, synthesize concepts, brainstorm answers, and simplify complex theoretical models. Keep track of operations or type below to begin.`
                  }
                ]);
              }
              setIsOpen(nextOpen);
            }}
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

        {/* Hover / persistent discoverability tooltips */}
        {!isOpen && (
          <span className="absolute right-[80px] bg-[#0c0c0e]/95 border-[1px] border-[#00f0ff] text-[#00f0ff] font-mono text-[10px] font-bold tracking-widest px-3 py-1.5 whitespace-nowrap shadow-[0_0_12px_rgba(0,240,255,0.4)] opacity-100 transition-opacity duration-300 pointer-events-auto uppercase flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#00f0ff] inline-block animate-ping" />
            Talk to HASEX AI
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
                onClick={() => {
                  setShowHistoryView(!showHistoryView);
                  setShowLogoMaker(false);
                  setShowFormsMaker(false);
                }}
                title="View Saved Conversation History"
                className={`p-1.5 border-[0.5px] transition-all cursor-pointer active:scale-95 ${
                  showHistoryView 
                    ? "bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]" 
                    : "text-[#b9cacb]/50 hover:text-white hover:bg-[#1f1f21] border-transparent"
                }`}
              >
                <History size={13} />
              </button>

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
            <div className="grid grid-cols-2 gap-2.5 select-none font-mono text-[9px] w-full">
              <button
                type="button"
                onClick={() => handleSwitchMode("learn")}
                className={`py-1 px-2 border-[0.5px] transition-all uppercase rounded-none text-center font-bold cursor-pointer flex flex-col items-center justify-center gap-0.5 h-[48px] ${
                  activeMode === "learn"
                    ? "bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]"
                    : "bg-[#0c0c0d] text-[#b9cacb]/50 border-transparent hover:border-[#00f0ff]/30 hover:text-white"
                }`}
              >
                <span className="font-bold tracking-wider">LEARN</span>
                <span className="text-[7px] font-sans lowercase leading-none opacity-80 font-normal">explain & study concepts</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode("create")}
                className={`py-1 px-2 border-[0.5px] transition-all uppercase rounded-none text-center font-bold cursor-pointer flex flex-col items-center justify-center gap-0.5 h-[48px] ${
                  activeMode === "create"
                    ? "bg-[#c57cff]/10 text-[#c57cff] border-[#c57cff]"
                    : "bg-[#0c0c0d] text-[#b9cacb]/50 border-transparent hover:border-[#c57cff]/30 hover:text-white"
                }`}
              >
                <span className="font-bold tracking-wider">CREATE</span>
                <span className="text-[7px] font-sans lowercase leading-none opacity-80 font-normal">assets, codes & google forms</span>
              </button>
            </div>

          </div>

          {/* Messages Registry / History Panel View */}
          {showHistoryView ? (
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3 font-mono text-left bg-black/60 scrollbar-thin">
              <div className="flex justify-between items-center pb-2 border-b border-[#3b494b]/30">
                <span className="text-[9px] text-[#00f0ff] font-extrabold uppercase tracking-widest flex items-center gap-1.5 leading-none">
                  <History size={12} /> SECURED SYSTEM SESSION ARCHIVES
                </span>
                <span className="text-[8px] text-[#b9cacb]/45 uppercase">
                  MYSQL // FIRESTORE STREAM
                </span>
              </div>

              {isLoadingHistory ? (
                <div className="py-24 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-5 h-5 border-[1.5px] border-t-[#00f0ff] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                  <span className="text-[8px] uppercase text-[#b9cacb]/40 tracking-wider font-bold">RETRIEVING REGISTERS...</span>
                </div>
              ) : historyRecords.length === 0 ? (
                <div className="py-24 text-center text-[#b9cacb]/40 text-[9px] uppercase tracking-wider">
                  No saved session logs found in database sectors.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {historyRecords.map((rec) => (
                    <div 
                      key={rec.id}
                      className="border border-[#3b494b]/20 bg-[#0c0c0d] hover:border-[#00f0ff]/40 p-3 transition-colors flex justify-between items-start"
                    >
                      <button
                        type="button"
                        onClick={() => handleLoadSession(rec)}
                        className="flex-grow text-left cursor-pointer flex flex-col gap-1 w-3/4"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[7px] font-bold px-1 py-0.5 border ${
                            rec.mode === "learn" ? "text-[#00f0ff] border-[#00f0ff]/20 bg-[#00f0ff]/5" : "text-[#c57cff] border-[#c57cff]/20 bg-[#c57cff]/5"
                          } uppercase`}>
                            {rec.mode}
                          </span>
                          <span className="text-[8px] text-[#b9cacb]/40">
                            {new Date(rec.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[11px] text-white font-bold leading-normal truncate block w-full">
                          {rec.title}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteSessionHistory(rec.id)}
                        className="p-1 text-red-500/70 hover:text-red-400 hover:bg-red-500/5 hover:border-red-500/20 border border-transparent transition-all cursor-pointer"
                        title="Purge session"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
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

                      {message.logoSvg && (
                        <div className="my-3 p-3 bg-black/60 border border-[#00f0ff]/30 flex flex-col items-center justify-center gap-3 animate-fade-in select-none">
                          <div 
                            className="w-32 h-32 flex items-center justify-center bg-[#070708] border border-[#3b494b]/30 p-2 relative"
                            dangerouslySetInnerHTML={{ __html: message.logoSvg }} 
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const blob = new Blob([message.logoSvg || ""], { type: "image/svg+xml" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `hasex-logo-${Date.now()}.svg`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                            className="px-3.5 py-1.5 bg-[#00f0ff]/15 hover:bg-[#00f0ff]/30 text-[#00f0ff] border border-[#00f0ff]/40 text-[9px] font-mono uppercase tracking-widest cursor-pointer transition-all hover:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                          >
                            DOWNLOAD SVG LOGO
                          </button>
                        </div>
                      )}
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
          )}

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
            <div className="p-3 bg-[#0d0d10] border-t-[0.5px] border-[#3b494b]/50 border-b-[0.5px] border-b-[#3b494b]/20 flex flex-col gap-2.5 text-left transition-all duration-300 animate-fade-in font-mono">
              <div className="flex justify-between items-center select-none">
                <span className="font-mono text-[8.5px] uppercase font-black text-[#00f0ff] tracking-widest flex items-center gap-1.5 animate-pulse">
                  <Cpu size={10} /> {showLogoMaker ? "INTEL LOGO GENERATOR" : showFormsMaker ? "GOOGLE FORMS SURVEYS" : "HASEX INTELLIGENCE ACTIONS"}
                </span>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAttachmentMenu(false);
                    setShowLogoMaker(false);
                    setShowFormsMaker(false);
                  }}
                  className="text-[#b9cacb]/50 hover:text-white transition-colors p-0.5"
                >
                  <X size={12} />
                </button>
              </div>

              {!showLogoMaker && !showFormsMaker ? (
                <div className="flex flex-col gap-3">
                  {/* Action row 1: Creative & Logical Actions (Only in Create Mode) */}
                  {activeMode === "create" && (
                    <>
                      <div className="grid grid-cols-4 gap-1 text-center">
                        {/* Code Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setCreateSubMode("code");
                            setShowAttachmentMenu(false);
                            setMessages([
                              {
                                role: "assistant",
                                content: "### [DEVELOPER PROTOCOL ENGAGED]\nConnected in **Create (Code Sub-mode)**.\n\n* **Cascade Stream:** GPT-OSS 120B &rarr; DeepSeek-R1 &rarr; Qwen3-Coder &rarr; Llama 3.1 70B &rarr; Nemotron 9B &rarr; Llama 3.2 3B.\n\nInput your programming task or algorithm request below."
                              }
                            ]);
                          }}
                          className={`flex flex-col items-center justify-center gap-1 border bg-black/45 p-1 cursor-pointer transition-all h-[54px] ${
                            createSubMode === "code" 
                              ? "border-[#c57cff] text-[#c57cff] bg-[#c57cff]/5 shadow-[0_0_8px_rgba(197,124,255,0.2)] font-bold" 
                              : "border-[#3b494b]/30 text-[#b9cacb]/80 hover:border-[#c57cff] hover:text-[#c57cff]"
                          }`}
                        >
                          <Terminal size={11} className={createSubMode === "code" ? "text-[#c57cff] scale-110" : "text-[#c57cff]/70"} />
                          <span className="text-[6.5px] font-bold tracking-widest uppercase mt-1 leading-none font-sans">CODE</span>
                          <span className="text-[5px] opacity-60 mt-0.5">GPT-OSS</span>
                        </button>

                        {/* Research Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setCreateSubMode("research");
                            setShowAttachmentMenu(false);
                            setMessages([
                              {
                                role: "assistant",
                                content: "### [RESEARCH PROTOCOL ENGAGED]\nConnected in **Create (Research Sub-mode)**.\n\n* **Cascade Stream:** Kimi K2.6 &rarr; LLaMA 90B &rarr; DeepSeek Pro &rarr; Nemotron 120B &rarr; gpt-oss-120b &rarr; Mistral Large 3.\n\nInput your academic or research query below."
                              }
                            ]);
                          }}
                          className={`flex flex-col items-center justify-center gap-1 border bg-black/45 p-1 cursor-pointer transition-all h-[54px] ${
                            createSubMode === "research" 
                              ? "border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/5 shadow-[0_0_8px_rgba(0,240,255,0.2)] font-bold" 
                              : "border-[#3b494b]/30 text-[#b9cacb]/80 hover:border-[#00f0ff] hover:text-[#00f0ff]"
                          }`}
                        >
                          <Search size={11} className={createSubMode === "research" ? "text-[#00f0ff] scale-110" : "text-[#00f0ff]/70"} />
                          <span className="text-[6.5px] font-bold tracking-widest uppercase mt-1 leading-none font-sans">RESEARCH</span>
                          <span className="text-[5px] opacity-60 mt-0.5">Kimi K2.6</span>
                        </button>

                        {/* Logo Gen Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowLogoMaker(true);
                          }}
                          className="flex flex-col items-center justify-center gap-1 border border-[#3b494b]/30 hover:border-[#ff9f1c] bg-black/45 text-[#b9cacb]/80 hover:text-[#ff9f1c] p-1.5 cursor-pointer transition-all h-[54px]"
                        >
                          <Sparkles size={11} className="text-[#ff9f1c] animate-pulse" />
                          <span className="text-[6.5px] font-bold tracking-widest uppercase mt-1 leading-none font-sans">LOGO GEN</span>
                          <span className="text-[5px] opacity-60 mt-0.5">Vector</span>
                        </button>

                        {/* Google Forms Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowFormsMaker(true);
                          }}
                          className="flex flex-col items-center justify-center gap-1 border border-[#3b494b]/30 hover:border-[#1ca8ff] bg-black/45 text-[#b9cacb]/80 hover:text-[#1ca8ff] p-1.5 cursor-pointer transition-all h-[54px]"
                          title="Generate dynamic Google Forms survey"
                        >
                          <FileText size={11} className="text-[#1ca8ff]" />
                          <span className="text-[6.5px] font-bold tracking-widest uppercase mt-1 leading-none font-sans">FORMS</span>
                          <span className="text-[5px] opacity-60 mt-0.5">Deploy</span>
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-[#3b494b]/15 my-0.5" />
                    </>
                  )}

                  {/* Standard file/image attachments row */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Image Upload */}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 border-[0.5px] border-[#3b494b]/30 bg-[#111112]/45 hover:bg-[#00f0ff]/10 text-[#b9cacb] hover:text-[#00f0ff] font-mono text-[8px] uppercase font-bold py-1.5 transition-all cursor-pointer hover:border-[#00f0ff]/40"
                    >
                      <ImageIcon size={10} className="text-[#00f0ff]/80" />
                      <span>IMAGE SCAN</span>
                    </button>

                    {/* Document/File Upload */}
                    <button
                      type="button"
                      onClick={() => docInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 border-[0.5px] border-[#3b494b]/30 bg-[#111112]/45 hover:bg-[#ffcb7c]/10 text-[#b9cacb] hover:text-[#ffcb7c] font-mono text-[8px] uppercase font-bold py-1.5 transition-all cursor-pointer hover:border-[#ffcb7c]/40"
                    >
                      <FileImage size={10} className="text-[#ffcb7c]/80" />
                      <span>SYSTEM LOGS</span>
                    </button>
                  </div>
                </div>
              ) : showFormsMaker ? (
                /* Google Forms wizard form */
                <div className="flex flex-col gap-2.5 text-[9px] text-[#b9cacb] animate-fade-in bg-black/30 p-2.5 border border-[#3b494b]/20">
                  <div className="flex flex-col gap-1 text-[#b9cacb]/90">
                    <span className="text-white font-bold block uppercase mb-1 text-[10px]">DEPLOY SECURE QUESTIONNAIRE</span>
                    Configure custom text-inputs and score survey panels dynamically on Google Cloud.
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-white/60 tracking-wider">FORM TITLE / SURVEY NAME</span>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="HASEX Metal Friction Audit Questionnaire"
                      className="w-full bg-[#111112] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] focus:outline-none text-white text-[10px] p-2 font-mono rounded-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-white/60 tracking-wider">QUESTION 1: CORE BARRIER (FREE TEXT RESPONSE)</span>
                    <input
                      type="text"
                      value={formBlockerQuestion}
                      onChange={(e) => setFormBlockerQuestion(e.target.value)}
                      className="w-full bg-[#111112] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] focus:outline-none text-white text-[10px] p-2 font-mono rounded-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-white/60 tracking-wider">QUESTION 2: INTENSITY TARGET (SCALE SELECTOR)</span>
                    <input
                      type="text"
                      value={formQuizQuestion}
                      onChange={(e) => setFormQuizQuestion(e.target.value)}
                      className="w-full bg-[#111112] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] focus:outline-none text-white text-[10px] p-2 font-mono rounded-none"
                    />
                  </div>

                  {deployError && (
                    <div className="text-red-400 font-mono text-[8px] bg-red-950/10 p-2 border border-red-500/20 leading-relaxed text-left">
                      {deployError}
                      {deployError.includes("Google Sign-In") && (
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await signInWithGooglePortal();
                              setDeployError(null);
                            } catch (gErr) {
                              console.error("Auth fault", gErr);
                            }
                          }}
                          className="mt-2 block bg-red-500/20 hover:bg-red-500/35 text-white font-bold p-1 uppercase text-center w-full border border-red-500/30"
                        >
                          EXECUTE GOOGLE PORTAL AUTH
                        </button>
                      )}
                    </div>
                  )}

                  {deployedFormLink && (
                    <div className="text-[#00f0ff] font-mono text-[8px] bg-cyan-950/20 p-2 border border-cyan-500/30 leading-relaxed text-left">
                      <span className="font-bold block text-white uppercase mb-1">✓ FORM GENERATED ONLINE!</span>
                      Form is active under your Google account.
                      <a 
                        href={deployedFormLink}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-2 block bg-[#00f0ff] text-black font-black p-1.5 uppercase text-center font-bold"
                      >
                        OPEN GOOGLE FORM SURVEY ↗
                      </a>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowFormsMaker(false)}
                      className="w-1/3 py-2 border-[0.5px] border-red-500/20 bg-red-950/10 hover:bg-red-500/10 text-red-100 font-mono text-[8.5px] tracking-wide uppercase text-center cursor-pointer"
                    >
                      BACK
                    </button>
                    {!deployedFormLink && (
                      <button
                        type="button"
                        onClick={handleDeployGoogleForm}
                        disabled={isDeployingForm}
                        className="w-2/3 py-2 bg-[#00f0ff] hover:bg-[#5cf2fb] text-black font-black tracking-widest cursor-pointer uppercase text-center font-bold text-[8.5px] disabled:opacity-35"
                      >
                        {isDeployingForm ? "COMPILING CLOUD SECTOR..." : "DEPLOY FORM TO GOOGLE CLOUD"}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2 animate-fade-in text-[9px] text-[#b9cacb]">
                  {isGeneratingLogo ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-3 text-center">
                      <div className="w-6 h-6 border-2 border-t-[#00f0ff] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                      <div className="font-mono text-[9px] uppercase tracking-widest text-[#00f0ff] animate-pulse">
                        {logoLogMessage || "COMPILING SVG VECTOR..."}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Concept prompt input */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[#b9cacb]/60 uppercase tracking-widest text-[7.5px]">CONCEPT SEED (e.g., cyber eye, robot wolf)</span>
                        <input
                          type="text"
                          value={logoConcept}
                          onChange={(e) => setLogoConcept(e.target.value)}
                          placeholder="Enter custom idea..."
                          className="w-full bg-[#111112] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] focus:outline-none text-white text-[10px] p-2 rounded-none font-mono"
                        />
                      </div>

                      {/* Icon Style select */}
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[#b9cacb]/60 uppercase tracking-widest text-[7.5px]">INSIGNIA LAYOUT STRUCTURE</span>
                        <div className="grid grid-cols-5 gap-1.5 text-center text-[7.5px] font-bold">
                          {[
                            { id: "eye", label: "OPTICAL" },
                            { id: "wolf", label: "PREDATOR" },
                            { id: "shield", label: "SHIELD" },
                            { id: "node", label: "CPU NODE" },
                            { id: "logo", label: "CREST" }
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setLogoStyle(item.id)}
                              className={`py-1 border-[0.5px] cursor-pointer uppercase transition-all tracking-wide ${
                                logoStyle === item.id ? "bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]" : "border-[#3b494b]/30 bg-black/40 hover:bg-[#00f0ff]/5"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color list customizer */}
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-[#b9cacb]/60 uppercase tracking-widest text-[7.5px]">INTERACTIVE COLOR WAVE</span>
                        <div className="flex gap-2">
                          {[
                            { hex: "#00f0ff", label: "CYAN" },
                            { hex: "#ff4e4e", label: "RED" },
                            { hex: "#ffcb7c", label: "AMBER" },
                            { hex: "#c57cff", label: "PURPLE" },
                            { hex: "#7cff82", label: "GREEN" }
                          ].map((col) => (
                            <button
                              key={col.hex}
                              type="button"
                              onClick={() => setLogoColor(col.hex)}
                              className={`flex items-center gap-1 px-1.5 py-1 border-[0.5px] rounded-none cursor-pointer transition-all flex-grow font-black tracking-wide text-[7px] text-center justify-center`}
                              style={{ 
                                borderColor: logoColor === col.hex ? col.hex : "rgba(59, 73, 75, 0.3)",
                                color: logoColor === col.hex ? col.hex : "rgba(185, 202, 203, 0.7)",
                                background: logoColor === col.hex ? `${col.hex}15` : "rgba(0,0,0,0.4)"
                              }}
                            >
                              <span className="w-1.5 h-1.5 rounded-none" style={{ backgroundColor: col.hex }} />
                              {col.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* CTA action keys */}
                      <div className="flex gap-2.5 mt-2.5 border-t border-[#3b494b]/15 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowLogoMaker(false)}
                          className="w-1/3 py-2 border-[0.5px] border-red-500/20 bg-red-950/10 hover:bg-red-500/10 text-red-400 font-bold tracking-widest cursor-pointer uppercase text-center"
                        >
                          BACK
                        </button>
                        <button
                          type="button"
                          onClick={handleTriggerLogoBuild}
                          className="w-2/3 py-2 bg-[#00f0ff] hover:bg-[#5cf2fb] text-black font-black tracking-widest cursor-pointer uppercase text-center"
                        >
                          GENERATE LOGO
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
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
            {/* Intel plus action trigger button */}
            <button
              type="button"
              onClick={() => {
                setShowAttachmentMenu(!showAttachmentMenu);
                setShowLogoMaker(false);
              }}
              className={`border-[0.5px] px-2.5 rounded-none transition-all flex items-center justify-center cursor-pointer ${
                showAttachmentMenu 
                  ? "bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff]" 
                  : "bg-[#111112] border-[#3b494b]/30 hover:border-[#00f0ff]/50 text-[#b9cacb] hover:text-white"
              }`}
              title="HASEX intelligence actions and logo creator"
            >
              <Plus size={14} className={showAttachmentMenu ? "rotate-45 transition-transform duration-300" : "transition-transform duration-300"} />
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
