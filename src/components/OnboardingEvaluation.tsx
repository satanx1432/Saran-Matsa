import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  Lock, 
  RefreshCw, 
  AlertOctagon, 
  Layers, 
  Zap, 
  BarChart2,
  Brain,
  Timer,
  Compass,
  LineChart,
  UserCheck
} from "lucide-react";
import { db, auth } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface Question {
  id: number;
  text: string;
  category: "Action" | "Persistence" | "Discipline" | "Awareness" | "Courage" | "Learning";
  options: {
    key: "A" | "B" | "C" | "D" | "E" | "F";
    text: string;
    scores: {
      Action: number;
      Persistence: number;
      Discipline: number;
      Awareness: number;
      Courage: number;
      Learning: number;
    };
  }[];
}

const QUESTIONS_LIST: Question[] = [
  {
    id: 1,
    category: "Action",
    text: "When starting something new, I usually...",
    options: [
      {
        key: "A",
        text: "Take a small first step.",
        scores: { Action: 0.95, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "B",
        text: "Think about the long-term path.",
        scores: { Action: 0.45, Persistence: 0.95, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "C",
        text: "Create some structure first.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.95, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "D",
        text: "Understand why it matters.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.95, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "E",
        text: "Accept the uncertainty and begin.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.95, Learning: 0.45 }
      },
      {
        key: "F",
        text: "Learn more before moving.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.95 }
      }
    ]
  },
  {
    id: 2,
    category: "Persistence",
    text: "When progress is slow, I usually...",
    options: [
      {
        key: "A",
        text: "Focus on the next action.",
        scores: { Action: 0.95, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "B",
        text: "Stay committed to the goal.",
        scores: { Action: 0.45, Persistence: 0.95, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "C",
        text: "Adjust my routine or system.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.95, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "D",
        text: "Reflect on what's happening.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.95, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "E",
        text: "Make a difficult decision.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.95, Learning: 0.45 }
      },
      {
        key: "F",
        text: "Look for lessons.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.95 }
      }
    ]
  },
  {
    id: 3,
    category: "Discipline",
    text: "With a completely free day, I usually...",
    options: [
      {
        key: "A",
        text: "Start doing something quickly.",
        scores: { Action: 0.95, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "B",
        text: "Work on something meaningful.",
        scores: { Action: 0.45, Persistence: 0.95, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "C",
        text: "Organize my time.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.95, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "D",
        text: "Think about priorities.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.95, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "E",
        text: "Try something unfamiliar.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.95, Learning: 0.45 }
      },
      {
        key: "F",
        text: "Explore new ideas.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.95 }
      }
    ]
  },
  {
    id: 4,
    category: "Awareness",
    text: "When someone disagrees with me, I usually...",
    options: [
      {
        key: "A",
        text: "Focus on what to do next.",
        scores: { Action: 0.95, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "B",
        text: "Test the idea over time.",
        scores: { Action: 0.45, Persistence: 0.95, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "C",
        text: "Compare it with experience.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.95, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "D",
        text: "Understand their perspective.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.95, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "E",
        text: "Question my assumptions.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.95, Learning: 0.45 }
      },
      {
        key: "F",
        text: "Look for something to learn.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.95 }
      }
    ]
  },
  {
    id: 5,
    category: "Learning",
    text: "In an unfamiliar situation, I usually...",
    options: [
      {
        key: "A",
        text: "Learn by doing.",
        scores: { Action: 0.95, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "B",
        text: "Commit before judging.",
        scores: { Action: 0.45, Persistence: 0.95, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "C",
        text: "Build a framework.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.95, Awareness: 0.45, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "D",
        text: "Observe before acting.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.95, Courage: 0.45, Learning: 0.45 }
      },
      {
        key: "E",
        text: "Move despite uncertainty.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.95, Learning: 0.45 }
      },
      {
        key: "F",
        text: "Gather information first.",
        scores: { Action: 0.45, Persistence: 0.45, Discipline: 0.45, Awareness: 0.45, Courage: 0.45, Learning: 0.95 }
      }
    ]
  }
];

interface OnboardingEvaluationProps {
  onCompleted: (results: any) => void;
}

export default function OnboardingEvaluation({ onCompleted }: OnboardingEvaluationProps) {
  const [currentStep, setCurrentStep] = useState<"intro" | "questions" | "loading" | "results">("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C" | "D" | "E" | "F">>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [calculatedResults, setCalculatedResults] = useState<any | null>(null);

  // Generate a steady device tracking ID
  const [deviceUid, setDeviceUid] = useState<string>("");

  useEffect(() => {
    let uid = localStorage.getItem("hasex_device_uid");
    if (!uid) {
      uid = "DEV-" + Math.random().toString(36).substring(2, 11).toUpperCase();
      localStorage.setItem("hasex_device_uid", uid);
    }
    setDeviceUid(uid);
  }, []);

  const handleSelectOption = (questionId: number, optionKey: "A" | "B" | "C" | "D" | "E" | "F") => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const handleNext = () => {
    if (!answers[QUESTIONS_LIST[currentQuestionIndex].id]) return; // Must answer to advance
    if (currentQuestionIndex < QUESTIONS_LIST.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      processAndSaveResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Trait and report constructor
  const processAndSaveResults = async () => {
    setIsSubmitting(true);

    // Calculation mapping
    // Action: Q1
    // Persistence: Q2
    // Discipline: Q3 + Q10
    // Awareness: Q7 + Q8
    // Courage: Q4 + Q5
    // Learning: Q6 + Q9

    const getOptionScore = (qId: number, traitName: string) => {
      const q = QUESTIONS_LIST.find((item) => item.id === qId);
      const selectedKey = answers[qId];
      if (!q || !selectedKey) return 0.45;
      const opt = q.options.find((o) => o.key === selectedKey);
      return opt ? (opt.scores as any)[traitName] : 0.45;
    };

    const actionScore = (getOptionScore(1, "Action") + getOptionScore(2, "Action") + getOptionScore(3, "Action") + getOptionScore(4, "Action") + getOptionScore(5, "Action")) / 5;
    const persistenceScore = (getOptionScore(1, "Persistence") + getOptionScore(2, "Persistence") + getOptionScore(3, "Persistence") + getOptionScore(4, "Persistence") + getOptionScore(5, "Persistence")) / 5;
    const disciplineScore = (getOptionScore(1, "Discipline") + getOptionScore(2, "Discipline") + getOptionScore(3, "Discipline") + getOptionScore(4, "Discipline") + getOptionScore(5, "Discipline")) / 5;
    const awarenessScore = (getOptionScore(1, "Awareness") + getOptionScore(2, "Awareness") + getOptionScore(3, "Awareness") + getOptionScore(4, "Awareness") + getOptionScore(5, "Awareness")) / 5;
    const courageScore = (getOptionScore(1, "Courage") + getOptionScore(2, "Courage") + getOptionScore(3, "Courage") + getOptionScore(4, "Courage") + getOptionScore(5, "Courage")) / 5;
    const learningScore = (getOptionScore(1, "Learning") + getOptionScore(2, "Learning") + getOptionScore(3, "Learning") + getOptionScore(4, "Learning") + getOptionScore(5, "Learning")) / 5;

    const traitScores = {
      Action: Number(actionScore.toFixed(2)),
      Persistence: Number(persistenceScore.toFixed(2)),
      Discipline: Number(disciplineScore.toFixed(2)),
      Awareness: Number(awarenessScore.toFixed(2)),
      Courage: Number(courageScore.toFixed(2)),
      Learning: Number(learningScore.toFixed(2))
    };

    const overallScore = Number(
      ((actionScore + persistenceScore + disciplineScore + awarenessScore + courageScore + learningScore) / 6).toFixed(2)
    );

    // Qualitative assessment descriptors
    const tDescriptions: Record<string, string> = {
      Action: "Indicates speed of thought translation into physical actions.",
      Persistence: "Represents durability of task focus when lacking visual signals or quick feedback.",
      Discipline: "Evaluates commitment stability during scheduling disruptions or lack of structure.",
      Awareness: "Deciphers quality of metacognitive feedback loops and pressure parsing.",
      Courage: "Measures willingness to parse risk variables and decide with incomplete telemetry.",
      Learning: "Quantifies adaptability and speed of cognitive framework rewrites on corrective feedback."
    };

    // Sort traits to isolate strengths/weaknesses
    const sortedTraits = Object.entries(traitScores).sort((a, b) => b[1] - a[1]);
    const strongestTraits = sortedTraits.slice(0, 2);
    const weakestTraits = sortedTraits.slice(-2).reverse(); // weakest last

    // Generate analytical report strings verbatim matching instructions format
    let summary = "";
    if (overallScore >= 0.8) {
      summary = `The subject demonstrates an exceptional execution-first profile characterized by extreme cognitive resilience, immediate task starts, and severe modular discipline. External pressure and disruption act as catalysts that sharpen focus vectors rather than scatter them.`;
    } else if (overallScore >= 0.6) {
      summary = `The subject registers a balanced and highly operational baseline. They possess healthy action bias and stable follow-through dynamics, though they are partially susceptible to situational drift during unstructured scheduling windows or extreme friction.`;
    } else if (overallScore >= 0.4) {
      summary = `The subject indicates an emergent execution framework. While cognitive awareness of bottlenecks and developmental loops is functional, actual daily resource allocation remains inconsistent, causing action delays when decisions carry real consequences.`;
    } else {
      summary = `The subject exhibits acute cognitive congestion and execution friction. Intention-to-action translation loops are delayed by resource-gathering filters, and focus commitment declines rapidly in the absence of constant positive feedback signals.`;
    }

    const strengthsList = strongestTraits.map(([trait, score]) => {
      let desc = "";
      if (trait === "Action") desc = "immediate execution starter limits friction windows.";
      if (trait === "Persistence") desc = "immense visual-result-independent routine stamina.";
      if (trait === "Discipline") desc = "extraordinary commitment consistency during structural disruption.";
      if (trait === "Awareness") desc = "high fidelity internal calibration and accurate pattern recognition.";
      if (trait === "Courage") desc = "rapid decision arriving and robust risk-outcome parsing.";
      if (trait === "Learning") desc = "immediate behavioral adaptation on receiving corrective inputs.";
      return `${trait} (${score.toFixed(2)}): Possesses ${desc}`;
    });

    const weaknessesList = weakestTraits.map(([trait, score]) => {
      let desc = "";
      if (trait === "Action") desc = "susceptibility to delay starting, waiting for perfect natural moments.";
      if (trait === "Persistence") desc = "tendency to shift focus to background when quick progress slows.";
      if (trait === "Discipline") desc = "irregularity in habits during unstructured days or schedules.";
      if (trait === "Awareness") desc = "tendency to process situations separately without tracking recurring loops.";
      if (trait === "Courage") desc = "propensity to stay in stable comfort zones, over-analyzing consequences.";
      if (trait === "Learning") desc = "resistance to updating established approaches despite correction signals.";
      return `${trait} (${score.toFixed(2)}): Registers ${desc}`;
    });

    // Custom blind spots mapping
    let blindSpots: string[] = [];
    if (traitScores.Awareness < 0.6) {
      blindSpots.push("You likely underestimate the repetitiveness of your setbacks, treating recurring behavioral patterns as isolated, one-off events.");
    }
    if (traitScores.Action > 0.8 && traitScores.Learning < 0.6) {
      blindSpots.push("Your immediate instinct to take action may sometimes blind you to the fact that you are executing suboptimal strategies over and over again.");
    }
    if (traitScores.Discipline < 0.6 && traitScores.Persistence > 0.7) {
      blindSpots.push("You can work exhaustively when a challenge is active, but you struggle to maintain low-friction operational baselines without a looming push.");
    }
    if (blindSpots.length === 0) {
      blindSpots.push("You may over-rely on positive external indicators to measure correctness, causing tiny friction spikes to register disproportionately in your planning.");
    }

    // 3 next action points
    const nextActions: string[] = [];
    const primaryWeakest = weakestTraits[0][0];
    const secondaryWeakest = weakestTraits[1][0];

    const actionTips: Record<string, string> = {
      Action: "Implement a strict 2-minute prompt window: execute one trivial micro-action within 120 seconds of establishing a work decision.",
      Persistence: "Adopt visual micro-milestones: break projects into 1-hour feedback checkpoints and commit to completing 3 milestones before reviews.",
      Discipline: "Set a rigid, non-negotiable anchor habit: execute a 15-minute scheduled review every day at the exact same hour regardless of disruptors.",
      Awareness: "Log daily telemetry registers: document one bottleneck event and cross-reference weekly logs to actively trace recursive focus blocks.",
      Courage: "Isolate one high-consequence choice, set a hard 10-minute timer, and execute the decision without requesting external confirmation.",
      Learning: "Dedicate a weekly review window to actively target and discard one habit or workflow that is underperforming metrics."
    };
    nextActions.push(actionTips[primaryWeakest]);
    nextActions.push(actionTips[secondaryWeakest]);
    nextActions.push("Connect your daily journal entries to generated missions in Maverick Tasks to actively enforce routine-tracking loops.");

    // Format appraisal report as requested verbatim
    const appraisalReport = `Action: ${traitScores.Action.toFixed(2)}
Persistence: ${traitScores.Persistence.toFixed(2)}
Discipline: ${traitScores.Discipline.toFixed(2)}
Awareness: ${traitScores.Awareness.toFixed(2)}
Courage: ${traitScores.Courage.toFixed(2)}
Learning: ${traitScores.Learning.toFixed(2)}

Overall Score: ${overallScore.toFixed(2)}

Summary:
${summary}

Strengths:
- ${strengthsList[0]}
- ${strengthsList[1]}

Weaknesses:
- ${weaknessesList[0]}
- ${weaknessesList[1]}

Blind Spots:
- ${blindSpots[0]}

Next Actions:
- 1. ${nextActions[0]}
- 2. ${nextActions[1]}
- 3. ${nextActions[2]}`;

    const appraisalData = {
      deviceUid: deviceUid,
      email: auth.currentUser?.email || "anonymous_operator",
      uid: auth.currentUser?.uid || null,
      answers: answers,
      scores: traitScores,
      overallScore: overallScore,
      summary: summary,
      strengths: strengthsList,
      weaknesses: weaknessesList,
      blindSpots: blindSpots,
      nextActions: nextActions,
      appraisalReport: appraisalReport,
      timestamp: new Date().toISOString()
    };

    // Save in LocalStorage
    localStorage.setItem("maverick_evaluation", JSON.stringify(appraisalData));

    // Save of evaluations collection
    const docId = auth.currentUser?.uid || deviceUid;
    try {
      await setDoc(doc(db, "evaluations", docId), {
        ...appraisalData,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("MAVERICK_OS [EVAL WRITE ERROR] // firebase save bypassed:", err);
    }

    // Save as History Record of MAVERICK AI in the background!
    const sessionId = "evaluation_" + Date.now();
    const userId = auth.currentUser?.uid || "guest_operator";
    const chatTitle = `HX COGNITIVE APPRAISAL REVIEW [Score: ${overallScore.toFixed(2)}]`;

    let detailsText = "### SPECIAL DIRECTIVE // COGNITIVE DIAGNOSTIC ANSWERS\n\n";
    QUESTIONS_LIST.forEach((q, idx) => {
      const ansKey = answers[q.id];
      const opt = q.options.find(o => o.key === ansKey);
      detailsText += `**Vector ${idx + 1} (${q.category}):** *${q.text}*\n-> Selected Option ${ansKey}: "${opt?.text || ""}"\n\n`;
    });

    const messagesToSave = [
      {
        role: "user",
        content: `Connect diagnostic terminal ports. Submit Genesis Appraisal answers:\n\n${detailsText}`
      },
      {
        role: "assistant",
        content: `### [NEXUS CORE REVIEW] // BASELINE EVALUATION REPORT SECURED\n\n${appraisalReport}`
      }
    ];

    const messagesJson = JSON.stringify(messagesToSave);
    const timestamp = new Date().toISOString();

    // 1. MySQL Simulated DB background save
    try {
      await fetch("/api/save-mysql-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sessionId,
          userId,
          mode: "learn",
          title: chatTitle,
          messagesJson,
          timestamp
        })
      });
      console.log("MAVERICK_OS [SQL WRITE] // Synced onboarding evaluation history to SQL grid.");
    } catch (mysqlErr) {
      console.error("MAVERICK_OS [SQL ERROR] // MySQL save fault for evaluation log:", mysqlErr);
    }

    // 2. Genuine Firebase chat_histories database save
    if (auth.currentUser) {
      try {
        const docRef = doc(db, "chat_histories", sessionId);
        await setDoc(docRef, {
          id: sessionId,
          userId,
          mode: "learn",
          title: chatTitle,
          messagesJson,
          timestamp: serverTimestamp()
        });
        console.log("MAVERICK_OS [FIRESTORE WRITE] // Synced onboarding appraisal chat logs to Firebase.");
      } catch (firestoreErr) {
        console.error("MAVERICK_OS [FIRESTORE ERROR] // Firestore evaluation chat history save failed:", firestoreErr);
      }
    } else {
      // 3. Guest log local saving fallback
      try {
        const localHistories = JSON.parse(localStorage.getItem("maverick_guest_histories") || "[]");
        localHistories.push({
          id: sessionId,
          userId,
          mode: "learn",
          title: chatTitle,
          messagesJson,
          timestamp
        });
        localStorage.setItem("maverick_guest_histories", JSON.stringify(localHistories));
      } catch (err) {
        console.error("MAVERICK_OS // guest offline history storage fault:", err);
      }
    }

    // Directly complete the onboarding flow and take the user to the cockpit page!
    onCompleted(appraisalData);
    setIsSubmitting(false);
  };

  const handleSkipEvaluation = async () => {
    setIsSubmitting(true);
    setSyncStatus("CONFIGURING DEFAULT OPERATOR RUNTIMES...");
    setCurrentStep("loading");

    const traitScores = {
      Action: 0.50,
      Persistence: 0.50,
      Discipline: 0.50,
      Awareness: 0.50,
      Courage: 0.50,
      Learning: 0.50
    };

    const overallScore = 0.50;
    const summary = "The operator bypassed the baseline diagnostic questions. Standard operational calibration registers loaded with a moderate baseline score.";
    const strengthsList = [
      "Action (0.50): Baseline execution bias assigned.",
      "Persistence (0.50): Moderate focus durability calibrated."
    ];
    const weaknessesList = [
      "Discipline (0.50): Schedule disruption filters configured.",
      "Learning (0.50): Direct adjustment loops operating at standard levels."
    ];
    const blindSpots = [
      "Your cognitive behavioral metrics are current running at default reference parameters. Operational exercise histories are required to compute customized reports."
    ];
    const nextActions = [
      "Log your first journal entries to evaluate live bottleneck factors.",
      "Track tactical task loops under TASKS tab to test active follow-through habits.",
      "Rerun the diagnostic appraisal assessment under PROFILE tab when ready to secure customized score matrices."
    ];

    const appraisalReport = `Action: 0.50
Persistence: 0.50
Discipline: 0.50
Awareness: 0.50
Courage: 0.50
Learning: 0.50

Overall Score: 0.50

Summary:
${summary}

Strengths:
- ${strengthsList[0]}
- ${strengthsList[1]}

Weaknesses:
- ${weaknessesList[0]}
- ${weaknessesList[1]}

Blind Spots:
- ${blindSpots[0]}

Next Actions:
- 1. ${nextActions[0]}
- 2. ${nextActions[1]}
- 3. ${nextActions[2]}`;

    const appraisalData = {
      deviceUid: deviceUid,
      email: auth.currentUser?.email || "anonymous_operator",
      uid: auth.currentUser?.uid || null,
      answers: {},
      scores: traitScores,
      overallScore: 0.50,
      summary: summary,
      strengths: strengthsList,
      weaknesses: weaknessesList,
      blindSpots: blindSpots,
      nextActions: nextActions,
      appraisalReport: appraisalReport,
      timestamp: new Date().toISOString(),
      skipped: true
    };

    // Save in LocalStorage
    localStorage.setItem("hasex_evaluation", JSON.stringify(appraisalData));

    // Save of evaluations collection
    const docId = auth.currentUser?.uid || deviceUid;
    try {
      await setDoc(doc(db, "evaluations", docId), {
        ...appraisalData,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("HASEX_OS [EVAL SKIP WRITE ERROR] // firebase save bypassed:", err);
    }

    // Save as History Record of HASEX AI in the background!
    const sessionId = "evaluation_skip_" + Date.now();
    const userId = auth.currentUser?.uid || "guest_operator";
    const chatTitle = "HX COGNITIVE APPRAISAL [BYPASSED BY OPERATOR]";

    const messagesToSaveString = [
      {
        role: "user",
        content: "Operator requested safe diagnostics bypass. Loading baseline system calibrators."
      },
      {
        role: "assistant",
        content: "### [NEXUS CORE BYPASS SECURED]\n\n" + appraisalReport
      }
    ];

    const messagesJson = JSON.stringify(messagesToSaveString);
    const timestamp = new Date().toISOString();

    // Simulated MySQL save in the background
    try {
      await fetch("/api/save-mysql-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: sessionId,
          userId,
          mode: "learn",
          title: chatTitle,
          messagesJson,
          timestamp
        })
      });
    } catch (mysqlErr) {
      console.error("HASEX_OS [SQL ERROR] // MySQL skip evaluation write skipped:", mysqlErr);
    }

    // Genuine Firebase chat_histories database save
    if (auth.currentUser) {
      try {
        const docRef = doc(db, "chat_histories", sessionId);
        await setDoc(docRef, {
          id: sessionId,
          userId,
          mode: "learn",
          title: chatTitle,
          messagesJson,
          timestamp: serverTimestamp()
        });
      } catch (firestoreErr) {
        console.error("HASEX_OS [FIRESTORE ERROR] // Firestore evaluation skip history save failed:", firestoreErr);
      }
    } else {
      // Guest log local saving fallback
      try {
        const localHistories = JSON.parse(localStorage.getItem("hasex_guest_histories") || "[]");
        localHistories.push({
          id: sessionId,
          userId,
          mode: "learn",
          title: chatTitle,
          messagesJson,
          timestamp
        });
        localStorage.setItem("hasex_guest_histories", JSON.stringify(localHistories));
      } catch (err) {
        console.error("HASEX_OS // guest offline history storage fault:", err);
      }
    }

    // Directly complete the onboarding flow and take the user to the cockpit page!
    onCompleted(appraisalData);
    setIsSubmitting(false);
  };

  const handleFinish = () => {
    onCompleted(calculatedResults);
  };

  const getTraitColorStyle = (val: number) => {
    if (val >= 0.8) return "text-[#00f0ff] border-[#00f0ff]/30 bg-[#00f0ff]/5";
    if (val >= 0.6) return "text-[#c57cff] border-[#c57cff]/30 bg-[#c57cff]/5";
    if (val >= 0.4) return "text-[#ffcb7c] border-[#ffcb7c]/30 bg-[#ffcb7c]/5";
    return "text-red-400 border-red-500/30 bg-red-500/5";
  };

  const getScoreTag = (val: number) => {
    if (val >= 0.8) return "Strong / Exceptional";
    if (val >= 0.6) return "Average / Functional";
    if (val >= 0.4) return "Below Average / Developing";
    return "Weak / Congested";
  };

  return (
    <div className="fixed inset-0 bg-[#040405] overflow-y-auto z-90 flex flex-col justify-start items-center p-4 sm:p-8 font-mono select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.015)_0%,transparent_80%)] pointer-events-none select-none z-0" />
      <div className="absolute inset-0 bg-cyber-grid opacity-10 bg-[size:40px_40px] pointer-events-none z-0" />

      <div className="w-full max-w-3xl my-auto py-10 z-10 flex flex-col gap-6 relative">
        <AnimatePresence mode="wait">
          
          {/* INTRO SCREEN */}
          {currentStep === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="glass-panel p-8 sm:p-12 w-full border-[#00f0ff]/30 bg-[#070709]/95 text-left flex flex-col gap-6"
            >
              <div className="flex items-center gap-3 border-b border-[#3b494b]/20 pb-4">
                <div className="p-3 bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] animate-pulse">
                  <Shield size={24} />
                </div>
                <div>
                  <span className="block text-[8px] text-[#00f0ff] uppercase tracking-[0.3em] font-bold">COGNITIVE SYSTEM HANDSHAKE</span>
                  <h1 className="font-sans text-lg sm:text-xl font-bold text-white tracking-wider mt-0.5">
                    HX-GENESIS COGNITIVE APPRAISAL
                  </h1>
                </div>
              </div>

              <div className="flex flex-col gap-4 font-sans text-xs sm:text-sm text-[#b9cacb]/80 leading-relaxed">
                <p>
                  Before initializing the operational cockpit directory, the database requires a baseline assessment of your behavior models, habit durability, and risk-coping heuristics.
                </p>
                <p className="border-l-[2px] border-[#00f0ff]/40 pl-3 font-mono text-[11px] text-[#00f0ff]/90 bg-[#00f0ff]/2 py-1.5 leading-normal">
                  "Pick what actually happens — not what you'd prefer to happen."
                </p>
                <p>
                  This 10-question evaluation parses key performance traits: <strong className="text-white">Action Bias</strong>, <strong className="text-white">Persistence</strong>, <strong className="text-white">Commitment Discipline</strong>, <strong className="text-white">Mindful Awareness</strong>, <strong className="text-white">Strategic Courage</strong>, and <strong className="text-white">Adaptation Speed</strong>.
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[#3b494b]/20 pt-6 mt-2 select-none font-mono gap-4 flex-wrap">
                <span className="text-[9px] text-[#b9cacb]/40 uppercase tracking-widest">
                  EST_DURATION // ~180s
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSkipEvaluation}
                    className="border border-[#b9cacb]/20 hover:border-[#ffcb7c] text-[#b9cacb] hover:text-white text-xs font-bold tracking-widest uppercase py-3.5 px-6 cursor-pointer transition-colors active:scale-95 duration-200"
                  >
                    SKIP APPRAISAL
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep("questions")}
                    className="bg-[#00f0ff] hover:bg-white text-black text-xs font-bold tracking-widest uppercase py-3.5 px-8 flex items-center gap-2 cursor-pointer transition-colors active:scale-95 duration-200"
                  >
                    <span>BEGIN APPRAISAL</span>
                    <ChevronRight size={14} className="stroke-[2.5px]" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* QUESTIONS FLOW */}
          {currentStep === "questions" && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass-panel p-6 sm:p-8 w-full border-[#00f0ff]/25 bg-[#070709]/95 text-left flex flex-col gap-6"
            >
              {/* Question HUD stats */}
              <div className="flex justify-between items-center border-b border-[#3b494b]/20 pb-4 select-none font-mono text-[9px]">
                <div className="flex items-center gap-2 text-[#00f0ff] font-bold">
                  <Zap size={10} className="animate-pulse" />
                  <span className="tracking-widest">DIAGNOSTIC PIPELINE // QUEST_{QUESTIONS_LIST[currentQuestionIndex].id} of 10</span>
                </div>
                <div className="text-[#b9cacb]/55 font-bold tracking-wider">
                  TRAIT: <span className="text-white uppercase font-black">{QUESTIONS_LIST[currentQuestionIndex].category}</span>
                </div>
              </div>

              {/* Progress bar scale */}
              <div className="w-full bg-[#141517] h-[2px] relative overflow-hidden select-none">
                <div 
                  className="bg-[#00f0ff] h-full shadow-[0_0_8px_#00f0ff] transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / QUESTIONS_LIST.length) * 100}%` }}
                />
              </div>

              {/* Actual Question display */}
              <div className="flex flex-col gap-4 py-2">
                <span className="font-mono text-[10px] text-[#00f0ff]/50 uppercase tracking-[0.2em] select-none font-bold">COGNITIVE_PROMPT //</span>
                <h2 className="font-sans text-sm sm:text-base font-bold text-white leading-relaxed select-text">
                  {QUESTIONS_LIST[currentQuestionIndex].text}
                </h2>
              </div>

              {/* A-F Choices list selection */}
              <div className="flex flex-col gap-3 font-sans text-xs">
                {QUESTIONS_LIST[currentQuestionIndex].options.map((opt) => {
                  const isSelected = answers[QUESTIONS_LIST[currentQuestionIndex].id] === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectOption(QUESTIONS_LIST[currentQuestionIndex].id, opt.key)}
                      className={`w-full text-left p-4 border transition-all duration-200 cursor-pointer flex items-start gap-4 relative group ${
                        isSelected 
                          ? "bg-[#00f0ff]/5 border-[#00f0ff] text-white shadow-[0_0_15px_rgba(0,240,255,0.05)]" 
                          : "bg-black/30 border-[#3b494b]/30 hover:border-[#00f0ff]/40 text-[#b9cacb]/80 hover:text-white"
                      }`}
                    >
                      {/* Glow indicator line */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00f0ff]" />
                      )}
                      
                      <span className={`font-mono text-[11px] font-black tracking-wider w-6 h-6 rounded-none flex items-center justify-center shrink-0 transition-colors uppercase ${
                        isSelected ? "bg-[#00f0ff] text-black" : "bg-[#141517] border border-[#3b494b]/20 group-hover:bg-[#00f0ff]/10 group-hover:text-[#00f0ff]"
                      }`}>
                        {opt.key}
                      </span>
                      <span className="leading-relaxed pt-0.5 text-[12.5px] font-normal">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Step utility controls */}
              <div className="flex justify-between items-center border-t border-[#3b494b]/20 pt-6 select-none font-mono gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className={`flex items-center gap-1.5 py-2 px-4 text-xs font-bold tracking-wider uppercase transition-colors rounded-none ${
                    currentQuestionIndex === 0 
                      ? "text-[#b9cacb]/20 cursor-not-allowed" 
                      : "text-[#b9cacb]/60 hover:text-white hover:bg-white/3 cursor-pointer"
                  }`}
                >
                  <ChevronLeft size={13} className="stroke-[2.5px]" />
                  <span>BACK</span>
                </button>

                <button
                  type="button"
                  onClick={handleSkipEvaluation}
                  className="text-[#ffcb7c]/70 hover:text-[#ffcb7c] hover:bg-[#ffcb7c]/5 border border-[#ffcb7c]/20 hover:border-[#ffcb7c]/50 text-[10px] font-bold tracking-widest uppercase py-2 px-4 transition-colors duration-200 cursor-pointer"
                >
                  SKIP
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!answers[QUESTIONS_LIST[currentQuestionIndex].id]}
                  className={`flex items-center gap-1.5 py-3 px-8 text-xs font-bold tracking-widest uppercase transition-all duration-200 rounded-none ${
                    answers[QUESTIONS_LIST[currentQuestionIndex].id]
                      ? "bg-[#00f0ff] hover:bg-white text-black cursor-pointer active:scale-95"
                      : "bg-[#141416] border border-[#3b494b]/20 text-[#b9cacb]/30 cursor-not-allowed"
                  }`}
                >
                  <span>{currentQuestionIndex === QUESTIONS_LIST.length - 1 ? "FINISH EVALUATION" : "NEXT QUESTION"}</span>
                  <ChevronRight size={13} className="stroke-[2.5px]" />
                </button>
              </div>
            </motion.div>
          )}

          {/* LOADING COMPUTATION PROCESS */}
          {currentStep === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-panel p-12 w-full border-[#00f0ff]/20 bg-[#070709]/95 text-center flex flex-col items-center justify-center gap-6"
            >
              <div className="p-4 bg-[#00f0ff]/5 border border-[#00f0ff]/30 text-[#00f0ff] animate-spin duration-3000">
                <RefreshCw size={36} className="animate-pulse" />
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-mono text-sm font-bold text-[#00f0ff] uppercase tracking-widest">
                  {syncStatus}
                </h3>
                <span className="text-[8.5px] text-[#b9cacb]/35 uppercase tracking-wider block mt-1">
                  UPLINKING TRANSACTIONS TO MAVERICK DATABASE SYSTEM CLUSTER Securely
                </span>
              </div>
            </motion.div>
          )}

          {/* RESULTS APPRAISAL TABLE SCREEN */}
          {currentStep === "results" && calculatedResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 sm:p-10 w-full border-[#00f0ff]/30 bg-[#070709]/95 text-left flex flex-col gap-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#3b494b]/20 pb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff]">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <span className="block text-[8px] text-[#00f0ff] uppercase tracking-[0.25em] font-bold">ANALYSIS RECORD SECURED</span>
                    <h2 className="font-sans text-base font-bold text-white uppercase tracking-wider">
                      COGNITIVE METRICS REVEALED
                    </h2>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 border-[0.5px] border-[#3b494b]/30 p-2 text-right bg-black/40 font-mono shrink-0">
                  <span className="text-[8px] text-[#b9cacb]/45 uppercase font-bold">OVERALL COGNITIVE SCORE //</span>
                  <div className="text-sm font-bold text-[#00f0ff] tracking-wide">
                    {calculatedResults.overallScore.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Trait Matrix Bento Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(calculatedResults.scores).map(([trait, score]: any) => (
                  <div 
                    key={trait} 
                    className={`border p-3.5 flex flex-col gap-2 relative overflow-hidden transition-all duration-300 ${getTraitColorStyle(score)}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#b9cacb]/80">{trait}</span>
                      <span className="text-xs font-bold leading-none">{score.toFixed(2)}</span>
                    </div>
                    
                    {/* Tiny stats bar */}
                    <div className="w-full h-[2.5px] bg-black/40 rounded-none overflow-hidden mt-1">
                      <div 
                        className={`h-full opacity-80 ${
                          score >= 0.8 ? "bg-[#00f0ff]" : score >= 0.6 ? "bg-[#c57cff]" : score >= 0.4 ? "bg-[#ffcb7c]" : "bg-red-400"
                        }`}
                        style={{ width: `${score * 100}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-[#b9cacb]/45 font-semibold font-mono tracking-wider leading-tight">
                      {getScoreTag(score)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Concise diagnostics blocks */}
              <div className="flex flex-col gap-4 font-sans text-xs sm:text-[13px] text-[#b9cacb]/90 leading-relaxed max-h-[250px] overflow-y-auto pr-2 border-y border-[#3b494b]/15 py-4 bg-black/20 px-3">
                <div className="flex flex-col gap-1.5 text-left select-text">
                  <span className="font-mono text-[8px] text-[#00f0ff] uppercase tracking-widest font-black block">SUMMARY APPRAISAL</span>
                  <p>{calculatedResults.summary}</p>
                </div>

                <div className="flex flex-col gap-1.5 text-left select-text mt-1">
                  <span className="font-mono text-[8px] text-[#c57cff] uppercase tracking-widest font-black block">CORE STRENGTHS DETECTED</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>{calculatedResults.strengths[0]}</li>
                    <li>{calculatedResults.strengths[1]}</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-1.5 text-left select-text mt-1">
                  <span className="font-mono text-[8px] text-[#ffcb7c] uppercase tracking-widest font-black block">IDENTIFIED WEAKNESS VECTORS</span>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>{calculatedResults.weaknesses[0]}</li>
                    <li>{calculatedResults.weaknesses[1]}</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-1.5 text-left select-text mt-1">
                  <span className="font-mono text-[8px] text-red-400 uppercase tracking-widest font-black block">CRITICAL BLIND SPOT</span>
                  <p>{calculatedResults.blindSpots[0]}</p>
                </div>

                <div className="flex flex-col gap-1.5 text-left select-text mt-1">
                  <span className="font-mono text-[8px] text-[#00f0ff] uppercase tracking-widest font-black block">SUGGESTED NEXT ACTIONS</span>
                  <ul className="list-decimal pl-4 space-y-1">
                    <li>{calculatedResults.nextActions[0]}</li>
                    <li>{calculatedResults.nextActions[1]}</li>
                    <li>{calculatedResults.nextActions[2]}</li>
                  </ul>
                </div>
              </div>

              {/* Confirmation section triggers exit */}
              <div className="flex items-center justify-between select-none font-mono pt-2">
                <span className="text-[8.5px] text-[#b9cacb]/40 font-bold uppercase tracking-widest">
                  APPRAISAL VERIFIED // SECURE BOOT
                </span>
                <button
                  type="button"
                  onClick={handleFinish}
                  className="bg-[#00f0ff] hover:bg-white text-black text-xs font-black tracking-widest uppercase py-3.5 px-8 flex items-center gap-2 cursor-pointer transition-all duration-200 active:scale-95"
                >
                  <span>UNLOCK COCKPIT DIRECTORY</span>
                  <ChevronRight size={14} className="stroke-[2.5px]" />
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
