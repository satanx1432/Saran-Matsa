import { useState, useEffect, useRef, DragEvent, ChangeEvent, FormEvent } from "react";
import { 
  Send, 
  Paperclip, 
  LogOut, 
  LogIn, 
  Globe, 
  Sparkles, 
  UploadCloud, 
  FileText, 
  AlertTriangle, 
  Users, 
  CornerDownRight,
  Clock,
  X,
  FileCheck
} from "lucide-react";
import { 
  auth, 
  signInWithGooglePortal, 
  logoutUserSession, 
  subscribeToMainChatChannel, 
  transmitChatMessage, 
  uploadChatAttachment 
} from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function FirebaseChat() {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  // File upload states
  const [attachedFile, setAttachedFile] = useState<{ url: string; name: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor user authorization state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Monitor and synchronize messages in real-time
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToMainChatChannel(
      (list) => {
        setMessages(list);
        setChatError(null);
      },
      (err) => {
        console.error("HASEX_OS [CHAT SYNC ERROR] //", err);
        setChatError("Permission denied or access error. Check Firestore configuration.");
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Keep chat pinned to latest messages on incoming streams
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Google Login triggers
  const handleLogin = async () => {
    try {
      setChatError(null);
      await signInWithGooglePortal();
    } catch (err: any) {
      setChatError(err.message || "Authentication popup canceled or failed.");
    }
  };

  // Handle Log Out triggers
  const handleLogout = async () => {
    try {
      await logoutUserSession();
      setMessages([]);
    } catch (err: any) {
      setChatError("Authentication disconnection fault.");
    }
  };

  // Submit message dispatch
  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;

    setIsSending(true);
    setChatError(null);

    try {
      await transmitChatMessage(inputText, attachedFile);
      setInputText("");
      setAttachedFile(null);
    } catch (err: any) {
      setChatError("Failed to dispatch message record to network cluster.");
    } finally {
      setIsSending(false);
    }
  };

  // Upload file selection flow
  const handleAttachFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const resp = await uploadChatAttachment(file);
      setAttachedFile(resp);
    } catch (err: any) {
      setUploadError("Cyber storage link failed. Attachment ignored.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAttachFile(e.target.files[0]);
    }
  };

  // Drag and Drop implementation parameters
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleAttachFile(e.dataTransfer.files[0]);
    }
  };

  // Rendering loading state
  if (isAuthLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[300px] border-[0.5px] border-[#3b494b]/30 bg-[#060607]/90 p-12 text-center select-none animate-pulse">
        <Sparkles className="animate-spin text-[#00f0ff] mb-4" size={24} />
        <span className="font-mono text-[9px] text-[#00f0ff] tracking-widest uppercase">
          SECURE SATELLITE HANDSHAKE IN PROGRESS...
        </span>
      </div>
    );
  }

  // Login Restriction visual page
  if (!user) {
    return (
      <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center p-8 md:p-12 border-[0.5px] border-[#3b494b]/30 bg-[#060607]/95 relative text-center select-none" id="guest-restricted-screen">
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#00f0ff]/3 rounded-none blur-3xl pointer-events-none" />
        
        <div className="p-4 bg-[#ffcb7c]/5 border-[0.5px] border-[#ffcb7c]/30 text-[#ffcb7c] mb-6 signal-glow">
          <AlertTriangle size={32} className="animate-pulse" />
        </div>

        <div className="flex flex-col gap-2 mb-8">
          <span className="font-mono text-[9px] text-[#00f0ff] tracking-[0.2em] font-bold uppercase leading-none">
            HASEX_NET COGNITIVE LINK PORTAL
          </span>
          <h2 className="font-sans text-xl font-extrabold text-white uppercase tracking-tight">
            RESTRICTED MULTI-USER CHAT COMM LINK
          </h2>
          <p className="font-sans text-xs text-[#b9cacb]/60 max-w-sm mx-auto leading-relaxed mt-2">
            Establish a secure satellite link via Firebase Authentication to sync live communications with active peer operators globally.
          </p>
        </div>

        {chatError && (
          <div className="w-full max-w-sm mb-6 bg-red-500/10 border-[0.5px] border-red-500/30 p-3 text-left">
            <span className="block font-mono text-[8px] text-red-400 font-bold uppercase mb-1">TERMINAL ERROR REPORT //</span>
            <span className="block font-sans text-[10px] text-red-300/90 leading-tight">{chatError}</span>
          </div>
        )}

        <button
          onClick={handleLogin}
          className="bg-white hover:bg-[#00f0ff] hover:text-black hover:scale-[1.02] text-black font-mono text-xs tracking-widest uppercase font-bold py-3.5 px-8 rounded-none cursor-pointer transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
          <LogIn size={15} />
          <span>AUTHORIZE SATELLITE USER</span>
        </button>
      </div>
    );
  }

  // Render chat room interface when logged in
  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full max-w-4xl mx-auto border-[0.5px] border-[#3b494b]/30 bg-[#060607]/95 flex flex-col h-[650px] relative transition-colors ${
        isDragging ? "bg-[#00f0ff]/5 border-[#00f0ff]" : ""
      }`}
      id="firebase-realtime-chat-block"
    >
      {/* Absolute Drag Overlay Visual Shield */}
      {isDragging && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center border-2 border-dashed border-[#00f0ff] p-6 text-center pointer-events-none">
          <UploadCloud size={48} className="text-[#00f0ff] animate-bounce mb-3" />
          <h3 className="font-mono text-xs font-bold text-[#00f0ff] uppercase tracking-widest">
            DROP DOCUMENT / IMAGE TO DISPATCH
          </h3>
          <span className="font-sans text-[10px] text-[#b9cacb]/50 mt-1 uppercase">
            Attachments will be buffered in Firestore Cluster arrays
          </span>
        </div>
      )}

      {/* Cyber Chat Header status bar */}
      <div className="flex justify-between items-center px-4 md:px-5 py-3 border-b-[0.5px] border-[#3b494b]/30 bg-[#09090b]">
        <div className="flex items-center gap-3.5 select-none text-left">
          <div className="p-1.5 bg-[#00f0ff]/15 text-[#00f0ff] rounded-none">
            <Globe size={14} className="animate-spin duration-15000" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[9px] font-bold text-[#00dbe9] tracking-wider leading-none">
              <span>HASEX_NET COMM CHANNEL</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-sans font-bold text-white leading-none">
                {messages.length} DISPATCHES LOGGED
              </span>
              <span className="text-[8.5px] font-mono text-[#b9cacb]/40 uppercase tracking-widest flex items-center gap-1">
                <Users size={10} /> Live Auth Synchronized
              </span>
            </div>
          </div>
        </div>

        {/* User Identity Info / Logout panel */}
        <div className="flex items-center gap-3 select-none">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[11px] font-bold text-white font-sans leading-tight">
              {user.displayName || "Operator"}
            </span>
            <span className="text-[8px] font-mono text-[#b9cacb]/40 leading-none">
              {user.email}
            </span>
          </div>

          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "Operator"} 
              className="w-8 h-8 rounded-none border-[0.5px] border-[#3b494b]/80 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-none bg-[#3b494b]/25 border-[0.5px] border-[#3b494b]/80 flex items-center justify-center font-mono text-[10px] text-[#00f0ff] font-bold">
              OP
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Log Out Terminal"
            className="p-2 border-[0.5px] border-[#3b494b]/45 hover:border-red-500/50 hover:bg-red-500/10 text-[#b9cacb] hover:text-red-400 cursor-pointer transition-all duration-300 rounded-none"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      {/* Internal diagnostic message notifications */}
      {chatError && (
        <div className="bg-red-500/10 border-b-[0.5px] border-red-500/30 p-2.5 text-left flex items-start gap-3">
          <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
          <div className="text-[10px] font-sans text-red-300">
            <span className="font-mono font-bold text-red-400 uppercase tracking-wider block mb-0.5">DISPATCH FAULT:</span>
            {chatError}
          </div>
        </div>
      )}

      {/* Main scrolling core database feed */}
      <div className="flex-grow p-4 md:p-5 overflow-y-auto space-y-4.5 bg-[#040405] custom-scrollbar scroll-smooth">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="p-3 bg-[#0d0d10] border-[0.5px] border-[#3b494b]/30 text-[#b9cacb]/40 mb-3 rounded-none">
              <Globe size={24} />
            </div>
            <h4 className="font-mono text-[10px] text-[#00f0ff] tracking-widest font-black uppercase">
              NO NETWORK DISPATCHES FOUND
            </h4>
            <p className="font-sans text-[11px] text-[#b9cacb]/50 max-w-xs mt-1.5 leading-relaxed">
              Feed has been indexed. Send a message or upload some diagnostic attachments to record the first entries.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderUid === user.uid;
            
            return (
              <div 
                key={msg.id || idx} 
                className={`flex gap-3 max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div className="shrink-0 select-none pt-0.5">
                  {msg.senderPhotoURL ? (
                    <img 
                      src={msg.senderPhotoURL} 
                      alt="" 
                      className="w-7.5 h-7.5 rounded-none border-[0.5px] border-[#3b494b]/60 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7.5 h-7.5 rounded-none bg-[#131317] border-[0.5px] border-[#3b494b]/60 flex items-center justify-center font-mono text-[9px] text-[#00f0ff] font-bold">
                      {msg.senderDisplayName ? msg.senderDisplayName.substring(0, 2).toUpperCase() : "OP"}
                    </div>
                  )}
                </div>

                {/* Message Body Content */}
                <div className="flex flex-col gap-1 text-left">
                  {/* Meta tag */}
                  <div className={`flex items-center gap-2 font-mono text-[8px] ${isMe ? "justify-end text-right" : ""}`}>
                    <span className="font-bold text-[#e2e2e2]">{msg.senderDisplayName || "Operator"}</span>
                    <span className="text-[#b9cacb]/45 flex items-center gap-1">
                      <Clock size={8} />
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Message Bubble */}
                  <div 
                    className={`p-3 border-[0.5px] rounded-none font-sans text-xs leading-relaxed break-all ${
                      isMe 
                        ? "bg-[#00f0ff]/5 border-[#00f0ff]/30 text-white" 
                        : "bg-[#111114]/90 border-[#3b494b]/30 text-[#b9cacb]"
                    }`}
                  >
                    {/* Raw Text render */}
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Optional File Attachment render */}
                    {msg.fileURL && (
                      <div className="mt-2.5 pt-2.5 border-t-[0.5px] border-[#3b494b]/20 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText size={16} className="text-[#00f0ff] shrink-0 animate-pulse" />
                          <div className="text-[10px] font-mono leading-none truncate max-w-[150px] text-zinc-300">
                            {msg.fileName || "attachment_vector"}
                          </div>
                        </div>

                        {/* File preview / download trigger */}
                        <a 
                          href={msg.fileURL} 
                          target="_blank" 
                          rel="noreferrer" 
                          referrerPolicy="no-referrer"
                          className="px-2.5 py-1 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] font-mono text-[8px] font-bold uppercase rounded-none border-[0.5px] border-[#00f0ff]/30 transition-colors whitespace-nowrap"
                        >
                          OPEN LINK
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Custom drag explanation / active attachments box */}
      {attachedFile && (
        <div className="bg-[#00dbe9]/5 border-t-[0.5px] border-b-[0.5px] border-[#00dbe9]/35 px-4.5 py-2.5 text-left flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-[#09090b] border-[0.5px] border-[#00dbe9]/20 px-3 py-1 bg-teal-950/20 max-w-[85%]">
            <FileCheck size={14} className="text-[#00f0ff] animate-pulse" />
            <span className="font-mono text-[9px] text-[#00f0ff] truncate leading-none">
              READY TO DISPATCH: {attachedFile.name}
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => setAttachedFile(null)}
            className="text-amber-400 hover:text-amber-500 text-[9px] font-bold font-mono uppercase bg-transparent p-1 cursor-pointer select-none"
          >
            [ DISCARD ]
          </button>
        </div>
      )}

      {/* Message Composer block */}
      <form onSubmit={handleSendMessage} className="p-4 bg-[#09090b] border-t-[0.5px] border-[#3b494b]/30 flex flex-col gap-2 relative">
        <div className="flex gap-2">
          {/* File picker button icon */}
          <button
            type="button"
            disabled={isUploading || isSending}
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-[#111113] hover:bg-[#1a1a1f] text-[#b9cacb]/80 hover:text-white border-[0.5px] border-[#3b494b]/40 rounded-none cursor-pointer transition-all duration-200 shrink-0 flex items-center justify-center active:scale-95 disabled:opacity-40"
            title="Attach System Document (or drag & drop files)"
          >
            {isUploading ? (
              <span className="inline-block w-4 h-4 rounded-full border-2 border-dashed border-[#00f0ff] animate-spin" />
            ) : (
              <Paperclip size={16} />
            )}
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,application/pdf,text/*"
          />

          {/* Master Text input field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            placeholder="DISPATCH NETWORK COMMS LOGS TO SATELLITE... OR DRAG FILE HERE"
            className="flex-grow bg-[#040405] border-[0.5px] border-[#3b494b]/45 focus:border-[#00f0ff] text-white py-2 px-3.5 font-sans text-xs focus:outline-none focus:ring-0 leading-relaxed placeholder-[#b9cacb]/30 rounded-none disabled:opacity-40"
          />

          {/* Sinker submit send button */}
          <button
            type="submit"
            disabled={isSending || isUploading || (!inputText.trim() && !attachedFile)}
            className="bg-[#00f0ff] hover:bg-[#6ef1ff] disabled:bg-[#172d30] disabled:text-[#00f0ff]/20 text-black font-semibold px-5.5 py-2 flex items-center justify-center rounded-none cursor-pointer transition-all duration-300 disabled:pointer-events-none active:scale-[0.97]"
          >
            <Send size={14} className="fill-current mr-1" />
          </button>
        </div>

        {/* Dynamic drop guidance prompt helper */}
        <div className="flex items-center justify-between text-[7px] font-mono text-[#b9cacb]/40 select-none px-0.5">
          <span className="flex items-center gap-1">
            <CornerDownRight size={8} /> Drag & Drop any local file directly into the terminal window to attach
          </span>
          {uploadError && <span className="text-amber-400 font-bold">{uploadError}</span>}
        </div>
      </form>
    </div>
  );
}
