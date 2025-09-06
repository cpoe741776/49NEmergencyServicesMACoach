// src/components/PracticeSession.tsx - Corrected version

import { useEffect, useMemo, useState } from "react";
import type { PracticeSessionData, SkillPractice, PracticeFormField } from "@/data/practices";
import { getPracticeBySkillId } from "@/data/practices";

type Props = {
  skillId: string;
  skillTitle: string;
  onComplete: (data: PracticeSessionData, durationMinutes: number) => void;
  onBack: () => void;
};

export default function PracticeSession({ skillId, skillTitle, onComplete, onBack }: Props) {
  const [practice, setPractice] = useState<SkillPractice | null>(null);
  const [formData, setFormData] = useState<PracticeSessionData>({});
  const [startTime] = useState<Date>(new Date());
  const [currentSection, setCurrentSection] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const data = getPracticeBySkillId(skillId);
    setPractice(data ?? null);
    if (data) {
      const init: PracticeSessionData = {};
      for (const section of data.sections) {
        for (const field of section.fields) {
          init[field.id] = field.type === 'multiselect' ? [] : "";
        }
      }
      setFormData(init);
      setCurrentSection(0);
      setShowSummary(false);
    }
  }, [skillId]);

  const current = useMemo(() => (!practice ? null : practice.sections[currentSection]), [practice, currentSection]);

  const handleInput = (fieldId: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Enhanced field rendering for new types
  const renderField = (field: PracticeFormField) => {
    const commonInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent";

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            rows={field.rows || 4}
            value={formData[field.id] as string || ""}
            onChange={(e) => handleInput(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={commonInputClasses}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            value={formData[field.id] as string || ""}
            onChange={(e) => handleInput(field.id, e.target.value)}
            className={commonInputClasses}
            required={field.required}
          >
            <option value="" disabled>{field.placeholder || "Select an option..."}</option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'scale': {
        const currentValue = formData[field.id] as string || field.min?.toString() || "1";
        return (
          <div className="space-y-3">
            <input
              type="range"
              min={field.min || 1}
              max={field.max || 10}
              step={field.step || 1}
              value={currentValue}
              onChange={(e) => handleInput(field.id, e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{field.min || 1}</span>
              <span className="font-medium bg-brand-primary text-white px-2 py-1 rounded">
                {currentValue}
              </span>
              <span>{field.max || 10}</span>
            </div>
          </div>
        );
      }

      case 'multiselect': {
        const selectedValues = Array.isArray(formData[field.id]) ? 
          formData[field.id] as string[] : [];
        return (
          <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {(field.options || []).map((option) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInput(field.id, [...selectedValues, option]);
                    } else {
                      handleInput(field.id, selectedValues.filter(item => item !== option));
                    }
                  }}
                  className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      }

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!(formData[field.id] as string)}
              onChange={(e) => handleInput(field.id, e.target.checked ? "true" : "")}
              className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
            />
            <span className="text-sm text-gray-700">{field.placeholder}</span>
          </label>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {(field.options || []).map((option) => (
              <label key={option} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={formData[field.id] === option}
                  onChange={(e) => handleInput(field.id, e.target.value)}
                  className="h-4 w-4 text-brand-primary border-gray-300 focus:ring-brand-primary"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={formData[field.id] as string || ""}
            onChange={(e) => handleInput(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={commonInputClasses}
            required={field.required}
          />
        );
    }
  };

  const next = () => {
    if (!practice) return;
    if (currentSection < practice.sections.length - 1) setCurrentSection((i) => i + 1);
    else setShowSummary(true);
  };

  const prev = () => { 
    if (currentSection > 0) setCurrentSection((i) => i - 1); 
    else onBack(); 
  };

  const complete = () => {
    const duration = Math.max(1, Math.round((Date.now() - startTime.getTime()) / 60000));
    onComplete(formData, duration);
  };

  // Enhanced summary function for Foundations of Resilience
  const foundationsSummary = useMemo(() => {
    if (!practice || skillId !== "foundations-resilience") return {};
    
    return {
      "Understanding & Definition": [
        formData["personal-definition"] && `Personal Definition: ${formData["personal-definition"]}`,
        formData["resilience-examples"] && `Examples Observed: ${formData["resilience-examples"]}`
      ].filter(Boolean),
      
      "Resilience Attributes": [
        formData["key-attributes"] && `Key Attributes: ${formData["key-attributes"]}`,
        formData["attribute-ranking"] && `Top 3 Priorities: ${formData["attribute-ranking"]}`
      ].filter(Boolean),
      
      "Historical Analysis": [
        formData["historical-figure"] && `Figure: ${formData["historical-figure"]}`,
        formData["figure-challenges"] && `Challenges: ${formData["figure-challenges"]}`,
        formData["figure-responses"] && `Responses: ${formData["figure-responses"]}`,
        formData["figure-growth"] && `Growth: ${formData["figure-growth"]}`
      ].filter(Boolean),
      
      "Personal Resilience": [
        formData["personal-challenge"] && `Challenge: ${formData["personal-challenge"]}`,
        formData["coping-strategies"] && `Strategies Used: ${formData["coping-strategies"]}`,
        formData["support-systems"] && `Support Systems: ${formData["support-systems"]}`,
        formData["lessons-learned"] && `Lessons: ${formData["lessons-learned"]}`
      ].filter(Boolean),
      
      "Current Assessment": [
        formData["current-strengths"] && `Strengths: ${formData["current-strengths"]}`,
        formData["growth-areas"] && `Growth Areas: ${formData["growth-areas"]}`,
        formData["resilience-rating"] && `Self-Rating: ${formData["resilience-rating"]}`
      ].filter(Boolean),
      
      "Action Plan": [
        formData["priority-skills"] && `Priority Skills: ${Array.isArray(formData["priority-skills"]) ? (formData["priority-skills"] as string[]).join(", ") : formData["priority-skills"]}`,
        formData["daily-practices"] && `Daily Practices: ${formData["daily-practices"]}`,
        formData["accountability"] && `Accountability: ${formData["accountability"]}`,
        formData["obstacle-planning"] && `Obstacle Planning: ${formData["obstacle-planning"]}`
      ].filter(Boolean)
    };
  }, [practice, formData, skillId]);

  if (!practice) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
        <p className="text-gray-700">Loading practice session for "{skillTitle}"...</p>
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900">{practice.title}</h2>
          <p className="text-gray-600 mt-2">Practice Session Summary</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Resilience Foundation Work</h3>
          {Object.keys(foundationsSummary).length === 0 ? (
            <p className="text-sm text-blue-800">No entries completed yet. Use "Back to Practice" to fill in your responses.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(foundationsSummary).map(([category, items]) => 
                (items as string[]).length > 0 && (
                  <div key={category} className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 text-center border-b pb-2">{category}</h4>
                    <div className="space-y-3">
                      {(items as string[]).map((item: string, i: number) => (
                        <div key={`${category}-${i}`} className="text-sm text-gray-700 p-3 bg-gray-50 rounded border-l-2 border-blue-300">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4">
          <button 
            onClick={() => setShowSummary(false)} 
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Back to Practice
          </button>
          <div className="space-x-3">
            <button 
              onClick={complete} 
              className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Complete Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="text-center border-b pb-6">
        <h2 className="text-2xl font-bold text-gray-900">{practice.title}</h2>
        {practice.description && <p className="text-gray-600 mt-2">{practice.description}</p>}
        
        {practice.totalTimeEstimate && (
          <p className="text-sm text-gray-500 mt-1">Estimated time: {practice.totalTimeEstimate}</p>
        )}
        
        {/* Progress Indicator */}
        <div className="mt-4 flex justify-center">
          <div className="flex space-x-2">
            {practice.sections.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-3 h-3 rounded-full transition-colors ${
                  idx === currentSection 
                    ? "bg-brand-primary ring-2 ring-brand-primary ring-opacity-30" 
                    : idx < currentSection 
                    ? "bg-green-500" 
                    : "bg-gray-300"
                }`} 
              />
            ))}
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mt-2">
          Step {currentSection + 1} of {practice.sections.length}
        </p>
      </div>

      {/* Current Section */}
      {current && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{current.title}</h3>
            {current.description && (
              <p className="text-gray-600 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-300">
                {current.description}
              </p>
            )}
            {current.timeEstimate && (
              <p className="text-xs text-gray-500 mt-2">Estimated time: {current.timeEstimate}</p>
            )}
          </div>

          <div className="space-y-6">
            {current.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {renderField(field)}

                {field.helpText && (
                  <p className="text-xs text-gray-600 mt-1">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <button 
          onClick={prev} 
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {currentSection === 0 ? "← Back to Skill" : "← Previous"}
        </button>
        
        <button 
          onClick={next} 
          className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          {practice.sections && currentSection === practice.sections.length - 1 ? "View Summary →" : "Next →"}
        </button>
      </div>
    </div>
  );
}