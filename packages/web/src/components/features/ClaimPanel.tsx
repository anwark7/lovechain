"use client";

import { useAccount, useReadContract } from "wagmi";
import { Button, Card, Alert, Stat } from "@/components/ui";
import { TxFeedback } from "./TxFeedback";
import { useClaimable, useLoveChain, useLoveChainWrite } from "@/hooks";
import type { Deal, PartnerRole } from "@/types/deal";
import { OUTCOME_LABEL } from "@/constants/contract";
import { formatEth } from "@/lib/format";

interface ClaimPanelProps {
  deal: Deal;
  role: PartnerRole;
  refetch: () => void;
}

/** Claim payout page (PRD §16.5): outcome, claimable amount, claim + withdraw. */
export function ClaimPanel({ deal, role, refetch }: ClaimPanelProps) {
  const { address, abi } = useLoveChain();
  const { address: account } = useAccount();
  const w = useLoveChainWrite(refetch);

  const { data: claimable } = useClaimable(deal.id, account);
  const { data: pending } = useReadContract({
    address,
    abi,
    functionName: "pendingWithdrawals",
    args: account ? [account] : undefined,
    query: { enabled: Boolean(account), refetchInterval: 6000 },
  });

  const isPartner = role === "A" || role === "B";
  const alreadyClaimed =
    (role === "A" && deal.partnerAClaimed) || (role === "B" && deal.partnerBClaimed);
  const claimableWei = (claimable as bigint | undefined) ?? 0n;
  const pendingWei = (pending as bigint | undefined) ?? 0n;
  const busy = w.isPending || w.isConfirming;

  return (
    <Card title="🏦 Claim payout" subtitle="Two steps: claim your share, then withdraw it">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Final outcome">{OUTCOME_LABEL[deal.outcome]}</Stat>
          <Stat label="Your claimable">{formatEth(claimableWei)}</Stat>
        </div>

        {!isPartner && (
          <Alert tone="info">Only the partners have a payout to claim on this contract.</Alert>
        )}

        {isPartner && (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium text-rose-50/80">Step 1 — Claim your share</p>
              {alreadyClaimed ? (
                <Alert tone="success">You&apos;ve claimed your share for this contract.</Alert>
              ) : (
                <Button
                  loading={busy}
                  disabled={claimableWei === 0n}
                  onClick={() => w.send("claimPayout", [deal.id])}
                >
                  Claim {formatEth(claimableWei)}
                </Button>
              )}
            </div>

            <div className="space-y-2 border-t border-white/5 pt-4">
              <p className="text-sm font-medium text-rose-50/80">
                Step 2 — Withdraw to your wallet
              </p>
              <p className="text-xs text-rose-50/40">
                Pull-payment balance across all your contracts:{" "}
                <span className="text-rose-300">{formatEth(pendingWei)}</span>
              </p>
              <Button
                variant="secondary"
                loading={busy}
                disabled={pendingWei === 0n}
                onClick={() => w.send("withdraw", [])}
              >
                Withdraw {formatEth(pendingWei)}
              </Button>
            </div>
          </>
        )}

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
