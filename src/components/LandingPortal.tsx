import React, { useEffect, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, signInWithGooglePortal } from "../lib/firebase";
import { RefreshCw, ShieldAlert, Compass } from "lucide-react";

interface LandingPortalProps {
  onEnter: () => void;
}

export default function LandingPortal({ onEnter }: LandingPortalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [isWarping, setIsWarping] = useState(false);
  const [showSystemAssembling, setShowSystemAssembling] = useState(false);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [coords, setCoords] = useState("COORDS // 40.7128 N, 74.0060 W");
  const [globalSpeedMultiplier, setGlobalSpeedMultiplier] = useState(1);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });

  // Authentic Firebase User State bindings
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isAuthWorking, setIsAuthWorking] = useState<boolean>(false);
  const [authErrorText, setAuthErrorText] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Generate static but realistic coordinate tag
    const lat = (Math.random() * 180 - 90).toFixed(4);
    const lng = (Math.random() * 360 - 180).toFixed(4);
    setCoords(`COORDS // ${lat} N, ${lng} W`);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let particles: Particle[] = [];
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let animationFrameId: number;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);

    class Particle {
      x!: number;
      y!: number;
      baseSize!: number;
      size!: number;
      baseSpeed!: number;
      speed!: number;
      alpha!: number;
      color!: string;

      constructor() {
        this.reset();
      }

      reset() {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.max(width, height) * 0.6 + Math.random() * width * 0.5;
        this.x = width / 2 + Math.cos(angle) * dist;
        this.y = height / 2 + Math.sin(angle) * dist;

        this.baseSize = Math.random() * 1.8 + 0.4;
        this.size = this.baseSize;

        this.baseSpeed = Math.random() * 0.4 + 0.1;
        this.speed = this.baseSpeed;

        this.alpha = Math.random() * 0.4 + 0.1;
        this.color = Math.random() > 0.7 ? "#00f0ff" : "#ffffff";
      }

      update(warping: boolean, speedMultiplier: number) {
        const dx = width / 2 - this.x;
        const dy = height / 2 - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;

        if (warping) {
          this.speed += 1.2;
          this.size = this.baseSize * (1 + this.speed * 0.05);
          this.alpha = Math.min(1, this.alpha + 0.02);
        } else {
          this.speed = this.baseSpeed * speedMultiplier;
        }

        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;

        if (distance < 40 && !warping) {
          this.reset();
        }

        if (warping && distance < 10) {
          this.alpha *= 0.9;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.globalAlpha = this.alpha;

        if (isWarping) {
          const dx = width / 2 - this.x;
          const dy = height / 2 - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const streakLen = Math.min(this.speed * 15, 300);
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x - (dx / dist) * streakLen, this.y - (dy / dist) * streakLen);

          ctx.strokeStyle = this.color;
          ctx.lineWidth = this.size;
          ctx.stroke();
        } else {
          ctx.fillStyle = this.color;
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const count = Math.min(window.innerWidth / 4, 350);
    for (let i = 0; i < count; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.update(isWarping, globalSpeedMultiplier);
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isWarping, globalSpeedMultiplier]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isWarping) return;
      const x = (e.clientX - window.innerWidth / 2) / 60;
      const y = (e.clientY - window.innerHeight / 2) / 60;
      setParallaxOffset({ x, y });

      const mouseFromCenter = Math.sqrt(
        Math.pow(e.clientX - window.innerWidth / 2, 2) +
          Math.pow(e.clientY - window.innerHeight / 2, 2)
      );
      setGlobalSpeedMultiplier(1 + (mouseFromCenter / window.innerWidth) * 2);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isWarping]);

  const handleGoogleSignIn = async () => {
    if (isAuthWorking) return;
    setIsAuthWorking(true);
    setAuthErrorText(null);
    try {
      await signInWithGooglePortal();
      triggerEntry();
    } catch (err: any) {
      console.error(err);
      setAuthErrorText(err?.message || "Google Handshake aborted.");
    } finally {
      setIsAuthWorking(false);
    }
  };

  const triggerEntry = () => {
    if (isWarping) return;
    setIsWarping(true);

    // Fade to black and transition
    setTimeout(() => {
      setFlashOpacity(1);
      setTimeout(() => {
        setShowSystemAssembling(true); // Turns background black, text white
        setFlashOpacity(0);
        setTimeout(() => {
          onEnter();
        }, 1500); // Directly enter relatively fast
      }, 500);
    }, 1200);
  };

  if (showSystemAssembling) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden font-mono z-50">
        <div className="flex flex-col items-center animate-pulse">
          <span className="text-white uppercase tracking-[1em] translate-x-[0.5em] text-xs sm:text-sm font-bold">
            SYSTEM_ASSEMBLING
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-black select-none font-mono">
      {/* HUD ELEMENTS */}
      <div
        className={`fixed top-6 left-6 z-50 flex items-center gap-3 transition-all duration-500 ${
          isWarping ? "opacity-0 -translate-y-2 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="w-1.5 h-1.5 bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]"></div>
        <span className="text-[11px] text-[#00f0ff] font-bold uppercase tracking-widest leading-none">
          HX-SIGNAL: SEARCHING...
        </span>
      </div>

      <div
        className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-1 transition-all duration-500 ${
          isWarping ? "opacity-0 translate-y-2 pointer-events-none" : "opacity-100"
        }`}
      >
        <span className="text-[10px] text-[#b9cacb]/45 uppercase tracking-wider">{coords}</span>
        <span className="text-[10px] text-[#b9cacb]/45 uppercase tracking-wider">V_01.8.9_STABLE</span>
      </div>

      <div className="animate-scan fixed left-0 w-full h-[120px] z-[40] bg-gradient-to-b from-transparent via-[#00f0ff]/[0.035] to-transparent pointer-events-none"></div>

      {/* SINGULARITY SECTION */}
      <div
        ref={anchorRef}
        style={{
          transform: `translate(${parallaxOffset.x}px, ${parallaxOffset.y}px)`,
        }}
        className={`relative flex flex-col items-center justify-center z-10 transition-transform duration-[1500ms] ease-[cubic-bezier(0.9,0,0.1,1)] ${
          isWarping ? "scale-[25] opacity-0 blur-[25px] brightness-[8]" : "scale-100"
        }`}
      >
        {/* The Core: Black Mass Singularity pulling particles in */}
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-[#030303] border border-neutral-800 flex items-center justify-center relative select-none">
          {/* Gravitational pull field borders */}
          <div className="absolute inset-[-40px] rounded-full bg-[radial-gradient(circle,rgba(0,0,0,1)_0%,transparent_70%)] -z-10"></div>
          <div className="absolute inset-[-50px] rounded-full border border-neutral-950 animate-pulse-ring -z-20"></div>
          <div className="absolute inset-[-100px] rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.85)_0%,transparent_90%)] -z-30"></div>

          <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-black border border-neutral-900 shadow-[inset_0_0_25px_rgba(0,0,0,1)] relative overflow-hidden animate-breathe flex items-center justify-center">
            {/* Absolute central black horizon */}
            <div className="w-8 h-8 rounded-full bg-black shadow-[0_0_20px_rgba(0,0,0,1)]"></div>
          </div>
        </div>

        {/* Content Area */}
        <div
          className={`mt-12 text-center px-8 transition-all duration-700 w-full max-w-sm flex flex-col items-center ${
            isWarping ? "opacity-0 scale-95 pointer-events-none" : "opacity-100"
          }`}
        >
          <p className="animate-glitch text-[#dbfcff]/80 uppercase tracking-[0.4em] mb-8 leading-relaxed text-xs font-mono">
            The structure was always there—hidden beneath the noise.
          </p>

          {authErrorText && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 p-3 text-left flex gap-2 w-full">
              <ShieldAlert size={14} className="text-red-400 shrink-0 mt-0.5" />
              <div className="font-mono text-[9px] text-red-300 leading-normal">
                <span className="font-bold text-red-400 block mb-0.5">UPLINK_FAULT //</span>
                {authErrorText}
              </div>
            </div>
          )}

          {isAuthChecking ? (
            <div className="flex flex-col items-center justify-center py-4 font-mono text-[10px] text-[#00f0ff] gap-2 select-none">
              <RefreshCw size={16} className="animate-spin text-[#00f0ff]" />
              <span className="tracking-widest animate-pulse">COGNITIVE INDEX HANDSHAKE...</span>
            </div>
          ) : currentUser ? (
            /* USER IS LOGGED IN - WE WELCOME THEM AND PROMPT ENTER */
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="bg-[#00f0ff]/5 border border-[#00f0ff]/30 p-3 w-full font-mono text-[10px] tracking-wider text-[#dbfcff] text-left">
                <span className="text-[#00f0ff] font-bold block mb-1">OPERATOR AUTHORIZED //</span>
                {currentUser.displayName || currentUser.email}
              </div>

              <button
                type="button"
                className="group relative flex items-center justify-center w-full py-4 transition-all duration-300 active:scale-95 cursor-pointer bg-black/40"
                onClick={triggerEntry}
              >
                {/* Button Border/Glow */}
                <div className="absolute inset-0 border border-[#00f0ff]/25 group-hover:border-[#00f0ff]/65 transition-colors duration-500"></div>
                <div className="absolute inset-[-4px] border border-[#00f0ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 scale-105"></div>
                <span className="text-[11px] text-[#dbfcff] font-bold tracking-[0.3em] uppercase z-10 flex items-center gap-2">
                  ENTER SYSTEM <Compass size={13} className="animate-spin duration-5000 text-[#00f0ff]" />
                </span>
                {/* Scanning line animation */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-[#00f0ff]/40 -translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-full transition-all duration-[2s] ease-in-out"></div>
              </button>
            </div>
          ) : (
            /* USER NOT LOGGED IN - SHOW GOOGLE AUTH BUTTON & SKIP OUT */
            <div className="flex flex-col items-center gap-3 w-full">
              {/* BRAND-COMPLIANT GOOGLE BUTTON */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthWorking}
                className="w-full flex items-center justify-center bg-white hover:bg-neutral-100 text-neutral-800 font-sans text-[13px] font-semibold md:font-bold py-3 px-5 rounded shadow-lg cursor-pointer transition-all duration-200 active:scale-95 select-none tracking-normal border border-white focus:outline-none"
              >
                {/* GOOGLE COLORFUL LOGO AS REQUESTED */}
                {isAuthWorking ? (
                  <RefreshCw size={16} className="animate-spin text-neutral-700" />
                ) : (
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 mr-3 shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.5 24c0-1.55-.15-3.24-.47-4.77H24v9.03h12.75c-.55 2.87-2.22 5.29-4.72 6.96l7.31 5.66C43.61 36.6 46.5 30.9 46.5 24z"/>
                    <path fill="#FBBC05" d="M10.54 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.31-5.66c-2.11 1.41-4.81 2.27-8.58 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* ALTERNATIVE BYPASS OPERATOR PORT FOR LOW-FRICTION TEST */}
              <button
                type="button"
                onClick={triggerEntry}
                className="text-[9px] text-[#b9cacb]/45 hover:text-[#00f0ff] uppercase tracking-widest font-bold underline underline-offset-4 py-1.5 transition-colors cursor-pointer select-none bg-transparent border-none"
              >
                Access directly as Guest Sandbox
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BACKGROUND PARTICLES CANVAS */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none"></canvas>

      {/* FLASH OVERLAY (TURNS BLACK NOW) */}
      <div
        style={{ opacity: flashOpacity }}
        className="fixed inset-0 bg-black pointer-events-none z-[100] transition-opacity duration-500"
      ></div>
    </div>
  );
}
