//SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20 {
    constructor(address _beneficiary) ERC20("WETH", "WETH") {
        _mint(_beneficiary, 1_000 ether); // We give 1k WETH to the deployer
    }
}
