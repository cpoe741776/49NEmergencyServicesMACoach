// src/services/enhanced-skill-suggestions.ts
import type { MentalArmorSkill } from "@/types/emergency";
import { MENTAL_ARMOR_SKILLS } from "@/data/skills";

// Complete updated SKILL_KEYWORD_MAP and SITUATION_SKILL_MAP
// Replace both sections in your src/services/enhanced-skill-suggestions.ts

const SKILL_KEYWORD_MAP = {
  "mindfulness": [
    // Anxiety/panic specific - HIGH PRIORITY
    "anxiety", "anxious", "high anxiety", "panic", "worried", "nervous", "tense", "stress", "stressed",
    "overwhelmed", "racing thoughts", "can't focus", "distracted", "restless",
    "jittery", "on edge", "wound up", "keyed up", "agitated",
    // Traditional mindfulness
    "mindfulness", "present", "focused", "awareness", "meditation", "breathing", 
    "calm", "grounding", "senses", "mindful", "breathe", "center"
  ],
  "reframe": [
    // Negative thinking patterns - HIGH PRIORITY for job anxiety
    "always think", "going to lose", "will happen", "lose my job", "what if",
    "negative thoughts", "catastrophic thinking", "worst case", "doom", "disaster",
    "always", "never", "everything", "nothing", "terrible", "awful",
    "catastrophe", "horrible", "ruined", "destroyed", "failed",
    // Traditional reframe
    "reframe", "thoughts", "thinking", "perspective", "reaction",
    "productive", "beliefs", "emotions", "behavior", "cognitive"
  ],
  "balance-your-thinking": [
    // Cognitive distortions - HIGH PRIORITY for job/future anxiety
    "lose my job", "going to lose", "always think", "catastrophizing",
    "overthinking", "ruminating", "spiraling", "black and white",
    "all or nothing", "jumping to conclusions", "mind reading", "fortune telling",
    "should", "must", "have to", "always", "never", "everyone", "nobody",
    // Traditional balance
    "balance", "evidence", "double standard", "accurate", "examine",
    "realistic", "facts", "proof", "logical", "rational"
  ],
  "whats-most-important": [
    // Family/priority concerns - MEDIUM PRIORITY
    "support my family", "provide for family", "family security", "financial security",
    "priorities mixed up", "everything urgent", "can't decide", "pulled in directions",
    "too many demands", "conflicted", "torn between", "competing priorities",
    "scattered", "all over the place", "chaos", "juggling too much",
    // Traditional priorities
    "important", "priorities", "values", "focus", "essential", "critical",
    "matters most", "core", "fundamental", "key"
  ],
  "values-based-living": [
    // Purpose/direction - MEDIUM PRIORITY
    "support my family", "family responsibility", "provide for",
    "lost", "no direction", "meaningless", "purposeless", "don't know why",
    "what's the point", "no motivation", "empty", "hollow", "directionless",
    "confused", "uncertain", "adrift", "aimless", "wandering",
    // Traditional values
    "values", "purpose", "meaning", "direction", "goals", "priorities",
    "alignment", "motivation", "core beliefs", "important to me"
  ],
  "cultivate-gratitude": [
    // Depression/negativity specific - LOWER PRIORITY for anxiety
    "depressed", "sad", "down", "low", "blue", "negative", "pessimistic",
    "nothing good", "everything wrong", "bad day", "terrible", "awful",
    "hopeless", "meaningless", "empty", "numb", "lifeless",
    // Traditional gratitude
    "gratitude", "thankful", "appreciation", "positive", "optimism",
    "good things", "wins", "blessings", "grateful", "count blessings"
  ],
  "spiritual-resilience": [
    // Spiritual crisis
    "faith crisis", "lost faith", "spiritual struggle", "questioning God",
    "why me", "unfair", "meaningless suffering", "abandoned by God",
    "crisis of faith", "spiritual emptiness", "disconnected from God",
    // Traditional spiritual
    "spiritual", "beliefs", "principles", "hope", "faith", "transcendence",
    "meaning", "purpose", "acceptance", "growth", "higher power"
  ],
  "flex-your-strengths": [
    // Low self-worth
    "weak", "not good at anything", "no talents", "failure", "incompetent",
    "can't do anything right", "worthless", "inadequate", "not enough",
    "useless", "stupid", "incapable", "hopeless at", "terrible at",
    // Traditional strengths
    "strengths", "character", "talents", "good at", "capable", "skilled",
    "confidence", "abilities", "competent", "resourceful", "VIA"
  ],
  "interpersonal-problem-solving": [
    // Conflict situations
    "conflict", "argument", "fight", "disagreement", "tension", "relationship problems",
    "communication breakdown", "misunderstanding", "can't talk to", "avoiding",
    "angry at", "frustrated with", "hurt by", "betrayed", "disappointed",
    // Traditional problem solving
    "interpersonal", "problem solving", "resolution", "compromise",
    "discussion", "negotiate", "work it out", "wind-up"
  ],
  "good-listening": [
    // Isolation/communication issues
    "not heard", "nobody listens", "alone", "isolated", "disconnected",
    "relationship issues", "communication problems", "misunderstood",
    "ignored", "dismissed", "not valued", "unimportant", "invisible",
    // Traditional listening
    "listening", "heard", "understood", "connected", "supported",
    "relationships", "communication", "empathy", "ABCDE", "celebrate"
  ]
};

