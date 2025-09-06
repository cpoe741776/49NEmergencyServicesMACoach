// src/components/RepairKit.tsx
import { useState, useRef, useEffect } from "react";
import type { MentalArmorSkill, EmergencyResource } from "@/types/emergency";
import { MENTAL_ARMOR_SKILLS } from "@/data/skills";
import { TRAINERS, type Trainer } from "@/data/trainers";
import { createMentalArmorAI } from "@/services/improved-openai-integration";
import { type SkillSuggestion } from "@/services/enhanced-skill-suggestions";
import PracticeSession from "@/components/PracticeSession";
import { type PracticeSessionData } from "@/data/practices";

// Keep numbers distinct & always flag with country emoji
const DEFAULT_EMERGENCY_RESOURCES: EmergencyResource[] = [
  // United States
  {
    type: "crisis",
    name: "🇺🇸 Suicide & Crisis Lifeline (US)",
    phone: "988",
    available: "24/7",
    description: "Free and confidential support for suicidal crisis or emotional distress",
  },
  {
    type: "crisis",
    name: "🇺🇸 Crisis Text Line (US)",
    phone: "Text HOME to 741741",
    available: "24/7",
    description: "Text with a trained crisis counselor",
  },
  {
    type: "crisis",
    name: "🇺🇸 Emergency Services (US)",
    phone: "911",
    available: "24/7",
    description: "Immediate emergency response for life-threatening situations",
  },

  // Canada
  {
    type: "crisis",
    name: "🇨🇦 Suicide Crisis Helpline (Canada)",
    phone: "988",
    available: "24/7",
    description: "Free and confidential support for suicidal crisis or emotional distress",
  },
  {
    type: "crisis",
    name: "🇨🇦 Canada Suicide Prevention Service",
    phone: "1-833-456-4566",
    available: "24/7",
    description: "Canada-wide suicide prevention support",
  },
  {
    type: "crisis",
    name: "🇨🇦 Crisis Text Line (Canada)",
    phone: "Text HOME to 686868",
    available: "24/7",
    description: "Text with a trained crisis counselor",
  },
  {
    type: "crisis",
    name: "🇨🇦 Emergency Services (Canada)",
    phone: "911",
    available: "24/7",
    description: "Immediate emergency response for life-threatening situations",
  },

  // United Kingdom
  {
    type: "crisis",
    name: "🇬🇧 Samaritans (UK)",
    phone: "116 123",
    available: "24/7",
    description: "Free emotional support for anyone in crisis",
  },
  {
    type: "crisis",
    name: "🇬🇧 Shout — Crisis Text (UK)",
    phone: "Text SHOUT to 85258",
    available: "24/7",
    description: "Text with a trained crisis volunteer",
  },
  {
    type: "crisis",
    name: "🇬🇧 Emergency Services (UK)",
    phone: "999",
    available: "24/7",
    description: "Immediate emergency response for life-threatening situations",
  },

  // Ireland
  {
    type: "crisis",
    name: "🇮🇪 Text About It (Ireland)",
    phone: "Text HOME to 50808",
    available: "24/7",
    description: "Text with a trained crisis volunteer",
  },
  {
    type: "crisis",
    name: "🇮🇪 Emergency Services (Ireland)",
    phone: "112 or 999",
    available: "24/7",
    description: "Immediate emergency response for life-threatening situations",
  },
];

// CRITICAL Emergency Keywords - Enhanced Detection
const EMERGENCY_KEYWORDS = [
  // Weapons/Methods - CRITICAL
  "gun",
  "weapon",
  "knife",
  "blade",
  "pills",
  "overdose",
  "rope",
  "noose",
  "poison",
  "jump",
  "bridge",
  "cliff",
  "train",
  "traffic",
  "car crash",
  "building",
  "roof",
  "hanging",
  "suffocate",
  "drown",
  "gas",

  // Direct suicide language
  "suicide",
  "kill myself",
  "end it all",
  "take my life",
  "end my life",
  "want to die",
  "wish I was dead",
  "better off dead",
  "not worth living",

  // Self-harm with methods
  "hurt myself",
  "self-harm",
  "cut myself",
  "harm myself",
  "cutting",

  // Violence to others
  "hurt someone",
  "kill someone",
  "harm others",
  "shoot someone",

  // Planning/immediacy
  "have a plan",
  "going to do it",
  "tonight",
  "today",
  "right now",
  "final decision",
  "made up my mind",
  "goodbye",
  "this is it",
];

