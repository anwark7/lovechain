import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, baseSepolia, optimismSepolia } from "wagmi/chains";
import { http } from "wagmi";

// WalletConnect project id — optional for a local demo with injected wallets
// (MetaMask). A placeholder keeps getDefaultConfig happy when it's unset.
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "lovechain-demo";

// OP Sepolia listed first so it is the default connection target.
export const wagmiConfig = getDefaultConfig({
  appName: "LoveChain",
  projectId,
  chains: [optimismSepolia, sepolia, baseSepolia],
  transports: {
    [optimismSepolia.id]: http(process.env.NEXT_PUBLIC_OP_SEPOLIA_RPC_URL || undefined),
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
