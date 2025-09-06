// src/components/ViaSignature.tsx
import { useEffect, useMemo, useState } from "react";
import { getAllViaStrengths, loadSignatureStrengths, saveSignatureStrengths, clearSignatureStrengths } from "@/utils/via";
import type { ViaStrength } from "@/types/via";

type Props = {
  onSaved?: (strengths: ViaStrength[]) => void; // optional callback
  maxSelect?: number;                            // default 5
  showNotes?: boolean;                           // default true
  compact?: boolean;                             // optional visual tweak
};

export default function ViaSignature({ onSaved, maxSelect = 5, showNotes = true, compact }: Props) {
  const options = useMemo(() => getAllViaStrengths(), []);
  const existing = loadSignatureStrengths();

  const [selected, setSelected] = useState<ViaStrength[]>(existing?.strengths ?? []);
  const [notes, setNotes] = useState<string>(existing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const remaining = maxSelect - selected.length;

  useEffect(() => setError(null), [selected]);

  const toggle = (s: ViaStrength) => {
    if (selected.includes(s)) {
      setSelected(selected.filter(x => x !== s));
      return;
    }
    if (selected.length >= maxSelect) {
      setError(`You can only select up to ${maxSelect}. Deselect one to add another.`);
      return;
    }
    setSelected([...selected, s]);
  };

  // ...inside ViaSignature component
const save = () => {
  if (selected.length === 0) {
    setError("Pick at least one strength (up to 5).");
    return;
  }
  saveSignatureStrengths({ strengths: selected, notes });
  // 🔔 notify listeners (Profile) to refresh
  window.dispatchEvent(new Event("viaSignatureUpdated"));
  onSaved?.(selected);
};

const reset = () => {
  setSelected([]);
  setNotes("");
  clearSignatureStrengths();
  // 🔔 notify listeners (Profile) to refresh
  window.dispatchEvent(new Event("viaSignatureUpdated"));
};


  

  return (
    <div className={`w-full ${compact ? "max-w-2xl" : "max-w-3xl"} mx-auto`}>
      <div className="mb-4">
        <h2 className="text-xl font-semibold">VIA Signature Strengths (Top {maxSelect})</h2>
        <p className="text-sm text-gray-600">
          Select up to {maxSelect}. Remaining: <span className="font-medium">{remaining}</span>
        </p>
      </div>

      {error && <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-red-700 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
        {options.map((s) => {
          const checked = selected.includes(s);
          return (
            <label key={s} className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer ${checked ? "border-emerald-500 bg-emerald-50" : "border-gray-200"}`}>
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={checked}
                onChange={() => toggle(s)}
                aria-label={s}
              />
              <span className="text-sm">{s}</span>
            </label>
          );
        })}
      </div>

      {showNotes && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., From VIA results on Aug 10; these energize me most…"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={save} className="rounded-md bg-black text-white px-4 py-2 text-sm hover:opacity-90">Save</button>
        <button onClick={reset} className="rounded-md border px-4 py-2 text-sm">Clear</button>
      </div>
    </div>
  );
}
