"use client";

import { useReadContract, useAccount } from "wagmi";
import { Button, Card, Countdown, AddressPill, Alert, Stat } from "@/components/ui";
import { TxFeedback } from "./TxFeedback";
import { useLoveChain, useLoveChainWrite } from "@/hooks";
import type { Deal, BreachClaim, PartnerRole } from "@/types/deal";
import { BREACH_THRESHOLD, WITNESS_COUNT } from "@/constants/contract";
import { formatEth, sameAddress } from "@/lib/format";

interface DisputePanelProps {
  deal: Deal;
  claim: BreachClaim;
  role: PartnerRole;
  refetch: () => void;
}

/** Dispute view: evidence, deadline, vote counts, witness voting (PRD §16.4). */
export function DisputePanel({ deal, claim, role, refetch }: DisputePanelProps) {
  const { address, abi } = useLoveChain();
  const { address: account } = useAccount();
  const w = useLoveChainWrite(refetch);

  const { data: alreadyVoted } = useReadContract({
    address,
    abi,
    functionName: "hasVoted",
    args: account ? [deal.id, account] : undefined,
    query: { enabled: Boolean(account), refetchInterval: 6000 },
  });

  const approve = Number(claim.approveVotes);
  const reject = Number(claim.rejectVotes);
  const isAccused = sameAddress(claim.accused, account);
  const busy = w.isPending || w.isConfirming;

  return (
    <Card title="⚠️ Breach Dispute" subtitle="Witnesses decide: 4 of 5 approvals uphold the claim">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Claimant">
            <AddressPill address={claim.claimant} you={sameAddress(claim.claimant, account)} />
          </Stat>
          <Stat label="Accused">
            <AddressPill address={claim.accused} you={isAccused} />
          </Stat>
          <Stat label="Challenge bond">{formatEth(claim.bondAmount)}</Stat>
        </div>

        <div>
          <div className="mb-1 text-xs uppercase tracking-wide text-rose-50/40">Evidence</div>
          <a
            href={claim.evidenceURI}
            target="_blank"
            rel="noreferrer"
            className="break-all text-sm text-rose-300 underline"
          >
            {claim.evidenceURI}
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-300">{approve}</div>
            <div className="text-xs text-emerald-200/70">Approve (need {BREACH_THRESHOLD})</div>
          </div>
          <div className="rounded-xl bg-red-500/10 p-3 text-center">
            <div className="text-2xl font-bold text-red-300">{reject}</div>
            <div className="text-xs text-red-200/70">Reject</div>
          </div>
        </div>

        <p className="text-sm text-rose-50/50">
          {claim.challenged ? "✅ Challenged by the accused." : "Not yet challenged."} · Voting{" "}
          <Countdown target={claim.votingEndsAt} elapsedLabel="closed" prefix="closes in" />
        </p>

        {/* Accused: challenge before the window closes */}
        {isAccused && !claim.challenged && (
          <Button loading={busy} onClick={() => w.send("challengeBreachClaim", [deal.id])}>
            Challenge this claim
          </Button>
        )}

        {/* Witness: vote once */}
        {role === "witness" && (
          <div className="border-t border-white/5 pt-4">
            {alreadyVoted ? (
              <Alert tone="info">You have already voted on this dispute.</Alert>
            ) : (
              <div className="flex gap-2">
                <Button
                  loading={busy}
                  onClick={() => w.send("voteDispute", [deal.id, true])}
                  className="flex-1"
                >
                  ✅ Approve claim
                </Button>
                <Button
                  variant="danger"
                  loading={busy}
                  onClick={() => w.send("voteDispute", [deal.id, false])}
                  className="flex-1"
                >
                  ❌ Reject claim
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Anyone: resolve by timeout once the window closes */}
        <div className="border-t border-white/5 pt-3">
          <p className="mb-2 text-xs text-rose-50/40">
            Once voting closes: unchallenged → upheld; challenged without {BREACH_THRESHOLD}/
            {WITNESS_COUNT} → rejected. Anyone can finalize.
          </p>
          <Button
            variant="ghost"
            size="sm"
            loading={busy}
            onClick={() => w.send("resolveBreachByTimeout", [deal.id])}
          >
            Resolve by timeout
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
