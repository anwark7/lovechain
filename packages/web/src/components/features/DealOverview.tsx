"use client";

import { Card, StatusBadge, AddressPill, Stat, Countdown } from "@/components/ui";
import type { Deal, PartnerRole } from "@/types/deal";
import type { Address } from "viem";
import { formatEth, timeAgo } from "@/lib/format";
import { ContractStatus, OUTCOME_LABEL, Outcome } from "@/constants/contract";
import { useEffect, useState } from "react";

interface DealOverviewProps {
  deal: Deal;
  witnesses: Address[];
  rules: string[];
  role: PartnerRole;
}

/** Read-only summary: partners, deposits, status, timers, witnesses, rules. */
export function DealOverview({ deal, witnesses, rules, role }: DealOverviewProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const termEnd = deal.activatedAt + deal.duration;
  const isActiveish =
    deal.status === ContractStatus.ACTIVE ||
    deal.status === ContractStatus.WEDDING_REQUESTED ||
    deal.status === ContractStatus.BREAKUP_REQUESTED;

  return (
    <Card
      title={`Love Contract #${deal.id.toString()}`}
      subtitle={role === "witness" ? "You are a witness on this contract." : undefined}
      actions={<StatusBadge status={deal.status} />}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AddressPill label="A" address={deal.partnerA} you={role === "A"} />
        <span className="text-rose-50/30">↔</span>
        <AddressPill label="B" address={deal.partnerB} you={role === "B"} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Deposit A">{formatEth(deal.depositA)}</Stat>
        <Stat label="Deposit B">{formatEth(deal.depositB)}</Stat>
        <Stat label="Total locked">{formatEth(deal.depositA + deal.depositB)}</Stat>
        <Stat label="Outcome">{OUTCOME_LABEL[deal.outcome]}</Stat>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Term ends">
          {deal.activatedAt === 0n ? (
            "not active"
          ) : (
            <Countdown target={termEnd} elapsedLabel="expired" />
          )}
        </Stat>
        <Stat label="A checked in">{timeAgo(deal.lastCheckInA, now)}</Stat>
        <Stat label="B checked in">{timeAgo(deal.lastCheckInB, now)}</Stat>
        {deal.status === ContractStatus.COOLING_PERIOD && (
          <Stat label="Cooling ends">
            <Countdown target={deal.coolingEndsAt} elapsedLabel="ready" />
          </Stat>
        )}
      </div>

      {witnesses.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-xs uppercase tracking-wide text-rose-50/40">
            Witnesses ({witnesses.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {witnesses.map((w) => (
              <AddressPill key={w} address={w} you={role === "witness" && undefined} />
            ))}
          </div>
        </div>
      )}

      {rules.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-xs uppercase tracking-wide text-rose-50/40">Rules</div>
          <ul className="list-inside list-disc space-y-0.5 text-sm text-rose-50/70">
            {rules.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {isActiveish && deal.activatedAt > 0n && Number(termEnd) * 1000 < now && (
        <p className="mt-4 text-xs text-amber-300/80">
          ⏳ The term has elapsed — either partner can force expiry to recover deposits.
        </p>
      )}
    </Card>
  );
}
