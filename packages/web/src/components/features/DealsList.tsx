"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { Alert, Button, Card } from "@/components/ui";
import { DealCard } from "./DealCard";
import { useDealCount, useLoveChain } from "@/hooks";

/** Lists every deal (newest first). A demo-friendly global view. */
export function DealsList() {
  const { ready } = useLoveChain();
  const { isConnected } = useAccount();
  const { data: count, isLoading } = useDealCount();

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

  return (
    <div className="space-y-3">
      {ids.map((id) => (
        <DealCard key={id.toString()} id={id} />
      ))}
    </div>
  );
}
