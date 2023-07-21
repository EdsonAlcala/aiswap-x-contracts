//SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDC is ERC20 {
    constructor(address _beneficiary) ERC20("USDC", "USDC") {
        _mint(_beneficiary, 2_000_000 ether); // We give 2M USDC to the deployer
    }
}
