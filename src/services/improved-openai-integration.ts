// src/services/improved-openai-integration.ts
import { MENTAL_ARMOR_SKILLS } from "@/data/skills";
import { EnhancedSkillSuggestions, type SkillSuggestion } from "./enhanced-skill-suggestions";

const MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
const FUNCTION_URL = "/.netlify/functions/openai-chat";

// ---- Serverless OpenAI call (no API key in client) ----
async function callOpenAI(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
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
  name: string;
  style?: string;
  guardrails?: string[];
};

export type CoachResponse = {
  text: string;
  suggestedSkills?: SkillSuggestion[];
  suggestionMethod: "curriculum" | "ai-validated" | "fallback";
  content?: string;
  requiresEscalation?: boolean;
};

// ---- Refusal detection + supportive baseline ----
function isLikelyRefusal(text: string): boolean {
  const t = text.toLowerCase();
  return [
    "i'm unable to provide",
    "i can’t help with that",
    "i can't help with that",
    "i can't provide the help you need",
    "i can’t provide the help you need",
    "i cannot assist with",
  ].some((p) => t.includes(p));
}

function composeSupportiveFirstTurn(_userTurn: string, coach?: CoachPersona): string {
  const coachTag = coach?.name ? ` I’m ${coach.name}.` : "";
  const lead = `I’m really sorry you’re feeling this way.${coachTag} You’re not alone, and I’m here with you.`;
  const ask = "What’s making today feel especially heavy?";
  const nudge = "If you want a Mental Armor™ skill, say the word and I’ll share one with exact steps.";
  return `${lead} ${ask} ${nudge}`;
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
    "CRITICAL: Use ONLY the exact language from the Mental Armor™ skill catalog below",
    "NEVER create new skills, exercises, or concepts not in the catalog",
    "NEVER modify or paraphrase the curriculum language - quote it exactly",
    "If referencing a skill, use its exact title and goal statement",
    "Focus on supportive coaching using only established Mental Armor™ concepts",
    "If uncertain about curriculum accuracy, be more general rather than specific",
    ...(coach?.guardrails ?? []),
  ]
    .map((x) => `- ${x}`)
    .join("\n");

  return `${coachHat}

CONVERSATIONAL BASELINE (do not violate safety, do not invent skills):
- If the user expresses distress WITHOUT explicit self-harm intent, do NOT refuse.
- Start with a brief, human validation (1–2 short sentences), then ask ONE short, open question.
- Only present a skill inline when the user explicitly asks for a skill (e.g., “is there a skill to help?”). When you do, use the exact curriculum format (GOAL, WHEN TO USE, STEPS) and keep it concise.

CRITICAL INSTRUCTION: When users ask about specific Mental Armor™ skills, respond IMMEDIATELY with the exact curriculum content. Do NOT give general explanations about the program first.

RESPONSE FORMAT FOR SKILL QUESTIONS:
1. Lead with the skill's exact GOAL statement
2. Follow with exact WHEN TO USE guidance  
3. Include the exact STEPS from curriculum
4. Add brief coach-specific encouragement at the end

STRICT RULES:
- Use ONLY exact language from Mental Armor™ curriculum
- NEVER create new content or paraphrase
- When a skill is mentioned, give its specific content immediately
- Do not explain "the program" - give the specific skill details
- Keep responses focused on the specific skill requested
- Do NOT suggest specific skills - the system handles skill suggestions automatically

MENTAL ARMOR™ SKILL CATALOG (USE EXACT LANGUAGE ONLY):
${skillCatalog}

STRICT GUARDRAILS:
${strictGuardrails}

RESPONSE EXAMPLES:

If asked about "Foundations of Resilience":
"**Foundations of Resilience** helps you learn how resilience helps us withstand, recover, and grow — and why understanding its foundations is essential to mental strength and endurance.

**When to use:** When you need the science of resilience, why practice matters day-to-day, or the right mindset for developing resilience in yourself and others.

**Steps to practice:**
1. Watch the introduction (Dr. Cornum's story)
2. Learn to define resilience and its attributes
3. Watch real examples and identify attributes in action
4. Choose 3—5 attributes that describe you; reflect on a time you used them
5. Debunk common myths about resilient people
6. Learn the science (neuroplasticity)
7. Adopt a growth mindset"

If asked about "Mindfulness":
"**Mindfulness** helps you reduce stress and distraction; stay focused, calm, and engaged.

**When to use:** Regularly; when distracted; when stressed or overwhelmed.

**Steps to practice:**
1. Practice informally during everyday activities (eat, walk, chores)
2. Practice formally (brief meditation, visualization, focused breathing)
3. Use in the moment (deep breaths; five-senses grounding: notice what you see/hear/feel, etc.)"

COACH-SPECIFIC GUIDANCE:
${coach?.name === "rhonda" ? 'End with: "This skill works if you work it. What\'s your next move?"' : ""}
${coach?.name === "scotty" ? 'End with: "Take this one step at a time, with patience and care."' : ""}
${coach?.name === "terry" ? 'End with: "This works in the real world when you practice it consistently."' : ""}
${coach?.name === "aj" ? 'End with: "This builds on strengths you already have."' : ""}
${coach?.name === "chris" ? 'End with: "Growth comes through practicing these steps."' : ""}

GENERAL COACHING APPROACH:
- Provide supportive guidance using only curriculum concepts
- Keep responses focused on understanding and practical application
- Use exact curriculum language for all skill references
- The system will automatically suggest appropriate skills separately
- Stay within the Mental Armor™ framework at all times`;
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
function validateCurriculumLanguage(text: string): string {
  const validSkillTitles = MENTAL_ARMOR_SKILLS.map((s) => s.title.toLowerCase());
  const lines = text.split("\n");

  return lines
    .map((line: string) => {
      const lowerLine = line.toLowerCase();
      const mentionsInvalidSkill =
        lowerLine.includes("skill") && !validSkillTitles.some((title) => lowerLine.includes(title));

      if (mentionsInvalidSkill) {
        return line
          .replace(/try the .* skill/gi, "consider using Mental Armor™ techniques")
          .replace(/use .* skill/gi, "apply your training")
          .replace(/practice .* skill/gi, "practice your techniques");
      }

      return line;
    })
    .join("\n");
}

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
  const sys = buildEnhancedSystemPrompt(coach);
  const messages = [
    { role: "system" as const, content: sys },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: userTurn },
  ];

  let text = "";
  try {
    text = await callOpenAI(messages);
    if (isLikelyRefusal(text)) {
      text = composeSupportiveFirstTurn(userTurn, coach);
    }
    text = validateCurriculumLanguage(text);
  } catch (error) {
    console.warn("OpenAI call failed:", error);
    text = getFallbackResponse(coach);
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
    coach = { name: config };
  } else if (config) {
    coach = config.coach;
    allowSuggestions = config.allowSuggestions ?? true;
  }

  return {
    async send(userText: string, history: ChatMsg[]) {
      return getImprovedCoachResponse({ history, userTurn: userText, coach, allowSuggestions });
    },

    // Legacy compatibility
    async generateResponse(...args: unknown[]) {
      let userText = "";
      let history: ChatMsg[] = [];

      if (args.length === 2) {
        [userText, history] = args as [string, ChatMsg[]];
      } else if (args.length === 3) {
        [userText, , history] = args as [string, unknown, ChatMsg[]];
      }

      return getImprovedCoachResponse({ history, userTurn: userText, coach, allowSuggestions });
    },
  };
}
