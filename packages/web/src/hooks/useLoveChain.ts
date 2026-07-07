"use client";

import { useChainId } from "wagmi";
import { loveChainAbi, getLoveChainAddress } from "@/lib/contracts";

/**
 * Resolve the LoveChain contract handle (address + abi) for the connected chain.
 * `ready` is false until an address is known for the current chain.
 */
export function useLoveChain() {
  const chainId = useChainId();
  const address = getLoveChainAddress(chainId);

  return {
    chainId,
    address,
    abi: loveChainAbi,
    ready: Boolean(address),
  } as const;
}
