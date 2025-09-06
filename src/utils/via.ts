// src/utils/via.ts
import type { ViaStrength, ViaSignatureRecord } from "@/types/via";

const STORAGE_KEY = "via.signatureStrengths";

export type ViaSignatureInput = {
  strengths: ViaStrength[];
  notes?: string;
};

export function getAllViaStrengths(): ViaStrength[] {
  return [
    "Appreciation of Beauty & Excellence",
    "Bravery",
    "Creativity",
    "Curiosity",
    "Fairness",
    "Forgiveness",
    "Gratitude",
    "Honesty",
    "Hope",
    "Humility",
    "Humor",
    "Judgment",
    "Kindness",
    "Leadership",
    "Love",
    "Love of Learning",
    "Perseverance",
    "Perspective",
    "Prudence",
    "Self-Regulation",
    "Social Intelligence",
    "Spirituality",
    "Teamwork",
    "Zest",
  ];
}

export function loadSignatureStrengths(): ViaSignatureRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ViaSignatureRecord;
    if (!Array.isArray(parsed.strengths)) return null;
    if (parsed.strengths.length > 5) parsed.strengths = parsed.strengths.slice(0, 5);
    return parsed;
  } catch {
    return null;
  }
}

// NOTE: accept input WITHOUT updatedAt; we add updatedAt here.
export function saveSignatureStrengths(next: ViaSignatureInput): void {
  const unique = Array.from(new Set(next.strengths))
    .slice(0, 5)
    .sort((a, b) => a.localeCompare(b)); // ✅ alphabetize before saving

  const rec: ViaSignatureRecord = {
    strengths: unique,
    updatedAt: new Date().toISOString(),
    notes: next.notes?.trim() || undefined,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
}

export function clearSignatureStrengths(): void {
  localStorage.removeItem(STORAGE_KEY);
}
