import { useState, useEffect, FormEvent } from "react";
import { 
  Shield, 
  Terminal, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  AlertCircle,
  Mail,
  Info,
  AlertOctagon
} from "lucide-react";
import { 
  auth, 
  signInWithGooglePortal, 
  logoutUserSession,
} from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

interface OperatorProfileProps {
  onTriggerQuiz?: () => void;
}

export default function OperatorProfile({ onTriggerQuiz }: OperatorProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"gateway" | "about" | "evaluation">("gateway");
  const [evaluationData, setEvaluationData] = useState<any | null>(null);

  // Load appraisal results on mounting or tab selection
  useEffect(() => {
    try {
      const cached = localStorage.getItem("hasex_evaluation");
      if (cached) {
        setEvaluationData(JSON.parse(cached));
      }
    } catch {
      setEvaluationData(null);
    }
  }, [subTab]);

  const handleResetEvaluation = () => {
    if (confirm("WARNING // Executing this procedure will clear your current cognitive appraisal metrics registry. Trigger full reboot of onboarding diagnostics?")) {
      localStorage.removeItem("hasex_evaluation");
      if (onTriggerQuiz) {
        onTriggerQuiz();
      } else {
        window.location.reload();
      }
    }
  };

  // Simulated Custom Email/Pass fields for terminal login
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isSimulatedLogin, setIsSimulatedLogin] = useState(false);
  const [simulatedUser, setSimulatedUser] = useState<any | null>(() => {
    try {
      const cached = localStorage.getItem("hasex_simulated_operator");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Monitor authentic firebase user status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync simulated credentials state with localStorage
  useEffect(() => {
    if (simulatedUser) {
      localStorage.setItem("hasex_simulated_operator", JSON.stringify(simulatedUser));
    } else {
      localStorage.removeItem("hasex_simulated_operator");
    }
  }, [simulatedUser]);

  // Google Single Sign-In Handshake Trigger
  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGooglePortal();
      setSimulatedUser(null); // Clear simulated state if real sign-in success
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Uplink authorization handshake failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Simulated Email Login Handler
  const handleSimulatedSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!emailInput.includes("@")) {
      setAuthError("CORRUPTED TARGET INDEX // Mail coordinates invalid.");
      return;
    }
    if (passwordInput.length < 6) {
      setAuthError("SECURE DECRYPTION KEY TOO SHORT // At least 6 indices required.");
      return;
    }

    setIsSimulatedLogin(true);
    setTimeout(() => {
      const generatedUid = "SIM-" + Math.random().toString(36).substring(2, 10).toUpperCase();
      const newSim = {
        uid: generatedUid,
        email: emailInput,
        displayName: emailInput.split("@")[0].toUpperCase() + "_OPERATOR",
        lastLogin: new Date().toISOString()
      };
      setSimulatedUser(newSim);
      setIsSimulatedLogin(false);
      setEmailInput("");
      setPasswordInput("");
    }, 1200);
  };

  // Core logout function
  const handleSignOut = async () => {
    setIsAuthLoading(true);
    try {
      await logoutUserSession();
      setSimulatedUser(null);
    } catch (err) {
      setAuthError("Disconnection sequence interrupted.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Determine active operator state
  const activeOperator = user || simulatedUser;

  if (isAuthLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[300px] border-[0.5px] border-[#3b494b]/30 bg-[#060607]/90 p-12 text-center select-none" id="operator-suspending-screen">
        <RefreshCw className="animate-spin text-[#00f0ff] mb-4 duration-3000" size={24} />
        <span className="font-mono text-[9px] text-[#00f0ff] tracking-widest uppercase">
          READING COGNITIVE GATEWAY CHIP...
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-5 text-left" id="operator-registry-canvas">
      
      {/* Sub-navigation bar inside Profile page */}
      <div className="flex border-b-[0.5px] border-[#3b494b]/30 font-mono text-[10px] select-none">
        <button
          type="button"
          onClick={() => setSubTab("gateway")}
          className={`px-4 py-2.5 font-bold uppercase transition-all tracking-wider cursor-pointer border-b-[2px] ${
            subTab === "gateway"
              ? "border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/5"
              : "border-transparent text-[#b9cacb]/55 hover:text-white hover:bg-white/3"
          }`}
        >
          GATEWAY SECURE
        </button>
        <button
          type="button"
          onClick={() => setSubTab("evaluation")}
          className={`px-4 py-2.5 font-bold uppercase transition-all tracking-wider cursor-pointer border-b-[2px] ${
            subTab === "evaluation"
              ? "border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/5"
              : "border-transparent text-[#b9cacb]/55 hover:text-white hover:bg-white/3"
          }`}
        >
          COGNITIVE APPRAISAL
        </button>
        <button
          type="button"
          onClick={() => setSubTab("about")}
          className={`px-4 py-2.5 font-bold uppercase transition-all tracking-wider cursor-pointer border-b-[2px] ${
            subTab === "about"
              ? "border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/5"
              : "border-transparent text-[#b9cacb]/55 hover:text-white hover:bg-white/3"
          }`}
        >
          ABOUT OS
        </button>
      </div>

      {subTab === "gateway" ? (
        /* Core Auth State Box */
        <div className="border-[0.5px] border-[#3b494b]/30 bg-[#0a0a0c]/90 px-6 py-8 flex flex-col relative overflow-hidden">
          {/* Cyberpunk background accents */}
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#00f0ff]/2 rounded-none blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 border-b-[0.5px] border-[#3b494b]/20 pb-4 select-none">
            <div className={`p-2 rounded-none border-[0.5px] ${activeOperator ? 'border-[#00f0ff]/40 text-[#00f0ff] bg-[#00f0ff]/5' : 'border-[#ffcb7c]/30 text-[#ffcb7c] bg-[#ffcb7c]/5'}`}>
              <Shield size={18} className={activeOperator ? "animate-pulse" : ""} />
            </div>
            <div>
              <span className="block font-mono text-[8px] text-[#b9cacb]/40 tracking-widest uppercase leading-none">IDENTITY GATEWAY</span>
              <h2 className="font-sans text-xs font-bold text-white uppercase tracking-wider mt-1">
                {activeOperator ? "OPERATOR ACTIVE" : "GATEWAY SIGN-IN"}
              </h2>
            </div>
          </div>

          {activeOperator ? (
            /* ONLY EMAIL APPEARANCE & LOGOUT INFO */
            <div className="flex flex-col gap-5 pt-6">
              <div className="bg-black/40 border-[0.5px] border-[#3b494b]/25 p-4 flex flex-col gap-3 font-mono">
                <span className="block text-[7.5px] text-[#00f0ff] uppercase tracking-wider select-none">REGISTERED MAILLINK COORDINATE</span>
                <div className="flex items-center gap-2 text-white">
                  <Mail size={12} className="text-[#00f0ff]/70 shrink-0" />
                  <span className="text-xs font-bold font-mono tracking-wide break-all select-all">
                    {activeOperator.email}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-3 bg-black hover:bg-red-500/10 text-red-400 hover:text-red-300 border-[0.5px] border-red-500/30 font-mono text-[10px] font-bold uppercase tracking-widest rounded-none select-none transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <LogOut size={12} />
                <span>LOGOUT SESSION</span>
              </button>
            </div>
          ) : (
            /* Not logged in: credentials authentication portal */
            <div className="flex flex-col gap-5 pt-5">
              <span className="font-sans text-[11px] text-[#b9cacb]/60 leading-relaxed text-left">
                Authorize operator linkage to access decrypted system nodes and log cognitive records.
              </span>

              {authError && (
                <div className="bg-red-500/10 border-[0.5px] border-red-500/30 p-2.5 text-left flex gap-2">
                  <AlertCircle size={13} className="text-red-400 shrink-0" />
                  <div className="font-mono text-[8.5px] text-red-300">
                    <span className="font-bold text-red-400 block mb-0.5">AUTH_FAULT //</span>
                    {authError}
                  </div>
                </div>
              )}

              {/* Standard OAuth link with Firebase Google portal styled like Continue with Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center bg-white hover:bg-neutral-150 text-neutral-800 font-sans text-xs md:text-sm font-bold py-3 px-5 rounded cursor-pointer transition-all duration-200 active:scale-95 select-none tracking-normal border border-white focus:outline-none shadow-md"
              >
                {/* Official Google colorful vector logo */}
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 mr-3 shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24c0-1.55-.15-3.24-.47-4.77H24v9.03h12.75c-.55 2.87-2.22 5.29-4.72 6.96l7.31 5.66C43.61 36.6 46.5 30.9 46.5 24z"/>
                  <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.31-5.66c-2.11 1.41-4.81 2.27-8.58 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 select-none">
                <div className="h-[0.5px] bg-[#3b494b]/20 flex-grow" />
                <span className="font-mono text-[8px] text-[#b9cacb]/30 uppercase tracking-widest">OR MANUAL TERMINAL ENTRY</span>
                <div className="h-[0.5px] bg-[#3b494b]/20 flex-grow" />
              </div>

              {/* Simulated terminal login entry form */}
              <form onSubmit={handleSimulatedSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="font-mono text-[7.5px] text-[#b9cacb]/50 uppercase tracking-wider font-bold">OPERATOR MAIL COORDINATES:</label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="operator@system.cloud"
                    required
                    className="w-full bg-[#050506] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] text-white px-3 py-2 font-mono text-[11px] rounded-none focus:outline-none focus:ring-0 leading-none"
                  />
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="font-mono text-[7.5px] text-[#b9cacb]/50 uppercase tracking-wider font-bold">ACCESS DECRYPTION KEY:</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-[#050506] border-[0.5px] border-[#3b494b]/40 focus:border-[#00f0ff] text-white px-3 py-2 font-mono text-[11px] rounded-none focus:outline-none focus:ring-0 leading-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSimulatedLogin}
                  className="w-full py-2 bg-[#ffcb7c]/10 text-[#ffcb7c] hover:bg-[#ffcb7c]/15 border-[0.5px] border-[#ffcb7c]/30 font-mono text-[10px] font-bold uppercase tracking-wider rounded-none select-none transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {isSimulatedLogin ? (
                    <RefreshCw className="animate-spin text-[#ffcb7c]" size={10} />
                  ) : (
                    <Terminal size={11} />
                  )}
                  <span>BOOT SIM_IDENTITY</span>
                </button>
              </form>
            </div>
          )}
        </div>
      ) : subTab === "evaluation" ? (
        /* Evaluation report subTab */
        <div className="border-[0.5px] border-[#3b494b]/30 bg-[#0a0a0c]/90 px-5 py-6 flex flex-col relative overflow-hidden" id="appraisal-profile-panel">
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#00f0ff]/2 rounded-none blur-2xl pointer-events-none" />
          
          {evaluationData ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b-[0.5px] border-[#3b494b]/20 pb-4 select-none">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2 border-[0.5px] border-[#00f0ff]/40 text-[#00f0ff] bg-[#00f0ff]/3 font-bold text-[9px]">
                    ANALYSIS DONE
                  </div>
                  <span className="font-mono text-[9px] text-[#b9cacb]/40 tracking-widest uppercase">COGNITIVE INDEX</span>
                </div>
                <div className="text-xs font-bold font-mono text-[#00f0ff] bg-[#00f0ff]/10 border-[0.5px] border-[#00f0ff]/30 px-2.5 py-0.5">
                  OVERALL: {evaluationData.overallScore?.toFixed(2)}
                </div>
              </div>

              {/* Trait breakdown rows */}
              <div className="flex flex-col gap-2.5 font-mono select-none">
                {Object.entries(evaluationData.scores || {}).map(([trait, score]: any) => (
                  <div key={trait} className="flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-[#b9cacb]">
                      <span>{trait.toUpperCase()}</span>
                      <span className="text-white font-bold">{score?.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1 bg-black/40 border-[0.5px] border-[#3b494b]/15 position-relative overflow-hidden">
                      <div 
                        className={`h-full ${
                          score >= 0.8 ? "bg-[#00f0ff]" : score >= 0.6 ? "bg-[#c57cff]" : score >= 0.4 ? "bg-[#ffcb7c]" : "bg-red-400"
                        }`}
                        style={{ width: `${score * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t-[0.5px] border-[#3b494b]/15 pt-4 text-xs font-sans text-[#b9cacb]/85 flex flex-col gap-4">
                <div className="flex flex-col gap-1 select-text">
                  <span className="font-mono text-[8.5px] text-[#00f0ff] font-bold block uppercase tracking-wider">SUMMARY PROFILE:</span>
                  <p className="leading-relaxed text-[11.5px] text-[#b9cacb]/80">{evaluationData.summary}</p>
                </div>

                <div className="flex flex-col gap-1 text-left select-text">
                  <span className="font-mono text-[8.5px] text-[#c57cff] font-bold block uppercase tracking-wider">STRENGTHS MATRIX:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#b9cacb]/80">
                    {evaluationData.strengths?.map((str: string, idx: number) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-1 text-left select-text">
                  <span className="font-mono text-[8.5px] text-[#ffcb7c] font-bold block uppercase tracking-wider">WEAKNESS VECTORS:</span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#b9cacb]/80">
                    {evaluationData.weaknesses?.map((wk: string, idx: number) => (
                      <li key={idx}>{wk}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-1 text-left select-text">
                  <span className="font-mono text-[8.5px] text-red-400 font-bold block uppercase tracking-wider">METACOGNITIVE BLIND SPOT:</span>
                  <p className="leading-relaxed text-[11px] text-[#b9cacb]/80">{evaluationData.blindSpots?.[0]}</p>
                </div>

                <div className="flex flex-col gap-1 text-left select-text">
                  <span className="font-mono text-[8.5px] text-[#00f0ff] font-bold block uppercase tracking-wider">NEXT STRATEGIC ACTIONS:</span>
                  <ul className="list-decimal pl-4 space-y-1 text-[11.5px] text-[#dbfcff]">
                    {evaluationData.nextActions?.map((act: string, idx: number) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetEvaluation}
                className="w-full py-2.5 mt-2 bg-black hover:bg-[#00f0ff]/10 text-[#00f0ff] border-[0.5px] border-[#00f0ff]/30 hover:border-[#00f0ff]/60 font-mono text-[9px] font-bold uppercase tracking-widest rounded-none select-none transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RefreshCw size={11} className="animate-pulse" />
                <span>RE-EVALUATE COGNITIVE BASELINE</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-8 flex flex-col items-center justify-center gap-5">
              <AlertOctagon className="text-[#ffcb7c] animate-pulse" size={28} />
              
              <div className="flex flex-col gap-1.5">
                <span className="block font-mono text-[10px] text-white font-black uppercase tracking-widest leading-none">
                  EVALUATION REGISTRY OFFLINE
                </span>
                <p className="font-sans text-[11px] text-[#b9cacb]/65 max-w-xs leading-relaxed mx-auto">
                  Handshake profile assessment required to compile cognitive indexes and configure traits.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (onTriggerQuiz) {
                    onTriggerQuiz();
                  } else {
                    window.location.reload();
                  }
                }}
                className="py-2.5 px-6 bg-[#ffcb7c]/10 text-[#ffcb7c] hover:bg-[#ffcb7c]/20 border-[0.5px] border-[#ffcb7c]/30 font-mono text-[9px] font-bold uppercase tracking-widest rounded-none select-none transition-all cursor-pointer active:scale-95"
              >
                BOOT COGNITIVE HANDSHAKE
              </button>
            </div>
          )}
        </div>
      ) : (
        /* About OS subTab */
        <div className="border-[0.5px] border-[#3b494b]/30 bg-[#0a0a0c]/90 px-6 py-8 flex flex-col relative overflow-hidden" id="about-info-panel">
          <div className="absolute right-0 top-0 w-24 h-24 bg-[#00f0ff]/2 rounded-none blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 border-b-[0.5px] border-[#3b494b]/20 pb-4 select-none">
            <div className="p-2 rounded-none border-[0.5px] border-[#00f0ff]/40 text-[#00f0ff] bg-[#00f0ff]/5">
              <Info size={18} />
            </div>
            <div>
              <span className="block font-mono text-[8px] text-[#b9cacb]/40 tracking-widest uppercase leading-none">SYSTEM DESIGNATION</span>
              <h2 className="font-sans text-xs font-bold text-white uppercase tracking-wider mt-1">
                Maverick AI
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-6 pt-6">
            <div className="flex flex-col gap-1.5 text-left select-none">
              <span className="font-mono text-[7.5px] text-[#00f0ff] uppercase tracking-widest block font-bold leading-none">AGENT SPECIFICATION</span>
              <p className="font-sans text-[11px] text-[#b9cacb]/70 leading-relaxed mt-1">
                Maverick AI is an advanced task management and cognitive mapping environment with fully functional system logging, real-time AI capabilities, and offline fallbacks.
              </p>
            </div>

            <div className="flex flex-col gap-3.5 text-left">
              <span className="font-mono text-[7.5px] text-[#ffcb7c] uppercase tracking-widest block font-bold leading-none">RECENT UPDATES</span>
              
              <ul className="space-y-3 font-sans text-xs text-[#b9cacb]/80 pl-1 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#ffcb7c] font-mono select-none text-[11px] leading-none mt-1">•</span>
                  <span>Added Brainstorm mode</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#ffcb7c] font-mono select-none text-[11px] leading-none mt-1">•</span>
                  <span>Improved voice journal</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#ffcb7c] font-mono select-none text-[11px] leading-none mt-1">•</span>
                  <span>Fixed AI connection bugs</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
