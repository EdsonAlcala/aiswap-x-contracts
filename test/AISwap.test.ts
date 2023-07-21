import {
    time,
    loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { USDC, USDC__factory, WETH, WETH__factory, AISwap, AISwap__factory } from '../typechain-types'

describe("AISwap tests", () => {
    let usdcToken: USDC;
    let wethToken: WETH;
    let aiSwap: AISwap;

    beforeEach(async () => {
        await deployments.fixture(["USDC", "WETH", "AISwap"]);

        const usdcDeployment = await deployments.get("USDC");
        const wethDeployment = await deployments.get("WETH");
        const aiSwapDeployment = await deployments.get("AISwap");

        usdcToken = USDC__factory.connect(usdcDeployment.address, ethers.provider);
        wethToken = WETH__factory.connect(wethDeployment.address, ethers.provider);
        aiSwap = AISwap__factory.connect(aiSwapDeployment.address, ethers.provider);
    })

    // SWAPPERS FUNCTIONS

    // create auction

    // reclaim auction

    it("should create an auction", async () => {

    })

    it("should reclaim an auction", async () => {

    })

    it("shouldn't allow to reclaim an auction if auction period hasn't passed", async () => {

    })

    it("shouldn't allow a non auction owner to reclaim an auction", async () => {

    })

    it("shouldn throw error if auction doesn't exists", async () => {

    })

    // CLAIMER FUNCTIONS

    // claim auction

    // settle auction
    it("should claim an auction", async () => {

    })

    it("shouldn't allow to claim an auction that is not open", async () => {

    })

    it("shouldn't allow to claim an auction when the auction period hasn't passed", async () => {

    })

    it("should settle an auction", async () => {

    })

    it("shouldn't allow settle an auction that is not claimed", async () => {

    })

    it("shouldn't allow settle an auction from a non claimer", async () => {

    })
})

