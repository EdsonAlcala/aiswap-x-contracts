import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { USDC, USDC__factory } from '../typechain-types'

describe("USDC tests", () => {
  let usdcToken: USDC;

  beforeEach(async () => {
    await deployments.fixture(["USDC"]);

    const usdcDeployment = await deployments.get("USDC");

    usdcToken = USDC__factory.connect(usdcDeployment.address, ethers.provider);
  })

  it("should have the right parameters", async () => {
    expect(await usdcToken.name()).to.equal("USDC");
    expect(await usdcToken.symbol()).to.equal("USDC");
    expect(await usdcToken.decimals()).to.equal(18);
    expect(await usdcToken.totalSupply()).to.equal(ethers.parseEther("2000000"));
  })
})

