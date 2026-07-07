# LoveChain — Project Guide (for teammates & AI assistants)

> **Read this first.** This single document is enough to understand the whole
> project and run it end-to-end. If you are an AI assistant, treat this as the
> source of truth for how the repo is laid out, how it behaves, and what NOT to
> break. If you are a teammate, follow the "Run it in 5 minutes" section.
>
> ⚠️ **Testnet learning project. Not financial or legal advice.** Everything uses
> **testnet ETH only.** Never put a mainnet private key anywhere in this repo.

---

## 1. What LoveChain is (in one paragraph)

LoveChain is a **relationship commitment escrow dApp**. Two partners (A and B)
each lock the same amount of testnet ETH into a smart contract as "proof of
commitment." The locked funds can only come out through one of four agreed
outcomes, and **the money can never get permanently stuck** — there's always a
time-based escape hatch.

| Outcome | Trigger | Platform fee |
|---|---|---|
| 💍 **Wedding Unlock** | both partners confirm **+ 3 of 5 witnesses** approve | 0.25% |
| 🕊️ **Peaceful Exit** | both agree → a **cooling period** passes with no dispute | 0.5% |
| ⚠️ **Breach Resolution** | one posts a **bond + evidence** → **4 of 5 witnesses** vote | 1% |
| ⏳ **Expiry / Timeout** | either partner, once the term ends (nobody else needed) | 0.5% |

The fee is intentionally tiered: the better the outcome, the lower the fee.

---

## 2. Mental model (how a deal moves through its life)

Each deal is one `LoveContract` struct identified by an auto-incrementing
`contractId` (0, 1, 2, …). It has a **status** (where it is in its lifecycle) and,
once decided, an **outcome** (which payout math applies).

```
                       cancelContract (A only, full refund)
                      ┌───────────────► CANCELLED
                      │
  createLoveContract  │  acceptContract (B matches deposit)
  ───────────────► PENDING_PARTNER ─────────────────► ACTIVE
                                                        │
   ┌────────────────────────────────────────────────────┼───────────────────────────┐
   │ requestWeddingUnlock          requestPeacefulExit    │  raiseBreachClaim          │
   ▼                               ▼                      │  ▼                         │
 WEDDING_REQUESTED             BREAKUP_REQUESTED           │ DISPUTED                   │
   │ confirm + 3/5 votes          │ approvePeacefulExit    │  │ challenge + 4/5 votes   │
   │                              ▼                        │  │ (or resolveByTimeout)   │
   │                          COOLING_PERIOD               │  ▼                         │
   │                              │ finalizePeacefulExit   │ RESOLVED                   │
   ▼                              ▼                        │ (Outcome: BREACH_VALID     │
 MARRIAGE_CONFIRMED            RESOLVED                    │  or BREACH_REJECTED)       │
 (Outcome: WEDDING)           (Outcome: PEACEFUL)          │                            │
   │                              │                        │  claimByTimeout (any time  │
   │       ┌──────────────────────┘                        │  after the term elapses)   │
   ▼       ▼                                               ▼                            │
        claimPayout → withdraw                          EXPIRED (Outcome: EXPIRED) ◄────┘
        (each partner claims once, then withdraws ETH)
```

Key ideas:
- **Two-step money out:** `claimPayout(id)` credits your internal balance, then
  `withdraw()` sends the ETH to your wallet (this is the safe "pull payment"
  pattern). Fees for the platform accrue to the owner, withdrawn via `withdrawFees`.
- **Deposits are symmetric:** B must deposit exactly what A did.
- **Witnesses:** exactly 5, chosen when the deal is created. They vote on weddings
  (need 3) and breaches (need 4).
- **Timeouts everywhere:** every step that needs other people has a fallback so a
  silent partner or lazy witnesses can never trap the funds.

---

## 3. Repository map (where everything lives)

