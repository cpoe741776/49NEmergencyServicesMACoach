// src/data/practices/index.ts
import type { SkillPractice } from "./types";
import { foundationsResiliencePractice } from "./foundations-resilience";


export const SKILL_PRACTICES: Record<string, SkillPractice> = {
  "foundations-resilience": foundationsResiliencePractice,
};

export const getPracticeBySkillId = (skillId: string): SkillPractice | undefined => {
  return SKILL_PRACTICES[skillId];
};

export const hasPracticeSession = (skillId: string): boolean => {
  return skillId in SKILL_PRACTICES;
};

export const getAvailablePracticeSkillIds = (): string[] => {
  return Object.keys(SKILL_PRACTICES);
};

// Types re-exports unchanged
export type {
  SkillPractice,
  PracticeSection,
  PracticeFormField,
  PracticeSessionData,
  CompletedPracticeSession
} from "./types";
