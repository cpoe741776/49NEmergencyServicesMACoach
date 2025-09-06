// src/utils/practiceKit.ts
const PRACTICE_KIT_STORAGE_KEY = 'mental-armor-practice-kit';

export const practiceKitUtils = {
  // Get all skill IDs from practice kit
  getPracticeKitSkills(): string[] {
    try {
      const stored = localStorage.getItem(PRACTICE_KIT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading practice kit:', error);
      return [];
    }
  },

  // Add a skill to practice kit
  addSkillToPracticeKit(skillId: string): void {
    const currentSkills = this.getPracticeKitSkills();
    if (!currentSkills.includes(skillId)) {
      const updatedSkills = [...currentSkills, skillId];
      localStorage.setItem(PRACTICE_KIT_STORAGE_KEY, JSON.stringify(updatedSkills));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('practiceKitUpdated', { 
        detail: { skillId, action: 'added' } 
      }));
    }
  },

  // Remove a skill from practice kit
  removeSkillFromPracticeKit(skillId: string): void {
    const currentSkills = this.getPracticeKitSkills();
    const updatedSkills = currentSkills.filter(id => id !== skillId);
    localStorage.setItem(PRACTICE_KIT_STORAGE_KEY, JSON.stringify(updatedSkills));
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('practiceKitUpdated', { 
      detail: { skillId, action: 'removed' } 
    }));
  },

  // Check if a skill is in practice kit
  isSkillInPracticeKit(skillId: string): boolean {
    const currentSkills = this.getPracticeKitSkills();
    return currentSkills.includes(skillId);
  },

  // Clear all skills from practice kit
  clearPracticeKit(): void {
    localStorage.removeItem(PRACTICE_KIT_STORAGE_KEY);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('practiceKitUpdated', { 
      detail: { action: 'cleared' } 
    }));
  },

  // Get practice kit count
  getPracticeKitCount(): number {
    return this.getPracticeKitSkills().length;
  },

  // Toggle skill in practice kit (add if not present, remove if present)
  toggleSkillInPracticeKit(skillId: string): boolean {
    if (this.isSkillInPracticeKit(skillId)) {
      this.removeSkillFromPracticeKit(skillId);
      return false; // Skill was removed
    } else {
      this.addSkillToPracticeKit(skillId);
      return true; // Skill was added
    }
  }
};