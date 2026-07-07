"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { Button, Card, Field, TextInput, TextArea, Alert } from "@/components/ui";
import { TxFeedback } from "./TxFeedback";
import { WeddingPanel } from "./WeddingPanel";
import { useLoveChainWrite } from "@/hooks";
import type { Deal, PartnerRole } from "@/types/deal";
import { ContractStatus } from "@/constants/contract";
import { formatEth, sameAddress } from "@/lib/format";

interface DealActionsProps {
  deal: Deal;
  role: PartnerRole;
  refetch: () => void;
}

const isPartner = (role: PartnerRole) => role === "A" || role === "B";

/** Context-sensitive partner actions, switched on (status, role). */
export function DealActions({ deal, role, refetch }: DealActionsProps) {
  const w = useLoveChainWrite(refetch);
  const [evidence, setEvidence] = useState("ipfs://mock-evidence");
  const [bond, setBond] = useState("0.01");
  const [proof, setProof] = useState("ipfs://mock-wedding-proof");

  const id = deal.id;
  const feedback = (
    <TxFeedback
      isPending={w.isPending}
      isConfirming={w.isConfirming}
      isSuccess={w.isSuccess}
      error={w.error}
      hash={w.hash}
    />
  );
  const busy = w.isPending || w.isConfirming;

  // ── PENDING_PARTNER ────────────────────────────────────────
  if (deal.status === ContractStatus.PENDING_PARTNER) {
    return (
      <Card title="Awaiting partner">
        <div className="space-y-3">
          {role === "B" && (
            <>
              <p className="text-sm text-rose-50/60">
                Accept this contract by matching partner A&apos;s deposit of{" "}
                <span className="text-rose-300">{formatEth(deal.depositA)}</span>.
              </p>
              <Button
                loading={busy}
                onClick={() => w.send("acceptContract", [id], deal.depositA)}
              >
                Accept & Deposit {formatEth(deal.depositA)}
              </Button>
            </>
          )}
          {role === "A" && (
            <>
              <p className="text-sm text-rose-50/60">
                Waiting for partner B to accept. You can cancel and get a full refund (no fee)
                until they do.
              </p>
              <Button variant="danger" loading={busy} onClick={() => w.send("cancelContract", [id])}>
                Cancel & Refund
              </Button>
            </>
          )}
          {!isPartner(role) && (
            <p className="text-sm text-rose-50/60">Waiting for partner B to accept.</p>
          )}
          {feedback}
        </div>
      </Card>
    );
  }

  // ── ACTIVE ─────────────────────────────────────────────────
  if (deal.status === ContractStatus.ACTIVE) {
    return (
      <Card title="Actions">
        {isPartner(role) ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" loading={busy} onClick={() => w.send("checkIn", [id])}>
                ✅ Check in
              </Button>
              <Button
                variant="secondary"
                loading={busy}
                onClick={() => w.send("requestPeacefulExit", [id])}
              >
                🕊️ Request peaceful exit
              </Button>
              <Button
                variant="secondary"
                loading={busy}
                onClick={() => w.send("claimByTimeout", [id])}
                title="Only works after the term has elapsed"
              >
                ⏳ Force expiry (if term elapsed)
              </Button>
            </div>

            <div className="border-t border-white/5 pt-4">
              <p className="mb-2 text-sm font-medium text-rose-50/80">💍 Request wedding unlock</p>
              <div className="space-y-2">
                <Field label="Proof URI / hash" hint="Off-chain proof; only the URI is stored.">
                  <TextInput value={proof} onChange={(e) => setProof(e.target.value)} />
                </Field>
                <Button
                  loading={busy}
                  onClick={() => w.send("requestWeddingUnlock", [id, proof])}
                  disabled={!proof.trim()}
                >
                  Request Wedding Unlock
                </Button>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4">
              <p className="mb-2 text-sm font-medium text-rose-50/80">⚠️ Raise a breach claim</p>
              <div className="space-y-2">
                <Field label="Evidence URI / hash">
                  <TextInput value={evidence} onChange={(e) => setEvidence(e.target.value)} />
                </Field>
                <Field label="Challenge bond (ETH)" hint="Posted with the claim; returned if upheld.">
                  <TextInput value={bond} onChange={(e) => setBond(e.target.value)} />
                </Field>
                <Button
                  variant="danger"
                  loading={busy}
                  disabled={!evidence.trim()}
                  onClick={() => {
                    try {
                      w.send("raiseBreachClaim", [id, evidence], parseEther(bond));
                    } catch {
                      /* invalid bond ignored; button stays enabled */
                    }
                  }}
                >
                  Raise Breach Claim
                </Button>
              </div>
            </div>
            {feedback}
          </div>
        ) : (
          <p className="text-sm text-rose-50/60">
            Only the partners can act on an active contract.
          </p>
        )}
      </Card>
    );
  }

  // ── WEDDING_REQUESTED ──────────────────────────────────────
  if (deal.status === ContractStatus.WEDDING_REQUESTED) {
    return <WeddingPanel deal={deal} role={role} refetch={refetch} />;
  }

  // ── BREAKUP_REQUESTED ──────────────────────────────────────
  if (deal.status === ContractStatus.BREAKUP_REQUESTED) {
    // The counterparty (not the requester) approves; the contract enforces this,
    // so only surface the button when the caller is NOT the requester.
    const myAddr = role === "A" ? deal.partnerA : role === "B" ? deal.partnerB : undefined;
    const isRequester = sameAddress(deal.breakupRequestedBy, myAddr);
    return (
      <Card title="Peaceful exit requested">
        <div className="space-y-3">
          <p className="text-sm text-rose-50/60">
            The other partner must approve to start the cooling period.
          </p>
          {isPartner(role) && !isRequester && (
            <Button loading={busy} onClick={() => w.send("approvePeacefulExit", [id])}>
              Approve peaceful exit
            </Button>
          )}
          {isRequester && (
            <p className="text-sm text-rose-50/50">
              You requested the exit — waiting for your partner to approve.
            </p>
          )}
          {!isPartner(role) && (
            <p className="text-sm text-rose-50/50">Waiting for the other partner.</p>
          )}
          {feedback}
        </div>
      </Card>
    );
  }

  // ── COOLING_PERIOD ─────────────────────────────────────────
  if (deal.status === ContractStatus.COOLING_PERIOD) {
    return (
      <Card title="Cooling period">
        <div className="space-y-3">
          <p className="text-sm text-rose-50/60">
            Once the cooling period elapses, anyone can finalize and deposits become claimable.
          </p>
          <Button loading={busy} onClick={() => w.send("finalizePeacefulExit", [id])}>
            Finalize peaceful exit
          </Button>
          {feedback}
        </div>
      </Card>
    );
  }

  // ── DISPUTED → handled on the dispute page ─────────────────
  if (deal.status === ContractStatus.DISPUTED) {
    return (
      <Alert tone="warn">
        This contract is in a dispute. Head to the{" "}
        <a href={`/deals/${id.toString()}/dispute`} className="underline">
          dispute page
        </a>{" "}
        to view evidence and vote.
      </Alert>
    );
  }

  // ── Terminal, claimable states → payout page ───────────────
  if (
    deal.status === ContractStatus.MARRIAGE_CONFIRMED ||
    deal.status === ContractStatus.RESOLVED ||
    deal.status === ContractStatus.EXPIRED
  ) {
    return (
      <Alert tone="success">
        This contract is resolved. Go to the{" "}
        <a href={`/deals/${id.toString()}/claim`} className="underline">
          claim page
        </a>{" "}
        to withdraw your payout.
      </Alert>
    );
  }

  // ── CANCELLED ──────────────────────────────────────────────
  return <Alert tone="info">This contract was cancelled. Partner A was refunded in full.</Alert>;
}