```
lovechain/
├─ README.md                     # human-facing quickstart + demo script
├─ docs/
│  ├─ PROJECT_GUIDE.md           # ← you are here
│  └─ LoveChain_PRD_v2.md        # the original product spec
├─ package.json                  # workspace root; the handy `pnpm <x>` scripts live here
├─ pnpm-workspace.yaml           # declares packages/* as workspaces
├─ .env.example                  # copy to .env; testnet config (RPC, key, windows)
│
├─ packages/contracts/           # ── THE SMART CONTRACT ──
│  ├─ contracts/LoveChain.sol    # the entire contract (one file, heavily commented)
│  ├─ test/                      # 63 tests, one file per concern:
│  │  ├─ helpers.ts              #   shared fixtures + enum mirrors
│  │  ├─ 01-create-accept-cancel.test.ts
│  │  ├─ 02-wedding.test.ts
│  │  ├─ 03-peaceful-exit.test.ts
│  │  ├─ 04-breach-voting.test.ts
│  │  ├─ 05-timeouts.test.ts
│  │  └─ 06-payout-fees.test.ts
│  ├─ scripts/
│  │  ├─ deploy.ts               # deploys AND syncs ABI+address into the web app
│  │  ├─ sync-abi.ts             # re-copies the ABI to the web app (no deploy)
│  │  └─ lib/writeAbi.ts         # the shared "write ABI/address" helper
│  └─ hardhat.config.ts          # networks (sepolia, baseSepolia, local), solc 0.8.24
│
└─ packages/web/                 # ── THE FRONTEND ──
   └─ src/
      ├─ app/                    # Next.js App Router pages:
      │  ├─ page.tsx             #   / (landing)
      │  ├─ create/page.tsx      #   /create
      │  ├─ deals/page.tsx       #   /deals (list)
      │  ├─ deals/[id]/page.tsx  #   /deals/1 (detail + actions)
      │  ├─ deals/[id]/dispute/  #   /deals/1/dispute (voting)
      │  ├─ deals/[id]/claim/    #   /deals/1/claim (payout)
      │  ├─ providers.tsx        #   wagmi + react-query + RainbowKit wrapper
      │  └─ layout.tsx
      ├─ components/
      │  ├─ ui/                  # generic reusable primitives (Button, Card, StatusBadge…)
      │  └─ features/            # app-specific composites (CreateDealForm, DealActions,
      │                          #   WeddingPanel, DisputePanel, ClaimPanel, DealsList…)
      ├─ hooks/                  # useDeal, useLoveChainWrite, useWindows, useDealCount…
      ├─ lib/
      │  ├─ wagmi.ts             # chains + connectors config
      │  ├─ format.ts            # shortAddress, formatEth, countdown, timeAgo
      │  └─ contracts/           # CENTRALIZED contract handle:
      │     ├─ loveChainAbi.ts   #   AUTO-GENERATED — do not edit by hand
      │     ├─ addresses.ts      #   AUTO-GENERATED — deployed addresses per chain
      │     └─ index.ts          #   getLoveChainAddress() resolver
      ├─ types/deal.ts           # Deal, BreachClaim, PartnerRole
      └─ constants/              # status/outcome/fee enums, chain config
```

**Structural rules (please keep these true):**
- Generic UI → `components/ui/`. App-specific composites → `components/features/`.
- Data reads/writes → `hooks/`. Never scatter `useReadContract` calls in pages.
- The ABI and deployed address live **only** in `src/lib/contracts/` and are
  generated from the compiled artifact — never paste an ABI or address elsewhere.

---

## 4. Run it in 5 minutes

### Prerequisites
- **Node 20+** and **pnpm 9+** — `npm install -g pnpm`
- (For on-chain interaction) a browser wallet like **MetaMask**

### A) Everything locally, no testnet, no faucet (fastest)

