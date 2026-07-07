"use client";

import { useCallback, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useLoveChain } from "./useLoveChain";

type Args = readonly unknown[];

/**
 * Ergonomic wrapper around a LoveChain write: exposes a `send(fn, args, value)`
 * callback plus the pending/confirming/success/error status of the tx.
 */
export function useLoveChainWrite(onConfirmed?: () => void) {
  const { address, abi, ready } = useLoveChain();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: Boolean(hash) },
  });

  // Fire the caller's refresh callback once a tx confirms.
  useEffect(() => {
    if (isSuccess && onConfirmed) onConfirmed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const send = useCallback(
    (functionName: string, args: Args = [], value?: bigint) => {
      if (!ready || !address) return;
      // The generic wrapper intentionally accepts loose fn/args; wagmi's write
      // is strictly literal-typed, so we cast at this single boundary.
      writeContract({
        address,
        abi,
        functionName,
        args,
        value,
      } as Parameters<typeof writeContract>[0]);
    },
    [ready, address, abi, writeContract]
  );

  return {
    send,
    hash,
    isPending, // waiting for wallet signature
    isConfirming, // tx in mempool
    isSuccess,
    error: error ?? receiptError,
    reset,
    ready,
  } as const;
}
