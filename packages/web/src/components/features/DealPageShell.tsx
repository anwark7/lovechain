"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { useAccount } from "wagmi";
import { Alert, Card } from "@/components/ui";
import { useDeal, useLoveChain } from "@/hooks";
import type { Deal, BreachClaim, PartnerRole } from "@/types/deal";
import type { Address } from "viem";

interface RenderArgs {
  deal: Deal;
  witnesses: Address[];
  claim?: BreachClaim;
  rules: string[];
  role: PartnerRole;
  account?: Address;
  refetch: () => void;
}

/**
 * Shared loader for the deal detail / dispute / claim pages: parses the id,
 * handles wallet/network/loading/not-found, then renders children with the deal.
 */
export function DealPageShell({
  idParam,
  children,
}: {
  idParam: string;
  children: (args: RenderArgs) => ReactNode;
}) {
  const { ready } = useLoveChain();
  const { isConnected } = useAccount();

  let id: bigint | undefined;
  try {
    id = BigInt(idParam);
  } catch {
    id = undefined;
  }

  const { deal, witnesses, claim, rules, role, account, isLoading, isError, refetch } =
    useDeal(id);

  if (id === undefined) {
    return <Alert tone="error">Invalid deal id.</Alert>;
  }
  if (!isConnected) {
    return <Alert tone="warn">Connect your wallet to view this deal.</Alert>;
  }
  if (!ready) {
    return (
      <Alert tone="warn">
        No LoveChain deployment found for this network. See the README to deploy and set the
        address, or switch networks.
      </Alert>
    );
  }
  if (isLoading) {
    return <Card>Loading deal #{idParam}…</Card>;
  }
  if (isError || !deal || deal.partnerA === "0x0000000000000000000000000000000000000000") {
    return (
      <div className="space-y-3">
        <Alert tone="error">Deal #{idParam} not found.</Alert>
        <Link href="/deals" className="text-sm text-rose-300 underline">
          ← Back to deals
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/deals" className="text-sm text-rose-50/50 hover:text-rose-50">
        ← All deals
      </Link>
      {children({ deal, witnesses, claim, rules, role, account, refetch })}
    </div>
  );
}