```bash
# from the repo root
pnpm install

# 1) compile + run the test suite (proves the contract works)
pnpm contracts:test          # expect: 63 passing

# 2) start a local blockchain (leave this terminal running)
pnpm --filter @lovechain/contracts node

# 3) in a SECOND terminal, deploy to that local chain
#    (this also writes the address into the web app automatically)
pnpm --filter @lovechain/contracts deploy --network localhost

# 4) start the web app
pnpm web:dev                 # http://localhost:3000
```

Then in MetaMask: add a network with RPC `http://127.0.0.1:8545`, chain ID `31337`,
and **import a private key** printed by the `node` command in step 2 (those test
accounts come pre-funded with 10000 fake ETH). Open http://localhost:3000, connect,
and create a deal.

> Tip: to play all the roles yourself (A, B, 5 witnesses), import several of the
> printed keys as separate MetaMask accounts and switch between them.

### B) On a public testnet (Sepolia)

```bash
pnpm install
cp .env.example .env          # then edit .env — see section 5

pnpm --filter @lovechain/contracts deploy:sepolia   # deploys + syncs address
pnpm web:dev
```

You'll need Sepolia ETH in your deployer wallet (grab some from a free faucet).

---

## 5. Configuration (.env)

Copy `.env.example` → `.env` at the repo root and fill in:

| Variable | What it is | Needed for |
|---|---|---|
| `SEPOLIA_RPC_URL` | an RPC endpoint (Alchemy/Infura free tier, or a public one) | deploying to Sepolia |
| `BASE_SEPOLIA_RPC_URL` | RPC for Base Sepolia | deploying to Base Sepolia |
| `DEPLOYER_PRIVATE_KEY` | a **testnet** wallet key, funded from a faucet | deploying |
| `COOLING_PERIOD_SECONDS` | peaceful-exit cooling window (default `180` = 3 min) | demo pacing |
| `CHALLENGE_PERIOD_SECONDS` | breach challenge + voting window (default `180`) | demo pacing |
| `WEDDING_WINDOW_SECONDS` | wedding approval window (default `180`) | demo pacing |
| `BREACH_AWARD_BPS` | how much of the accused's deposit a valid claimant gets (`10000` = 100%) | payout tuning |

Frontend-only vars go in `packages/web/.env.local` (all prefixed `NEXT_PUBLIC_`):

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud id — **optional**; MetaMask works without it |
| `NEXT_PUBLIC_LOVECHAIN_ADDRESS_SEPOLIA` | deployed address (the deploy script fills `addresses.ts` for you; this env var is an override) |
| `NEXT_PUBLIC_DEFAULT_CHAIN` | `sepolia` (default) or `baseSepolia` |

The short 3-minute windows exist so you can **watch** a cooling/voting period elapse
during a live demo instead of waiting 3 real days.

---

## 6. The three flows, click by click (demo script)

Set up a few wallets first: **A**, **B**, and up to **5 witnesses** (any addresses
that are not A or B).

