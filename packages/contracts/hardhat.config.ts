import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as path from "path";

// Load the workspace-root .env (contracts + web share one example file).
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const {
  SEPOLIA_RPC_URL,
  BASE_SEPOLIA_RPC_URL,
  OP_SEPOLIA_RPC_URL,
  DEPLOYER_PRIVATE_KEY,
  ETHERSCAN_API_KEY,
  BASESCAN_API_KEY,
  OPTIMISM_ETHERSCAN_API_KEY,
} = process.env;

// Only pass an accounts array when a key is present, so `hardhat compile`
// and local tests work without any .env at all.
const accounts =
  DEPLOYER_PRIVATE_KEY && DEPLOYER_PRIVATE_KEY.startsWith("0x")
    ? [DEPLOYER_PRIVATE_KEY]
    : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {
      // Local in-process network used for the test suite.
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL || "",
      accounts,
      chainId: 11155111,
    },
    baseSepolia: {
      url: BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts,
      chainId: 84532,
    },
    opSepolia: {
      url: OP_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
      accounts,
      chainId: 11155420,
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY || "",
      baseSepolia: BASESCAN_API_KEY || "",
      // Hardhat's built-in id for OP Sepolia verification.
      optimisticSepolia: OPTIMISM_ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "optimisticSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
  },
};

export default config;
