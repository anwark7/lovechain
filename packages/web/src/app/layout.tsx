import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/features/SiteHeader";

export const metadata: Metadata = {
  title: "LoveChain — Proof of Commitment",
  description:
    "A relationship commitment escrow dApp. Lock testnet ETH as proof of commitment. Testnet learning project — not financial or legal advice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-8">{children}</main>
          <footer className="border-t border-white/5 py-6 text-center text-xs text-rose-50/40">
            LoveChain · Testnet learning project · Not financial or legal advice
          </footer>
        </Providers>
      </body>
    </html>
  );
}
