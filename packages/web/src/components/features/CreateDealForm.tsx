"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isAddress, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Button, Card, Field, TextInput, TextArea, Alert } from "@/components/ui";
import { TxFeedback } from "./TxFeedback";
import { useLoveChainWrite } from "@/hooks";
import { WITNESS_COUNT } from "@/constants/contract";
import { sameAddress } from "@/lib/format";

const DURATION_OPTIONS = [
  { label: "5 minutes (demo)", seconds: 5 * 60 },
  { label: "1 hour", seconds: 60 * 60 },
  { label: "7 days", seconds: 7 * 86400 },
  { label: "30 days", seconds: 30 * 86400 },
];

/** The Create Love Contract form (PRD §16.2). */
export function CreateDealForm() {
  const router = useRouter();
  const { address: account, isConnected } = useAccount();

  const [partner, setPartner] = useState("");
  const [deposit, setDeposit] = useState("0.01");
  const [duration, setDuration] = useState(DURATION_OPTIONS[0].seconds);
  const [witnesses, setWitnesses] = useState<string[]>(Array(WITNESS_COUNT).fill(""));
  const [rules, setRules] = useState("Weekly check-in\nNo ghosting for more than 7 days");
  const [formError, setFormError] = useState<string>();

  const { send, isPending, isConfirming, isSuccess, error, hash } = useLoveChainWrite(() => {
    // On confirmation, bounce to the deals list to view the new contract.
    setTimeout(() => router.push("/deals"), 1200);
  });

  const setWitness = (i: number, v: string) => {
    setWitnesses((w) => w.map((x, idx) => (idx === i ? v : x)));
  };

  function validate(): string | undefined {
    if (!isAddress(partner)) return "Partner must be a valid address.";
    if (sameAddress(partner, account)) return "Partner cannot be yourself.";
    let depWei: bigint;
    try {
      depWei = parseEther(deposit);
    } catch {
      return "Deposit is not a valid ETH amount.";
    }
    if (depWei <= 0n) return "Deposit must be greater than zero.";
    // DEMO: at least 1 witness required; the rest are optional (contract accepts 1–5).
    const filled = witnesses.map((w) => w.trim()).filter((w) => w.length > 0);
    if (filled.length < 1) return "At least 1 witness is required.";
    const seen = new Set<string>();
    for (const w of filled) {
      if (!isAddress(w)) return "Each provided witness must be a valid address.";
      if (sameAddress(w, account) || sameAddress(w, partner))
        return "A witness cannot be a partner.";
      const key = w.toLowerCase();
      if (seen.has(key)) return "Witness addresses must be distinct.";
      seen.add(key);
    }
    return undefined;
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    setFormError(err);
    if (err) return;

    const ruleList = rules
      .split("\n")
      .map((r) => r.trim())
      .filter(Boolean);

    // DEMO: send only the filled witness fields (1–5), not the empty placeholders.
    const filledWitnesses = witnesses
      .map((w) => w.trim())
      .filter((w) => w.length > 0) as `0x${string}`[];

    send(
      "createLoveContract",
      [partner as `0x${string}`, BigInt(duration), filledWitnesses, ruleList],
      parseEther(deposit)
    );
  }

  if (!isConnected) {
    return <Alert tone="warn">Connect your wallet to create a Love Contract.</Alert>;
  }

  return (
    <form onSubmit={onSubmit}>
      <Card
        title="Create a Love Contract"
        subtitle="You deposit now; your partner matches the same amount to activate it."
      >
        <div className="space-y-4">
          <Field label="Partner wallet address" hint="The other partner (User B).">
            <TextInput
              placeholder="0x…"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your deposit (ETH)" hint="Partner B must match this exactly.">
              <TextInput
                inputMode="decimal"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
              />
            </Field>
            <Field label="Relationship term">
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-ink-800/60 px-3 py-2.5 text-sm text-rose-50 outline-none focus:border-rose-400/50"
              >
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.seconds} value={o.seconds} className="bg-ink-800">
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-rose-50/80">
              Witnesses (1–{WITNESS_COUNT})
            </span>
            <p className="mb-2 text-xs text-rose-50/40">
              At least 1 required; up to {WITNESS_COUNT}. Distinct addresses, not the partners.
            </p>
            <div className="space-y-2">
              {witnesses.map((w, i) => (
                <TextInput
                  key={i}
                  placeholder={`Witness ${i + 1} — 0x…`}
                  value={w}
                  onChange={(e) => setWitness(i, e.target.value)}
                />
              ))}
            </div>
          </div>

          <Field
            label="Relationship rules"
            hint="Free text, one per line. Declarative — witnesses judge these; only check-in is enforced on-chain."
          >
            <TextArea rows={3} value={rules} onChange={(e) => setRules(e.target.value)} />
          </Field>

          {formError && <Alert tone="error">{formError}</Alert>}

          <TxFeedback
            isPending={isPending}
            isConfirming={isConfirming}
            isSuccess={isSuccess}
            error={error}
            hash={hash}
            successMessage="Contract created! Redirecting to your deals…"
          />

          <Button type="submit" loading={isPending || isConfirming} className="w-full">
            Create & Deposit
          </Button>
        </div>
      </Card>
    </form>
  );
}
