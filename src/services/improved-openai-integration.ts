// src/services/improved-openai-integration.ts
// src/services/improved-openai-integration.ts
import { MENTAL_ARMOR_SKILLS } from "@/data/skills";
import { EnhancedSkillSuggestions, type SkillSuggestion } from "./enhanced-skill-suggestions";
import { getTrainerById, TRAINERS } from "@/data/trainers"; // ⬅️ NEW
const MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
const FUNCTION_URL = "/.netlify/functions/openai-chat";

// ---- Serverless OpenAI call (no API key in client) ----
async function callOpenAI(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.45,
      max_tokens: 300,
      messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Function error ${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  // Support either { text } from your function or raw OpenAI shape
  return data.text || data.choices?.[0]?.message?.content || "";
}

export type ChatMsg = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type CoachPersona = {
  id?: string;          // ⬅️ NEW (trainer id like "rhonda", "scotty", etc.)
  name: string;
  style?: string;
  voice?: string;       // ⬅️ NEW (resolved from trainers.ts)
  guardrails?: string[];
};

export type CoachResponse = {
  text: string;
  suggestedSkills?: SkillSuggestion[];
  suggestionMethod: "curriculum" | "ai-validated" | "fallback";
  content?: string;
  requiresEscalation?: boolean;
};

function deriveStyleChecklist(voice?: string): string[] {
  const v = (voice || "").toLowerCase();

  const rules: string[] = [];

  // Tone & cadence
  if (v.includes("direct") || v.includes("military") || v.includes("general")) {
    rules.push(
      "Use short, direct sentences.",
      "Prefer active voice and imperative verbs.",
      "Avoid hedging (no 'maybe', 'might', 'perhaps' unless necessary)."
    );
  }
  if (v.includes("warm") || v.includes("kind") || v.includes("support") || v.includes("empath")) {
    rules.push(
      "Lead with brief empathy before guidance.",
      "Use approachable, encouraging phrasing."
    );
  }
  if (v.includes("academic") || v.includes("research") || v.includes("psychology")) {
    rules.push(
      "Use precise, evidence-informed wording.",
      "Briefly name constructs when relevant (e.g., 'growth mindset')."
    );
  }
  if (v.includes("witty") || v.includes("humor") || v.includes("bronx")) {
    rules.push(
      "Allow a brief, dry quip when appropriate or when the user requests humor.",
      "Keep humor clean, supportive, and one-liner length."
    );
  }
  if (v.includes("spiritual") || v.includes("faith")) {
    rules.push(
      "Keep a gentle, reflective tone.",
      "Use purpose- and values-oriented language without preaching."
    );
  }
  if (v.includes("reflective") || v.includes("introspective")) {
    rules.push(
      "Pose one thoughtful, open-ended question to prompt reflection.",
      "Use calm, measured pacing."
    );
  }
  if (v.includes("goal") || v.includes("driven")) {
    rules.push(
      "Close with a concrete next step.",
      "Frame actions as commitments."
    );
  }

  // Always ensure at least a baseline
  if (rules.length === 0) {
    rules.push("Use a professional, supportive coaching tone.");
  }

  return rules;
}


// Put this near the top of the file (below types is fine)
function resolveCoachPersona(input?: CoachPersona): CoachPersona | undefined {
  if (!input) return undefined;

  // Try resolving by id first, then by name
  const t =
    (input.id && getTrainerById(input.id)) ||
    TRAINERS.find(tr => tr.id.toLowerCase() === (input.name ?? "").toLowerCase()) ||
    TRAINERS.find(tr => tr.name.toLowerCase() === (input.name ?? "").toLowerCase());

  // Merge: explicit fields on input win; otherwise fall back to trainer data
  return {
    id: input.id ?? t?.id,
    name: input.name ?? t?.name ?? "Coach",
    style: input.style,
    voice: input.voice ?? t?.voice,     // ⬅️ pull the canonical voice from trainers.ts
    guardrails: input.guardrails,
  };
}

// ---- System prompt (curriculum-first) ----
function buildEnhancedSystemPrompt(coach?: CoachPersona): string {
  const skillCatalog = MENTAL_ARMOR_SKILLS.map((skill) => {
    return `**${skill.id}**: ${skill.title}
   Goal: ${skill.goal}
   When to use: ${skill.whenToUse}
   Trainer: ${skill.trainer}
   Modules: ${skill.modules.join(", ")}
   Steps: ${skill.steps.join(" → ")}`;
  }).join("\n\n");

  const coachHat = coach?.name
    ? `You are "${coach.name}", an expert Mental Armor™ coach. ${coach?.style ?? ""}`.trim()
    : `You are an expert Mental Armor™ coach.`;

  const strictGuardrails = [
    "CRITICAL: Do NOT invent new skills, exercises, or concepts outside the catalog.",
    "For the GOAL, WHEN TO USE, and STEPS sections, quote the catalog EXACTLY (verbatim).",
    "Before/after those sections, you MAY add brief coaching in the coach's voice.",
    "Stay within the Mental Armor™ framework at all times.",
    ...(coach?.guardrails ?? []),
  ].map((x) => `- ${x}`).join("\n");

  const voiceProfile = (coach?.voice && coach.voice.trim().length > 0)
    ? coach.voice.trim()
    : "Write with a professional, supportive coaching tone.";

  const styleChecklist = deriveStyleChecklist(coach?.voice)
    .map((r) => `- ${r}`)
    .join("\n");

  return `${coachHat}

VOICE PROFILE (MANDATORY — keep this tone, diction, and cadence in every reply, including refusals and redirects):
${voiceProfile}

STYLE CHECKLIST (ALWAYS APPLY):
${styleChecklist}

CONVERSATIONAL BASELINE:
- If the user expresses distress WITHOUT explicit self-harm intent, do NOT refuse.
- Start with a brief, human validation (1–2 short sentences), then ask ONE short, open question (if appropriate).

CRITICAL INSTRUCTION (Skills):
- When users ask about a specific skill, respond IMMEDIATELY with the exact curriculum content.
- Format:
  1) GOAL (verbatim)
  2) WHEN TO USE (verbatim)
  3) STEPS (verbatim)
  4) One-sentence, on-voice encouragement or next step

STRICT GUARDRAILS:
${strictGuardrails}

MENTAL ARMOR™ SKILL CATALOG (USE EXACT LANGUAGE in GOAL/WHEN/STEPS):
${skillCatalog}
`;
}



// ---- Direct skill content delivery ----
function getDirectSkillResponse(skillId: string, coach?: CoachPersona): string {
  const skill = MENTAL_ARMOR_SKILLS.find((s) => s.id === skillId);
  if (!skill) return "";

  let response = "";
  if (coach?.name) {
    switch (coach.name.toLowerCase()) {
      case "rhonda":
        response += "That's a fundamental question that requires solid foundations. ";
        break;
      case "scotty":
        response += "That's a deep question, friend. Let me share something that might help. ";
        break;
      case "terry":
        response += "Now that's a question that's been around since humans started thinking. Here's what works in practice: ";
        break;
      case "aj":
        response += "What an important question! I love that you're thinking about purpose. ";
        break;
      case "chris":
        response += "That's the kind of question that builds character through reflection. ";
        break;
      case "jill":
        response += "That's a profound question that touches on our core psychological needs. ";
        break;
      default:
        response += "That's an important question. ";
    }
  }

  response += `**${skill.title}** ${skill.goal}

**When to use:** ${skill.whenToUse}

**Steps to practice:**`;

  skill.steps.forEach((step, index) => {
    response += `\n${index + 1}. ${step}`;
  });

  if (skill.benefits && skill.benefits.length > 0) {
    response += `\n\n**Scientific benefits:**`;
    skill.benefits.slice(0, 3).forEach((benefit) => {
      response += `\n• ${benefit}`;
    });
  }

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
}

// ---- Detect skill mentions in user input ----
function detectMentionedSkills(userInput: string): string[] {
  const input = userInput.toLowerCase();
  const mentionedSkills: string[] = [];

  // Direct title/ID matching
  for (const skill of MENTAL_ARMOR_SKILLS) {
    const titleLower = skill.title.toLowerCase();
    if (input.includes(titleLower)) {
      mentionedSkills.push(skill.id);
      continue;
    }
    const titleWords = titleLower.split(" ");
    if (titleWords.length >= 3) {
      for (let i = 0; i <= titleWords.length - 3; i++) {
        const phrase = titleWords.slice(i, i + 3).join(" ");
        if (input.includes(phrase)) {
          mentionedSkills.push(skill.id);
          break;
        }
      }
    }
    if (input.includes(skill.id)) {
      mentionedSkills.push(skill.id);
    }
  }

  // Keyword-based with context
  const skillKeywords = {
    "foundations-resilience": ["foundations", "resilience foundation", "resilience science", "neuroplasticity", "growth mindset"],
    "flex-your-strengths": ["flex strengths", "character strengths", "VIA", "signature strengths", "strengths finder"],
    "values-based-living": ["values based", "values living", "core values", "purpose", "meaningful goals"],
    "spiritual-resilience": ["spiritual resilience", "spiritual strength", "faith", "meaning", "transcendence"],
    "cultivate-gratitude": ["cultivate gratitude", "gratitude practice", "thankfulness", "appreciation"],
    mindfulness: ["mindfulness", "mindful", "meditation", "present moment", "awareness"],
    reframe: ["reframe", "reframing", "cognitive reframe", "change perspective"],
    "balance-your-thinking": ["balance thinking", "thinking balance", "cognitive balance", "examine evidence"],
    "whats-most-important": ["most important", "priorities", "what matters", "values clarification"],
    "interpersonal-problem-solving": ["interpersonal", "problem solving", "conflict resolution", "wind-up approach"],
    "good-listening": ["good listening", "active listening", "celebrate good news", "ABCDE"],
  };

  for (const [skillId, keywords] of Object.entries(skillKeywords)) {
    if (mentionedSkills.includes(skillId)) continue;
    for (const keyword of keywords) {
      if (input.includes(keyword.toLowerCase())) {
        const contextWords = ["what is", "tell me about", "explain", "describe", "skill", "about", "how to", "steps"];
        const hasContext = contextWords.some((word) => input.includes(word));
        if (hasContext || input.length < 50) {
          mentionedSkills.push(skillId);
          break;
        }
      }
    }
  }

  return [...new Set(mentionedSkills)];
}

// ---- Validate curriculum references ----

// ---- Fallback response ----
function getFallbackResponse(coach?: CoachPersona): string {
  const fallbacks = [
    "I hear what you're sharing. Mental Armor™ training gives us tools to build resilience through practice.",
    "That sounds challenging. The Mental Armor™ approach helps us develop skills to withstand, recover, and grow.",
    "Thank you for sharing that with me. Building mental armor takes practice and the right tools for each situation.",
  ];

  let response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  if (coach?.name) {
    switch (coach.name.toLowerCase()) {
      case "rhonda":
        response += " What's your next move?";
        break;
      case "scotty":
        response += " Take it one step at a time.";
        break;
      case "terry":
        response += " Let's focus on what works in the real world.";
        break;
      case "aj":
        response += " You have strengths to build on.";
        break;
      case "chris":
        response += " Growth comes through practice and reflection.";
        break;
    }
  }
  return response;
}

// ---- Main response function ----
export async function getImprovedCoachResponse(opts: {
  history: ChatMsg[];
  userTurn: string;
  coach?: CoachPersona;
  allowSuggestions?: boolean;
}): Promise<CoachResponse> {
  const { history, userTurn, coach, allowSuggestions = true } = opts;
  const resolvedCoach = resolveCoachPersona(opts.coach); // ⬅️ NEW
  // 1) If user asked about a specific skill, return exact curriculum content
  const mentionedSkills = detectMentionedSkills(userTurn);
  if (mentionedSkills.length > 0) {
    const skillResponse = getDirectSkillResponse(mentionedSkills[0], coach);
    const relatedSuggestions = allowSuggestions
    
      ? EnhancedSkillSuggestions.getSuggestions(userTurn, 2).filter((s) => s.skillId !== mentionedSkills[0])
      : [];
      
    return {
      text: skillResponse,
      suggestedSkills: relatedSuggestions,
      suggestionMethod: "curriculum",
      content: skillResponse,
    };
  }

  // 2) Curriculum-based suggestions (separate from the chat)
  let suggestedSkills: SkillSuggestion[] = [];
  let suggestionMethod: "curriculum" | "ai-validated" | "fallback" = "curriculum";
  if (allowSuggestions) {
    try {
      suggestedSkills = EnhancedSkillSuggestions.getSuggestions(userTurn, 2);
      suggestionMethod = "curriculum";
    } catch (error) {
      console.warn("Curriculum suggestions failed:", error);
      suggestionMethod = "fallback";
    }
  }

  // 3) Chat completion with system prompt (via Netlify function)
   // 3) chat completion with *two* system messages:
  const sys = buildEnhancedSystemPrompt(resolvedCoach);
  const voiceLock = {
    role: "system" as const,
    content:
      `You must write *every* assistant message in the coach's voice. Do not switch tone.\n\n` +
      `COACH VOICE:\n${resolvedCoach?.voice ?? "Professional, supportive coaching tone."}`,
  };

  const messages = [
    voiceLock,                                 // ⬅️ FIRST system message (strongest)
    { role: "system" as const, content: sys }, // ⬅️ Your main rules + catalog
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: userTurn },
  ];

  let text = "";
  try {
    text = await callOpenAI(messages);
  } catch (error) {
    console.warn("OpenAI call failed:", error);
    text = getFallbackResponse(resolvedCoach);
  }

  return {
    text: text.trim(),
    suggestedSkills,
    suggestionMethod,
    content: text.trim(),
  };
}

// ---- Wrapper used by RepairKit.tsx ----
export function createMentalArmorAI(config?: string | { coach?: CoachPersona; allowSuggestions?: boolean }) {
  let coach: CoachPersona | undefined;
  let allowSuggestions = true;

  if (typeof config === "string") {
    coach = { id: config, name: config }; // ⬅️ id preferred; name kept for backward-compat
  } else if (config) {
    coach = config.coach;
    allowSuggestions = config.allowSuggestions ?? true;
  }

  return {
    async send(userText: string, history: ChatMsg[]) {
      return getImprovedCoachResponse({ history, userTurn: userText, coach, allowSuggestions });
    },
    async generateResponse(...args: unknown[]) {
      let userText = "";
      let history: ChatMsg[] = [];
      if (args.length === 2) [userText, history] = args as [string, ChatMsg[]];
      else if (args.length === 3) [userText, , history] = args as [string, unknown, ChatMsg[]];

      return getImprovedCoachResponse({ history, userTurn: userText, coach, allowSuggestions });
    },
  };
}
