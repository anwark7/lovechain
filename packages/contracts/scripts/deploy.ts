import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { writeAbiAndAddress, DeployedAddresses } from "./lib/writeAbi";

/**
 * Deploy LoveChain to the selected network, then sync the ABI + deployed
 * address into the frontend. Demo windows and the breach-award share are read
 * from env (falling back to short demo defaults) so a judge can watch the
 * cooling / challenge / wedding windows elapse live.
 *
 *   pnpm --filter @lovechain/contracts deploy:sepolia
 *   pnpm --filter @lovechain/contracts deploy:baseSepolia
 */

function envInt(name: string, fallback: number): number {
  const v = process.env[name];
  return v && !Number.isNaN(Number(v)) ? Number(v) : fallback;
}

function chainKeyFor(networkName: string): keyof DeployedAddresses | undefined {
  if (networkName === "sepolia") return "sepolia";
  if (networkName === "baseSepolia") return "baseSepolia";
  if (networkName === "localhost" || networkName === "hardhat") return "localhost";
  return undefined;
}

async function main() {
  const cooling = envInt("COOLING_PERIOD_SECONDS", 180);
  const challenge = envInt("CHALLENGE_PERIOD_SECONDS", 180);
  const weddingWindow = envInt("WEDDING_WINDOW_SECONDS", 180);
  const breachAwardBps = envInt("BREACH_AWARD_BPS", 10_000);

  const [deployer] = await ethers.getSigners();
  console.log(`Network:  ${network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(
    `Windows:  cooling=${cooling}s challenge=${challenge}s wedding=${weddingWindow}s | breachAwardBps=${breachAwardBps}`
  );

  const Factory = await ethers.getContractFactory("LoveChain");
  const love = await Factory.deploy(cooling, challenge, weddingWindow, breachAwardBps);
  await love.waitForDeployment();

  const address = await love.getAddress();
  console.log(`\n✅ LoveChain deployed to: ${address}`);

  // Persist a deployment record.
  const deploymentsDir = path.resolve(__dirname, "../deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}.json`),
    JSON.stringify(
      { network: network.name, address, deployer: deployer.address, cooling, challenge, weddingWindow, breachAwardBps },
      null,
      2
    )
  );

  // Sync ABI + address into the frontend.
  const chainKey = chainKeyFor(network.name);
  const { abiFile, addressesFile } = writeAbiAndAddress(chainKey, address);
  console.log(`Synced ABI  -> ${abiFile}`);
  console.log(`Synced addr -> ${addressesFile}${chainKey ? ` (${chainKey})` : " (no chain key)"}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
