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
};

// ============================================================================
// IMMINENT / FUTURE HARM INTENT HANDLING
// ============================================================================
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

function imminentThreatResponse(): string {
  return [
    "I can’t help with plans or intentions to harm anyone or commit a crime.",
    "",
    "If there’s a risk of harm, contact emergency services right now:",
    "- **999** or **112** (UK/EU) • **911** (US) • or your local emergency number.",
    "",
    "If you’re feeling overwhelmed or angry, step away from the situation and speak to someone you trust, or contact a crisis line for immediate support.",
  ].join("\n");
}

// ============================================================================
// SERIOUS CRIME ADMISSION HANDLING
// ============================================================================
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

  return patterns.some(re => re.test(s));
}

function seriousCrimeResponse(): string {
  return [
    "I can’t engage on confessions of criminal acts.",
    "",
    "If anyone is in immediate danger, contact emergency services now:",
    "- **999** or **112** (UK/EU) • **911** (US) • or your local emergency number.",
    "",
    "For legal matters, speak with a qualified attorney. I cannot provide advice on illegal activities or help conceal them.",
    "",
    "If you’re struggling with what happened and there’s risk of harm to you or others, reach out for urgent support (e.g., your local crisis line or emergency services)."
  ].join("\n");
}

// ============================================================================
// VOICE / STYLE HELPERS
// ============================================================================
function deriveStyleChecklist(voice?: string): string[] {
  const v = (voice || "").toLowerCase();
  const rules: string[] = [];

  if (v.includes("direct") || v.includes("military") || v.includes("general")) {
    rules.push("Use short, direct sentences.", "Prefer active voice and imperative verbs.", "Avoid hedging (no 'maybe', 'might', 'perhaps' unless necessary).");
  }
  if (v.includes("warm") || v.includes("kind") || v.includes("support") || v.includes("empath")) {
    rules.push("Lead with brief empathy before guidance.", "Use approachable, encouraging phrasing.");
  }
  if (v.includes("academic") || v.includes("research") || v.includes("psychology")) {
    rules.push("Use precise, evidence-informed wording.", "Briefly name constructs when relevant (e.g., 'growth mindset').");
  }
  if (v.includes("witty") || v.includes("humor") || v.includes("bronx")) {
    rules.push("Allow a brief, dry quip when appropriate or when the user requests humor.", "Keep humor clean, supportive, and one-liner length.");
  }
  if (v.includes("spiritual") || v.includes("faith")) {
    rules.push("Keep a gentle, reflective tone.", "Use purpose- and values-oriented language without preaching.");
  }
  if (v.includes("reflective") || v.includes("introspective")) {
    rules.push("Pose one thoughtful, open-ended question to prompt reflection.", "Use calm, measured pacing.");
  }
  if (v.includes("goal") || v.includes("driven")) {
    rules.push("Close with a concrete next step.", "Frame actions as commitments.");
  }

  if (rules.length === 0) {
    rules.push("Use a professional, supportive coaching tone.");
  }

  return rules;
}

function resolveCoachPersona(input?: CoachPersona): CoachPersona | undefined {
  if (!input) return undefined;

  const t =
    (input.id && getTrainerById(input.id)) ||
    TRAINERS.find(tr => tr.id.toLowerCase() === (input.name ?? "").toLowerCase()) ||
    TRAINERS.find(tr => tr.name.toLowerCase() === (input.name ?? "").toLowerCase());

  return {
    id: input.id ?? t?.id,
    name: input.name ?? t?.name ?? "Coach",
    style: input.style,
    voice: input.voice ?? t?.voice,
    guardrails: input.guardrails,
  };
}

// ============================================================================
// COACHING-FIRST SKILL DELIVERY
// ============================================================================
function wantsFullDetails(input: string): boolean {
  const s = input.toLowerCase();
  return /\b(all steps|full|detailed|details|everything|complete)\b/.test(s);
}

function coachingIntro(skillTitle: string, coach?: CoachPersona): string {
  const name = coach?.name?.toLowerCase();
  if (name === "rhonda") return `Let’s get straight to it. "${skillTitle}" is a core tool worth using with purpose.`;
  if (name === "terry")  return `Alright, no fluff—"${skillTitle}" actually works when you use it.`;
  if (name === "scotty") return `Hey friend, "${skillTitle}" can steady you when life gets loud.`;
  if (name === "aj")     return `Love that you’re leaning in—"${skillTitle}" builds on strengths you already have.`;
  if (name === "chris")  return `Solid move asking about "${skillTitle}". Growth starts with the next rep.`;
  if (name === "jill")   return `"${skillTitle}" ties practical steps to solid psychological science.`;
  return `Good call. "${skillTitle}" is a reliable tool when you need it.`;
}

