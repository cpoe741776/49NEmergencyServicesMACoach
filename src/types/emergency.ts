// Core domains
export type MFADomain = 'emotional' | 'social' | 'family' | 'spiritual';

// Training modules
export type MentalArmorModule =
  | 'Foundation'
  | 'Values & Meaning'
  | 'Resilient Thinking'
  | 'Social Resilience';

// A single skill (now supports multiple modules)
export interface MentalArmorSkill {
  id: string;
  title: string;
  trainer: string;                 // e.g., "Rhonda"
  modules: MentalArmorModule[];    // NOTE: plural
  domains: MFADomain[];            // MFA measures it supports
  goal: string;
  whenToUse: string;
  benefits: string[];
  steps: string[];
  image?: string;                  // public path like /skills/xxx.jpg
}

// Enhanced types for RepairKit functionality
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isEmergencyAlert?: boolean;
  skillId?: string;                // Link to specific skill if relevant
}

export interface EmergencyResource {
  type: 'crisis' | 'internal' | 'chaplain' | 'peer' | 'psychology' | 'supervisor';
  name: string;
  phone: string;
  email?: string;
  available?: string;              // e.g., "24/7", "Mon-Fri 9-5"
  description?: string;
  isInternal?: boolean;            // Organization-specific resource
}

export interface PracticeSession {
  id: string;
  skillId: string;
  skillTitle: string;
  startTime: Date;
  endTime?: Date;
  notes?: string;
  completed: boolean;
  duration?: number;               // in minutes
  effectiveness?: number;          // 1-5 rating
}

export interface OrganizationConfig {
  id: string;
  name: string;
  emergencyResources: EmergencyResource[];
  features: {
    aiChatEnabled: boolean;
    practiceSessionsEnabled: boolean;
    emergencyDetectionEnabled: boolean;
    anonymousMode: boolean;
  };
  customization: {
    primaryColor?: string;
    logoUrl?: string;
    welcomeMessage?: string;
  };
}

export interface UserProgress {
  userId: string;
  equippedSkills: string[];        // Array of skill IDs
  completedSessions: PracticeSession[];
  totalPracticeTime: number;       // in minutes
  skillLevels: Record<string, number>; // skillId -> level (1-5)
  lastActive: Date;
  preferences: {
    reminderFrequency: 'daily' | 'weekly' | 'monthly' | 'none';
    preferredTrainers: string[];
    focusAreas: MFADomain[];
  };
}

// AI Chat related types
export interface AIResponse {
  content: string;
  confidence: number;              // 0-1
  suggestedSkills?: string[];      // Skill IDs to recommend
  requiresEscalation?: boolean;    // Emergency detected
  followUpQuestions?: string[];
}

export interface ChatContext {
  userId: string;
  sessionId: string;
  currentSkill?: string;
  recentMessages: ChatMessage[];
  userEmotionalState?: 'calm' | 'stressed' | 'crisis' | 'unknown';
  practiceMode: boolean;
}

// Safety and emergency detection
export interface EmergencyDetection {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  confidence: number;
  recommendedAction: 'continue' | 'provide_resources' | 'escalate' | 'emergency_protocol';
  detectedAt: Date;
}

// Demo mode configuration
export interface DemoConfig {
  enabled: boolean;
  restrictedFeatures: string[];    // Features disabled in demo
  maxChatMessages?: number;
  maxPracticeSessions?: number;
  showWatermark: boolean;
  demoMessage?: string;
}