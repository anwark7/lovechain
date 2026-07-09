"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Alert, Button, Card } from "@/components/ui";
import { DealCard } from "./DealCard";
import { useDealCount, useLoveChain } from "@/hooks";

/** Lists the connected account's deals (as partner or witness), newest first. */
export function DealsList() {
  const { ready } = useLoveChain();
  const { isConnected } = useAccount();
  const { data: count, isLoading } = useDealCount();

  // Track which deal ids belong to the connected account so we can show a
  // correct empty state when none of the on-chain deals involve them.
  const [mineById, setMineById] = useState<Record<string, boolean>>({});
  const onResolved = useCallback((id: bigint, shown: boolean) => {
    setMineById((m) => {
      const key = id.toString();
      if (m[key] === shown) return m;
      return { ...m, [key]: shown };
    });
  }, []);

  if (!isConnected) {
    return <Alert tone="warn">Connect your wallet to view deals.</Alert>;
  }
  if (!ready) {
    return (
      <Alert tone="warn">
        No LoveChain deployment found for this network. Deploy the contract and set the address
        (see the README), or switch to a supported testnet.
      </Alert>
    );
  }
  if (isLoading) {
    return <Card>Loading deals…</Card>;
  }

  const total = count ? Number(count) : 0;
  if (total === 0) {
    return (
      <Card title="No deals yet">
        <p className="mb-4 text-sm text-rose-50/60">Be the first to lock in a commitment.</p>
        <Link href="/create">
          <Button>Create a Love Contract</Button>
        </Link>
      </Card>
    );
  }

  // Newest first.
  const ids = Array.from({ length: total }, (_, i) => BigInt(total - 1 - i));

  // Once every card has reported in and none are the user's, show empty state.
  const resolvedCount = Object.keys(mineById).length;
  const shownCount = Object.values(mineById).filter(Boolean).length;
  const allResolved = resolvedCount >= total;

  if (allResolved && shownCount === 0) {
    return (
      <Card title="No deals yet">
        <p className="mb-4 text-sm text-rose-50/60">
          You&apos;re not part of any Love Contracts yet.
        </p>
        <Link href="/create">
          <Button>Create a Love Contract</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {ids.map((id) => (
        <DealCard key={id.toString()} id={id} mineOnly onResolved={onResolved} />
      ))}
    </div>
  );
}
