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

  // async function main() {
  //   const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  //   const unlockTime = currentTimestampInSeconds + 60;

  //   const lockedAmount = ethers.parseEther("0.001");

  //   const lock = await ethers.deployContract("Lock", [unlockTime], {
  //     value: lockedAmount,
  //   });

  //   await lock.waitForDeployment();

  //   console.log(
  //     `Lock with ${ethers.formatEther(
  //       lockedAmount
  //     )}ETH and unlock timestamp ${unlockTime} deployed to ${lock.target}`
  //   );
  // }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