const CRISIS_KEYWORDS = {
  CRITICAL: [
    // Weapons/methods
    "gun",
    "weapon",
    "knife",
    "blade",
    "pills",
    "overdose",
    "rope",
    "noose",
    "poison",
    "jump off",
    "bridge",
    "cliff",
    "hanging",
    "suffocate",

    // Immediate suicide language
    "suicide",
    "kill myself",
    "end my life",
    "take my life",
    "want to die",
    "end it all",
    "better off dead",
    "wish I was dead",
    "not worth living",
    "going to do it",
    "have a plan",
    "tonight",
    "today",
    "right now",

    // Violence
    "hurt someone",
    "kill someone",
    "shoot someone",
    "stab someone",
  ],
  HIGH: [
    "hopeless",
    "worthless",
    "no point living",
    "give up",
    "can't go on",
    "meaningless",
    "lost all hope",
    "no way out",
    "trapped forever",
    "nothing left",
    "burden to everyone",
    "everyone better without me",
    "hate my life",
    "i hate my life",
    "life sucks",
    "done with everything",
    "can’t do this anymore",
  ],
  MEDIUM: [
    // Only truly overwhelming situations, not regular anxiety
    "falling apart",
    "breaking down",
    "can't cope",
    "losing it",
    "at my limit",
    "spiraling",
    "out of control",
    "mental breakdown",
    "can't handle anymore",
    "completely overwhelmed",
    "drowning in",
  ],
  LOW: [
    // Regular stress/anxiety
    "stressed",
    "anxious",
    "worried",
    "tired",
    "exhausted",
    "struggling",
    "difficult",
    "tough time",
    "frustrated",
    "upset",
    "sad",
    "anxiety",
    "nervous",
    "tense",
    "overwhelmed",
    "high anxiety",
    "panic",
    "stress",
  ],
};

const aiService = createMentalArmorAI({ allowSuggestions: true });

type ChatKind = "user" | "assistant" | "system";
type Distress = "none" | "low" | "medium" | "high" | "critical";

interface ChatMessage {
  id: string;
  type: ChatKind;
  content: string;
  timestamp: Date;
  isEmergencyAlert?: boolean;
  trainerId?: string;
  suggestedSkills?: SkillSuggestion[];
  suggestionMethod?: "curriculum" | "ai-validated" | "fallback";
}

interface PracticeSession {
  id: string;
  skillId: string;
  skillTitle: string;
  startTime: Date;
  endTime?: Date;
  notes?: string;
  completed: boolean;
  trainerId?: string;
}

