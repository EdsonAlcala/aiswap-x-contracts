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
    // hardhat: {
    // },
    // arbitrum_goerli: {

    // },
    // goerli: {

    // }
  }
};

export default config;
