import * as fs from "fs";
import * as path from "path";

/**
 * Shared helper: read the compiled LoveChain artifact and emit a typed
 * TypeScript module the frontend consumes. Centralizes the ABI so the web app
 * never hand-maintains it (a hard requirement of the project structure).
 */

const ARTIFACT_PATH = path.resolve(
  __dirname,
  "../../artifacts/contracts/LoveChain.sol/LoveChain.json"
);

const WEB_CONTRACTS_DIR = path.resolve(__dirname, "../../../web/src/lib/contracts");

export interface DeployedAddresses {
  sepolia?: string;
  baseSepolia?: string;
  opSepolia?: string;
  localhost?: string;
}

/**
 * Write `LoveChain.ts` (ABI) and merge `addresses.ts` (per-chain deployed
 * addresses) into the frontend's contracts directory.
 */
export function writeAbiAndAddress(chainKey?: keyof DeployedAddresses, address?: string) {
  if (!fs.existsSync(ARTIFACT_PATH)) {
    throw new Error(`Artifact not found at ${ARTIFACT_PATH}. Run \`hardhat compile\` first.`);
  }
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));

  fs.mkdirSync(WEB_CONTRACTS_DIR, { recursive: true });

  // 1) ABI module — regenerated from the artifact every time.
  const abiFile = path.join(WEB_CONTRACTS_DIR, "loveChainAbi.ts");
  const abiContent =
    `// AUTO-GENERATED from packages/contracts artifact. Do not edit by hand.\n` +
    `// Regenerate with: pnpm --filter @lovechain/contracts sync-abi\n` +
    `export const loveChainAbi = ${JSON.stringify(artifact.abi, null, 2)} as const;\n`;
  fs.writeFileSync(abiFile, abiContent);

  // 2) Addresses module — merge in the newly deployed address if provided.
  const addressesFile = path.join(WEB_CONTRACTS_DIR, "addresses.ts");
  let existing: DeployedAddresses = {};
  if (fs.existsSync(addressesFile)) {
    const match = fs.readFileSync(addressesFile, "utf8").match(/= (\{[\s\S]*?\}) as const/);
    if (match) {
      try {
        existing = JSON.parse(match[1]);
      } catch {
        /* fall back to empty */
      }
    }
  }
  if (chainKey && address) {
    existing[chainKey] = address;
  }
  const addressesContent =
    `// AUTO-GENERATED. Deployed LoveChain addresses per chain key.\n` +
    `// Updated by the deploy script; can also be overridden via env in the web app.\n` +
    `export const loveChainAddresses = ${JSON.stringify(existing, null, 2)} as const;\n\n` +
    `export type ChainKey = keyof typeof loveChainAddresses;\n`;
  fs.writeFileSync(addressesFile, addressesContent);

  return { abiFile, addressesFile };
}
