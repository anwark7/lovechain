import type { Address } from "viem";
import { loveChainAbi } from "./loveChainAbi";
import { loveChainAddresses } from "./addresses";
import { CHAIN_KEY_BY_ID, type ChainKey } from "@/constants/chains";

export { loveChainAbi };
export type { ChainKey };

/**
 * Resolve the deployed LoveChain address for a chain id. Env overrides take
 * precedence over the generated addresses.ts (handy before the first deploy is
 * committed). Returns undefined if no address is known for the chain.
 */
export function getLoveChainAddress(chainId?: number): Address | undefined {
  if (!chainId) return undefined;

  const envAddr =
    chainId === 11155111
      ? process.env.NEXT_PUBLIC_LOVECHAIN_ADDRESS_SEPOLIA
      : chainId === 84532
        ? process.env.NEXT_PUBLIC_LOVECHAIN_ADDRESS_BASE_SEPOLIA
        : chainId === 11155420
          ? process.env.NEXT_PUBLIC_LOVECHAIN_ADDRESS_OP_SEPOLIA
          : undefined;
  if (envAddr && envAddr.startsWith("0x")) return envAddr as Address;

  const key = CHAIN_KEY_BY_ID[chainId] as ChainKey | undefined;
  const generated = key ? (loveChainAddresses as Record<string, string>)[key] : undefined;
  return generated && generated.startsWith("0x") ? (generated as Address) : undefined;
}