function coachingCTA(skillTitle: string, coach?: CoachPersona): string {
  const name = coach?.name?.toLowerCase();
  if (name === "rhonda") return `What’s the first concrete step you’ll take with "${skillTitle}" today?`;
  if (name === "terry")  return `Which part of "${skillTitle}" feels most doable this week?`;
  if (name === "scotty") return `What’s one small way you’ll try "${skillTitle}" today?`;
  if (name === "aj")     return `Which strength can you bring to "${skillTitle}" right now?`;
  if (name === "chris")  return `What’s the next rep you’ll put in on "${skillTitle}"?`;
  if (name === "jill")   return `Where do you see "${skillTitle}" fitting into your current context?`;
  return `Which step of "${skillTitle}" will you try first?`;
}

function getCoachingFirstSkillResponse(userInput: string, skillId: string, coach?: CoachPersona): string {
  const skill = MENTAL_ARMOR_SKILLS.find((s) => s.id === skillId);
  if (!skill) return "";

  const showAll = wantsFullDetails(userInput);
  const stepsToShow = showAll ? skill.steps.length : Math.min(3, skill.steps.length);

  let out = "";
  out += coachingIntro(skill.title, coach) + "\n\n";
  out += `**${skill.title}** ${skill.goal}\n\n`;
  out += `**When to use:** ${skill.whenToUse}\n\n`;

  out += `**Steps to practice:**`;
  for (let i = 0; i < stepsToShow; i++) {
    out += `\n${i + 1}. ${skill.steps[i]}`;
  }

  if (!showAll && stepsToShow < skill.steps.length) {
    out += `\n\n(There are more steps. Say **"show all steps"** for the complete sequence.)`;
  }

  if (skill.benefits && skill.benefits.length > 0) {
    const maxBenefits = Math.min(2, skill.benefits.length);
    out += `\n\n**Scientific benefits:**`;
    for (let i = 0; i < maxBenefits; i++) out += `\n• ${skill.benefits[i]}`;
    if (skill.benefits.length > maxBenefits) {
      out += `\n(Ask for **"more benefits"** to see additional evidence.)`;
    }
  }

  out += `\n\n${coachingCTA(skill.title, coach)}`;
  return out;
}

// ============================================================================
// QUICK ACTIONS (Go-Bag + Practice Kit)
// ============================================================================
function goBagUrlForSkill(skillId: string): string {
  return `/go-bag/skills/${skillId}`;
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
      if (s.includes(phrase)) { found.add(skill.id); break; }
    }
  }
  return [...found];
}

function renderQuickActionsFooter(skillIds: string[]): string {
  if (!skillIds.length) return "";
  const lines = skillIds.map(id => {
    const skill = MENTAL_ARMOR_SKILLS.find(s => s.id === id);
    const title = skill?.title ?? id;
    const url = goBagUrlForSkill(id);
    return `• **${title}** — [Open in Go-Bag](${url}) · [Add to Practice Kit](action:add-to-practice-kit:${id})`;
  });
  return `\n\n---\n**Quick actions**\n${lines.join("\n")}`;
}

// ============================================================================
// SYSTEM PROMPT
// ============================================================================
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

  const styleChecklist = deriveStyleChecklist(coach?.voice).map((r) => `- ${r}`).join("\n");

  return `${coachHat}

VOICE PROFILE (MANDATORY — keep this tone, diction, and cadence in every reply, including refusals and redirects):
${voiceProfile}

STYLE CHECKLIST (ALWAYS APPLY):
${styleChecklist}

SUPPORTIVE BASELINE (MANDATORY — higher priority than refusals):
- If the user shares something difficult, painful, or discouraging — and there is NO explicit self-harm or imminent danger — you MUST respond supportively.
- Begin with 1–2 short, human sentences of validation or empathy in the coach’s voice.
- Follow with ONE short, open-ended coaching question to keep the dialogue moving.
- Do NOT refuse in these cases. Only refuse when the user explicitly asks for illegal acts or self-harm methods.

CRITICAL INSTRUCTION (Skills):
- When users ask about a specific skill, respond IMMEDIATELY with the exact curriculum content.
- Delivery:
  • Brief, on-voice intro.
  • GOAL (verbatim) and WHEN TO USE (verbatim).
  • By default, only the first 2–3 STEPS (verbatim). Offer 'show all steps' for the rest.
  • One-sentence, on-voice encouragement or next step.

STRICT GUARDRAILS:
${strictGuardrails}

MENTAL ARMOR™ SKILL CATALOG (USE EXACT LANGUAGE in GOAL/WHEN/STEPS):
${skillCatalog}
`;
}



