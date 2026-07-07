import { writeAbiAndAddress } from "./lib/writeAbi";

/**
 * Regenerate the frontend's ABI module from the latest compiled artifact
 * without deploying. Run after changing the contract:
 *
 *   pnpm --filter @lovechain/contracts sync-abi
 */
async function main() {
  const { abiFile } = writeAbiAndAddress();
  console.log(`Synced ABI -> ${abiFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
