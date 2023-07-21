import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { WETH, WETH__factory } from '../typechain-types'

describe("WETH tests", () => {
  let wethToken: WETH;

  beforeEach(async () => {
    await deployments.fixture(["WETH"]);

    const deployment = await deployments.get("WETH");

    wethToken = WETH__factory.connect(deployment.address, ethers.provider);
  })

  it("should have the right parameters", async () => {
    expect(await wethToken.name()).to.equal("WETH");
    expect(await wethToken.symbol()).to.equal("WETH");
    expect(await wethToken.decimals()).to.equal(18);
    expect(await wethToken.totalSupply()).to.equal(ethers.parseEther("1000"));
  })
})

