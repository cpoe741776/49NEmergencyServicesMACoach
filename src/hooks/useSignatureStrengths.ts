import { useEffect, useState } from "react";
import { loadSignatureStrengths } from "@/utils/via";
import type { ViaStrength } from "@/types/via";

export function useSignatureStrengths(): { strengths: ViaStrength[]; updatedAt?: string } {
  const [strengths, setStrengths] = useState<ViaStrength[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined);

  useEffect(() => {
    const refresh = () => {
      const rec = loadSignatureStrengths();
      setStrengths(rec?.strengths ?? []);
      setUpdatedAt(rec?.updatedAt);
    };

    // Initial load + subscribe to updates
    refresh();
    window.addEventListener("viaSignatureUpdated", refresh);

    return () => window.removeEventListener("viaSignatureUpdated", refresh);
  }, []);

  return { strengths, updatedAt };
}