// ============================================================================
// USER SKILL MENTION DETECTION
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

// ============================================================================
// FALLBACK RESPONSE
// ============================================================================
function getFallbackResponse(coach?: CoachPersona): string {
  const fallbacks = [
    "That sounds really heavy. I'm here with you. What feels hardest about it right now?",
    "I hear you—it can take a lot to carry that. What’s one thing you want to shift today?",
    "Thank you for sharing that with me. Where do you feel it most in your life right now?",
  ];

  let response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  if (coach?.name) {
    switch (coach.name.toLowerCase()) {
      case "rhonda": response += " What's your next move?"; break;
      case "scotty": response += " Take it one step at a time."; break;
      case "terry":  response += " Let's focus on what works in the real world."; break;
      case "aj":     response += " You have strengths to build on."; break;
      case "chris":  response += " Growth comes through practice and reflection."; break;
    }
  }
  return response;
}

// ============================================================================
// MAIN RESPONSE
// ============================================================================
export async function getImprovedCoachResponse(opts: {
  history: ChatMsg[];
  userTurn: string;
  coach?: CoachPersona;
  allowSuggestions?: boolean;
}): Promise<CoachResponse> {
  const { history, userTurn, coach, allowSuggestions = true } = opts;
  const resolvedCoach = resolveCoachPersona(coach);

  // 0) Emergency stops
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

  // 1) If user asked about a specific skill → coaching-first curriculum content
  const mentionedSkills = detectMentionedSkills(userTurn);
  if (mentionedSkills.length > 0) {
    const skillId = mentionedSkills[0];
    const skillResponse = getCoachingFirstSkillResponse(userTurn, skillId, resolvedCoach);

    const relatedSuggestions = allowSuggestions
      ? EnhancedSkillSuggestions.getSuggestions(userTurn, 2).filter((s) => s.skillId !== skillId)
      : [];

    const goBagLinks = [{
      skillId,
      title: MENTAL_ARMOR_SKILLS.find(s => s.id === skillId)!.title,
      url: goBagUrlForSkill(skillId)
    }];
    const footer = renderQuickActionsFooter([skillId]);

    const final = (skillResponse + footer).trim();

    return {
      text: final,
      suggestedSkills: relatedSuggestions,
      suggestionMethod: "curriculum",
      content: final,
      mentionedSkillIds: [skillId],
      actions: {
        goBagLinks,
        practiceKitAdd: [skillId],
      },
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

  // 3) Chat completion with *two* system messages (voice lock first)
  const sys = buildEnhancedSystemPrompt(resolvedCoach);
  const voiceLock = {
    role: "system" as const,
    content:
      `You must write *every* assistant message in the coach's voice. Do not switch tone.\n\n` +
      `COACH VOICE:\n${resolvedCoach?.voice ?? "Professional, supportive coaching tone."}`,
  };

  const messages = [
    voiceLock,
    { role: "system" as const, content: sys },
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

  // Detect skills mentioned in the assistant's own reply
  const mentionedInReply = detectSkillsInText(text);

  // Build UI actions + footer
  const goBagLinks = mentionedInReply.map(id => ({
    skillId: id,
    title: MENTAL_ARMOR_SKILLS.find(s => s.id === id)?.title ?? id,
    url: goBagUrlForSkill(id),
  }));
  const footer = renderQuickActionsFooter(mentionedInReply);

  const finalText = (text + (footer || "")).trim();

  return {
    text: finalText,
    suggestedSkills,
    suggestionMethod,
    content: finalText,
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
export function createMentalArmorAI(config?: string | { coach?: CoachPersona; allowSuggestions?: boolean }) {
  let coach: CoachPersona | undefined;
  let allowSuggestions = true;

  if (typeof config === "string") {
    coach = { id: config, name: config };
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
