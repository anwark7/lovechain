# 💍 LoveChain — Proof of Commitment, Not Just Proof of Love

> **⚠️ Testnet learning project. Not financial or legal advice.**
> LoveChain uses **testnet ETH only**. It is a Web3 bootcamp demo — not a real
> financial product, and not a legally binding relationship agreement.

LoveChain is a **relationship commitment escrow dApp**. Two partners lock native
testnet ETH into a smart contract as proof of commitment. The funds can only be
released through agreed conditions:

| Outcome | How it unlocks | Fee |
|---|---|---|
| 💍 **Wedding Unlock** | both partners confirm + **3 of 5** witnesses approve | 0.25% |
| 🕊️ **Peaceful Exit** | mutual approval → cooling period, no dispute | 0.5% |
| ⚠️ **Breach Resolution** | claimant posts bond + evidence → **4 of 5** witness vote | 1% |
| ⏳ **Expiry / Timeout** | either partner, after the term elapses (safety net) | 0.5% |

The guiding principle: **funds are never permanently stuck.** Every threshold has
a time-based fallback, and a lone partner can always recover their deposit once
the term ends.

## 📚 Documentation

| Document | What it's for |
|---|---|
| 📘 [`docs/PROJECT_GUIDE.md`](docs/PROJECT_GUIDE.md) | **Start here.** One self-contained onboarding doc — explains the whole system, the lifecycle, the repo map, how to run it, a full function reference, gotchas, and a paste-into-AI summary. Written so a teammate *or* an AI assistant can pick up the project cold. |
| 📄 [`docs/LoveChain_PRD_v2.md`](docs/LoveChain_PRD_v2.md) | The original **Product Requirements Document** — the product spec this MVP was built from (flows, states, fee tiers, known limitations). |
| 📖 This `README.md` | Quickstart: setup, test, deploy, and a demo script for the three flows. |

---

## Monorepo layout

```
lovechain/
├─ packages/
│  ├─ contracts/                 # Hardhat + Solidity ^0.8.24
│  │  ├─ contracts/LoveChain.sol # the escrow contract
│  │  ├─ test/                   # one spec per concern (63 tests, ~97% coverage)
│  │  ├─ scripts/deploy.ts       # deploy + sync ABI/address to the web app
│  │  └─ hardhat.config.ts
│  └─ web/                       # Next.js (App Router) + Wagmi + Viem + RainbowKit
│     └─ src/
│        ├─ app/                 # routes: /, /create, /deals, /deals/[id](/dispute|/claim)
│        ├─ components/ui/       # generic primitives (Button, Card, StatusBadge…)
│        ├─ components/features/ # composites (CreateDealForm, DealActions, DisputePanel…)
│        ├─ hooks/               # useDeal, useLoveChainWrite, useWindows…
│        ├─ lib/                 # wagmi config, contract ABI+address, formatters
│        ├─ types/               # Deal, BreachClaim
│        └─ constants/           # status/outcome/fee enums, chains
└─ docs/
   ├─ PROJECT_GUIDE.md           # onboarding guide (teammates & AI)
   └─ LoveChain_PRD_v2.md        # product requirements document
```

## Tech stack

- **Chain:** EVM — Sepolia (default) and Base Sepolia, native testnet ETH.
- **Contracts:** Solidity `^0.8.24`, Hardhat 2, OpenZeppelin (`ReentrancyGuard`, `Ownable`).
- **Tests:** Hardhat + Mocha/Chai + ethers v6 + solidity-coverage.
- **Frontend:** Next.js 14 (App Router) + TypeScript, Wagmi v2 + Viem v2 + RainbowKit v2, Tailwind CSS.
- **Package manager:** pnpm workspace monorepo.

---

## Prerequisites

- **Node 20+** and **pnpm 9+** (`npm i -g pnpm`).
- A testnet wallet (e.g. MetaMask) with Sepolia ETH from a faucet — only needed to deploy / interact.

## Install

```bash
pnpm install
```

## Compile & test the contracts

```bash
pnpm contracts:build          # compile
pnpm contracts:test           # run the full suite (63 tests)
pnpm --filter @lovechain/contracts coverage   # coverage report
```

The suite covers every flow and every revert path: create/accept/cancel/check-in,
wedding (+ window timeout), peaceful exit (+ cooling), breach + witness voting,
the timeout safety nets, and payout/fee accounting (including value conservation).

## Configure environment

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Key variables (all testnet-only — never put a mainnet key here):

| Variable | Purpose |
|---|---|
| `SEPOLIA_RPC_URL` / `BASE_SEPOLIA_RPC_URL` | RPC endpoints (Alchemy/Infura/public) |
| `DEPLOYER_PRIVATE_KEY` | funded **testnet** deployer key |
| `COOLING_PERIOD_SECONDS` / `CHALLENGE_PERIOD_SECONDS` / `WEDDING_WINDOW_SECONDS` | demo windows (default 180s each) |
| `BREACH_AWARD_BPS` | share of accused deposit awarded on a valid breach (default `10000` = 100%) |

