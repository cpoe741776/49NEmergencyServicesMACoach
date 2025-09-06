import { MENTAL_ARMOR_SKILLS } from "@/data/skills";
import type { MentalArmorSkill } from "@/types/emergency";
import type { MfaDomain, MfaScores } from "@/types/mfa";
import { classifyMfa } from "@/utils/mfa";

export type MfaSuggestion = {
  skill: MentalArmorSkill;
  matchDomains: MfaDomain[];
  relevance: number;
};

const DOMAINS: readonly MfaDomain[] = ["emotional", "social", "family", "spiritual"] as const;

export function getMfaWeakDomains(scores: MfaScores): MfaDomain[] {
  return DOMAINS.filter((d) => {
    const v = scores[d];
    const band = classifyMfa(typeof v === "number" ? v : undefined);
    return band === "challenged" || band === "needs_improvement";
  });
}

export function suggestSkillsByMfa(scores: MfaScores): MfaSuggestion[] {
  const weak = new Set(getMfaWeakDomains(scores));
  if (weak.size === 0) return [];

  const suggestions: MfaSuggestion[] = MENTAL_ARMOR_SKILLS
    .map((skill) => {
      const matches = (skill.domains as MfaDomain[]).filter((d) => weak.has(d));
      return { skill, matchDomains: matches, relevance: matches.length };
    })
    .filter((s) => s.relevance > 0);

  suggestions.sort(
    (a, b) => b.relevance - a.relevance || a.skill.title.localeCompare(b.skill.title)
  );
  return suggestions;
}
