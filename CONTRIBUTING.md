# Contributing to LoveChain

Thanks for helping build LoveChain! This guide covers how to get set up and how
to land a change cleanly. It's written for both human teammates and AI assistants.

> ⚠️ **Testnet learning project.** Everything uses testnet ETH. Never commit a real
> private key, an `.env` file, or any secret. `.env` is gitignored — keep it that way.

New to the project? Read **[`docs/PROJECT_GUIDE.md`](docs/PROJECT_GUIDE.md)** first —
it explains the whole system, the repo layout, and how to run everything.

---

## 1. Get set up

```bash
git clone git@github.com:anwark7/lovechain.git
cd lovechain
pnpm install
pnpm contracts:test      # sanity check — expect 63 passing
```

You need **Node 20+** and **pnpm 9+** (`npm install -g pnpm`).

## 2. Branch, don't commit to `main`

`main` is protected — changes land through a pull request, not a direct push.

```bash
git checkout main
git pull                              # start from the latest main
git checkout -b feat/short-description # or fix/…, docs/…, chore/…
```

Branch name prefixes: `feat/`, `fix/`, `docs/`, `chore/`, `test/`, `refactor/`.

## 3. Make your change

Keep the existing structure (see the guide's "Structural rules"):

- Generic UI → `packages/web/src/components/ui/`
- App-specific composites → `packages/web/src/components/features/`
- Contract reads/writes → a hook in `packages/web/src/hooks/` (don't inline in pages)
- The contract ABI/address live **only** in `packages/web/src/lib/contracts/` and are
  **generated** — never hand-edit `loveChainAbi.ts` or `addresses.ts`.

**If you change the Solidity contract** (`packages/contracts/contracts/LoveChain.sol`):

```bash
pnpm contracts:build     # 1. recompile
pnpm sync-abi            # 2. refresh the frontend ABI so it matches
pnpm contracts:test      # 3. keep the suite green
```

If you changed a struct/enum, also update the mirrors in
`packages/web/src/constants/contract.ts` and `packages/web/src/types/deal.ts`
(their field order must match Solidity).

## 4. Before you push — checks must pass

```bash
pnpm contracts:test                        # contract tests
pnpm --filter @lovechain/web typecheck     # frontend types
pnpm web:build                             # frontend production build
```

Add or update tests for any contract behavior you change — the suite has one file
per concern under `packages/contracts/test/`.

## 5. Commit style

Use short, conventional messages scoped to the area you touched:

```
feat(contracts): add witness reputation score
fix(web): correct cooling-period countdown
docs: clarify local deploy steps
test(contracts): cover breach-rejected bond routing
```

- Present tense, lower case, no trailing period.
- **Do not** add `Co-authored-by` trailers.
- Group related work into logical commits rather than one giant commit.

## 6. Open a pull request

```bash
git push -u origin feat/short-description
```

Then open a PR against `main` (GitHub will prompt you, or use `gh pr create`).
In the PR description, say **what** changed, **why**, and **how you verified it**
(e.g. "63 tests pass, web build green, tested the wedding flow locally").

A maintainer reviews and merges. Thanks for contributing! 💍

---

## Gotchas (don't re-trip these)

- **Do NOT add a hoisted pnpm linker** (`node-linker=hoisted`). It breaks the
  `@noble/hashes` version split between Hardhat and viem. See the guide, section 9.
- **This is Next.js 14**, not 15 — read route `params` synchronously, not with `use()`.
- See [`docs/PROJECT_GUIDE.md`](docs/PROJECT_GUIDE.md) §9 for the full list.