Frontend variables live in `packages/web/.env.local` (prefixed `NEXT_PUBLIC_`):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud id (optional for MetaMask-only demos) |
| `NEXT_PUBLIC_LOVECHAIN_ADDRESS_SEPOLIA` | deployed address (auto-synced by the deploy script, or set here) |
| `NEXT_PUBLIC_DEFAULT_CHAIN` | `sepolia` (default) or `baseSepolia` |

## Deploy

The deploy script deploys with your configured demo windows **and** writes the ABI
+ deployed address straight into the frontend (`packages/web/src/lib/contracts/`),
so no ABI is ever hand-copied.

```bash
# Sepolia
pnpm --filter @lovechain/contracts deploy:sepolia

# Base Sepolia
pnpm --filter @lovechain/contracts deploy:baseSepolia
```

To regenerate the frontend ABI after changing the contract (without deploying):

```bash
pnpm sync-abi
```

### Local end-to-end (no testnet needed)

```bash
# terminal 1 — local chain
pnpm --filter @lovechain/contracts node

# terminal 2 — deploy to it (syncs the "localhost" address into the web app)
pnpm --filter @lovechain/contracts deploy --network localhost
```

Then point MetaMask at `http://127.0.0.1:8545` (chain id 31337) and import one of
the node's printed private keys.

## Run the web app

```bash
pnpm web:dev        # http://localhost:3000
pnpm web:build      # production build
```

Connect a wallet (top-right), then **Create a Love Contract** or browse **My Deals**.

---

## Demoing the three flows

Use short demo windows (the default 180s) so cooling/challenge/wedding periods
elapse live. You'll want a few wallets: **A**, **B**, and up to **5 witnesses**
(any addresses distinct from the partners).

### 1. 💍 Wedding Unlock
1. **A** creates a contract (partner **B**, a deposit, a duration, 5 witnesses).
2. **B** opens the deal and **Accept & Deposit** (matches A's amount) → `ACTIVE`.
3. **A** (or B) **Request Wedding Unlock** with a proof URI (a mock `ipfs://…` is fine).
4. The other partner **Confirm wedding**.
5. Three witnesses **Approve wedding** → status flips to **Married 💍**.
6. Each partner opens the **Claim page** → **Claim**, then **Withdraw**. Deposits
   return net of the 0.25% fee; a `WeddingBadge` event is emitted.

### 2. 🕊️ Peaceful Exit
1. From an `ACTIVE` deal, **A** **Request peaceful exit**.
2. **B** **Approve peaceful exit** → `COOLING_PERIOD` (watch the countdown).
3. After it elapses, anyone clicks **Finalize peaceful exit** → `RESOLVED`.
4. Both partners **Claim** → **Withdraw** (deposits back, net 0.5%).

### 3. ⚠️ Breach Resolution
1. From an `ACTIVE` deal, **A** **Raise Breach Claim** with an evidence URI + a bond.
2. On the **Dispute page**, **B** (the accused) **Challenge this claim**.
3. Witnesses vote **Approve / Reject**. **4 of 5** approvals uphold the claim.
   - **Upheld:** claimant claims their deposit + the accused's deposit + bond back (net 1%).
   - **Rejected:** deposits return to owners; the bond compensates the falsely-accused.
4. If witnesses go silent, anyone clicks **Resolve by timeout** after the window
   (unchallenged → upheld; challenged-without-threshold → rejected).

**Safety net:** from any stuck mid-flow state, once the term elapses a partner can
**Force expiry** on the deal page and recover their deposit unilaterally (net 0.5%).

---

## Contract design notes

- **Pull-payment** for all payouts (`claimPayout` credits a ledger; `withdraw`
  moves ETH), reentrancy-guarded. Fees accrue to the owner (`withdrawFees`).
- **Symmetric deposits** in the MVP (B matches A) — asymmetric payout is future work.
- Only the **evidence URI/hash** is stored on-chain, never raw evidence.
- An **`Outcome`** enum is stored alongside `ContractStatus` so `claimPayout`
  applies the correct fee/split (several outcomes collapse into `RESOLVED`).
- **Deliberate deviations from the PRD** (all intentional for the MVP):
  - PRD §10.6's `PEACEFUL_EXIT` state isn't in the enum; peaceful exit ends in
    `RESOLVED` with `Outcome.PEACEFUL`.
  - `breachAwardBps` (default 100%) implements the deposit-split the PRD lists as
    future work — chosen for stronger consequences; owner-configurable.
  - The wedding badge is an **event** in the core; a real ERC-721 is an isolated bonus.
  - Breach claims aren't gated on missed check-in (witnesses adjudicate); check-in
    timestamps are still recorded and surfaced.

See PRD §33 for known limitations (wedding proof is an honor system, witnesses are
unstaked in the MVP, rules are declarative, etc.).

## License

MIT.
