import { Terminal } from "lucide-react";
import MaverickLogo from "./MaverickLogo";

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  titleSuffix?: string;
  onToggleSidebar?: () => void;
}

export default function Header({ currentTab, onNavigate, titleSuffix, onToggleSidebar }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full bg-[#131313]/80 backdrop-blur-xl border-b-[0.5px] border-[#3b494b]/30 shadow-[0_0_15px_rgba(0,240,255,0.1)] z-50">
      <div className="flex justify-between items-center px-6 h-16 w-full max-w-7xl mx-auto">
        {/* Leading icon */}
        <div 
          onClick={onToggleSidebar}
          className="flex items-center justify-center w-10 h-10 text-[#b9cacb] hover:text-[#00f0ff] transition-colors duration-300 cursor-pointer active:scale-95"
          id="hdr-lead-icon"
          title="Toggle Chronicle Registry Sidebar"
        >
          <Terminal size={20} className="font-mono" />
        </div>

        {/* Brand center */}
        <div 
          className="font-mono text-xs font-bold tracking-[0.2em] text-[#00dbe9] select-none flex items-center gap-2"
          id="hdr-brand"
        >
          <MaverickLogo height={18} className="text-[#00f0ff] animate-pulse" />
          {currentTab === "hasex" ? "HASEX CORE // MAVERICK" : <>HASEX_OS{titleSuffix ? ` // ${titleSuffix}` : ""}</>}
        </div>

        {/* Spacing placeholder for layout symmetry */}
        <div className="w-10 h-10" id="hdr-trail-placeholder" />
      </div>
    </header>
  );
}
