require('dotenv').config()

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "hardhat-deploy";

import { CONFIG } from "./config";

const DEPLOYER_MNEMONIC = process.env.DEPLOYER_MNEMONIC || "";

if (!DEPLOYER_MNEMONIC) {
  throw new Error("Please set your DEPLOYER_MNEMONIC in a .env file");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    }
  },
  namedAccounts: {
    deployer: 0
  },
  networks: {
    hardhat: {
      forking: {
        url: CONFIG.arbitrumMainnetRPCURL,
        enabled: true,
        blockNumber: 113544548
      }
    },
    network1: {
      url: "http://localhost:8545",
      forking: {
        url: CONFIG.arbitrumGoerliRPCURL,
        enabled: true
      }
    },
    network2: {
      url: "http://localhost:8546",
      forking: {
        url: CONFIG.goerliRPCURL,
        enabled: true
      }
    },
    arbitrum_goerli: {
      url: CONFIG.arbitrumGoerliRPCURL,
      accounts: {
        mnemonic: DEPLOYER_MNEMONIC,
        initialIndex: 0
      }
    },
    goerli: {
      url: CONFIG.goerliRPCURL,
      accounts: {
        mnemonic: DEPLOYER_MNEMONIC,
        initialIndex: 0
      }
    }
  }
};

export default config;
