// src/hooks/useMfa.ts
import { useEffect, useState } from "react";
import { loadMfa } from "@/utils/mfa";
import type { MfaScores } from "@/types/mfa";

export function useMfa(): { scores: MfaScores; updatedAt?: string } {
  const [scores, setScores] = useState<MfaScores>({});
  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined);

  useEffect(() => {
    const refresh = () => {
      const rec = loadMfa();
      setScores(rec?.scores ?? {});
      setUpdatedAt(rec?.updatedAt);
    };
    refresh();
    window.addEventListener("mfaUpdated", refresh);
    return () => window.removeEventListener("mfaUpdated", refresh);
  }, []);

  return { scores, updatedAt };
}
