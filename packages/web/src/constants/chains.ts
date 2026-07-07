import { sepolia, baseSepolia } from "wagmi/chains";

// Canonical address-book keys (kept independent of the auto-generated
// addresses.ts, whose union is empty until the first deploy).
export type ChainKey = "sepolia" | "baseSepolia" | "localhost";

// Maps a wagmi chain id to our address-book key.
export const CHAIN_KEY_BY_ID: Record<number, ChainKey> = {
  [sepolia.id]: "sepolia",
  [baseSepolia.id]: "baseSepolia",
  31337: "localhost",
};

export const SUPPORTED_CHAINS = [sepolia, baseSepolia] as const;

export const DEFAULT_CHAIN =
  (process.env.NEXT_PUBLIC_DEFAULT_CHAIN as "sepolia" | "baseSepolia") === "baseSepolia"
    ? baseSepolia
    : sepolia;

// Block explorers for tx links.
export const EXPLORER_TX: Record<number, string> = {
  [sepolia.id]: "https://sepolia.etherscan.io/tx/",
  [baseSepolia.id]: "https://sepolia.basescan.org/tx/",
};
