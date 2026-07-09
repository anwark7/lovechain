"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

/** Top navigation bar with the wallet connect button. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-ink-900/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">💍</span>
          <span className="text-rose-50">
            Love<span className="text-rose-400">Chain</span>
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/create"
            className="hidden text-sm text-rose-50/70 hover:text-rose-50 sm:block"
          >
            Create
          </Link>
          <Link
            href="/deals"
            className="hidden text-sm text-rose-50/70 hover:text-rose-50 sm:block"
          >
            My Deals
          </Link>
          <ConnectButton
            showBalance={false}
            accountStatus="address"
            chainStatus="none"
          />
        </nav>
      </div>
    </header>
  );
}
