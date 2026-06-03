import { useState, useEffect, FormEvent } from "react";
import { 
  Shield, 
  Terminal, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  AlertCircle,
  Mail,
  Info
} from "lucide-react";
import { 
  auth, 
  signInWithGooglePortal, 
  logoutUserSession,
} from "../lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function OperatorProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"gateway" | "about">("gateway");

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

              {/* Standard OAuth link with Firebase Google portal */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white hover:bg-[#00f0ff] hover:text-black text-black font-mono text-[10px] font-black uppercase tracking-widest rounded-none select-none transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(255,255,255,0.05)]"
              >
                <LogIn size={12} />
                <span>GOOGLE GATEWAY LINK</span>
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
                Beta v0.1
              </h2>
            </div>
          </div>

          <div className="flex flex-col gap-6 pt-6">
            <div className="flex flex-col gap-1.5 text-left select-none">
              <span className="font-mono text-[7.5px] text-[#00f0ff] uppercase tracking-widest block font-bold leading-none">AGENT SPECIFICATION</span>
              <p className="font-sans text-[11px] text-[#b9cacb]/70 leading-relaxed mt-1">
                HASEX Assistant (Beta v0.1) is an advanced task management and cognitive mapping environment with fully functional system logging, real-time AI capabilities, and offline fallbacks.
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
