"use client";

import { useChainId } from "wagmi";
import { Alert } from "@/components/ui";
import { EXPLORER_TX } from "@/constants/chains";

interface TxFeedbackProps {
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  error?: Error | null;
  hash?: `0x${string}`;
  successMessage?: string;
}

/** Consistent inline status line for a write transaction. */
export function TxFeedback({
  isPending,
  isConfirming,
  isSuccess,
  error,
  hash,
  successMessage = "Confirmed!",
}: TxFeedbackProps) {
  const chainId = useChainId();
  const explorer = EXPLORER_TX[chainId];

  if (error) {
    // Surface the concise revert reason, not the whole stack.
    const msg = (error as { shortMessage?: string }).shortMessage ?? error.message;
    return <Alert tone="error">{msg}</Alert>;
  }
  if (isPending) return <Alert tone="info">Confirm in your wallet…</Alert>;
  if (isConfirming) return <Alert tone="info">Waiting for confirmation…</Alert>;
  if (isSuccess) {
    return (
      <Alert tone="success">
        {successMessage}
        {hash && explorer && (
          <>
            {" "}
            <a
              href={`${explorer}${hash}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              View tx ↗
            </a>
          </>
        )}
      </Alert>
    );
  }
  return null;
}
