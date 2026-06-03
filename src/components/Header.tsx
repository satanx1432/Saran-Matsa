import { Terminal, Sliders, AlertTriangle } from "lucide-react";

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  titleSuffix?: string;
}

export default function Header({ currentTab, onNavigate, titleSuffix }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full bg-[#131313]/80 backdrop-blur-xl border-b-[0.5px] border-[#3b494b]/30 shadow-[0_0_15px_rgba(0,240,255,0.1)] z-50">
      <div className="flex justify-between items-center px-6 h-16 w-full max-w-7xl mx-auto">
        {/* Leading icon */}
        <div 
          onClick={() => onNavigate("radar")}
          className="flex items-center justify-center w-10 h-10 text-[#b9cacb] hover:text-[#00f0ff] transition-colors duration-300 cursor-pointer active:scale-95"
          id="hdr-lead-icon"
        >
          <Terminal size={20} className="font-mono" />
        </div>

        {/* Brand center */}
        <div 
          className="font-mono text-xs font-bold tracking-[0.2em] text-[#00dbe9] select-none flex items-center gap-2"
          id="hdr-brand"
        >
          <div className="w-1.5 h-1.5 bg-[#00dbe9] signal-glow rounded-none animate-pulse"></div>
          HASEX_OS{titleSuffix ? ` // ${titleSuffix}` : ""}
        </div>

        {/* Trailing icon */}
        <div 
          onClick={() => onNavigate("radar")}
          className="flex items-center justify-center w-10 h-10 text-[#b9cacb] hover:text-[#00f0ff] transition-colors duration-300 cursor-pointer active:scale-95"
          id="hdr-trail-icon"
        >
          {currentTab === "core" ? (
            <AlertTriangle size={20} className="text-[#ffb4ab]" />
          ) : (
            <Sliders size={20} />
          )}
        </div>
      </div>
    </header>
  );
}