export default function RepairKit() {
  const [activeTab, setActiveTab] =
    useState<"chat" | "practice" | "resources" | "coaches">("coaches");

  // Honor tab hint from Profile (e.g., "practice") when RepairKit mounts
  useEffect(() => {
    const hint = localStorage.getItem("repair-kit-tab");
    if (
      hint === "practice" ||
      hint === "chat" ||
      hint === "resources" ||
      hint === "coaches"
    ) {
      setActiveTab(hint as typeof activeTab);
    }
    localStorage.removeItem("repair-kit-tab");
  }, []);

  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>(
    []
  );
  const [selectedSkillForPractice, setSelectedSkillForPractice] =
    useState<MentalArmorSkill | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [expandedBioId, setExpandedBioId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message when trainer selected
  useEffect(() => {
    if (selectedTrainer && messages.length === 0) {
      setMessages([
        {
          id: crypto.randomUUID(),
          type: "assistant",
          content: getTrainerWelcomeMessage(selectedTrainer),
          timestamp: new Date(),
          trainerId: selectedTrainer.id,
        },
      ]);
    }
  }, [selectedTrainer, messages.length]);

  // Handle practice session handoff
  useEffect(() => {
    const raw = localStorage.getItem("start-practice-skill");
    if (!raw) return;

    try {
      const { id } = JSON.parse(raw);
      const found = MENTAL_ARMOR_SKILLS.find((s) => s.id === id);
      if (found) {
        const session: PracticeSession = {
          id: crypto.randomUUID(),
          skillId: found.id,
          skillTitle: found.title,
          startTime: new Date(),
          completed: false,
          trainerId: selectedTrainer?.id,
        };
        setPracticeSessions((p) => [...p, session]);
        setSelectedSkillForPractice(found);
        setActiveTab("practice");
        localStorage.removeItem("repair-kit-tab"); // ensure no leftover hint
      }
    } catch {
      // Ignore JSON errors
    } finally {
      localStorage.removeItem("start-practice-skill");
    }
  }, [selectedTrainer?.id]);

  // Enhanced Detection Functions
  const detectDistressLevel = (text: string): Distress => {
    const t = text.toLowerCase();

    if (
      CRISIS_KEYWORDS.CRITICAL.some((k: string) => t.includes(k.toLowerCase()))
    )
      return "critical";
    if (CRISIS_KEYWORDS.HIGH.some((k: string) => t.includes(k.toLowerCase())))
      return "high";
    if (
      CRISIS_KEYWORDS.MEDIUM.some((k: string) => t.includes(k.toLowerCase()))
    )
      return "medium";
    if (CRISIS_KEYWORDS.LOW.some((k: string) => t.includes(k.toLowerCase())))
      return "low";
    return "none";
  };

  const detectEmergencySignals = (text: string): boolean => {
    const t = text.toLowerCase();

    // Primary emergency detection
    const hasEmergency = EMERGENCY_KEYWORDS.some((k: string) =>
      t.includes(k.toLowerCase())
    );
    const hasCritical = CRISIS_KEYWORDS.CRITICAL.some((k: string) =>
      t.includes(k.toLowerCase())
    );

    // Enhanced phrase detection for context
    const emergencyPhrases = [
      "have a gun",
      "got a weapon",
      "holding a knife",
      "pills ready",
      "standing on",
      "ready to jump",
      "tied the rope",
      "wrote goodbye",
      "final decision",
      "going to do it",
      "tonight's the night",
      "this is it",
      "time to go",
      "can't take another day",
    ];

    const hasEmergencyPhrase = emergencyPhrases.some((phrase) =>
      t.includes(phrase)
    );

    return hasEmergency || hasCritical || hasEmergencyPhrase;
  };

  const getTrainerWelcomeMessage = (trainer: Trainer): string => {
    switch (trainer.id) {
      case "scotty":
        return `Well hello there, friend! I'm Scotty. Building resilience is like tending a garden—patience, care, and a little faith. What's on your mind today?`;
      case "rhonda":
        return `I'm BG Rhonda Cornum. We're here to build your mental armor—no excuses, no shortcuts. What challenge are you facing today?`;
      case "jill":
        return `Hi, I'm Dr. Jill. Let's explore your resilience journey with insight and practical tools. What would you like to work on today?`;
      case "terry":
        return `Hey—Terry here. Life's got a sense of humor. We'll build strength through it. What's going on in your world?`;
      case "aj":
        return `Hi! I'm AJ. Love helping people discover strengths. What goal are you excited to tackle?`;
      case "chris":
        return `I'm Chris—First Sergeant, dad, and growth nerd. True strength comes from hard moments. What's weighing on your mind?`;
      default:
        return `Hello! I'm ${trainer.name}, your Mental Armor™ Coach. How can I support your training today?`;
    }
  };

  // -------- Country-separated contact blocks for AI messages
  const CONTACT_BLOCKS = {
    US: `🇺🇸 United States:
• Suicide & Crisis Lifeline: 988 (24/7)
• Crisis Text Line: Text HOME to 741741 (24/7)
• Emergency: 911`,
    CA: `🇨🇦 Canada:
• Suicide Crisis Helpline: 988 (24/7)
• Canada Suicide Prevention Service: 1-833-456-4566 (24/7)
• Crisis Text Line: Text HOME to 686868 (24/7)
• Emergency: 911`,
    UK: `🇬🇧 United Kingdom:
• Samaritans: 116 123 (24/7)
• Shout (text): Text SHOUT to 85258 (24/7)
• Emergency: 999`,
    IE: `🇮🇪 Ireland:
• Text About It: Text HOME to 50808 (24/7)
• Emergency: 112 or 999`,
  };

  function guessRegion():
    | keyof typeof CONTACT_BLOCKS
    | "ALL" {
    const lang = (navigator?.language || "").toLowerCase();
    if (lang.includes("en-gb") || lang.includes("-gb") || lang.includes("uk"))
      return "UK";
    if (lang.includes("en-ie") || lang.includes("-ie")) return "IE";
    if (lang.includes("en-ca") || lang.includes("-ca") || lang.endsWith("-ca"))
      return "CA";
    if (lang.includes("en-us") || lang.includes("-us")) return "US";
    return "ALL";
  }

  function formatContacts(): string {
    const region = guessRegion();
    if (region === "ALL") {
      return `${CONTACT_BLOCKS.US}\n\n${CONTACT_BLOCKS.CA}\n\n${CONTACT_BLOCKS.UK}\n\n${CONTACT_BLOCKS.IE}`;
    }
    const order = [region, ...(["US", "CA", "UK", "IE"] as const).filter((r) => r !== region)];
    return order.map((r) => CONTACT_BLOCKS[r]).join("\n\n");
  }

  const getDistressResponse = (
    trainer: Trainer,
    _userMessage: string,
    level: Exclude<Distress, "none">
  ): string => {
    const contacts = formatContacts();

    if (level === "critical") {
      return `I'm very concerned about your safety. Please reach out immediately:\n\n${contacts}\n\nYour life has value. We can pause practice and focus on safety first.`;
    }
    if (level === "high") {
      return `I hear you're in real pain. If you need immediate help, here are options:\n\n${contacts}\n\nWe can anchor to meaning—try Values-Based Living, Spiritual Resilience, or What's Most Important. Which fits right now?`;
    }
    if (level === "medium") {
      return `That sounds really challenging. If things feel unmanageable, support is available:\n\n${contacts}\n\nLet's focus on what might help right now.`;
    }
    // LOW
    return `That sounds stressful. If it ever becomes overwhelming, support is available:\n\n${contacts}\n\nLet's work on some skills that can help with these feelings.`;
  };

  const handleTrainerSelect = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setExpandedBioId(null);
    setMessages([]);
    setActiveTab("chat");
  };

  const handleSendMessage = async () => {
    const content = inputMessage.trim();
    if (!content || !selectedTrainer) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      type: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    const emergency = detectEmergencySignals(content);
    const distress = detectDistressLevel(content);
    if (emergency || distress === "critical") {
      setShowEmergencyAlert(true);
    }

    try {
      // Get AI response and skill suggestions from the SAME source
      const history = messages.map((m) => ({
        role: m.type as "user" | "assistant",
        content: m.content,
      }));

      const aiResponse = await aiService.send(content, history);

      // Use the SAME skill suggestions for both AI response and cards
      let finalContent = aiResponse.text;
      const skillSuggestions = aiResponse.suggestedSkills || [];

      // If distress detected, override with distress response but keep skill suggestions
      if (distress !== "none") {
        finalContent = getDistressResponse(selectedTrainer, content, distress);

        // For low/medium distress, append skill suggestions to the response
        if ((distress === "low" || distress === "medium") && skillSuggestions.length > 0) {
          const skillNames = skillSuggestions.map((s) => s.skill.title).join(", ");
          finalContent += `\n\nConsider trying: ${skillNames}. Would you like to explore any of these?`;
        }
      }

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        type: "assistant",
        content: finalContent,
        timestamp: new Date(),
        trainerId: selectedTrainer.id,
        suggestedSkills: skillSuggestions, // Use the SAME suggestions
        suggestionMethod: aiResponse.suggestionMethod,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        type: "assistant",
        content:
          "I'm having trouble responding right now. Please try again, or reach out to emergency resources if you need urgent help.",
        timestamp: new Date(),
        trainerId: selectedTrainer.id,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const startPracticeSession = (skill: MentalArmorSkill) => {
    const session: PracticeSession = {
      id: crypto.randomUUID(),
      skillId: skill.id,
      skillTitle: skill.title,
      startTime: new Date(),
      completed: false,
      trainerId: selectedTrainer?.id,
    };
    setPracticeSessions((p) => [...p, session]);
    setSelectedSkillForPractice(skill);
    setActiveTab("practice");
  };

  const completePracticeSession = (sessionId: string, notes?: string) => {
    setPracticeSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, endTime: new Date(), notes, completed: true }
          : s
      )
    );
    setSelectedSkillForPractice(null);
  };

  // Helper function for direct skill responses
  const getDirectSkillResponse = (skillId: string, coach?: Trainer): string => {
    const skill = MENTAL_ARMOR_SKILLS.find((s) => s.id === skillId);
    if (!skill) return "";

    // Add coach-specific adlib before skill content
    let response = "";

    if (coach?.name) {
      switch (coach.name.toLowerCase()) {
        case "rhonda":
          response += "That's exactly what we need to address. ";
          break;
        case "scotty":
          response += "I'm glad you're interested in this, friend. ";
          break;
        case "terry":
          response += "Good choice - this one really works when you work it. ";
          break;
        case "aj":
          response += "Perfect! This skill aligns with your strengths. ";
          break;
        case "chris":
          response += "Smart thinking. This skill builds real strength. ";
          break;
        case "jill":
          response += "This is a valuable skill for your development. ";
          break;
        default:
          response += "Let me tell you about this skill. ";
      }
    }

    response += `**${skill.title}** ${skill.goal}

**When to use:** ${skill.whenToUse}

**Steps to practice:**`;

    skill.steps.forEach((step, index) => {
      response += `\n${index + 1}. ${step}`;
    });

    // Add scientific benefits if available
    if (skill.benefits && skill.benefits.length > 0) {
      response += `\n\n**Scientific benefits:**`;
      skill.benefits.slice(0, 3).forEach((benefit) => {
        response += `\n• ${benefit}`;
      });
    }

    // Add coach-specific encouragement
    if (coach?.name) {
      switch (coach.name.toLowerCase()) {
        case "rhonda":
          response += "\n\nThis skill works if you work it. What's your next move?";
          break;
        case "scotty":
          response += "\n\nTake this one step at a time, with patience and care.";
          break;
        case "terry":
          response += "\n\nThis works in the real world when you practice it consistently.";
          break;
        case "aj":
          response += "\n\nThis builds on strengths you already have. What do you notice you do well?";
          break;
        case "chris":
          response += "\n\nGrowth comes through practicing these steps. What's the deeper challenge here?";
          break;
        case "jill":
          response += "\n\nThis connects to your psychological well-being. How does this resonate with you?";
          break;
        default:
          response += "\n\nReady to practice this skill?";
      }
    }

    return response;
  };

  // Handle skill suggestion click
  const handleSkillSuggestionClick = (suggestion: SkillSuggestion) => {
    const explanationContent = getDirectSkillResponse(
      suggestion.skillId,
      selectedTrainer || undefined
    );

    const explanationMsg: ChatMessage = {
      id: crypto.randomUUID(),
      type: "assistant",
      content: explanationContent,
      timestamp: new Date(),
      trainerId: selectedTrainer?.id,
      suggestedSkills: [],
      suggestionMethod: "curriculum",
    };

    setMessages((prev) => [...prev, explanationMsg]);

    // Optionally start practice session
    startPracticeSession(suggestion.skill);
  };

  // Helper function to handle navigation to Go-Bag (properly typed)
  const handleNavigateToGoBag = (skillId: string) => {
    if ("navigateToGoBag" in window && typeof window.navigateToGoBag === "function") {
      (window.navigateToGoBag as (skillId: string) => void)(skillId);
    } else {
      localStorage.setItem("pending-skill-navigation", skillId);
      const skill = MENTAL_ARMOR_SKILLS.find((s) => s.id === skillId);
      alert(`Navigate to Go-Bag to view ${skill?.title || "this skill"} details`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer Modal */}
      {!disclaimerAccepted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Important Disclaimer</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                This is a <strong>supporting application</strong> for the Mental Armor™ curriculum by{" "}
                <strong>49 North (TechWerks, LLC)</strong>. It supplements but does not replace complete training.
              </p>
              <ul className="list-disc ml-5">
                <li>AI responses are limited to curriculum content for accuracy</li>
                <li>Skill suggestions use validated Mental Armor™ concepts only</li>
                <li>This is not clinical advice or therapy</li>
                <li>Use it to learn and practice established resilience skills</li>
              </ul>
              <p className="text-red-700">
                If you are in crisis, please use the Emergency Resources tab for country-specific help.
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setDisclaimerAccepted(true)}
                className="flex-1 bg-brand-primary text-white px-4 py-2 rounded-lg hover:opacity-90"
              >
                I Understand — Continue
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Banner */}
      {showEmergencyAlert && (
        <div className="bg-blue-50 border-l-4 border-red-500 rounded-lg p-6 shadow-sm">
          <div className="flex items-start">
            <div className="text-red-600 text-2xl">🤝</div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-red-700 mb-1">You Have Value — Help Is Available</h3>
              <p className="text-blue-800 mb-2">
                Being resilient includes reaching out for help when you need it most.
              </p>
              <div className="space-y-3">
                {DEFAULT_EMERGENCY_RESOURCES.slice(0, 4).map((r: EmergencyResource, i: number) => (
                  <div key={i} className="bg-white/80 rounded-lg p-3 border border-blue-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-red-700">{r.name}</p>
                        <p className="text-blue-700 text-sm">{r.description}</p>
                        {r.available && <p className="text-blue-600 text-xs mt-1">{r.available}</p>}
                      </div>
                      <div className="ml-4 text-right">
                        {r.phone?.toLowerCase?.().includes("text") ? (
                          <a
                            href={`sms:${
                              r.phone.includes("741741")
                                ? "741741?body=HOME"
                                : r.phone.includes("686868")
                                ? "686868?body=HOME"
                                : r.phone.includes("85258")
                                ? "85258?body=SHOUT"
                                : r.phone.includes("50808")
                                ? "50808?body=HOME"
                                : ""
                            }`}
                            className="inline-block bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                          >
                            📱 {r.phone}
                          </a>
                        ) : (
                          <a
                            href={`tel:${r.phone.replace(/[^0-9]/g, "")}`}
                            className="inline-block bg-brand-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                          >
                            📞 Call {r.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm font-medium">
                  💚 Your life matters. These feelings can change. Help is just a call or text away.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowEmergencyAlert(false)}
              className="ml-4 text-blue-500 hover:text-blue-700 text-xl"
              aria-label="Close emergency banner"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Mental Armor™ Maintenance & Repair Kit</h2>
        <p className="text-gray-700 mt-0.5">
          Practice your skills, get curriculum-based training support, and access emergency resources
        </p>
        <div className="mt-2 text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full inline-block">
          Enhanced with curriculum-first AI • See the Emergency Resources tab for crisis hotlines.
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: "coaches" as const, label: "Select Coach", icon: "👥" },
            { key: "chat" as const, label: "Training Support", icon: "💬" },
            { key: "practice" as const, label: "Practice Sessions", icon: "🎯" },
            { key: "resources" as const, label: "Emergency Resources", icon: "🆘" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Coach selection */}
        {activeTab === "coaches" && (
          <div className="p-6 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Mental Armor™ Coach</h3>
              <p className="text-gray-600">Each coach brings a unique style to support your resilience.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {TRAINERS.map((t) => {
                const expanded = expandedBioId === t.id;
                return (
                  <div
                    key={t.id}
                    className={`border-2 rounded-lg p-5 min-h-[360px] flex flex-col transition-all hover:shadow-md ${
                      selectedTrainer?.id === t.id ? "border-brand-primary bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <img src={t.image} alt={t.name} className="w-20 h-20 rounded-full mx-auto mb-3 object-cover" />
                      <h4 className="font-semibold text-gray-900 text-lg">{t.name}</h4>

                      <div className="mt-2 flex flex-wrap gap-1 justify-center">
                        {t.specialties.slice(0, 3).map((s) => (
                          <span key={s} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="text-sm text-gray-600 mt-3 text-left">
                        <p className={expanded ? "" : "max-h-24 overflow-hidden"}>{t.bio}</p>
                        <button
                          onClick={() => setExpandedBioId(expanded ? null : t.id)}
                          className="mt-2 text-brand-primary text-xs font-medium hover:underline"
                        >
                          {expanded ? "Show less" : "Read more"}
                        </button>
                      </div>

                      {selectedTrainer?.id === t.id && (
                        <div className="mt-3 text-brand-primary font-medium text-sm">✓ Selected Coach</div>
                      )}
                    </div>

                    <div className="mt-auto pt-4">
                      <button
                        onClick={() => handleTrainerSelect(t)}
                        className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90"
                      >
                        Start Training with {t.name}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat */}
        {activeTab === "chat" && (
          <div className="h-96 flex flex-col">
            {!selectedTrainer ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Coach First</h3>
                  <p className="text-gray-600 mb-4">Choose your coach to begin curriculum-based training.</p>
                  <button
                    onClick={() => setActiveTab("coaches")}
                    className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90"
                  >
                    Choose Your Coach
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b p-4 bg-gray-50 flex items-center gap-3">
                  <img
                    src={selectedTrainer.image}
                    alt={selectedTrainer.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedTrainer.name}</h4>
                    <p className="text-sm text-gray-600">Mental Armor™ Coach</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("coaches")}
                    className="ml-auto text-sm text-brand-primary hover:underline"
                  >
                    Change Coach
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((m) => (
                    <div key={m.id} className="space-y-2">
                      <div className={`flex ${m.type === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            m.type === "user"
                              ? "bg-brand-primary text-white"
                              : m.isEmergencyAlert
                              ? "bg-red-100 text-red-800 border border-red-300"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                          <p className={`text-xs mt-1 ${m.type === "user" ? "text-blue-200" : "text-gray-500"}`}>
                            {m.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      {/* Enhanced Skill Suggestions with Go-Bag Navigation */}
                      {m.suggestedSkills && m.suggestedSkills.length > 0 && (
                        <div className="ml-4 space-y-3">
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <span>💡</span>
                            <span>
                              Mental Armor™ skills that might help
                              {m.suggestionMethod === "curriculum" && " (curriculum-matched)"}:
                            </span>
                          </p>
                          <div className="space-y-2">
                            {m.suggestedSkills.map((suggestion) => (
                              <div
                                key={suggestion.skillId}
                                className="bg-blue-50 border border-blue-200 rounded-lg p-3"
                              >
                                {/* Skill Title and Confidence */}
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-blue-900">{suggestion.skill.title}</h4>
                                  <div className="text-xs text-blue-600">
                                    {suggestion.confidence > 0.7 ? "🎯" : suggestion.confidence > 0.5 ? "👍" : "💭"}
                                  </div>
                                </div>

                                {/* Brief Description */}
                                <p className="text-sm text-blue-800 mb-3 line-clamp-2">
                                  {suggestion.curriculumQuote || suggestion.skill.goal}
                                </p>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSkillSuggestionClick(suggestion)}
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                                  >
                                    Learn & Practice
                                  </button>
                                  <button
                                    onClick={() => handleNavigateToGoBag(suggestion.skillId)}
                                    className="px-3 py-2 border border-blue-600 text-blue-600 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
                                  >
                                    Go to Skill →
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                        <p className="text-sm">{selectedTrainer.name} is thinking...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <textarea
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`Share your thoughts with ${selectedTrainer.name}...`}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                      rows={2}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    AI responses use only Mental Armor™ curriculum content. Skill suggestions are curriculum-validated.
                  </p>
                </div>

                <div className="border-t bg-gray-50 p-3 text-xs text-gray-600 flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <p>Enhanced with curriculum controls • See Emergency Resources tab for 🇺🇸🇨🇦🇬🇧🇮🇪 numbers</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Practice Sessions */}
        {activeTab === "practice" && (
          <div className="p-6">
            {selectedSkillForPractice ? (
              <div className="space-y-6">
                {/* Check if this skill has a practice session available */}
                {selectedSkillForPractice.id === "foundations-resilience" ? (
                  <PracticeSession
                    skillId={selectedSkillForPractice.id}
                    skillTitle={selectedSkillForPractice.title}
                    onComplete={(data: PracticeSessionData, durationMinutes: number) => {
                      const inProgress = practiceSessions.find((s) => !s.completed);
                      if (inProgress) {
                        completePracticeSession(inProgress.id, `Practice completed in ${durationMinutes} minutes`);
                      }
                    }}
                    onBack={() => setSelectedSkillForPractice(null)}
                  />
                ) : (
                  /* Fallback for skills without practice sessions */
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Practicing: {selectedSkillForPractice.title}</h3>
                      <button
                        onClick={() => setSelectedSkillForPractice(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕ End Session
                      </button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Goal:</h4>
                      <p className="text-gray-700 mb-4">{selectedSkillForPractice.goal}</p>
                      <h4 className="font-medium text-gray-900 mb-2">When to Use:</h4>
                      <p className="text-gray-700 mb-4">{selectedSkillForPractice.whenToUse}</p>
                      <h4 className="font-medium text-gray-900 mb-2">Steps to Practice:</h4>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        {selectedSkillForPractice.steps.map((s, i) => (
                          <li key={i} className="text-sm">
                            {s}
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800 text-sm">
                        Interactive practice session for this skill is coming soon. For now, you can review the steps
                        above and practice on your own.
                      </p>
                    </div>

                    <div className="border-t pt-4">
                      <button
                        onClick={() => {
                          const inProgress = practiceSessions.find((s) => !s.completed);
                          if (inProgress) completePracticeSession(inProgress.id, "Practice complete");
                        }}
                        className="w-full px-4 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90"
                      >
                        Mark Practice as Complete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Start a Practice Session</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {MENTAL_ARMOR_SKILLS.slice(0, 6).map((skill) => (
                    <div key={skill.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{skill.title}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{skill.goal}</p>
                      <button
                        onClick={() => startPracticeSession(skill)}
                        className="w-full px-3 py-2 bg-brand-primary text-white rounded text-sm hover:opacity-90"
                      >
                        Start Practice
                      </button>
                    </div>
                  ))}
                </div>

                {practiceSessions.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Practice Sessions</h3>
                    <div className="space-y-3">
                      {practiceSessions
                        .slice(-5)
                        .reverse()
                        .map((s: PracticeSession) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{s.skillTitle}</p>
                              <p className="text-sm text-gray-600">
                                {s.startTime.toLocaleDateString()} at {s.startTime.toLocaleTimeString()}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                s.completed ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {s.completed ? "Completed" : "In Progress"}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Resources */}
        {activeTab === "resources" && (
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Crisis Support Resources</h3>
              <p className="text-gray-600">
                You are more resilient than you may think. If you are experiencing a mental health crisis, please reach out for immediate support.
              </p>
            </div>

            {DEFAULT_EMERGENCY_RESOURCES.map((r: EmergencyResource, i: number) => {
              const isText = r.phone?.toLowerCase?.().includes("text");
              return (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{r.name}</h4>
                      <p className="text-gray-600 text-sm mt-1">{r.description}</p>
                      {r.available && <p className="text-gray-500 text-xs mt-1">Available: {r.available}</p>}
                    </div>
                    <div className="ml-4 text-right">
                      {isText ? (
                        <a
                          href={`sms:${
                            r.phone.includes("741741")
                              ? "741741?body=HOME"
                              : r.phone.includes("686868")
                              ? "686868?body=HOME"
                              : r.phone.includes("85258")
                              ? "85258?body=SHOUT"
                              : r.phone.includes("50808")
                              ? "50808?body=HOME"
                              : ""
                          }`}
                          className="inline-block bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                        >
                          📱 {r.phone}
                        </a>
                      ) : (
                        <a
                          href={`tel:${r.phone.replace(/[^0-9]/g, "")}`}
                          className="inline-block bg-brand-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                        >
                          📞 Call {r.phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-1">Organization-Specific Resources</h4>
              <p className="text-blue-700 text-sm">
                Your organization may offer chaplains, peer support, or psychology services. Check with your supervisor or
                HR for options.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
