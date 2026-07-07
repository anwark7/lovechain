import Link from "next/link";
import { Button } from "@/components/ui";
import { DealsList } from "@/components/features/DealsList";

export const metadata = { title: "Deals · LoveChain" };

export default function DealsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Love Contracts</h1>
        <Link href="/create">
          <Button size="sm">+ New</Button>
        </Link>
      </div>
      <DealsList />
    </div>
  );
}
