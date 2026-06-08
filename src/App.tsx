import { useState, useEffect } from "react";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import OperatorProfile from "./components/OperatorProfile";
import LandingPortal from "./components/LandingPortal";
import OnboardingEvaluation from "./components/OnboardingEvaluation";
import MaverickEngine from "./components/MaverickEngine";
import MaverickJournal from "./components/MaverickJournal";
import Frontier from "./components/Frontier";
import ChronicleSidebar from "./components/ChronicleSidebar";

export default function App() {
  const [isEntered, setIsEntered] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("frontier");
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Initialize and load from local storage
  useEffect(() => {
    try {
      const cachedEvaluation = localStorage.getItem("hasex_evaluation");
      if (cachedEvaluation) {
        setEvaluationResult(JSON.parse(cachedEvaluation));
      }
    } catch (err) {
      console.error("HASEX_OS // Error reading operational registers from localStorage:", err);
    }
  }, []);

  // Header dynamic subtitle mapper
  const getHeaderSubtitle = () => {
    switch (activeTab) {
      case "frontier": return "FRONTIER";
      case "hasex": return "ADAPTIVE CORE";
      case "profile": return "PROFILE";
      case "journal": return "CHRONICLE";
      default: return "";
    }
  };

  if (!isEntered) {
    return <LandingPortal onEnter={() => setIsEntered(true)} />;
  }

  if (!evaluationResult) {
    return <OnboardingEvaluation onCompleted={setEvaluationResult} />;
  }

  return (
    <div className={`min-h-screen bg-black text-[#e2e2e2] flex flex-col font-sans relative antialiased select-none pb-28 ${activeTab === "hasex" ? "overflow-hidden" : ""}`}>
      {/* Absolute top grid background decor */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.02)_0%,transparent_75%)] pointer-events-none select-none z-0" />

      {/* Top Header App bar */}
      <Header 
        currentTab={activeTab} 
        onNavigate={(tab) => {
          setActiveTab(tab);
        }} 
        titleSuffix={getHeaderSubtitle()}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Reactive History Sidebar drawer */}
      <ChronicleSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onNavigate={setActiveTab} />

      {/* Main Container Canvas */}
      <main className={
        activeTab === "hasex" 
          ? "flex-grow pt-16 w-full flex flex-col items-stretch justify-stretch z-10 relative bg-black h-[calc(100vh-140px)] overflow-hidden"
          : "flex-grow pt-24 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col items-center justify-center z-10 relative"
      }>
        <div className={activeTab === "hasex" ? "w-full h-full flex flex-col" : "w-full"}>
          {/* FRONTIER HOMEPAGE VIEW */}
          {activeTab === "frontier" && (
            <div className="w-full pb-8">
              <Frontier onNavigate={setActiveTab} />
            </div>
          )}

          {/* MAVERICK COMMAND ENGINE TAB */}
          {activeTab === "hasex" && (
            <div className="w-full h-full flex flex-col overflow-hidden">
              <MaverickEngine />
            </div>
          )}

          {/* MAVERICK JOURNAL GUIDED MODULE */}
          {activeTab === "journal" && (
            <div className="w-full pb-8">
              <MaverickJournal />
            </div>
          )}

          {/* OPERATOR PROFILE REGISTRY TAB */}
          {activeTab === "profile" && (
            <div className="w-full select-none">
              <OperatorProfile onTriggerQuiz={() => setEvaluationResult(null)} />
            </div>
          )}
        </div>
      </main>

      {/* Persistent Bottom Nav */}
      <BottomNav 
        activeTab={activeTab} 
        onTabChange={(tab) => setActiveTab(tab)} 
      />
    </div>
  );
}
