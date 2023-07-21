import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

import { CONFIG } from "../config";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy('WETH', {
        from: deployer,
        args: [CONFIG.sampleUserAddress],
        log: true,
    });
};

export default func;

func.tags = ['all', 'WETH'];