import { useMemo, useState } from "react";
import type { MentalArmorSkill, MentalArmorModule } from "@/types/emergency";
import { MENTAL_ARMOR_SKILLS } from "@/data/skills";

type Props = { onSelect?: (skill: MentalArmorSkill) => void };

const MODULES: MentalArmorModule[] = [
  "Foundation",
  "Values & Meaning",
  "Resilient Thinking",
  "Social Resilience",
];

const domainLabel: Record<string, string> = {
  emotional: "Emotional",
  social: "Social",
  family: "Family",
  spiritual: "Spiritual",
};

const moduleAccentByFirst = (modules: string[]) => {
  switch (modules[0]) {
    case "Foundation": return "border-t-4 border-blue-500";
    case "Values & Meaning": return "border-t-4 border-brand-primary";
    case "Resilient Thinking": return "border-t-4 border-green-500";
    case "Social Resilience": return "border-t-4 border-amber-500";
    default: return "border-t-4 border-gray-400";
  }
};

const getModuleColor = (module: string) => {
  switch (module) {
    case "Foundation": return "bg-blue-100 text-blue-800";
    case "Values & Meaning": return "bg-indigo-100 text-indigo-800";
    case "Resilient Thinking": return "bg-green-100 text-green-800";
    case "Social Resilience": return "bg-amber-100 text-amber-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export default function GoBag({ onSelect }: Props) {
  const [active, setActive] = useState<Set<MentalArmorModule>>(new Set());

  const toggle = (m: MentalArmorModule) => {
    setActive(prev => {
      const next = new Set(prev);
      if (next.has(m)) {
        next.delete(m);
      } else {
        next.add(m);
      }
      return next;
    });
  };

  const skills = useMemo(() => {
    if (active.size === 0) return MENTAL_ARMOR_SKILLS;
    return MENTAL_ARMOR_SKILLS.filter(s =>
      s.modules.some(m => active.has(m as MentalArmorModule))
    );
  }, [active]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Mental Armor™ Skills Go-Bag</h2>
        <p className="text-gray-600 mt-2 text-lg">
          Your essential resilience gear. Equip and carry wherever you serve.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-center gap-3 bg-gray-50 p-4 rounded-lg">
        <span className="text-sm font-medium text-gray-700 mr-2">Filter by Module:</span>
        <button
          onClick={() => setActive(new Set())}
          className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${
            active.size === 0
              ? "bg-brand-primary text-white border-brand-primary shadow-md"
              : "border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm"
          }`}
        >
          All Skills ({MENTAL_ARMOR_SKILLS.length})
        </button>
        {MODULES.map(m => (
          <button
            key={m}
            onClick={() => toggle(m)}
            className={`px-4 py-2 text-sm font-medium rounded-full border transition-all ${
              active.has(m)
                ? "bg-brand-primary text-white border-brand-primary shadow-md"
                : "border-gray-300 text-gray-700 hover:bg-white hover:shadow-sm"
            }`}
          >
            {m} ({MENTAL_ARMOR_SKILLS.filter(s => s.modules.includes(m)).length})
          </button>
        ))}
      </div>

      {/* Skills Grid */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {skills.map(skill => (
          <article
            key={skill.id}
            className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col h-full ${moduleAccentByFirst(
              skill.modules
            )}`}
          >
            {/* Skill Image */}
            <div className="aspect-video bg-gray-50 flex items-center justify-center overflow-hidden">
              {skill.image ? (
                <img
                  src={skill.image}
                  alt={skill.title}
                  className="w-full h-full object-contain p-4"
                  loading="lazy"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <span className="text-sm">Mental Armor Skill</span>
                </div>
              )}
            </div>

            <div className="p-6 flex flex-col flex-1">
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                {skill.title}
              </h3>

              {/* Trainer Info */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={`/trainers/${skill.trainer.toLowerCase()}.jpg`}
                  alt={skill.trainer}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="text-sm font-medium text-gray-600">
                  Led by {skill.trainer}
                </span>
              </div>

              {/* Goal Description - Fixed height with line clamp */}
              <div className="mb-4 flex-1">
                <p className="text-gray-700 text-sm leading-relaxed line-clamp-4 h-20 overflow-hidden">
                  {skill.goal}
                </p>
              </div>

              {/* Module Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {skill.modules.map(m => (
                  <span
                    key={`${skill.id}-m-${m}`}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getModuleColor(m)}`}
                  >
                    {m}
                  </span>
                ))}
              </div>

              {/* Domain Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {skill.domains.map(d => (
                  <span
                    key={`${skill.id}-${d}`}
                    className="px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs"
                  >
                    {domainLabel[d] ?? d}
                  </span>
                ))}
              </div>

              {/* Equip Button - Always at bottom */}
              <div className="mt-auto">
                <button
                  onClick={() => onSelect?.(skill)}
                  className="w-full bg-brand-primary text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <span>🎒</span>
                  <span>Equip this Skill</span>
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Results Summary */}
      <div className="text-center text-gray-600">
        <p className="text-sm">
          Showing {skills.length} of {MENTAL_ARMOR_SKILLS.length} Mental Armor™ skills
          {active.size > 0 && (
            <span> filtered by: {Array.from(active).join(", ")}</span>
          )}
        </p>
      </div>
    </div>
  );
}