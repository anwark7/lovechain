"use client";

import Link from "next/link";
import { Card, StatusBadge, AddressPill } from "@/components/ui";
import { useDeal } from "@/hooks";
import { formatEth, sameAddress } from "@/lib/format";
import { OUTCOME_LABEL, Outcome } from "@/constants/contract";

/** Compact summary of a single deal, linking to its detail page. */
export function DealCard({ id }: { id: bigint }) {
  const { deal, account, isLoading } = useDeal(id);

  if (isLoading || !deal) {
    return (
      <Card>
        <div className="h-16 animate-pulse rounded-lg bg-white/5" />
      </Card>
    );
  }

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
