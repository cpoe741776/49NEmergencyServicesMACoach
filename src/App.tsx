import { useEffect, useMemo, useState } from "react";
import type { MentalArmorSkill } from "@/types/emergency";
import { MENTAL_ARMOR_SKILLS } from "@/data/skills";
import GoBag from "@/components/GoBag";
import RepairKit from "@/components/RepairKit";
import Profile from "@/components/Profile";
import SkillDetail from "@/components/SkillDetail";

type View = "go-bag" | "detail" | "repair-kit" | "profile";

declare global {
  interface Window {
    navigateToGoBag?: (skillId: string) => void;
    navigateToRepairKit?: (tab?: string) => void; // ← add this
  }
}


export default function App() {
  const [currentView, setCurrentView] = useState<View>("go-bag");
  const [selectedSkill, setSelectedSkill] = useState<MentalArmorSkill | null>(null);
  const [skillFromChat, setSkillFromChat] = useState<string | null>(null);

  const appMode = (import.meta.env.VITE_APP_MODE as string) || "demo";

  // Title per view (optional nicety)
  const title = useMemo(() => {
    switch (currentView) {
      case "go-bag":
        return "Mental Armor™ Skills Go-Bag";
      case "detail":
        return selectedSkill ? selectedSkill.title : "Skill Detail";
      case "repair-kit":
        return "Maintenance & Repair Kit";
      case "profile":
        return "Your Profile & Practice Kit";
      default:
        return "Mental Armor™ Coach";
    }
  }, [currentView, selectedSkill]);

  useEffect(() => {
    document.title = `Mental Armor™ — ${title}`;
  }, [title]);

  // Handle navigation from chat to skills
  useEffect(() => {
    // Check for pending skill navigation from chat
    const pendingSkill = localStorage.getItem('pending-skill-navigation');
    if (pendingSkill && currentView === 'go-bag') {
      const skill = MENTAL_ARMOR_SKILLS.find(s => s.id === pendingSkill);
      if (skill) {
        setSelectedSkill(skill);
        setCurrentView('detail');
        setSkillFromChat(pendingSkill);
      }
      localStorage.removeItem('pending-skill-navigation');
    }

    // Check for direct skill selection from chat
    const selectedFromChat = localStorage.getItem('selected-skill-from-chat');
    if (selectedFromChat && currentView === 'go-bag') {
      try {
        const { id } = JSON.parse(selectedFromChat);
        const skill = MENTAL_ARMOR_SKILLS.find(s => s.id === id);
        if (skill) {
          setSelectedSkill(skill);
          setCurrentView('detail');
          setSkillFromChat(id);
        }
      } catch (error) {
        console.warn('Error parsing selected skill from chat:', error);
      }
      localStorage.removeItem('selected-skill-from-chat');
    }
  }, [currentView]);

// Global navigation helpers for Profile → Go-Bag/Repair Kit
useEffect(() => {
  window.navigateToGoBag = (skillId: string) => {
    const skill = MENTAL_ARMOR_SKILLS.find((s) => s.id === skillId);
    if (skill) {
      setSelectedSkill(skill);
      setCurrentView("go-bag");

      // mark as coming from chat/profile (optional)
      setSkillFromChat(skillId);

      // ensure the view switches to Go-Bag first, then open detail
      setTimeout(() => {
        setCurrentView("detail");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  };

  window.navigateToRepairKit = (tab?: string) => {
    if (tab) localStorage.setItem("repair-kit-tab", tab); // optional hint if RepairKit reads this
    setCurrentView("repair-kit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return () => {
    delete window.navigateToGoBag;
    delete window.navigateToRepairKit;
  };
}, []);


  // Simple top nav link
  const NavLink = ({
    id,
    label,
    icon,
  }: {
    id: View;
    label: string;
    icon: string;
  }) => (
    <button
      onClick={() => {
        setCurrentView(id);
        if (id !== "detail") {
          setSelectedSkill(null);
          setSkillFromChat(null);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
        ${
          currentView === id
            ? "bg-brand-primary text-white"
            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
        }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* App Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-brand-primary/10 flex items-center justify-center">
              <span className="text-brand-primary text-lg">🛡️</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Mental Armor™ Coach
              </h1>
              <p className="text-xs text-gray-500">
                Supporting app for the Mental Armor™ curriculum by 49 North (TechWerks)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <NavLink id="go-bag" label="Skills Go-Bag" icon="🎒" />
            <NavLink id="repair-kit" label="Repair Kit" icon="🛠️" />
            <NavLink id="profile" label="Profile" icon="👤" />
          </div>
        </div>
      </header>

      {/* Demo badge */}
      {appMode === "demo" && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 py-2 text-amber-800 text-sm">
            DEMO MODE — contact numbers may be masked; AI responses may use a light demo model.
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {currentView === "go-bag" && (
          <GoBag
            onSelect={(skill: MentalArmorSkill) => {
              setSelectedSkill(skill);
              setCurrentView("detail");
              setSkillFromChat(null); // Reset chat indicator for manual selections
            }}
          />
        )}

        {currentView === "detail" && selectedSkill && (
          <SkillDetail
            skill={selectedSkill}
            fromChat={skillFromChat === selectedSkill.id}
            onBack={() => {
              setCurrentView("go-bag");
              setSelectedSkill(null);
              setSkillFromChat(null);
            }}
            onStartPractice={(skill) => {
              // Handoff to Repair Kit
              localStorage.setItem(
                "start-practice-skill",
                JSON.stringify({ id: skill.id, title: skill.title })
              );
              setCurrentView("repair-kit");
            }}
          />
        )}

        {currentView === "repair-kit" && <RepairKit />}

        {currentView === "profile" && <Profile />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
  <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-gray-500">
    Mental Armor™ is a program of{" "}
    <a
      href="https://www.mymentalarmor.com"
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:text-gray-700"
    >
      49 North™
    </a>
    , a division of{" "}
    <a
      href="https://www.TechWerks-LLC.com"
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:text-gray-700"
    >
      TechWerks, LLC™
    </a>
    . This application supports Mental Armor™ skills learning and practice. It is not a
    substitute for clinical care. In an emergency call{" "}
    <a
      href="tel:911"
      aria-label="Call 911 (US & Canada)"
      className="text-red-700 font-medium underline hover:text-red-800"
    >
      911
    </a>{" "}
    (US &amp; Canada) or{" "}
    <a
      href="tel:999"
      aria-label="Call 999 (UK & Ireland)"
      className="text-red-700 font-medium underline hover:text-red-800"
    >
      999
    </a>{" "}
    (UK &amp; Ireland). <span className="block sm:inline">© 2025</span>
  </div>
</footer>


    </div>
  );
}