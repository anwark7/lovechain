import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { FeeTierTable } from "@/components/features/FeeTierTable";

export default function LandingPage() {
  return (
    <div className="space-y-10">
      <section className="pt-6 text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-rose-400">
          Proof of Commitment, Not Just Proof of Love
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          Lock your commitment <span className="text-rose-400">on-chain</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-rose-50/60">
          Two partners escrow testnet ETH as proof of commitment. Funds release only through
          agreed conditions — a wedding, a peaceful exit, a witness-adjudicated breach, or a
          time-based safety net. Nothing gets stuck; no one can walk off with the pot.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/create">
            <Button size="md">Create a Love Contract</Button>
          </Link>
          <Link href="/deals">
            <Button variant="secondary" size="md">
              View My Deals
            </Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="💍 Wedding Unlock" subtitle="The best outcome">
          <p className="text-sm text-rose-50/60">
            Both partners confirm + 3 of 5 witnesses approve → deposits return to each, a wedding
            badge is emitted, and the platform fee is the lowest tier (0.25%).
          </p>
        </Card>
        <Card title="🕊️ Peaceful Exit" subtitle="Mutual, no drama">
          <p className="text-sm text-rose-50/60">
            Either partner requests a breakup, the other approves, a cooling period passes with no
            dispute → deposits return 50/50 (fee 0.5%).
          </p>
        </Card>
        <Card title="⚠️ Breach Resolution" subtitle="Adjudicated by witnesses">
          <p className="text-sm text-rose-50/60">
            A claimant posts a bond + evidence. The accused may challenge. 4 of 5 witnesses decide.
            Valid → claimant is made whole; false → the bond compensates the accused (fee 1%).
          </p>
        </Card>
        <Card title="⏳ Expiry / Timeout" subtitle="Funds are never stuck">
          <p className="text-sm text-rose-50/60">
            If the other partner (and witnesses) go silent, either partner can force expiry once the
            term elapses and recover their deposit unilaterally (fee 0.5%).
          </p>
        </Card>
      </div>

      <Card title="Tiered platform fee" subtitle="The worse the outcome, the higher the fee">
        <FeeTierTable />
      </Card>

      <p className="text-center text-xs text-rose-50/40">
        ⚠️ Testnet learning project. Not financial or legal advice.
      </p>
    </div>
  );
}
