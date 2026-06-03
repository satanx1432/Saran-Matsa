import { FlowchartData, FlowchartNode } from "../types";
import { ArrowRight, Clock, Info, ShieldAlert, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

interface AnalysisFlowchartProps {
  data: FlowchartData;
}

export default function AnalysisFlowchart({ data }: AnalysisFlowchartProps) {
  if (!data || !data.nodes || data.nodes.length === 0) {
    return null;
  }

  // Group nodes by their productivity type to render summaries or stats
  const productiveNodes = data.nodes.filter(n => n.type === "productive");
  const wasteNodes = data.nodes.filter(n => n.type === "distraction");

  // Style finder for node types
  const getNodeStyles = (type: FlowchartNode["type"]) => {
    switch (type) {
      case "source":
        return {
          border: "border-[#00dbe9]/40 bg-[#00dbe9]/5 hover:border-[#00dbe9]",
          text: "text-[#00dbe9]",
          badgeBg: "bg-[#00dbe9]/15",
          accentLine: "bg-[#00dbe9]"
        };
      case "productive":
        return {
          border: "border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400",
          text: "text-emerald-400/90",
          badgeBg: "bg-emerald-500/10",
          accentLine: "bg-emerald-500"
        };
      case "distraction":
        return {
          border: "border-amber-500/30 bg-amber-950/10 hover:border-amber-400",
          text: "text-amber-400/90",
          badgeBg: "bg-amber-500/10",
          accentLine: "bg-amber-500"
        };
      case "bottleneck":
        return {
          border: "border-red-500/40 bg-red-950/20 hover:border-red-400",
          text: "text-red-400",
          badgeBg: "bg-red-500/10 animate-pulse",
          accentLine: "bg-red-500"
        };
      case "action":
        return {
          border: "border-purple-500/40 bg-purple-950/20 hover:border-purple-400",
          text: "text-purple-400",
          badgeBg: "bg-purple-500/10",
          accentLine: "bg-purple-500"
        };
      default:
        return {
          border: "border-[#3b494b]/30 bg-[#0a0a0b]/80",
          text: "text-[#b9cacb]",
          badgeBg: "bg-[#3b494b]/20",
          accentLine: "bg-[#3b494b]"
        };
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 border-[0.5px] border-[#3b494b]/30 bg-[#060607]/90 p-5 md:p-6 select-none relative" id="hasex-flowchart-block">
      {/* Background visual network ambient grids */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-[#00dbe9]/3 rounded-none blur-3xl pointer-events-none" />
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-[0.5px] border-[#3b494b]/15 pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-[#00dbe9]" />
          <h3 className="font-mono text-[10px] uppercase font-bold tracking-[0.15em] text-[#00dbe9]">
            ATTENTION MAP // COGNITIVE WASTE vs PRODUCTIVE PATHWAYS
          </h3>
        </div>
        <div className="flex gap-4 font-mono text-[8px] text-[#b9cacb]/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500/20 border border-emerald-500/50" />
            <span>PRODUCTIVE BLOCKS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-amber-500/20 border border-amber-500/50" />
            <span>ATTENTION LEAK (WASTED)</span>
          </div>
        </div>
      </div>

      {/* Metric summary panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0a0a0c]/80 border-[0.5px] border-[#3b494b]/20 p-3.5 mb-2 text-left">
        <div className="flex items-start gap-3 border-r-[0.5px] border-[#3b494b]/10 pr-4">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 mt-0.5">
            <Sparkles size={14} />
          </div>
          <div>
            <span className="block font-mono text-[7px] text-[#b9cacb]/50 uppercase tracking-widest leading-none">TIME USED (PRODUCTIVE)</span>
            <span className="block text-xl font-sans font-bold text-emerald-400 mt-1">
              {productiveNodes.length > 0 ? productiveNodes.map(n => n.time_spent || "").join(", ") || "Active Block" : "Aligned"}
            </span>
            <span className="block font-sans text-[10px] text-[#b9cacb]/60 mt-0.5">
              Refocusing attention directly on deep-work parameters.
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3 pl-0 sm:pl-2">
          <div className="p-1.5 bg-amber-500/10 text-amber-400 mt-0.5">
            <AlertTriangle size={14} />
          </div>
          <div>
            <span className="block font-mono text-[7px] text-[#b9cacb]/50 uppercase tracking-widest leading-none">TIME WASTED (LEAKAGE)</span>
            <span className="block text-xl font-sans font-bold text-amber-400 mt-1">
              {wasteNodes.length > 0 ? wasteNodes.map(n => n.time_spent || "").join(", ") || "None Identified" : "0 Minutes"}
            </span>
            <span className="block font-sans text-[10px] text-[#b9cacb]/60 mt-0.5">
              Lost in micro-loops or excessive notification processing.
            </span>
          </div>
        </div>
      </div>

      {/* Visual Flow diagram container */}
      <div className="relative py-4 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 overflow-x-auto select-none">
        {data.nodes.map((node, index) => {
          const styles = getNodeStyles(node.type);
          const isLast = index === data.nodes.length - 1;

          return (
            <div key={node.id} className="flex flex-col md:flex-row items-center w-full md:w-auto relative group">
              {/* Node Card */}
              <div
                className={`w-full md:w-[170px] min-h-[110px] p-4 border-[0.5px] ${styles.border} transition-all duration-300 relative text-left select-none flex flex-col justify-between`}
              >
                {/* Node Accent Left Header Strip */}
                <div className={`absolute left-0 top-0 w-[2.5px] h-full ${styles.accentLine}`} />

                {/* Node Node Type Header */}
                <div className="flex justify-between items-center mb-2 font-mono text-[8.5px]">
                  <span className={`px-1.5 py-0.5 ${styles.badgeBg} ${styles.text} font-bold lowercase tracking-wider`}>
                    {node.type}
                  </span>
                  {node.time_spent && (
                    <span className="flex items-center gap-1 opacity-70">
                      <Clock size={8} /> {node.time_spent}
                    </span>
                  )}
                </div>

                {/* Content text */}
                <div className="flex-grow flex flex-col gap-1.5">
                  <h4 className="font-sans text-[11px] font-bold text-[#e2e2e2] leading-tight tracking-tight">
                    {node.label}
                  </h4>
                  {node.description && (
                    <p className="font-sans text-[9px] text-[#b9cacb]/60 leading-relaxed max-w-[150px]">
                      {node.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Edge Connection Arrow */}
              {!isLast && (
                <div className="flex items-center justify-center py-2 md:px-2 relative">
                  {/* Vertical on Mobile, Horizontal on Desktop */}
                  <div className="md:hidden flex flex-col items-center gap-1 text-[#3b494b]/50 my-1">
                    <div className="w-[0.5px] h-6 bg-[#3b494b]/40 border-dashed" />
                    <ArrowRight size={14} className="rotate-90 text-[#00dbe9]/70" />
                  </div>

                  <div className="hidden md:flex items-center gap-1 text-[#3b494b]/50">
                    <div className="w-4 h-[0.5px] bg-[#3b494b]/30" />
                    <ArrowRight size={12} className="text-[#00dbe9]/70" />
                    {data.edges[index]?.label && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[7px] text-[#b9cacb]/40 uppercase tracking-widest whitespace-nowrap">
                        {data.edges[index].label}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
