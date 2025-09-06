import type { MentalArmorSkill } from "@/types/emergency";
import { useState, useEffect } from "react";
import { practiceKitUtils } from "@/utils/practiceKit";

type Props = {
  skill: MentalArmorSkill;
  fromChat?: boolean;
  onBack: () => void;
  onStartPractice?: (skill: MentalArmorSkill) => void;
};

const domainLabel = {
  emotional: "Emotional",
  social: "Social",
  family: "Family",
  spiritual: "Spiritual",
};

const getModuleColor = (module: string) => {
  switch (module) {
    case "Foundation":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Values & Meaning":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "Resilient Thinking":
      return "bg-green-100 text-green-800 border-green-200";
    case "Social Resilience":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function SkillDetail({ skill, fromChat = false, onBack, onStartPractice }: Props) {
  const [isInPracticeKit, setIsInPracticeKit] = useState(false);
  const [showAddedMessage, setShowAddedMessage] = useState(false);

  // Check if skill is in practice kit on mount and listen for updates
  useEffect(() => {
    setIsInPracticeKit(practiceKitUtils.isSkillInPracticeKit(skill.id));

    const handlePracticeKitUpdate = () => {
      setIsInPracticeKit(practiceKitUtils.isSkillInPracticeKit(skill.id));
    };

    window.addEventListener("practiceKitUpdated", handlePracticeKitUpdate);
    return () => {
      window.removeEventListener("practiceKitUpdated", handlePracticeKitUpdate);
    };
  }, [skill.id]);

  const handleAddToPracticeKit = () => {
    if (!isInPracticeKit) {
      practiceKitUtils.addSkillToPracticeKit(skill.id);
      setIsInPracticeKit(true);
      setShowAddedMessage(true);
      setTimeout(() => setShowAddedMessage(false), 3000);
    }
  };

  const handleStartPractice = () => {
    // Ensure it's in the Practice Kit
    if (!isInPracticeKit) {
      practiceKitUtils.addSkillToPracticeKit(skill.id);
      setIsInPracticeKit(true);
    }
    // Pass to parent if provided; otherwise hand off via localStorage
    if (onStartPractice) {
      onStartPractice(skill);
    } else {
      localStorage.setItem(
        "start-practice-skill",
        JSON.stringify({ id: skill.id, title: skill.title })
      );
      alert(
        `Practice session for "${skill.title}" is queued. Navigate to the Repair Kit to begin.`
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* AI Coach Recommendation Banner */}
      {fromChat && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <span className="text-lg">💬</span>
            <div>
              <p className="font-medium">Recommended by your AI Coach</p>
              <p className="text-sm text-blue-600">
                This skill was suggested based on your conversation in the Repair Kit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-brand-primary hover:opacity-80 font-medium transition-opacity"
        aria-label={fromChat ? "Back to Repair Kit Chat" : "Back to Go-Bag"}
      >
        <span>←</span>
        <span>{fromChat ? "Back to Chat" : "Back to Skills Go-Bag"}</span>
      </button>

      {/* Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* Image */}
            <div className="flex-shrink-0">
              {skill.image ? (
                <div className="w-48 h-48 bg-white rounded-xl shadow-md flex items-center justify-center overflow-hidden">
                  <img
                    src={skill.image}
                    alt={skill.title}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-white rounded-xl shadow-md flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <div className="text-6xl mb-4">🎯</div>
                    <span className="text-sm">Mental Armor Skill</span>
                  </div>
                </div>
              )}
            </div>

            {/* Header */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                {skill.title}
              </h1>

              {/* Trainer */}
              <div className="flex items-center gap-3 mb-6 justify-center lg:justify-start">
                <img
                  src={`/trainers/${skill.trainer.toLowerCase()}.jpg`}
                  alt={skill.trainer}
                  className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    Led by {skill.trainer}
                  </p>
                  <p className="text-sm text-gray-500">Mental Armor™ Trainer</p>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {skill.modules.map((m) => (
                    <span
                      key={m}
                      className={`px-4 py-2 rounded-full text-sm font-medium border ${getModuleColor(
                        m
                      )}`}
                    >
                      {m}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                  {skill.domains.map((d) => (
                    <span
                      key={`d-${d}`}
                      className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-sm"
                    >
                      {domainLabel[d as keyof typeof domainLabel] ?? d} Domain
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Goal */}
          <section className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
            <h2 className="text-xl font-bold text-blue-900 mb-3 flex items-center gap-2">
              <span>🎯</span>
              <span>Goal</span>
            </h2>
            <p className="text-blue-800 text-lg leading-relaxed">{skill.goal}</p>
          </section>

          {/* When to Use */}
          <section className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
            <h2 className="text-xl font-bold text-green-900 mb-3 flex items-center gap-2">
              <span>⏰</span>
              <span>When to Use</span>
            </h2>
            <p className="text-green-800 text-lg leading-relaxed">
              {skill.whenToUse}
            </p>
          </section>

          {/* Benefits */}
          <section className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
            <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
              <span>✨</span>
              <span>Scientific Benefits</span>
            </h2>
            <ul className="space-y-3">
              {skill.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 text-purple-800">
                  <span className="text-purple-600 mt-1 flex-shrink-0">•</span>
                  <span className="text-lg leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Steps */}
          <section className="bg-orange-50 rounded-lg p-6 border-l-4 border-orange-500">
            <h2 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
              <span>📋</span>
              <span>How to Practice (Step by Step)</span>
            </h2>
            <ol className="space-y-4">
              {skill.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-4 text-orange-800">
                  <span className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                    {i + 1}
                  </span>
                  <span className="text-lg leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 p-6 border-t">
          {showAddedMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <span>✓</span>
                <span className="text-sm font-medium">
                  Added to your Practice Kit!
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleAddToPracticeKit}
              disabled={isInPracticeKit}
              className={`flex-1 max-w-sm py-3 px-6 rounded-lg font-medium transition-opacity flex items-center justify-center gap-2 ${
                isInPracticeKit
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-brand-primary text-white hover:opacity-90"
              }`}
            >
              <span>{isInPracticeKit ? "✓" : "🎒"}</span>
              <span>
                {isInPracticeKit ? "In Practice Kit" : "Add to Practice Kit"}
              </span>
            </button>
            <button
              onClick={handleStartPractice}
              className="flex-1 max-w-sm bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <span>🏃</span>
              <span>Start Practice Session</span>
            </button>
          </div>

          <p className="text-center text-gray-600 text-sm mt-4">
            Ready to build your mental armor? Add skills to your kit and practice
            regularly for best results.
          </p>
        </div>
      </div>

      {/* Special Call-to-Action for Chat-Recommended Skills */}
      {fromChat && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Ready to Apply This Skill?</h3>
          <p className="text-green-800 text-sm mb-3">
            Your AI coach recommended this skill based on what you shared. Consider how you might use it in your current situation.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleStartPractice}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Start Practice Now
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50"
            >
              Continue Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}