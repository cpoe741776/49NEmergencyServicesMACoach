// src/types/via.ts
export type ViaStrength =
  | "Appreciation of Beauty & Excellence"
  | "Bravery"
  | "Creativity"
  | "Curiosity"
  | "Fairness"
  | "Forgiveness"
  | "Gratitude"
  | "Honesty"
  | "Hope"
  | "Humility"
  | "Humor"
  | "Judgment"
  | "Kindness"
  | "Leadership"
  | "Love"
  | "Love of Learning"
  | "Perseverance"
  | "Perspective"
  | "Prudence"
  | "Self-Regulation"
  | "Social Intelligence"
  | "Spirituality"
  | "Teamwork"
  | "Zest";

export type ViaSignatureRecord = {
  strengths: ViaStrength[];
  updatedAt: string;
  notes?: string;
};
