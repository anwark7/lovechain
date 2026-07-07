"use client";

import { useReadContract } from "wagmi";
import { Button, Card, Countdown, Alert } from "@/components/ui";
import { TxFeedback } from "./TxFeedback";
import { useLoveChain, useLoveChainWrite } from "@/hooks";
import type { Deal, PartnerRole } from "@/types/deal";
import type { BreachClaim } from "@/types/deal";
import { WEDDING_THRESHOLD } from "@/constants/contract";
import { useLoveChainWindows } from "@/hooks/useWindows";

interface WeddingPanelProps {
  deal: Deal;
  role: PartnerRole;
  refetch: () => void;
}

/** Wedding-request panel: mutual confirm + 3/5 witness approvals + timeout. */
export function WeddingPanel({ deal, role, refetch }: WeddingPanelProps) {
  const { address, abi } = useLoveChain();
  const w = useLoveChainWrite(refetch);
  const { weddingWindow } = useLoveChainWindows();

  // The wedding vote tally reuses the claim struct's approveVotes on-chain.
  const { data: tally } = useReadContract({
    address,
    abi,
    functionName: "getClaim",
    args: [deal.id],
    query: { refetchInterval: 6000 },
  });
  const approveVotes = tally ? Number((tally as BreachClaim).approveVotes) : 0;

  const bothConfirmed = deal.partnerAConfirmedWedding && deal.partnerBConfirmedWedding;
  const myConfirmed =
    (role === "A" && deal.partnerAConfirmedWedding) ||
    (role === "B" && deal.partnerBConfirmedWedding);
  const windowEnd = deal.weddingRequestedAt + BigInt(weddingWindow || 0);
  const busy = w.isPending || w.isConfirming;

  return (
    <Card
      title="💍 Wedding Unlock in progress"
      subtitle="Needs both partners confirmed + 3 of 5 witnesses"
    >
      <div className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-xs text-rose-50/50">
            <span>Witness approvals</span>
            <span>
              {approveVotes} / {WEDDING_THRESHOLD}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-rose-500 transition-all"
              style={{ width: `${Math.min(100, (approveVotes / WEDDING_THRESHOLD) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <span className={deal.partnerAConfirmedWedding ? "text-emerald-300" : "text-rose-50/40"}>
            {deal.partnerAConfirmedWedding ? "✅" : "○"} Partner A confirmed
          </span>
          <span className={deal.partnerBConfirmedWedding ? "text-emerald-300" : "text-rose-50/40"}>
            {deal.partnerBConfirmedWedding ? "✅" : "○"} Partner B confirmed
          </span>
        </div>

        <p className="text-xs text-rose-50/50">
          Window: <Countdown target={windowEnd} elapsedLabel="closed" />
        </p>

        {(role === "A" || role === "B") && !myConfirmed && (
          <Button loading={busy} onClick={() => w.send("confirmWedding", [deal.id])}>
            Confirm wedding
          </Button>
        )}
        {(role === "A" || role === "B") && myConfirmed && !bothConfirmed && (
          <Alert tone="info">You&apos;ve confirmed. Waiting for your partner.</Alert>
        )}

        {role === "witness" && (
          <Button loading={busy} onClick={() => w.send("voteWedding", [deal.id])}>
            Approve wedding (witness)
          </Button>
        )}

        {/* Anyone can expire the request once the window closes. */}
        <div className="border-t border-white/5 pt-3">
          <Button
            variant="ghost"
            size="sm"
            loading={busy}
            onClick={() => w.send("expireWeddingRequest", [deal.id])}
            title="Only works after the wedding window closes"
          >
            Expire request → back to Active
          </Button>
        </div>

        <TxFeedback
          isPending={w.isPending}
          isConfirming={w.isConfirming}
          isSuccess={w.isSuccess}
          error={w.error}
          hash={w.hash}
        />
      </div>
    </Card>
  );
}