### 💍 Wedding Unlock
1. **A** → `/create`: enter B's address, a deposit, a duration, and 5 witness addresses → **Create & Deposit**.
2. **B** → open the deal → **Accept & Deposit** (matches A's amount). Status → **Active**.
3. **A** (or B) → **Request Wedding Unlock** with a proof URI (a mock `ipfs://...` string is fine).
4. The other partner → **Confirm wedding**.
5. **3 witnesses** → **Approve wedding**. Status → **Married 💍**.
6. Each partner → **Claim** then **Withdraw** on the claim page. Deposits return minus 0.25%.

### 🕊️ Peaceful Exit
1. From an **Active** deal, **A** → **Request peaceful exit**.
2. **B** → **Approve peaceful exit**. Status → **Cooling Period** (watch the countdown).
3. After it elapses, anyone → **Finalize peaceful exit**. Status → **Resolved**.
4. Both partners → **Claim** → **Withdraw** (deposits back, minus 0.5%).

### ⚠️ Breach Resolution
1. From an **Active** deal, **A** → **Raise Breach Claim** with an evidence URI + a bond amount.
2. On the **dispute page**, **B** (the accused) → **Challenge this claim**.
3. Witnesses → **Approve** / **Reject**. **4 approvals** upholds it.
   - **Upheld:** claimant claims their deposit + the accused's deposit + bond back (minus 1%).
   - **Rejected:** deposits go back to their owners; the bond compensates the falsely-accused partner.
4. If witnesses go silent, anyone → **Resolve by timeout** after the window closes.

### ⏳ The safety net
From any stuck state, once the term has elapsed, either partner can **Force expiry**
on the deal page and recover their own deposit (minus 0.5%) — no one else required.

---

## 7. Contract function reference

Everything lives in one file: `packages/contracts/contracts/LoveChain.sol`.

**Lifecycle**
- `createLoveContract(partner, duration, witnesses[5], rules[])` *(payable)* — A creates + deposits.
- `acceptContract(id)` *(payable)* — B matches the deposit → Active.
- `cancelContract(id)` — A only, while pending; full refund, no fee.
- `checkIn(id)` — either partner records a check-in while Active.

**Wedding**
- `requestWeddingUnlock(id, proofURI)` — either partner opens the wedding window.
- `confirmWedding(id)` — the other partner confirms.
- `voteWedding(id)` — a witness approves (need 3/5).
- `expireWeddingRequest(id)` — anyone, after the window → back to Active.

**Peaceful exit**
- `requestPeacefulExit(id)` → `approvePeacefulExit(id)` (the *other* partner) → `finalizePeacefulExit(id)` (after cooling).

**Breach**
- `raiseBreachClaim(id, evidenceURI)` *(payable — the bond)*.
- `challengeBreachClaim(id)` — the accused, within the window.
- `voteDispute(id, approveClaim)` — a witness (need 4/5 approvals to uphold).
- `resolveDispute(id)` / `resolveBreachByTimeout(id)` — finalize after the window.

**Timeout safety net**
- `claimByTimeout(id)` — either partner, after the term elapses → Expired.

**Money out (pull-payment)**
- `claimPayout(id)` — credits your internal balance based on the outcome (once per partner).
- `withdraw()` — sends your internal balance to your wallet.
- `withdrawFees(to)` — owner only; sends accrued platform fees.

**Views (read-only, used by the UI)**
- `getContract(id)`, `getWitnesses(id)`, `getRules(id)`, `getClaim(id)`
- `isWitness(id, addr)`, `hasVoted(id, addr)`, `claimableAmount(id, who)`
- `nextContractId`, `pendingWithdrawals(addr)`, `accruedFees`

---

## 8. Common tasks

| I want to… | Do this |
|---|---|
| Run the tests | `pnpm contracts:test` |
| See test coverage | `pnpm --filter @lovechain/contracts coverage` |
| Compile after editing the contract | `pnpm contracts:build` |
| Refresh the frontend ABI after a contract change | `pnpm sync-abi` |
| Deploy to Sepolia | `pnpm --filter @lovechain/contracts deploy:sepolia` |
| Deploy locally | start `... node`, then `... deploy --network localhost` |
| Run the web app | `pnpm web:dev` |
| Production-build the web app | `pnpm web:build` |
| Add a UI element | put generic ones in `components/ui/`, app-specific ones in `components/features/` |
| Add a contract read/write in the UI | add or extend a hook in `src/hooks/`, don't inline it in a page |

**If you change the Solidity contract**, always: `pnpm contracts:build` → `pnpm sync-abi`
(so the frontend ABI matches) → `pnpm contracts:test`. If you changed a struct or enum,
also update the mirrors in `packages/web/src/constants/contract.ts` and
`packages/web/src/types/deal.ts` — their field order must match Solidity.

---

## 9. Gotchas & troubleshooting (things that will bite you)

These are real issues encountered while building this repo. If you (or an AI) touch
the tooling, keep them in mind.

1. **Do NOT re-add a hoisted pnpm linker** (`node-linker=hoisted` in `.npmrc`).
   Hardhat needs an older `@noble/hashes`; viem needs a newer one (for its `abytes`
   export). A single hoisted copy satisfies neither and breaks *both* `pnpm contracts:test`
   and `pnpm web:build`. The default pnpm (isolated) linker nests each version correctly —
   leave it alone.

2. **This is Next.js 14, not 15.** In dynamic route pages, read params **synchronously**
   (`function Page({ params }: { params: { id: string } })` → `const { id } = params`).
   Do **not** use the Next 15 `use(params)` promise pattern — it throws at runtime here.

3. **`loveChainAbi.ts` and `addresses.ts` are generated.** Never hand-edit them.
   Regenerate the ABI with `pnpm sync-abi`; the deploy script writes the address.

4. **"No LoveChain deployment found for this network"** in the UI means the contract
   isn't deployed on your connected chain (or the address wasn't synced). Deploy it,
   or set `NEXT_PUBLIC_LOVECHAIN_ADDRESS_SEPOLIA` in `packages/web/.env.local`, and make
   sure your wallet is on the matching network.

