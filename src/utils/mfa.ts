// src/utils/mfa.ts
import type { MfaDomain, MfaRecord, MfaBand, MfaScores } from "@/types/mfa";

export const MFA_DOMAIN_LABEL: Record<MfaDomain, string> = {
  emotional: "Emotional",
  social: "Social",
  family: "Family",
  spiritual: "Spiritual",
};

export const MFA_THRESHOLDS = {
  challengedMax: 2.7,       // 0–2.7 inclusive
  needsImprovementMax: 3.8, // >2.7–3.8 inclusive
} as const;

export function classifyMfa(score: number | undefined): MfaBand | undefined {
  if (score == null || Number.isNaN(score)) return undefined;
  if (score <= MFA_THRESHOLDS.challengedMax) return "challenged";
  if (score <= MFA_THRESHOLDS.needsImprovementMax) return "needs_improvement";
  return "thriving";
}

export function bandUiClasses(band?: MfaBand): {
  wrap: string; chip: string; label: string;
} {
  switch (band) {
    case "challenged":
      return {
        wrap: "border border-red-200 bg-red-50 text-red-800",
        chip: "px-2 py-0.5 rounded-full text-xs border border-red-200 bg-red-100 text-red-800",
        label: "Challenged",
      };
    case "needs_improvement":
      return {
        wrap: "border border-amber-200 bg-amber-50 text-amber-800",
        chip: "px-2 py-0.5 rounded-full text-xs border border-amber-200 bg-amber-100 text-amber-800",
        label: "Needs Improvement",
      };
    case "thriving":
      return {
        wrap: "border border-emerald-200 bg-emerald-50 text-emerald-800",
        chip: "px-2 py-0.5 rounded-full text-xs border border-emerald-200 bg-emerald-100 text-emerald-800",
        label: "Thriving",
      };
    default:
      return {
        wrap: "border border-gray-200 bg-white text-gray-800",
        chip: "px-2 py-0.5 rounded-full text-xs border border-gray-200 bg-gray-100 text-gray-700",
        label: "",
      };
  }
}

// ---- storage helpers (unchanged from earlier) ----
const STORAGE_KEY = "mfa.scores";
const DOMAINS: readonly MfaDomain[] = ["emotional", "social", "family", "spiritual"] as const;

export type MfaInput = { scores: MfaScores; notes?: string };

export function loadMfa(): MfaRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MfaRecord;
    if (!parsed || typeof parsed !== "object" || !parsed.scores) return null;
    for (const d of DOMAINS) {
      const v = parsed.scores[d];
      if (typeof v === "number") parsed.scores[d] = clamp(v, 0, 5);
      else delete parsed.scores[d];
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveMfa(next: MfaInput): void {
  const clamped: MfaScores = {};
  for (const d of DOMAINS) {
    const v = next.scores[d];
    if (typeof v === "number" && !Number.isNaN(v)) {
      clamped[d] = clamp(round1(v), 0, 5);
    }
  }
  const rec: MfaRecord = {
    scores: clamped,
    updatedAt: new Date().toISOString(),
    notes: next.notes?.trim() || undefined,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
}

export function clearMfa(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)); }
function round1(n: number) { return Math.round(n * 10) / 10; }
