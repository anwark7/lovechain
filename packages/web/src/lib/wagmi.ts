import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, baseSepolia } from "wagmi/chains";
import { http } from "wagmi";

// WalletConnect project id — optional for a local demo with injected wallets
// (MetaMask). A placeholder keeps getDefaultConfig happy when it's unset.
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "lovechain-demo";

export const wagmiConfig = getDefaultConfig({
  appName: "LoveChain",
  projectId,
  chains: [sepolia, baseSepolia],
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: true,
});
