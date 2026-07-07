"use client";

import { use } from "react";
import Link from "next/link";
import { DealPageShell } from "@/components/features/DealPageShell";
import { DealOverview } from "@/components/features/DealOverview";
import { DisputePanel } from "@/components/features/DisputePanel";
import { Alert } from "@/components/ui";
import { ContractStatus } from "@/constants/contract";

export default function DisputePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <DealPageShell idParam={id}>
      {({ deal, witnesses, rules, claim, role, refetch }) => (
        <>
          <DealOverview deal={deal} witnesses={witnesses} rules={rules} role={role} />
          {deal.status === ContractStatus.DISPUTED && claim ? (
            <DisputePanel deal={deal} claim={claim} role={role} refetch={refetch} />
          ) : (
            <Alert tone="info">
              This contract is not currently in a dispute.{" "}
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
