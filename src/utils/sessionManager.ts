// src/utils/sessionManager.ts
import type { ChatMessage } from "@/types/emergency";
import type { Trainer } from "@/data/trainers";

interface SessionData {
  chatSessions: { [trainerId: string]: ChatMessage[] };
  practiceSessions: any[];
  selectedTrainer: string | null;
  timestamp: number;
  version: string;
}

interface ExportData {
  exportDate: string;
  trainerName: string;
  chatHistory: {
    timestamp: string;
    sender: string;
    message: string;
  }[];
  disclaimer: string;
}

class SessionManager {
  private static instance: SessionManager;
  private readonly STORAGE_KEY = 'mentalArmor-session';
  private readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly VERSION = '1.0';

  static getInstance(): SessionManager {
    if (!this.instance) {
      this.instance = new SessionManager();
    }
    return this.instance;
  }

  // Initialize with privacy notice
  init(): boolean {
    const hasConsent = this.checkPrivacyConsent();
    if (!hasConsent) {
      return false; // Don't initialize storage without consent
    }
    this.cleanExpiredSessions();
    return true;
  }

  // Privacy consent management
  private checkPrivacyConsent(): boolean {
    return localStorage.getItem('mentalArmor-privacy-consent') === 'true';
  }

  setPrivacyConsent(consent: boolean): void {
    if (consent) {
      localStorage.setItem('mentalArmor-privacy-consent', 'true');
      localStorage.setItem('mentalArmor-consent-date', new Date().toISOString());
    } else {
      this.clearAllData();
    }
  }

  // Session data management
  saveChatSession(trainerId: string, messages: ChatMessage[]): boolean {
    if (!this.checkPrivacyConsent()) return false;

    try {
      const existingData = this.getSessionData();
      const newData: SessionData = {
        ...existingData,
        chatSessions: {
          ...existingData.chatSessions,
          [trainerId]: messages
        },
        timestamp: Date.now(),
        version: this.VERSION
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newData));
      return true;
    } catch (error) {
      console.warn('Failed to save chat session:', error);
      return false;
    }
  }

  getChatSession(trainerId: string): ChatMessage[] {
    if (!this.checkPrivacyConsent()) return [];

    try {
      const data = this.getSessionData();
      return data.chatSessions[trainerId] || [];
    } catch (error) {
      console.warn('Failed to load chat session:', error);
      return [];
    }
  }

  private getSessionData(): SessionData {
    const defaultData: SessionData = {
      chatSessions: {},
      practiceSessions: [],
      selectedTrainer: null,
      timestamp: Date.now(),
      version: this.VERSION
    };

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return defaultData;

      const parsed = JSON.parse(stored);
      
      // Check if session is expired
      if (Date.now() - parsed.timestamp > this.SESSION_DURATION) {
        this.clearAllData();
        return defaultData;
      }

      return { ...defaultData, ...parsed };
    } catch (error) {
      console.warn('Failed to parse session data:', error);
      return defaultData;
    }
  }

  // Export functionality
  exportChatSession(trainerId: string, trainerName: string): ExportData | null {
    const messages = this.getChatSession(trainerId);
    if (messages.length === 0) return null;

    return {
      exportDate: new Date().toISOString(),
      trainerName,
      chatHistory: messages.map(msg => ({
        timestamp: msg.timestamp.toISOString(),
        sender: msg.type === 'user' ? 'You' : trainerName,
        message: msg.content
      })),
      disclaimer: "This chat export contains training content from Mental Armor™ by 49 North (TechWerks, LLC). This is not clinical advice. If you are in crisis, contact emergency services."
    };
  }

  // Download as JSON
  downloadChatAsJSON(trainerId: string, trainerName: string): void {
    const exportData = this.exportChatSession(trainerId, trainerName);
    if (!exportData) {
      alert('No chat history to export');
      return;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mental-armor-chat-${trainerName}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Print chat
  printChatSession(trainerId: string, trainerName: string): void {
    const exportData = this.exportChatSession(trainerId, trainerName);
    if (!exportData) {
      alert('No chat history to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print chat history');
      return;
    }

    const html = this.generatePrintHTML(exportData);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }

  private generatePrintHTML(data: ExportData): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mental Armor™ Chat Session - ${data.trainerName}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 20px; 
      line-height: 1.5; 
      color: #333; 
    }
    .header { 
      text-align: center; 
      margin-bottom: 30px; 
      border-bottom: 2px solid #003049; 
      padding-bottom: 15px; 
    }
    .logo { 
      color: #003049; 
      font-size: 24px; 
      font-weight: bold; 
      margin-bottom: 5px; 
    }
    .session-info { 
      background: #f8f9fa; 
      padding: 15px; 
      border-radius: 8px; 
      margin-bottom: 25px; 
    }
    .message { 
      margin-bottom: 20px; 
      padding: 12px; 
      border-radius: 8px; 
    }
    .user-message { 
      background: #e3f2fd; 
      border-left: 4px solid #1976d2; 
    }
    .assistant-message { 
      background: #f1f8e9; 
      border-left: 4px solid #388e3c; 
    }
    .timestamp { 
      font-size: 12px; 
      color: #666; 
      margin-bottom: 5px; 
    }
    .sender { 
      font-weight: bold; 
      margin-bottom: 5px; 
    }
    .content { 
      white-space: pre-wrap; 
    }
    .disclaimer { 
      margin-top: 30px; 
      padding: 15px; 
      background: #fff3cd; 
      border: 1px solid #ffeaa7; 
      border-radius: 8px; 
      font-size: 12px; 
    }
    @media print {
      body { margin: 15px; }
      .message { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Mental Armor™</div>
    <div>Chat Session Export</div>
  </div>
  
  <div class="session-info">
    <strong>Coach:</strong> ${data.trainerName}<br>
    <strong>Export Date:</strong> ${new Date(data.exportDate).toLocaleString()}<br>
    <strong>Total Messages:</strong> ${data.chatHistory.length}
  </div>

  ${data.chatHistory.map(msg => `
    <div class="message ${msg.sender === 'You' ? 'user-message' : 'assistant-message'}">
      <div class="timestamp">${new Date(msg.timestamp).toLocaleString()}</div>
      <div class="sender">${msg.sender}</div>
      <div class="content">${msg.message}</div>
    </div>
  `).join('')}

  <div class="disclaimer">
    <strong>Disclaimer:</strong> ${data.disclaimer}
  </div>
</body>
</html>`;
  }

  // Data management
  cleanExpiredSessions(): void {
    try {
      const data = this.getSessionData();
      // If data is expired, it will be automatically cleared by getSessionData()
    } catch (error) {
      console.warn('Failed to clean expired sessions:', error);
    }
  }

  clearAllData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem('mentalArmor-privacy-consent');
      localStorage.removeItem('mentalArmor-consent-date');
      console.log('All Mental Armor data cleared');
    } catch (error) {
      console.warn('Failed to clear data:', error);
    }
  }

  // Get storage size (for transparency)
  getStorageSize(): string {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return '0 KB';
      
      const bytes = new TextEncoder().encode(data).length;
      return bytes < 1024 ? `${bytes} bytes` : `${(bytes / 1024).toFixed(1)} KB`;
    } catch (error) {
      return 'Unknown';
    }
  }
}

export const sessionManager = SessionManager.getInstance();