"use client";

import { useReadContracts } from "wagmi";
import { useLoveChain } from "./useLoveChain";

/** Read the contract's configured demo windows (seconds). */
export function useLoveChainWindows() {
  const { address, abi, ready } = useLoveChain();

  const { data } = useReadContracts({
    query: { enabled: ready, staleTime: 60_000 },
    contracts: ready
      ? [
          { address, abi, functionName: "coolingPeriod" },
          { address, abi, functionName: "challengePeriod" },
          { address, abi, functionName: "weddingWindow" },
        ]
      : [],
  });

  return {
    coolingPeriod: Number((data?.[0]?.result as bigint | undefined) ?? 0n),
    challengePeriod: Number((data?.[1]?.result as bigint | undefined) ?? 0n),
    weddingWindow: Number((data?.[2]?.result as bigint | undefined) ?? 0n),
  };
}
