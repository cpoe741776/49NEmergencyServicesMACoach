// src/types/mfa.ts
export type MfaDomain = "emotional" | "social" | "family" | "spiritual";

export type MfaBand = "challenged" | "needs_improvement" | "thriving";

export type MfaScores = Partial<Record<MfaDomain, number>>; // allow incomplete until saved

export type MfaRecord = {
  scores: MfaScores;     // each 0–5
  updatedAt: string;     // ISO timestamp
  notes?: string;
};
