import { ArrowLeft, Target, Zap, Clock, Repeat, ShieldAlert } from "lucide-react";
import { Mission } from "../types";

interface MissionAssignmentProps {
  mission: Mission;
  onExecute: () => void;
  onAbort: () => void;
}

export default function MissionAssignment({ mission, onExecute, onAbort }: MissionAssignmentProps) {
  return (
    <div className="w-full flex flex-col gap-8" id="mission-assignment-section">
      {/* Transactional Abort header callback / Back button */}
      <div className="flex justify-between items-center pb-4 border-b-[0.5px] border-[#3b494b]/20 text-left">
        <button
          onClick={onAbort}
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#b9cacb] hover:text-[#00f0ff] transition-colors duration-200 active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>ABORT MISSION</span>
        </button>

        <div className="font-mono text-[10px] tracking-widest text-[#00dbe9] uppercase select-none">
          HASEX_OS // TACTICAL
        </div>

        <div className="text-[#ffb4ab] flex items-center justify-center w-8 h-8">
          <ShieldAlert size={16} className="animate-pulse" />
        </div>
      </div>

      {/* Primary Mission Header */}
      <div className="text-center flex flex-col gap-2 items-center mt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 glass-panel rounded-none bg-[#0a0a0b]/80 border-[#3b494b]/40">
          <span className="w-1.5 h-1.5 bg-[#00dbe9] signal-glow block rounded-none"></span>
          <span className="font-mono text-[10px] font-bold text-[#00dbe9] uppercase tracking-widest leading-none">
            MISSION DIRECTIVE ASSIGNED
          </span>
        </div>

        <h1 className="font-sans text-3xl md:text-5xl font-bold text-[#e2e2e2] tracking-tight antialiased uppercase leading-tight max-w-2xl mt-4">
          {mission.title}
        </h1>

        <p className="font-mono text-xs text-[#b9cacb]/80 uppercase mt-2">
          ID: {mission.code} // SECTOR: {mission.sector}
        </p>
      </div>

      {/* Bento Card: Mission Details */}
      <div className="glass-panel p-6 md:p-8 rounded-none flex flex-col gap-6 relative overflow-hidden bg-[#0a0a0b]/70 border-[#3b494b]/40 group text-left">
        {/* Abstract cyber layout decorations */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/5 rounded-none blur-2xl pointer-events-none"></div>

        {/* Primary objective statement header */}
        <div className="flex justify-between items-start border-b-[0.5px] border-[#3b494b]/30 pb-4">
          <div className="flex items-start gap-4">
            <div className="mt-1 bg-[#00dbe9]/10 p-2 border-[0.5px] border-[#00dbe9]/30">
              <Target size={24} className="text-[#00dbe9]" />
            </div>
            <div>
              <h2 className="font-sans text-xl font-bold text-[#e2e2e2]">Primary Objective</h2>
              <p className="font-mono text-xs text-[#b9cacb]/80 uppercase tracking-wide mt-1">
                {mission.objective}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic metadata metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2 border-b-[0.5px] border-[#3b494b]/20 pb-6">
          <div className="flex flex-col gap-1 text-left">
            <span className="font-mono text-[10px] text-[#b9cacb]/60 uppercase tracking-wider font-semibold">
              Difficulty
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#ffb4ab]">
                {mission.difficulty}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <span className="font-mono text-[10px] text-[#b9cacb]/60 uppercase tracking-wider font-semibold">
              Signal Reward
            </span>
            <div className="flex items-center gap-1.5 text-[#00dbe9]">
              <Zap size={14} className="fill-current" />
              <span className="font-mono text-sm font-bold">
                +{mission.reward} SIG
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <span className="font-mono text-[10px] text-[#b9cacb]/60 uppercase tracking-wider font-semibold">
              Time Est.
            </span>
            <div className="flex items-center gap-1.5 text-[#e2e2e2]">
              <Clock size={14} className="text-[#b9cacb]/80" />
              <span className="font-mono text-sm font-bold">
                {mission.time_est_m} MIN
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 text-left">
            <span className="font-mono text-[10px] text-[#b9cacb]/60 uppercase tracking-wider font-semibold">
              Loop Status
            </span>
            <div className="flex items-center gap-1.5 text-[#e2e2e2]">
              <Repeat size={14} className="text-[#b9cacb]/80" />
              <span className="font-mono text-sm font-bold uppercase">
                {mission.loop_status}
              </span>
            </div>
          </div>
        </div>

        {/* Mission action panel */}
        <div className="mt-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 text-[#b9cacb]/70 font-mono text-[11px] uppercase select-none w-full md:w-auto">
            <span className="w-1 h-1 bg-[#b9cacb] block rounded-none animate-ping"></span>
            Awaiting Authorization...
          </div>

          <button
            onClick={onExecute}
            className="w-full md:w-auto bg-[#F0F0F0] hover:bg-white text-[#000000] px-8 py-4 flex items-center justify-center gap-2 transition-all duration-300 hover:signal-glow border-[0.5px] border-transparent font-mono text-xs font-bold tracking-[0.2em] rounded-none cursor-pointer active:scale-95"
          >
            <span>EXECUTE MISSION</span>
            <Zap size={13} className="fill-current" />
          </button>
        </div>
      </div>

      {/* Degradation sub warning notification */}
      <div className="flex flex-col gap-1 opacity-70 hover:opacity-100 transition-opacity duration-300 select-none">
        <p className="font-mono text-[10px] text-center uppercase tracking-[0.1em] text-[#ffb4ab]">
          [!] Failure to execute may result in localized sector degradation.
        </p>
      </div>
    </div>
  );
}
