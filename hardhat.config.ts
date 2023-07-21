require('dotenv').config()

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "hardhat-deploy";

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
        url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
        enabled: true,
        blockNumber: 113544548
      }
    },
    network1: {
      url: "http://localhost:8545",
      forking: {
        url: `https://arbitrum-goerli.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
        enabled: true
      }
    },
    network2: {
      url: "http://localhost:8546",
      forking: {
        url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
        enabled: true
      }
    },
    arbitrum_goerli: {
      url: `https://arbitrum-goerli.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
      accounts: {
        mnemonic: process.env.ARBITRUM_TESTNET_MNEMONIC || "",
        initialIndex: 1
      }
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
      accounts: {
        mnemonic: process.env.GOERLI_TESTNET_MNEMONIC || "",
        initialIndex: 2
      }
    }
  }
};

export default config;
