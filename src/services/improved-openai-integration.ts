// src/services/improved-openai-integration.ts
import { MENTAL_ARMOR_SKILLS } from "@/data/skills";
import { EnhancedSkillSuggestions, type SkillSuggestion } from "./enhanced-skill-suggestions";
import { getTrainerById, TRAINERS } from "@/data/trainers";

const MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
const FUNCTION_URL = "/.netlify/functions/openai-chat";

// ---- Serverless OpenAI call (no API key in client) ----
async function callOpenAI(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.5,
      max_tokens: 350,
      messages,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Function error ${res.status}: ${text || res.statusText}`);
  }
  const data = await res.json();
  return data.text || data.choices?.[0]?.message?.content || "";
}

export type ChatMsg = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type CoachPersona = {
  id?: string;          // trainer id like "rhonda", "scotty", etc.
  name: string;
  style?: string;
  voice?: string;       // resolved from trainers.ts
  guardrails?: string[];
};

export type CoachingContext = {
  mode?: "active_coaching" | "general_support";
  skillId?: string;
  skillTitle?: string;
  currentStep?: number;
  stepData?: Record<string, string>;
  totalSteps?: number;
  allowSkillSuggestions?: boolean;
  practiceMode?: boolean;
};

export type CoachResponse = {
  text: string;
  suggestedSkills?: SkillSuggestion[];
  suggestionMethod: "curriculum" | "ai-validated" | "fallback";
  content?: string;
  requiresEscalation?: boolean;
  escalationReason?: "confession-serious-crime" | "imminent-threat";
  mentionedSkillIds?: string[];
  actions?: {
    goBagLinks: { skillId: string; title: string; url: string }[];
    practiceKitAdd: string[];
  };
  // NEW: lets the service tell the UI to advance/end coaching steps
  coaching?: {
    nextStep?: number;
    end?: boolean;
  };
};


// ============================================================================
// ENHANCED EMERGENCY DETECTION (More Specific)
// ============================================================================
function detectCriticalEmergency(text: string): boolean {
  const s = text.toLowerCase();
  if (s.length < 10) return false;

  const criticalPatterns: RegExp[] = [
    /\b(i|we)\s+(am|'m|will|going to|plan to|want to)\s+(kill myself|end my life|commit suicide|take my life)\b/,
    /\b(i|we)\s+(am|'m|will|going to|plan to|want to)\s+(hurt myself|cut myself|harm myself)\b/,
    /\b(i|we)\s+(have|took|swallowed)\s+.*(pills|overdose|poison)\b.*\b(to die|to end|kill me)\b/,
    /\b(suicide|kill myself|end it all|better off dead)\b.*\b(tonight|today|now|soon)\b/,
  ];

  return criticalPatterns.some((pattern) => pattern.test(s));
}

function detectImminentThreatIntent(text: string): boolean {
  const s = text.toLowerCase();
  if (s.length < 6) return false;

  const patterns: RegExp[] = [
    /\b(i|we)\s+(am|'m|plan|planning|going|gonna|intend|thinking)\s+(to|of)\s+(kill|murder|stab|shoot|hurt|harm|attack|assault)\b/,
    /\b(i|we)\s+(want|wanna|wish)\s+to\s+(kill|murder|stab|shoot|hurt|harm|attack|assault)\b/,
    /\b(i|we)\s+(am|'m|plan|planning|going|gonna|intend|thinking)\s+(to|of)\s+(hurt|harm|kill|beat)\b.*\b(him|her|them|someone|person|man|woman|boy|girl)\b/,
    /\b(i|we)\s+(am|'m|plan|planning|going|gonna|intend|thinking)\s+(to|of)\s+(rob|mug|carjack|home-?invade|kidnap)\b/,
    /\b(i|we)\s+(am|'m|plan|planning|going|gonna|intend|thinking)\s+(to|of)\s+(burn|set\s+fire|torch|bomb)\b/,
    /\b(i|we)\s+(am|'m|plan|planning|going|gonna|intend|thinking)\s+(to|of)\s+(kill|hurt|harm|torture|poison)\b.*\b(dog|cat|animal|pet)\b/,
  ];

  return patterns.some((re) => re.test(s));
}

function detectSeriousCrimeAdmission(text: string): boolean {
  const s = text.toLowerCase();
  if (s.length < 6) return false;

  const patterns: RegExp[] = [
    /\b(i|we)\s+(have\s+)?(killed|murdered|shot|stabbed|strangled)\b.*\b(person|someone|him|her|them|man|woman|boy|girl)\b/,
    /\b(i|we)\s+(have\s+)?(raped|assaulted)\b.*\b(person|someone|him|her|them|man|woman|boy|girl)\b/,
    /\b(i|we)\s+(have\s+)?(robbed|mugged|carjacked|home-?invaded)\b/,
    /\b(i|we)\s+(have\s+)?(killed|tortured|hurt|beat|poisoned)\b.*\b(dog|cat|animal|pet)\b/,
    /\b(i|we)\s+(have\s+)?(set\s+fire|committed\s+arson)\b.*\b(house|home|building|car|property)\b/,
    /\b(i|we)\s+(have\s+)?(abused|hurt|molested|assaulted)\b.*\b(child|kid|minor)\b/,
  ];

  return patterns.some((re) => re.test(s));
}

function imminentThreatResponse(): string {
  return [
    "I can't help with plans or intentions to harm anyone or commit a crime.",
    "",
    "If there's a risk of harm, contact emergency services right now:",
    "- **999** or **112** (UK/EU) • **911** (US) • or your local emergency number.",
    "",
    "If you're feeling overwhelmed or angry, step away from the situation and speak to someone you trust, or contact a crisis line for immediate support.",
  ].join("\n");
}

function seriousCrimeResponse(): string {
  return [
    "I can't engage on confessions of criminal acts.",
    "",
    "If anyone is in immediate danger, contact emergency services now:",
    "- **999** or **112** (UK/EU) • **911** (US) • or your local emergency number.",
    "",
    "For legal matters, speak with a qualified attorney. I cannot provide advice on illegal activities or help conceal them.",
    "",
    "If you're struggling with what happened and there's risk of harm to you or others, reach out for urgent support (e.g., your local crisis line or emergency services).",
  ].join("\n");
}

function criticalEmergencyResponse(): string {
  return [
    "I'm very concerned about your safety. Please reach out immediately:",
    "",
    "🇺🇸 United States:",
    "• Suicide & Crisis Lifeline: 988 (24/7)",
    "• Crisis Text Line: Text HOME to 741741 (24/7)",
    "• Emergency: 911",
    "",
    "🇨🇦 Canada:",
    "• Canada Suicide Prevention Service: 1-833-456-4566 (24/7)",
    "• Crisis Text Line: Text CONNECT to 686868 (24/7)",
    "• Emergency: 911",
    "",
    "🇬🇧 United Kingdom:",
    "• Samaritans: 116 123 (24/7)",
    "• Crisis Text Line: Text SHOUT to 85258 (24/7)",
    "• Emergency: 999",
    "",
    "Your life has value. These resources are here to help you through this moment.",
  ].join("\n");
}

// ============================================================================
// ENHANCED VOICE AND COACHING SYSTEM
// ============================================================================
function resolveCoachPersona(input?: CoachPersona): CoachPersona | undefined {
  if (!input) return undefined;

  const t =
    (input.id && getTrainerById(input.id)) ||
    TRAINERS.find((tr) => tr.id.toLowerCase() === (input.name ?? "").toLowerCase()) ||
    TRAINERS.find((tr) => tr.name.toLowerCase() === (input.name ?? "").toLowerCase());

  return {
    id: input.id ?? t?.id,
    name: input.name ?? t?.name ?? "Coach",
    style: input.style,
    voice: input.voice ?? t?.voice,
    guardrails: input.guardrails,
  };
}

// ============================================================================
// FOCUSED COACHING SYSTEM PROMPTS
// ============================================================================
function buildFocusedCoachingPrompt(coach?: CoachPersona, context?: CoachingContext): string {
  const resolvedCoach = resolveCoachPersona(coach);
  const coachVoice = resolvedCoach?.voice ?? "You are a professional, supportive Mental Armor™ coach.";

  const voiceInstructions = buildVoiceInstructions(resolvedCoach);
  const isActiveCoaching = context?.mode === "active_coaching" && context?.skillId;

  if (isActiveCoaching) {
    const skill = MENTAL_ARMOR_SKILLS.find((s) => s.id === context.skillId);
    const currentStep = context.currentStep || 1;
    const totalSteps = skill?.steps.length || 1;

    return `${coachVoice}

${voiceInstructions}

ACTIVE COACHING SESSION - SKILL: ${skill?.title}
Current Step: ${currentStep} of ${totalSteps}

COACHING FOCUS RULES:
- You are ONLY coaching the user through "${skill?.title}" step by step
- CURRENT STEP FOCUS: "${skill?.steps[currentStep - 1] || "Review and practice"}"
- Guide them through THIS specific step before moving forward
- Ask ONE focused question about the current step to help them practice it
- Stay encouraging but keep laser focus on the skill at hand unless the user wants to move on

STRICT BOUNDARIES:
+ - No skill suggestions during active coaching **unless the user explicitly asks for another skill or names a different skill**
+ - If the user says “what is next”, “what’s next”, “next step”, “step N”, “move on”, or similar, ADVANCE to the next step. Do not repeat completed steps.
- No emergency protocols unless truly critical (explicit self-harm/suicide)
- Keep responses under 3 sentences to maintain focus
- Only end session if user explicitly says they want to stop or are done

${
  currentStep <= totalSteps
    ? `Help them complete step ${currentStep}: "${skill?.steps[currentStep - 1] || "Complete the practice"}"`
    : `Help them review what they learned and apply this skill going forward.`
}`;
  }

  // General coaching mode with enhanced voice
  const skillCatalog = MENTAL_ARMOR_SKILLS.map((skill) => {
    return `**${skill.id}**: ${skill.title}
   Goal: ${skill.goal}
   When to use: ${skill.whenToUse}
   Steps: ${skill.steps.slice(0, 3).join(" → ")}${skill.steps.length > 3 ? " → ..." : ""}`;
  }).join("\n\n");

  return `${coachVoice}

${voiceInstructions}

GENERAL COACHING MODE

COACHING PRINCIPLES:
- Listen and understand BEFORE suggesting anything
- Focus on empathy and connection first
- Ask open-ended questions to understand their situation
- Only suggest skills when directly relevant and helpful
- Maximum of 1 skill suggestion per response
- Avoid emergency resources unless user mentions explicit self-harm or suicide

CONVERSATION FLOW:
1. Acknowledge what they shared with empathy
2. Ask ONE clarifying question to understand better
3. Only then suggest a relevant skill if appropriate
4. If suggesting a skill, offer to coach them through it

SKILL CATALOG (reference only when specifically relevant):
${skillCatalog}

VOICE REMINDER: Always maintain your authentic coaching voice throughout the conversation.`;
}

function buildVoiceInstructions(coach?: CoachPersona): string {
  if (!coach?.id) return "Maintain a professional, supportive coaching tone.";

  switch (coach.id) {
    case "rhonda":
      return `VOICE: You are bold, direct, and no-nonsense like a Military General. Use short, decisive sentences. Say "That's not helping" instead of "maybe that's not the best approach." Use phrases like "What's your next move?" "Get after it." "No excuses." Be supportive but tough.`;
    case "chris":
      return `VOICE: You're introspective and deeply caring. Use thoughtful, reflective language. Ask probing questions about growth and meaning. Say things like "What's this teaching you?" "Growth comes through the hard moments." Be both kind and willing to give tough love when needed.`;
    case "scotty":
      return `VOICE: Speak with humble warmth and Southern kindness. Use gentle, story-like language. Say things like "Hey friend," "Take it one step at a time," "Let's walk through this together." Be patient and nurturing.`;
    case "terry":
      return `VOICE: Use dry, witty Bronx humor and practical wisdom. Be compassionate but ready with smart remarks. Say things like "Here's what actually works in the real world." "Let's cut through the noise." Blend heart with practical street smarts.`;
    case "aj":
      return `VOICE: Be energetic, upbeat, and goal-driven. Use positive, strengths-focused language. Say things like "I love that you're leaning in!" "What strengths can you bring to this?" "You've got this!" Focus on capabilities and achievements.`;
    case "jill":
      return `VOICE: Be warm, academic, and psychologically insightful. Use precise but caring language. Say things like "Let's explore what's happening here." "From a psychological perspective..." Blend evidence with empathy.`;
    default:
      return "Maintain a professional, supportive coaching tone.";
  }
}