// Enhanced situation mapping prioritizing anxiety-appropriate skills
const SITUATION_SKILL_MAP = {
  // Anxiety-focused - CORRECTED to match AI recommendations
  "anxiety": ["mindfulness", "reframe", "balance-your-thinking"],
  "high anxiety": ["mindfulness", "reframe", "balance-your-thinking"],
  "panic": ["mindfulness", "reframe", "balance-your-thinking"], 
  "worried": ["mindfulness", "balance-your-thinking", "reframe"],
  "nervous": ["mindfulness", "reframe", "flex-your-strengths"],
  "lose my job": ["balance-your-thinking", "reframe", "whats-most-important"],
  "going to lose": ["balance-your-thinking", "reframe", "mindfulness"],
  "job security": ["balance-your-thinking", "whats-most-important", "values-based-living"],
  
  // Stress-focused  
  "stress": ["mindfulness", "whats-most-important", "reframe"],
  "stressed": ["mindfulness", "whats-most-important", "reframe"],
  "overwhelmed": ["balance-your-thinking", "whats-most-important", "mindfulness"],
  "pressure": ["mindfulness", "values-based-living", "whats-most-important"],
  
  // Family/support concerns
  "support my family": ["whats-most-important", "values-based-living", "balance-your-thinking"],
  "provide for family": ["values-based-living", "whats-most-important", "balance-your-thinking"],
  "family": ["values-based-living", "whats-most-important", "good-listening"],
  
  // Depression-focused
  "sad": ["cultivate-gratitude", "values-based-living", "flex-your-strengths"],
  "depressed": ["cultivate-gratitude", "values-based-living", "spiritual-resilience"],
  "down": ["cultivate-gratitude", "flex-your-strengths", "mindfulness"],
  "hopeless": ["values-based-living", "spiritual-resilience", "cultivate-gratitude"],
  
  // Relationship-focused
  "conflict": ["interpersonal-problem-solving", "good-listening", "reframe"],
  "relationship": ["good-listening", "interpersonal-problem-solving", "flex-your-strengths"],
  "communication": ["good-listening", "interpersonal-problem-solving", "mindfulness"],
  
  // Direction/meaning-focused
  "lost": ["values-based-living", "spiritual-resilience", "whats-most-important"],
  "direction": ["values-based-living", "spiritual-resilience", "whats-most-important"],
  "purpose": ["values-based-living", "spiritual-resilience", "flex-your-strengths"],
  "meaningless": ["values-based-living", "spiritual-resilience", "cultivate-gratitude"],
  
  // General distress
  "burnout": ["values-based-living", "mindfulness", "spiritual-resilience"],
  "exhausted": ["mindfulness", "cultivate-gratitude", "values-based-living"],
  "struggling": ["flex-your-strengths", "mindfulness", "cultivate-gratitude"]
};

export interface SkillSuggestion {
  skillId: string;
  skill: MentalArmorSkill;
  confidence: number;
  rationale: string;
  curriculumQuote?: string;
}

