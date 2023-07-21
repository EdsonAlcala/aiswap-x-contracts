import { ethers } from "hardhat";

async function main() {
  // Start ganache node1 with fork 

  // Start ganache node2 with fork

  // Deploy WETH contract in network 1

  // Deploy USDC contract in network 2

  // Deploy AISwap contract in network 1

  // Start intent (I want to swap 10 ETH for USDC)

  // Get quote

  // User sends the intent and start an auction (transaction executed in network 1)

  // Market maker takes de auction (transaction in network 1 to lock the auction)

  // Market maker sends the transaction to network 2

  // After X time, Market maker claims the user funds in network 1
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
