// src/components/MfaEditor.tsx
import { useEffect, useState } from "react";
import { saveMfa, clearMfa, loadMfa, classifyMfa, bandUiClasses, MFA_DOMAIN_LABEL } from "@/utils/mfa";
import type { MfaDomain } from "@/types/mfa";

type Props = {
  onSaved?: () => void;
  showNotes?: boolean;
};

const DOMAINS: MfaDomain[] = ["emotional", "social", "family", "spiritual"];

export default function MfaEditor({ onSaved, showNotes = true }: Props) {
  const existing = loadMfa();

  const [values, setValues] = useState<Record<MfaDomain, string>>({
    emotional: existing?.scores.emotional?.toString() ?? "",
    social: existing?.scores.social?.toString() ?? "",
    family: existing?.scores.family?.toString() ?? "",
    spiritual: existing?.scores.spiritual?.toString() ?? "",
  });

  const [notes, setNotes] = useState<string>(existing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setError(null), [values]);

  const onChange = (d: MfaDomain, v: string) => {
    // allow empty while typing; validate on save
    setValues((prev) => ({ ...prev, [d]: v }));
  };

  const parseOrUndef = (v: string) => {
    const n = Number(v);
    return v === "" || Number.isNaN(n) ? undefined : n;
  };

  const handleSave = () => {
    // basic validation: if present, must be 0–5
    for (const d of DOMAINS) {
      const n = parseOrUndef(values[d]);
      if (n != null && (n < 0 || n > 5)) {
        setError(`${MFA_DOMAIN_LABEL[d]} must be between 0 and 5.`);
        return;
      }
    }
    const scores = {
      emotional: parseOrUndef(values.emotional),
      social: parseOrUndef(values.social),
      family: parseOrUndef(values.family),
      spiritual: parseOrUndef(values.spiritual),
    };
    saveMfa({ scores, notes });
    window.dispatchEvent(new Event("mfaUpdated"));
    onSaved?.();
  };

  const handleClear = () => {
    clearMfa();
    window.dispatchEvent(new Event("mfaUpdated"));
    onSaved?.();
  };

  return (
    <div className="w-full max-w-3xl">
      {error && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DOMAINS.map((d) => {
          const n = parseOrUndef(values[d]);
          const band = classifyMfa(n);
          const ui = bandUiClasses(band);
          return (
            <div key={d} className={`rounded-md p-3 ${ui.wrap}`}>
              <div className="flex items-center justify-between">
                <label className="font-medium">{MFA_DOMAIN_LABEL[d]}</label>
                {band && <span className={ui.chip}>{ui.label}</span>}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  inputMode="decimal"
                  value={values[d]}
                  onChange={(e) => onChange(d, e.target.value)}
                  className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm bg-white"
                  placeholder="0–5"
                />
                <span className="text-xs text-gray-600">0–5 (decimals OK)</span>
              </div>
            </div>
          );
        })}
      </div>

      {showNotes && (
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Context, date you took the MFA, etc."
          />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={handleSave} className="rounded-md bg-black text-white px-4 py-2 text-sm hover:opacity-90">
          Save
        </button>
        <button onClick={handleClear} className="rounded-md border px-4 py-2 text-sm">
          Clear
        </button>
      </div>
    </div>
  );
}
