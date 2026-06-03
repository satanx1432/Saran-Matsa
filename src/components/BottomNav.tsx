import { Radar, Database, Layers, Globe, User } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  activeMissionCount?: number;
}

export default function BottomNav({ activeTab, onTabChange, activeMissionCount }: BottomNavProps) {
  const tabs = [
    { id: "radar", label: "TODAY", icon: Radar },
    { id: "data", label: "JOURNAL", icon: Database },
    { id: "core", label: "TASKS", icon: Layers, badge: activeMissionCount && activeMissionCount > 0 ? activeMissionCount : undefined },
    { id: "chat", label: "CHAT", icon: Globe },
    { id: "profile", label: "PROFILE", icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-[#131313]/90 backdrop-blur-xl border-t-[0.5px] border-[#3b494b]/30 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
      <div className="flex justify-around items-center py-3 px-4 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center p-2 relative transition-all duration-300 active:scale-95 cursor-pointer rounded-none group w-20`}
              id={`nav-${tab.id}`}
            >
              <div className="relative">
                <Icon 
                  size={20}
                  className={`mb-1 transition-all duration-300 ${
                    isActive 
                      ? "text-[#00dbe9] filter drop-shadow-[0_0_8px_rgba(0,219,233,0.5)]" 
                      : "text-[#b9cacb]/50 group-hover:text-[#00dbe9]/80"
                  }`} 
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-[#ffb4ab] text-black text-[9px] font-mono leading-none px-1 py-0.5 rounded-none font-bold">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span 
                className={`font-mono text-[10px] tracking-wider transition-all duration-300 ${
                  isActive 
                    ? "text-[#e2e2e2] font-semibold" 
                    : "text-[#b9cacb]/50 group-hover:text-[#e2e2e2]/80"
                }`}
              >
                {tab.label}
              </span>
              
              {/* Highlight active underline line bar */}
              {isActive && (
                <div className="absolute bottom-0 w-8 h-[2px] bg-[#00dbe9] signal-glow"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
