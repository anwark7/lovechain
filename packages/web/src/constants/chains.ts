import { sepolia, baseSepolia, optimismSepolia } from "wagmi/chains";

// Canonical address-book keys (kept independent of the auto-generated
// addresses.ts, whose union is empty until the first deploy).
export type ChainKey = "sepolia" | "baseSepolia" | "opSepolia" | "localhost";

// Maps a wagmi chain id to our address-book key.
export const CHAIN_KEY_BY_ID: Record<number, ChainKey> = {
  [sepolia.id]: "sepolia",
  [baseSepolia.id]: "baseSepolia",
  [optimismSepolia.id]: "opSepolia",
  31337: "localhost",
};

export const SUPPORTED_CHAINS = [optimismSepolia, sepolia, baseSepolia] as const;

type DefaultChainName = "opSepolia" | "sepolia" | "baseSepolia";

const CHAIN_BY_NAME = {
  opSepolia: optimismSepolia,
  sepolia,
  baseSepolia,
} as const;

// Default chain the UI connects to; OP Sepolia unless overridden by env.
export const DEFAULT_CHAIN =
  CHAIN_BY_NAME[(process.env.NEXT_PUBLIC_DEFAULT_CHAIN as DefaultChainName) ?? "opSepolia"] ??
  optimismSepolia;

// Block explorers for tx links.
export const EXPLORER_TX: Record<number, string> = {
  [sepolia.id]: "https://sepolia.etherscan.io/tx/",
  [baseSepolia.id]: "https://sepolia.basescan.org/tx/",
  [optimismSepolia.id]: "https://sepolia-optimism.etherscan.io/tx/",
};
