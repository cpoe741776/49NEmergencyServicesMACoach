export interface PracticeFormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'scale' | 'multiselect';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
}

export interface PracticeSection {
  id: string;
  title: string;
  description?: string;
  fields: PracticeFormField[];
  timeEstimate?: string;
}

export interface SkillPractice {
  skillId: string;
  title: string;
  description: string;
  sections: PracticeSection[];
  printTitle: string;
  totalTimeEstimate?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  followUpSkills?: string[];
}

export interface PracticeSessionData {
  [fieldId: string]: string | string[];
}

export interface CompletedPracticeSession {
  id: string;
  skillId: string;
  skillTitle: string;
  practiceTitle: string;
  data: PracticeSessionData;
  completedAt: Date;
  duration?: number;
}

// src/types/via.ts
export type ViaStrength =
  | "Creativity" | "Curiosity" | "Judgment" | "Love of Learning" | "Perspective"
  | "Bravery" | "Perseverance" | "Honesty" | "Zest"
  | "Love" | "Kindness" | "Social Intelligence"
  | "Teamwork" | "Fairness" | "Leadership"
  | "Forgiveness" | "Humility" | "Prudence" | "Self-Regulation"
  | "Hope" | "Humor" | "Spirituality"
  | "Appreciation of Beauty & Excellence" | "Gratitude";

export type ViaSignatureRecord = {
  strengths: ViaStrength[];        // 0–5
  updatedAt: string;               // ISO timestamp
  notes?: string;                  // optional user note
};
