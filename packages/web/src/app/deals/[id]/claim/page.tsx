"use client";

import { use } from "react";
import Link from "next/link";
import { DealPageShell } from "@/components/features/DealPageShell";
import { DealOverview } from "@/components/features/DealOverview";
import { ClaimPanel } from "@/components/features/ClaimPanel";
import { Alert } from "@/components/ui";
import { ContractStatus } from "@/constants/contract";

const CLAIMABLE = [
  ContractStatus.MARRIAGE_CONFIRMED,
  ContractStatus.RESOLVED,
  ContractStatus.EXPIRED,
];

export default function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <DealPageShell idParam={id}>
      {({ deal, witnesses, rules, role, refetch }) => (
        <>
          <DealOverview deal={deal} witnesses={witnesses} rules={rules} role={role} />
          {CLAIMABLE.includes(deal.status) ? (
            <ClaimPanel deal={deal} role={role} refetch={refetch} />
          ) : (
            <Alert tone="info">
              This contract isn&apos;t resolved yet — nothing to claim.{" "}
              <Link href={`/deals/${id}`} className="underline">
                Back to the deal
              </Link>
              .
            </Alert>
          )}
        </>
      )}
    </DealPageShell>
  );
}
