import { useEffect, useMemo, useState } from "react";
import type { MentalArmorSkill } from "@/types/emergency";
import { MENTAL_ARMOR_SKILLS } from "@/data/skills";
import { practiceKitUtils } from "@/utils/practiceKit";

import ViaSignature from "@/components/ViaSignature";
import { useSignatureStrengths } from "@/hooks/useSignatureStrengths";

import MfaEditor from "@/components/MfaEditor";
import { useMfa } from "@/hooks/useMfa";
import { classifyMfa, bandUiClasses, MFA_DOMAIN_LABEL } from "@/utils/mfa";

import { suggestSkillsByMfa, type MfaSuggestion } from "@/services/mfa-suggestions";
import type { MfaDomain } from "@/types/mfa";

export default function Profile() {
  const [kitIds, setKitIds] = useState<string[]>([]);
  const inKitSet = useMemo(() => new Set(kitIds), [kitIds]);

  // inline “added!” feedback for suggestions
  const [addedNow, setAddedNow] = useState<Record<string, boolean>>({});

  // VIA
  const { strengths: viaStrengths, updatedAt: viaUpdatedAt } = useSignatureStrengths();
  const [editingVia, setEditingVia] = useState(false);

  // MFA
  const { scores: mfaScores, updatedAt: mfaUpdatedAt } = useMfa();
  const [editingMfa, setEditingMfa] = useState(false);

  // Practice Kit init + refresh
  useEffect(() => {
    setKitIds(practiceKitUtils.getPracticeKitSkills());
    const onUpdate = () => setKitIds(practiceKitUtils.getPracticeKitSkills());
    window.addEventListener("practiceKitUpdated", onUpdate);
    return () => window.removeEventListener("practiceKitUpdated", onUpdate);
  }, []);

  const kitSkills: MentalArmorSkill[] = useMemo(
    () => MENTAL_ARMOR_SKILLS.filter((s) => kitIds.includes(s.id)),
    [kitIds]
  );

  // Suggestions based on MFA
  const suggestions: MfaSuggestion[] = useMemo(
    () => suggestSkillsByMfa(mfaScores),
    [mfaScores]
  );

  // --- Navigation helpers (globals, with safe fallback) ---
  const goToRepairKitPractice = () => {
    localStorage.setItem("repair-kit-tab", "practice"); // hint for RepairKit
    if (window.navigateToRepairKit) {
      window.navigateToRepairKit("practice");
    } else {
      window.dispatchEvent(new CustomEvent("navigate", { detail: { view: "repair-kit", tab: "practice" } }));
    }
  };
  const goToGoBagSkill = (skillId: string) => {
    if (window.navigateToGoBag) {
      window.navigateToGoBag(skillId);
    } else {
      window.dispatchEvent(new CustomEvent("navigate", { detail: { view: "go-bag", skillId } }));
    }
  };

  // --- Actions ---
  const startPractice = (skill: MentalArmorSkill) => {
    localStorage.setItem(
      "start-practice-skill",
      JSON.stringify({ id: skill.id, title: skill.title })
    );
    goToRepairKitPractice();
  };

  const viewDetails = (skillId: string) => {
    goToGoBagSkill(skillId);
  };

  const addToKit = (skillId: string) => {
    practiceKitUtils.addSkillToPracticeKit(skillId);
    // instant inline feedback
    setAddedNow((prev) => ({ ...prev, [skillId]: true }));
    setTimeout(() => {
      setAddedNow((prev) => {
        const next = { ...prev };
        delete next[skillId];
        return next;
      });
    }, 1600);
  };

  const removeFromKit = (id: string) => {
    practiceKitUtils.removeSkillFromPracticeKit(id);
  };

  const clearKit = () => {
    practiceKitUtils.clearPracticeKit();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Your Profile & Practice Kit</h1>
        <p className="text-gray-600 mt-1">
          Add Mental Armor™ skills to your kit, then practice them regularly to build resilient habits.
        </p>
      </header>

      {/* Practice Kit */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Practice Kit</h2>
            <p className="text-gray-600">
              {kitSkills.length === 0
                ? "You don’t have any skills in your Practice Kit yet."
                : `You have ${kitSkills.length} skill${kitSkills.length > 1 ? "s" : ""} ready to practice.`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setKitIds(practiceKitUtils.getPracticeKitSkills())}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={clearKit}
              disabled={kitSkills.length === 0}
              className="px-3 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300 disabled:opacity-50"
            >
              Clear Kit
            </button>
          </div>
        </div>

        {kitSkills.length === 0 ? (
          <div className="mt-6 text-center text-gray-600">
            <p>Add skills from the Go-Bag to see them here.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {kitSkills.map((skill) => (
              <article key={skill.id} className="border border-gray-200 rounded-lg p-4 flex flex-col">
                <h3 className="font-semibold text-gray-900 text-lg">{skill.title}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-3">{skill.goal}</p>

                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {skill.modules.map((m) => (
                      <span key={m} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {m}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {skill.domains.map((d) => (
                      <span key={d} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => startPractice(skill)}
                    className="col-span-2 px-3 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
                  >
                    Start Practice
                  </button>
                  <button
                    onClick={() => removeFromKit(skill.id)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Remove
                  </button>
                  <button
                    onClick={() => viewDetails(skill.id)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 text-center hover:bg-gray-50"
                  >
                    View Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* VIA Signature Strengths */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">VIA Signature Strengths</h2>
            <p className="text-gray-600">
              Save your Top 5 from the VIA Survey. These will auto-fill the “Flex Your Strengths” practice.
            </p>
          </div>
          <button
            onClick={() => setEditingVia((v) => !v)}
            className="px-3 py-2 rounded-lg bg-brand-primary text-white text-sm hover:opacity-90"
          >
            {editingVia ? "Close" : viaStrengths.length > 0 ? "Edit strengths" : "Add strengths"}
          </button>
        </div>

        <div className="mt-4">
          {!editingVia ? (
            viaStrengths.length === 0 ? (
              <p className="text-gray-600">No strengths saved yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {viaStrengths
                  .slice()
                  .sort((a, b) => a.localeCompare(b))
                  .map((s) => (
                    <span
                      key={s}
                      className="px-2 py-1 rounded-full text-xs border bg-emerald-50 text-emerald-700 border-emerald-200"
                    >
                      {s}
                    </span>
                  ))}
              </div>
            )
          ) : (
            <div className="mt-2">
              <ViaSignature onSaved={() => setEditingVia(false)} maxSelect={5} showNotes />
            </div>
          )}
        </div>

        {viaUpdatedAt && (
          <p className="text-xs text-gray-500 mt-3">
            Last updated: {new Date(viaUpdatedAt).toLocaleString()}
          </p>
        )}

        <p className="text-sm text-blue-700 mt-4">
          Don’t know your strengths yet?{" "}
          <a
            href="https://www.viacharacter.org/account/register"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-900"
          >
            Take the free VIA Survey here
          </a>{" "}
          (paid version optional).
        </p>
      </section>

      {/* Mental Fitness Assessment (MFA) */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Mental Fitness Assessment (MFA)</h2>
            <p className="text-gray-600">Enter your domain scores (0.0 – 5.0)</p>
          </div>
          <button
            onClick={() => setEditingMfa((v) => !v)}
            className="px-3 py-2 rounded-lg bg-brand-primary text-white text-sm hover:opacity-90"
          >
            {editingMfa ? "Close" : Object.keys(mfaScores).length ? "Edit scores" : "Add scores"}
          </button>
        </div>

        <div className="mt-4">
          {!editingMfa ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["emotional", "social", "family", "spiritual"] as const).map((d: MfaDomain) => {
                const v = mfaScores[d];
                const band = classifyMfa(typeof v === "number" ? v : undefined);
                const ui = bandUiClasses(band);
                return (
                  <div key={d} className={`rounded-md p-3 ${ui.wrap}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{MFA_DOMAIN_LABEL[d]}</div>
                      {band && <span className={ui.chip}>{ui.label}</span>}
                    </div>
                    <div className="mt-2 text-sm">
                      Score: <span className="font-semibold">{typeof v === "number" ? v.toFixed(1) : "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-2">
              <MfaEditor onSaved={() => setEditingMfa(false)} />
            </div>
          )}
        </div>

        {mfaUpdatedAt && (
          <p className="text-xs text-gray-500 mt-3">
            Last updated: {new Date(mfaUpdatedAt).toLocaleString()}
          </p>
        )}

        <p className="text-sm text-blue-700 mt-4">
          Don’t know your scores yet?{" "}
          <a
            href="https://mymentalfitnessassessment.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-900"
          >
            Take the Free MFA here
          </a>
          .
        </p>
      </section>

      {/* Suggested Skills Based on Your MFA */}
      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Suggested Skills Based on Your MFA</h2>
            <p className="text-gray-600">
              We recommend skills that target domains currently{" "}
              <span className="font-medium text-red-700">Challenged</span> or{" "}
              <span className="font-medium text-amber-700">Needs Improvement</span>.
            </p>
          </div>
        </div>

        <div className="mt-4">
          {suggestions.length === 0 ? (
            <p className="text-gray-600">Add or update your MFA scores above to see targeted suggestions.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {suggestions.map(({ skill, matchDomains }: MfaSuggestion) => {
                const isInKit = inKitSet.has(skill.id);
                const justAdded = !!addedNow[skill.id];

                return (
                  <article key={skill.id} className="border border-gray-200 rounded-lg p-4 flex flex-col">
                    <h3 className="font-semibold text-gray-900 text-lg">{skill.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-3">{skill.goal}</p>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {(skill.domains as MfaDomain[]).map((d) => {
                        const v = mfaScores[d];
                        const band = classifyMfa(typeof v === "number" ? v : undefined);
                        const active = matchDomains.includes(d);
                        const ui = active
                          ? bandUiClasses(band)
                          : { chip: "px-2 py-0.5 rounded-full text-xs border border-gray-200 bg-gray-100 text-gray-700" };

                        return (
                          <span
                            key={d}
                            className={ui.chip}
                            title={
                              active && typeof v === "number"
                                ? `${MFA_DOMAIN_LABEL[d]} • ${v.toFixed(1)}`
                                : MFA_DOMAIN_LABEL[d]
                            }
                          >
                            {MFA_DOMAIN_LABEL[d]}
                          </span>
                        );
                      })}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => startPractice(skill)}
                        className="col-span-2 px-3 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
                      >
                        Start Practice
                      </button>

                      <button
                        onClick={() => addToKit(skill.id)}
                        disabled={isInKit || justAdded}
                        className={`px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 ${
                          isInKit || justAdded
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
                            : "border-gray-300 text-gray-800"
                        }`}
                      >
                        {isInKit ? "In Kit ✓" : justAdded ? "Added ✓" : "Add to Kit"}
                      </button>

                      <button
                        onClick={() => viewDetails(skill.id)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 text-center hover:bg-gray-50"
                      >
                        View Details
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h2 className="font-semibold text-blue-900">Tips to Get the Most from Your Practice</h2>
        <ul className="list-disc ml-5 mt-2 text-sm text-blue-800 space-y-1">
          <li>Pick 1–2 skills and practice them for a week.</li>
          <li>Schedule short daily reps (2–5 minutes beats zero minutes).</li>
          <li>After practice, jot one sentence about what you noticed.</li>
        </ul>
      </section>
    </div>
  );
}