export class EnhancedSkillSuggestions {
  /**
   * Get skill suggestions using curriculum-first approach
   */
  static getSuggestions(userInput: string, maxSuggestions = 3): SkillSuggestion[] {
  const input = userInput.toLowerCase();
  const suggestions: SkillSuggestion[] = [];

  // 1. Enhanced keyword matching with ANXIETY BOOST
  for (const [skillId, keywords] of Object.entries(SKILL_KEYWORD_MAP)) {
    const skill = MENTAL_ARMOR_SKILLS.find(s => s.id === skillId);
    if (!skill) continue;

    const matchedKeywords = keywords.filter(keyword => 
      input.includes(keyword.toLowerCase())
    );

    if (matchedKeywords.length > 0) {
      let confidence = Math.min(0.95, 0.4 + (matchedKeywords.length * 0.15));
      
      // BOOST for anxiety-related skills when anxiety keywords detected
      const hasAnxietyKeywords = ["anxiety", "anxious", "high anxiety", "panic", "worried", "nervous"].some(k => input.includes(k));
      if (hasAnxietyKeywords && ["mindfulness", "reframe", "balance-your-thinking"].includes(skillId)) {
        confidence += 0.2; // Significant boost
      }
      
      // BOOST for job anxiety
      const hasJobAnxiety = ["lose my job", "going to lose", "job security"].some(k => input.includes(k));
      if (hasJobAnxiety && ["balance-your-thinking", "reframe"].includes(skillId)) {
        confidence += 0.25; // Major boost
      }

      suggestions.push({
        skillId,
        skill,
        confidence,
        rationale: `Direct match: ${matchedKeywords.slice(0, 3).join(', ')}`,
        curriculumQuote: skill.goal
      });
    }
  }

  // 2. Situation-based matching with anxiety priority
  for (const [situation, skillIds] of Object.entries(SITUATION_SKILL_MAP)) {
    if (input.includes(situation)) {
      for (const skillId of skillIds) {
        const skill = MENTAL_ARMOR_SKILLS.find(s => s.id === skillId);
        if (!skill || suggestions.some(s => s.skillId === skillId)) continue;

        let confidence = 0.8;
        
        // Higher confidence for anxiety situations
        if (["anxiety", "high anxiety", "worried", "lose my job"].includes(situation)) {
          confidence = 0.9;
        }

        suggestions.push({
          skillId,
          skill,
          confidence,
          rationale: `Recommended for ${situation} situations`,
          curriculumQuote: skill.whenToUse
        });
      }
    }
  }

  // Sort by confidence and return top suggestions
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxSuggestions);
}

  /**
   * Generate curriculum-accurate response for a suggested skill
   */
  static generateSkillResponse(suggestion: SkillSuggestion, trainerStyle?: string): string {
    const { skill } = suggestion;
    
    let response = `**${skill.title}** might be helpful here. `;
    
    // Use exact curriculum language
    response += `${skill.goal}\n\n`;
    
    if (skill.whenToUse) {
      response += `**When to use:** ${skill.whenToUse}\n\n`;
    }

    // Add quick practice tip using curriculum steps
    if (skill.steps.length > 0) {
      response += `**Quick practice:** ${skill.steps[0]}\n\n`;
    }

    // Add trainer-specific guidance without changing curriculum content
    if (trainerStyle) {
      response += this.getTrainerGuidance(trainerStyle);
    }

    return response;
  }

  private static getTrainerGuidance(trainerStyle: string): string {
    switch (trainerStyle.toLowerCase()) {
      case 'rhonda':
        return "This skill works if you work it. What's your next move?";
      case 'scotty':
        return "Take this one step at a time, with patience and care.";
      case 'terry':
        return "This works in the real world when you practice it consistently.";
      case 'aj':
        return "This builds on strengths you already have. What do you notice you do well?";
      case 'chris':
        return "Growth often comes from practicing through challenging moments.";
      default:
        return "Would you like to explore this skill further?";
    }
  }

  /**
   * Validate that AI suggestions match curriculum
   */
  static validateAISuggestions(aiSuggestedIds: string[]): string[] {
    const validSkillIds = new Set(MENTAL_ARMOR_SKILLS.map(s => s.id));
    return aiSuggestedIds.filter(id => validSkillIds.has(id));
  }
}

// Export for use in other components
export { SKILL_KEYWORD_MAP, SITUATION_SKILL_MAP };