// ============================================================================
// SKILL MENTION DETECTION AND COACHING RESPONSES
// ============================================================================
function detectMentionedSkills(userInput: string): string[] {
  const input = userInput.toLowerCase();
  const mentionedSkills: string[] = [];

  for (const skill of MENTAL_ARMOR_SKILLS) {
    const titleLower = skill.title.toLowerCase();
    if (input.includes(titleLower)) {
      mentionedSkills.push(skill.id);
      continue;
    }
    // Check for partial matches of 3-word phrases
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

  const skillKeywords: Record<string, string[]> = {
    "foundations-resilience": ["foundations", "resilience foundation", "resilience science", "neuroplasticity", "growth mindset"],
    "flex-your-strengths": ["flex strengths", "character strengths", "VIA", "signature strengths", "strengths finder"],
    "values-based-living": ["values based", "values living", "core values", "purpose", "meaningful goals"],
    "spiritual-resilience": ["spiritual resilience", "spiritual strength", "faith", "meaning", "transcendence"],
    "cultivate-gratitude": ["cultivate gratitude", "gratitude practice", "thankfulness", "appreciation"],
    "mindfulness": ["mindfulness", "mindful", "meditation", "present moment", "awareness"],
    "reframe": ["reframe", "reframing", "cognitive reframe", "change perspective"],
    "balance-your-thinking": ["balance thinking", "thinking balance", "cognitive balance", "examine evidence"],
    "whats-most-important": ["most important", "priorities", "what matters", "values clarification"],
    "interpersonal-problem-solving": ["interpersonal", "problem solving", "conflict resolution", "wind-up approach"],
    "good-listening": ["good listening", "active listening", "celebrate good news", "ABCDE"],
  };

  for (const [skillId, keywords] of Object.entries(skillKeywords)) {
    if (mentionedSkills.includes(skillId)) continue;
    for (const keyword of keywords) {
      if (input.includes(keyword.toLowerCase())) {
        const contextWords = ["what is", "tell me about", "explain", "describe", "skill", "about", "how to", "steps", "coach me", "help me with"];
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

function getCoachingFirstSkillResponse(userInput: string, skillId: string, coach?: CoachPersona): string {
  const skill = MENTAL_ARMOR_SKILLS.find((s) => s.id === skillId);
  if (!skill) return "";

  const resolvedCoach = resolveCoachPersona(coach);
  const showAll = /\b(all steps|full|detailed|details|everything|complete)\b/.test(userInput.toLowerCase());
  const stepsToShow = showAll ? skill.steps.length : Math.min(3, skill.steps.length);

  // Voice-specific intro
  let intro = "";
  switch (resolvedCoach?.id) {
    case "rhonda":
      intro = `Let's get straight to it. "${skill.title}" is a core tool—use it with purpose.`;
      break;
    case "terry":
      intro = `Alright, no fluff here. "${skill.title}" actually works when you use it.`;
      break;
    case "scotty":
      intro = `Hey friend, "${skill.title}" can steady you when life gets loud.`;
      break;
    case "aj":
      intro = `I love that you're leaning in! "${skill.title}" builds on strengths you already have.`;
      break;
    case "chris":
      intro = `Solid move asking about "${skill.title}". Growth starts with the next rep.`;
      break;
    case "jill":
      intro = `"${skill.title}" ties practical steps to solid psychological science.`;
      break;
    default:
      intro = `Good call. "${skill.title}" is a reliable tool when you need it.`;
  }

  let out = intro + "\n\n";
  out += `**${skill.title}** ${skill.goal}\n\n`;
  out += `**When to use:** ${skill.whenToUse}\n\n`;
  out += `**Steps to practice:**`;
  for (let i = 0; i < stepsToShow; i++) {
    out += `\n${i + 1}. ${skill.steps[i]}`;
  }

  if (!showAll && stepsToShow < skill.steps.length) {
    out += `\n\n(Say **"show all steps"** for the complete sequence.)`;
  }

  if (skill.benefits && skill.benefits.length > 0) {
    const maxBenefits = Math.min(2, skill.benefits.length);
    out += `\n\n**Scientific benefits:**`;
    for (let i = 0; i < maxBenefits; i++) out += `\n• ${skill.benefits[i]}`;
    if (skill.benefits.length > maxBenefits) {
      out += `\n(Ask for **"more benefits"** to see additional evidence.)`;
    }
  }

  // Voice-specific CTA
  let cta = "";
  switch (resolvedCoach?.id) {
    case "rhonda":
      cta = `What's your first move with "${skill.title}"?`;
      break;
    case "terry":
      cta = `Which part of "${skill.title}" feels most doable this week?`;
      break;
    case "scotty":
      cta = `What's one small way you'll try "${skill.title}" today?`;
      break;
    case "aj":
      cta = `Which strength can you bring to "${skill.title}" right now?`;
      break;
    case "chris":
      cta = `What's the next rep you'll put in on "${skill.title}"?`;
      break;
    case "jill":
      cta = `Where do you see "${skill.title}" fitting into your current context?`;
      break;
    default:
      cta = `Which step of "${skill.title}" will you try first?`;
  }

  out += `\n\n${cta}`;
  return out;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function needsSkillSuggestion(userInput: string, context?: CoachingContext): boolean {
  if (context?.mode === "active_coaching") return false;
  const input = userInput.toLowerCase();
  return (
    input.includes("help") ||
    input.includes("what should i do") ||
    input.includes("how can i") ||
    input.includes("need guidance") ||
    input.includes("stuck") ||
    input.includes("overwhelmed") ||
    (input.includes("anxious") && (input.includes("what") || input.includes("how")))
  );
}

function detectSkillsInText(text: string): string[] {
  const s = text.toLowerCase();
  const found = new Set<string>();

  for (const skill of MENTAL_ARMOR_SKILLS) {
    const id = skill.id.toLowerCase();
    const title = skill.title.toLowerCase();

    if (s.includes(id) || s.includes(title)) {
      found.add(skill.id);
      continue;
    }

    const words = title.split(/\s+/);
    for (let i = 0; i <= words.length - 3; i++) {
      const phrase = words.slice(i, i + 3).join(" ");
      if (s.includes(phrase)) {
        found.add(skill.id);
        break;
      }
    }
  }
  return [...found];
}

function goBagUrlForSkill(skillId: string): string {
  return `/go-bag/skills/${skillId}`;
}

function getFallbackResponse(coach?: CoachPersona): string {
  const resolvedCoach = resolveCoachPersona(coach);

  const fallbacks = [
    "That sounds really challenging. I'm here with you.",
    "I hear you—that's a lot to carry.",
    "Thank you for sharing that with me.",
  ];

  let response = fallbacks[Math.floor(Math.random() * fallbacks.length)];

  switch (resolvedCoach?.id) {
    case "rhonda":
      response += " What's your next move?";
      break;
    case "scotty":
      response += " Let's take this one step at a time.";
      break;
    case "terry":
      response += " Let's focus on what actually works here.";
      break;
    case "aj":
      response += " You have strengths to build on.";
      break;
    case "chris":
      response += " What's this teaching you right now?";
      break;
    case "jill":
      response += " Let's explore what's happening here.";
      break;
    default:
      response += " What feels most important to address right now?";
      break;
  }

  return response;
}

function userRequestsAnotherSkill(userInput: string, currentSkillId?: string) {
  const s = userInput.toLowerCase();
  const wantsOther =
    /\b(other skill|another skill|different skill|something else|what else|show more skills|more skills|new skill|other options)\b/.test(s);

  const mentioned = detectMentionedSkills(userInput).filter(id => id !== currentSkillId);
  // Allow if they explicitly want other skills OR they named a different skill
  return { allow: wantsOther || mentioned.length > 0, requestedIds: mentioned };
}
// ============================================================================
// MAIN RESPONSE FUNCTION
// ============================================================================
function parseCoachingStepIntent(userInput: string, ctx?: CoachingContext): { nextStep?: number; end?: boolean } {
  if (!ctx?.skillId) return {};
  const s = userInput.toLowerCase();
  const total = ctx.totalSteps ?? 1;
  const cur = ctx.currentStep ?? 1;

  // explicit "step N"
  const m = s.match(/\bstep\s*([0-9]{1,2})\b/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= total) return { nextStep: n };
  }

  // “what’s next / next step / continue / move on / proceed…”
  if (/\b(what'?s next|next step|continue|move on|proceed|keep going|advance)\b/.test(s)) {
    return { nextStep: Math.min(cur + 1, total) };
  }

  // done / end session
  if (/\b(end session|stop|done|finish(?:ed)?|complete(?:d)?)\b/.test(s)) {
    return { end: true };
  }

  return {};
}


export async function getImprovedCoachResponse(opts: {
  history: ChatMsg[];
  userTurn: string;
  coach?: CoachPersona;
  context?: CoachingContext;
}): Promise<CoachResponse> {
  const { history, userTurn, coach, context } = opts;
  const resolvedCoach = resolveCoachPersona(coach);

  // Emergency stops (only for truly critical situations)
  if (detectSeriousCrimeAdmission(userTurn)) {
    const text = seriousCrimeResponse();
    return {
      text,
      suggestedSkills: [],
      suggestionMethod: "fallback",
      content: text,
      requiresEscalation: true,
      escalationReason: "confession-serious-crime",
    };
  }

  if (detectImminentThreatIntent(userTurn)) {
    const text = imminentThreatResponse();
    return {
      text,
      suggestedSkills: [],
      suggestionMethod: "fallback",
      content: text,
      requiresEscalation: true,
      escalationReason: "imminent-threat",
    };
  }

  if (detectCriticalEmergency(userTurn)) {
    const text = criticalEmergencyResponse();
    return {
      text,
      suggestedSkills: [],
      suggestionMethod: "fallback",
      content: text,
      requiresEscalation: true,
      escalationReason: "imminent-threat",
    };
  }

  // 1) If user asked about a specific skill → coaching-first curriculum content
  const mentionedSkills = detectMentionedSkills(userTurn);
  if (mentionedSkills.length > 0) {
    const skillId = mentionedSkills[0];
    const skillResponse = getCoachingFirstSkillResponse(userTurn, skillId, resolvedCoach);

    const goBagLinks = [
      {
        skillId,
        title: MENTAL_ARMOR_SKILLS.find((s) => s.id === skillId)!.title,
        url: goBagUrlForSkill(skillId),
      },
    ];

    const final = skillResponse.trim();
    return {
      text: final,
      suggestedSkills: [], // Don’t suggest additional skills when they asked about a specific one
      suggestionMethod: "curriculum",
      content: final,
      mentionedSkillIds: [skillId],
      actions: {
        goBagLinks,
        practiceKitAdd: [skillId],
      },
    };
  }

  // 2) Build focused system prompt based on context and call model
  const sys = buildFocusedCoachingPrompt(resolvedCoach, context);
  const messages = [
    { role: "system" as const, content: sys },
    ...history.slice(-6).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })), // keep short
    { role: "user" as const, content: userTurn },
  ];

  let text = "";
  try {
    text = await callOpenAI(messages);
  } catch (error) {
    console.warn("OpenAI call failed:", error);
    text = getFallbackResponse(resolvedCoach);
  }

  // In active coaching mode, normally don't suggest skills — unless the user asked for another
if (context?.mode === "active_coaching") {
  const { allow, requestedIds } = userRequestsAnotherSkill(userTurn, context.skillId);
  const stepIntent = parseCoachingStepIntent(userTurn, context);

  if (!allow) {
  return {
    text,
    suggestedSkills: [],
    suggestionMethod: "curriculum",
    content: text,
    coaching: stepIntent, // NEW
  };
}


  // Build at most one alternative suggestion, prioritizing a named skill
  let suggestedSkills: SkillSuggestion[] = [];

  if (requestedIds.length > 0) {
    const id = requestedIds[0];
    const skill = MENTAL_ARMOR_SKILLS.find(s => s.id === id);
    if (skill) {
      suggestedSkills = [{
        skillId: id,
        skill,
        confidence: 0.9,
        curriculumQuote: skill.goal,
        rationale: "User explicitly named a different skill while in active coaching.",
      }];
    }
  } else {
    try {
      // Returns full SkillSuggestion objects; ensure a rationale is present
      suggestedSkills = EnhancedSkillSuggestions.getSuggestions(userTurn, 1).map(s => ({
  ...s,
  rationale: s.rationale ?? "User explicitly requested another skill during active coaching.",
}));

    } catch {
      suggestedSkills = [];
    }
  }

  const goBagLinks = suggestedSkills.map(s => ({
    skillId: s.skillId,
    title: s.skill?.title || MENTAL_ARMOR_SKILLS.find(ms => ms.id === s.skillId)?.title || s.skillId,
    url: `/go-bag/skills/${s.skillId}`,
  }));

  return {
    text,
    suggestedSkills,
    suggestionMethod: "curriculum",
    content: text,
    mentionedSkillIds: requestedIds,
    actions: {
      goBagLinks,
      practiceKitAdd: suggestedSkills.map(s => s.skillId),
    },
    coaching: stepIntent, // NEW
  };
}



  // 3) Only suggest skills if not in active coaching and user needs guidance
  let suggestedSkills: SkillSuggestion[] = [];
  if (needsSkillSuggestion(userTurn, context)) {
    try {
      suggestedSkills = EnhancedSkillSuggestions.getSuggestions(userTurn, 1); // Max 1 suggestion
    } catch (error) {
      console.warn("Skill suggestions failed:", error);
    }
  }

  // Detect skills mentioned in the assistant's own reply (for UI actions)
  const mentionedInReply = detectSkillsInText(text);

  const goBagLinks = mentionedInReply.map((id) => ({
    skillId: id,
    title: MENTAL_ARMOR_SKILLS.find((s) => s.id === id)?.title ?? id,
    url: goBagUrlForSkill(id),
  }));

  // No markdown footer concatenation; return plain text and separate UI actions
  return {
    text,
    suggestedSkills,
    suggestionMethod: "curriculum",
    content: text,
    mentionedSkillIds: mentionedInReply,
    actions: {
      goBagLinks,
      practiceKitAdd: mentionedInReply,
    },
  };
}

// ============================================================================
// WRAPPER used by RepairKit.tsx
// ============================================================================
export function createMentalArmorAI(
  config?: string | { coach?: CoachPersona; allowSuggestions?: boolean; context?: CoachingContext },
) {
  let coach: CoachPersona | undefined;
  let context: CoachingContext | undefined;

  if (typeof config === "string") {
    coach = { id: config, name: config };
  } else if (config) {
    coach = config.coach;
    // allowSuggestions is no longer needed here; suggestion logic is in needsSkillSuggestion(...)
    context = config.context;
  }

  return {
    async send(userText: string, history: ChatMsg[]) {
      return getImprovedCoachResponse({ history, userTurn: userText, coach, context });
    },

    async generateResponse(...args: unknown[]) {
      let userText = "";
      let history: ChatMsg[] = [];
      let passedContext: Partial<CoachingContext> | undefined = undefined;

      if (args.length === 2) {
        [userText, history] = args as [string, ChatMsg[]];
      } else if (args.length === 3) {
        [userText, passedContext, history] = args as [string, Partial<CoachingContext>, ChatMsg[]];
        context = { ...(context ?? {}), ...(passedContext ?? {}) };
      }

      return getImprovedCoachResponse({ history, userTurn: userText, coach, context });
    },

    // Method to update coaching context (for RepairKit state management)
    updateContext(newContext: Partial<CoachingContext>) {
      context = { ...(context ?? {}), ...newContext };
    },

    // Method to check if in active coaching
    isActiveCoaching() {
      return context?.mode === "active_coaching";
    },

    // Method to start coaching session
    startCoaching(skillId: string, skillTitle: string) {
      context = {
        ...(context ?? {}),
        mode: "active_coaching",
        skillId,
        skillTitle,
        currentStep: 1,
        stepData: {},
        totalSteps: MENTAL_ARMOR_SKILLS.find((s) => s.id === skillId)?.steps.length || 1,
      };
    },

    // Method to end coaching session
    endCoaching() {
      context = {
        ...(context ?? {}),
        mode: "general_support",
        skillId: undefined,
        skillTitle: undefined,
        currentStep: undefined,
        stepData: undefined,
      };
    },
  };
}
