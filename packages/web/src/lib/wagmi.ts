import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { optimismSepolia } from "wagmi/chains";
import { http } from "wagmi";

// WalletConnect project id — optional for a local demo with injected wallets
// (MetaMask). A placeholder keeps getDefaultConfig happy when it's unset, but
// WalletConnect's relay rejects a non-32-char id, so any WalletConnect/QR flow
// (and often the whole connect modal on a hosted deploy) fails with a cryptic
// "projectId must be 32 characters / Forbidden". Warn loudly so a misconfigured
// deploy is obvious instead of silently broken.
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "lovechain-demo";
if (projectId === "lovechain-demo") {
  console.warn(
    "[LoveChain] NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set — using an invalid " +
      "placeholder. WalletConnect will return 'Forbidden'. Set a real 32-char id " +
      "from https://cloud.reown.com in your env / Vercel project settings."
  );
}

// Locked to OP Sepolia only — the LoveChain contract is only deployed there,
// so offering other chains would be dead ends (no address to resolve).
export const wagmiConfig = getDefaultConfig({
  appName: "LoveChain",
  projectId,
  chains: [optimismSepolia],
  transports: {
    [optimismSepolia.id]: http(process.env.NEXT_PUBLIC_OP_SEPOLIA_RPC_URL || undefined),
  },
  ssr: true,
});