5. **Windows line endings**: `.gitattributes` normalizes to LF. Harmless CRLF warnings
   on Windows are expected; ignore them.

6. **Wedding vote tally storage**: on-chain, the wedding approval count reuses the
   breach-claim struct's `approveVotes` field (a deal is never mid-wedding and mid-breach
   at once). If you refactor the claim struct, account for this. The UI reads it via
   `getClaim(id).approveVotes` in `WeddingPanel`.

---

## 10. Where behavior differs from the PRD (on purpose)

All intentional MVP decisions, also noted in the README:
- The PRD mentions a `PEACEFUL_EXIT` state that isn't in the enum — peaceful exit
  ends in `RESOLVED` with `Outcome.PEACEFUL`.
- `breachAwardBps` (default 100%) implements the deposit-split the PRD lists as future
  work; it's owner-configurable.
- The wedding badge is emitted as an **event**, not minted as an NFT (NFT is a bonus).
- Breach claims aren't gated on a missed check-in (witnesses judge); check-in timestamps
  are still recorded and shown in the UI.

See PRD §33 ("Known Limitations") for the honest list of what the MVP deliberately
doesn't do (wedding proof is an honor system, witnesses aren't staked, most rules are
declarative text, etc.).

---

## 11. One-paragraph summary to paste into an AI

> LoveChain is a pnpm monorepo with two packages: `packages/contracts` (a single
> Solidity `^0.8.24` escrow contract `LoveChain.sol` built/tested with Hardhat 2 —
> 63 passing tests) and `packages/web` (a Next.js 14 App Router frontend using Wagmi
> v2 + Viem v2 + RainbowKit v2 + Tailwind). Two partners lock equal testnet ETH; funds
> release via Wedding Unlock (3/5 witnesses + mutual confirm), Peaceful Exit (cooling
> period), Breach Resolution (bond + 4/5 witness vote), or a time-based Expiry safety
> net — with a tiered platform fee (0.25/0.5/1/0.5%). Payouts use a pull-payment pattern
> (`claimPayout` then `withdraw`). To run: `pnpm install`, then `pnpm contracts:test`;
> for a live app run a local chain (`pnpm --filter @lovechain/contracts node`), deploy
> to it (`... deploy --network localhost`, which auto-syncs the ABI/address into the web
> app), and start the UI (`pnpm web:dev`). The contract ABI/address live only in
> `packages/web/src/lib/contracts/` and are generated — never hand-edited. Do not add a
> hoisted pnpm linker (it breaks the `@noble/hashes` version split between Hardhat and
> viem), and read Next route `params` synchronously (this is Next 14, not 15).
