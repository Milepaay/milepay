import { useState, useCallback } from "react";
import { getEscrow, releaseMilestone, disputeEscrow, refundEscrow } from "../lib/contract";
import type { Escrow } from "../types";

type Signer = { publicKey: () => string; sign: (msg: Uint8Array) => Uint8Array };

export function useEscrow(escrowId: number) {
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEscrow(escrowId);
      setEscrow(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load escrow");
    } finally {
      setLoading(false);
    }
  }, [escrowId]);

  const release = useCallback(
    async (signer: Signer, milestoneId: number) => {
      await releaseMilestone(signer, escrowId, milestoneId);
      await refresh();
    },
    [escrowId, refresh]
  );

  const dispute = useCallback(
    async (signer: Signer) => {
      await disputeEscrow(signer, escrowId);
      await refresh();
    },
    [escrowId, refresh]
  );

  const refund = useCallback(
    async (signer: Signer) => {
      await refundEscrow(signer, escrowId);
      await refresh();
    },
    [escrowId, refresh]
  );

  return { escrow, loading, error, refresh, release, dispute, refund };
}
