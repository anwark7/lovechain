"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, StatusBadge, AddressPill } from "@/components/ui";
import { useDeal } from "@/hooks";
import { formatEth, sameAddress } from "@/lib/format";
import { OUTCOME_LABEL, Outcome } from "@/constants/contract";

/**
 * Compact summary of a single deal, linking to its detail page.
 *
 * When `mineOnly` is set, the card renders nothing unless the connected
 * account is involved in the deal (partner A/B or a witness). `onResolved`
 * reports back whether this card was shown, so the parent list can render a
 * correct "no deals" empty state instead of a run of blank rows.
 */
export function DealCard({
  id,
  mineOnly = false,
  onResolved,
}: {
  id: bigint;
  mineOnly?: boolean;
  onResolved?: (id: bigint, shown: boolean) => void;
}) {
  const { deal, account, role, isLoading } = useDeal(id);

  // "Mine" = I'm a partner or a witness (role !== "outsider").
  const isMine = role !== "outsider";
  const hidden = mineOnly && !isLoading && !!deal && !isMine;

  useEffect(() => {
    if (mineOnly && !isLoading && !!deal) {
      onResolved?.(id, isMine);
    }
  }, [mineOnly, isLoading, deal, isMine, id, onResolved]);

  if (isLoading || !deal) {
    return (
      <Card>
        <div className="h-16 animate-pulse rounded-lg bg-white/5" />
      </Card>
    );
  }

  if (hidden) return null;

  const youAre = sameAddress(deal.partnerA, account)
    ? "A"
    : sameAddress(deal.partnerB, account)
      ? "B"
      : null;

  return (
    <Link href={`/deals/${id.toString()}`} className="block">
      <Card className="transition-colors hover:border-rose-400/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-rose-50">#{id.toString()}</span>
            <StatusBadge status={deal.status} />
          </div>
          <span className="text-sm font-medium text-rose-300">
            {formatEth(deal.depositA + deal.depositB)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <AddressPill label="A" address={deal.partnerA} you={youAre === "A"} />
          <span className="text-rose-50/30">↔</span>
          <AddressPill label="B" address={deal.partnerB} you={youAre === "B"} />
          {deal.outcome !== Outcome.NONE && (
            <span className="ml-auto text-rose-50/50">{OUTCOME_LABEL[deal.outcome]}</span>
          )}
        </div>
      </Card>
    </Link>
  );
}
