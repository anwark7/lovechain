# 💍 LoveChain — Proof of Commitment, Not Just Proof of Love

> **⚠️ Testnet learning project. Not financial or legal advice.**
> LoveChain uses **testnet ETH only**. It is a Web3 bootcamp demo, not a real
> financial product and not a legally binding relationship agreement.

LoveChain is a **relationship commitment escrow dApp**. Two partners lock native
testnet ETH into a smart contract as proof of commitment. Funds are only released
through agreed conditions:

- 💍 **Wedding Unlock** — the relationship reaches marriage.
- 🕊️ **Peaceful Exit** — both partners mutually agree to end things.
- ⚠️ **Breach Resolution** — a committed rule is broken, adjudicated by witnesses.
- ⏳ **Expiry / Timeout** — a time-based safety net so funds are *never* stuck.

Built for the Web3 Bootcamp per [`docs/LoveChain_PRD_v2.md`](docs/LoveChain_PRD_v2.md).

---

## Monorepo layout

```
lovechain/
├─ packages/
│  ├─ contracts/   # Hardhat + Solidity ^0.8.24  (the LoveChain escrow contract)
│  └─ web/         # Next.js (App Router) + Wagmi + Viem + RainbowKit + Tailwind
└─ docs/           # Product Requirements Document
```

## Quick start

```bash
pnpm install
pnpm contracts:build     # compile contracts
pnpm contracts:test      # run the Hardhat test suite
pnpm web:dev             # run the frontend (after syncing an ABI/address)
```

_(Full setup, deploy, and demo instructions are added as the build progresses.)_
