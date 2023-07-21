import { time, setBalance, impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { expect } from "chai";
import { deployments, ethers } from "hardhat";

import { USDC, USDC__factory, WETH, WETH__factory, AISwap, AISwap__factory } from '../typechain-types'
import { CONFIG } from "../config";

enum AuctionStatus {
    OPEN,
    CLAIMED,
    SETTLED,
    EXPIRED
}

describe("AISwap tests", () => {
    let usdcToken: USDC;
    let wethToken: WETH;
    let aiSwap: AISwap;

    let usdcTokenAddress: string
    let wethTokenAddress: string
    let aiSwapAddress: string

    let deployer: HardhatEthersSigner

    beforeEach(async () => {
        [deployer] = await ethers.getSigners()

        await deployments.fixture(["USDC", "WETH", "AISwap"]);

        const usdcDeployment = await deployments.get("USDC");
        const wethDeployment = await deployments.get("WETH");
        const aiSwapDeployment = await deployments.get("AISwap");

        usdcToken = USDC__factory.connect(usdcDeployment.address, ethers.provider);
        wethToken = WETH__factory.connect(wethDeployment.address, ethers.provider);
        aiSwap = AISwap__factory.connect(aiSwapDeployment.address, ethers.provider);

        usdcTokenAddress = usdcDeployment.address;
        wethTokenAddress = wethDeployment.address;
        aiSwapAddress = aiSwapDeployment.address;
    })

    // SWAPPERS FUNCTIONS

    // create auction
    it("should create an auction", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);

        const tx = aiSwap.connect(swapperSigner).createAuction({
            tokenInputAddress: wethTokenAddress,
            tokenOutputAddress: usdcTokenAddress,
            tokenInputAmount: inputAmount,
            minimumTokenOutputAmount: minimumOutputAmount,
        });

        const timeStamp = await time.latest();
        const nextBlockTimeStamp = timeStamp + 1
        await time.setNextBlockTimestamp(nextBlockTimeStamp);

        await expect(tx).to.emit(aiSwap, "AuctionCreated")
            .withArgs(1,
                wethTokenAddress,
                usdcTokenAddress,
                inputAmount,
                minimumOutputAmount,
                timeStamp + 1,
                AuctionStatus.OPEN
            );

        const auction = await aiSwap.auctions(1);

        expect(auction.auctionId).to.be.equal(1);
        expect(auction.tokenInputAddress).to.be.equal(wethTokenAddress);
        expect(auction.tokenOutputAddress).to.be.equal(usdcTokenAddress);
        expect(auction.tokenInputAmount).to.be.equal(inputAmount);
        expect(auction.minimumTokenOutputAmount).to.be.equal(minimumOutputAmount);
        expect(auction.creationTime).to.be.equal(nextBlockTimeStamp);
        expect(auction.claimingTime).to.be.equal(0);
        expect(auction.claimer).to.be.equal(ethers.ZeroAddress);
        expect(auction.owner).to.be.equal(swapperSigner.address);
        expect(auction.auctionStatus).to.be.equal(AuctionStatus.OPEN);
    })

    // reclaim auction
    it("should reclaim an auction funds", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);
        await aiSwap.connect(swapperSigner).createAuction({
            tokenInputAddress: wethTokenAddress,
            tokenOutputAddress: usdcTokenAddress,
            tokenInputAmount: inputAmount,
            minimumTokenOutputAmount: minimumOutputAmount,
        });

        // move time to pass auction period
        const auctionPeriod = await aiSwap.AUCTION_PERIOD();

        await time.increase(auctionPeriod);

        await expect(aiSwap.connect(swapperSigner).reclaimAuctionFunds(1))
            .to.emit(aiSwap, "AuctionFundsClaimed")
            .withArgs(1, AuctionStatus.EXPIRED);
    })

    it("shouldn't allow to reclaim an auction if auction period hasn't passed", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);
        await aiSwap.connect(swapperSigner).createAuction({
            tokenInputAddress: wethTokenAddress,
            tokenOutputAddress: usdcTokenAddress,
            tokenInputAmount: inputAmount,
            minimumTokenOutputAmount: minimumOutputAmount,
        });

        await expect(aiSwap.connect(swapperSigner).reclaimAuctionFunds(1))
            .to.revertedWithCustomError(aiSwap, "AuctionIsNotExpired");
    })

    it("shouldn't allow a non auction owner to reclaim an auction", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);
        await aiSwap.connect(swapperSigner).createAuction({
            tokenInputAddress: wethTokenAddress,
            tokenOutputAddress: usdcTokenAddress,
            tokenInputAmount: inputAmount,
            minimumTokenOutputAmount: minimumOutputAmount,
        });

        // move time to pass auction period
        const auctionPeriod = await aiSwap.AUCTION_PERIOD();

        await time.increase(auctionPeriod);

        await expect(aiSwap.connect(deployer).reclaimAuctionFunds(1))
            .to.revertedWithCustomError(aiSwap, "OnlyAuctionOwner");
    })

    it("shouldn throw error if auction doesn't exists", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);
        await aiSwap.connect(swapperSigner).createAuction({
            tokenInputAddress: wethTokenAddress,
            tokenOutputAddress: usdcTokenAddress,
            tokenInputAmount: inputAmount,
            minimumTokenOutputAmount: minimumOutputAmount,
        });

        // move time to pass auction period
        const auctionPeriod = await aiSwap.AUCTION_PERIOD();

        await time.increase(auctionPeriod);

        await expect(aiSwap.connect(deployer).reclaimAuctionFunds(2)) // @dev non existing auction id
            .to.revertedWithCustomError(aiSwap, "AuctionDoesNotExist");
    })

    // CLAIMER FUNCTIONS

    // settle auction
    // it("should claim an auction", async () => {

    // })

    // it("shouldn't allow to claim an auction that is not open", async () => {

    // })

    // it("shouldn't allow to claim an auction when the auction period hasn't passed", async () => {

    // })

    // it("should settle an auction", async () => {

    // })

    // it("shouldn't allow settle an auction that is not claimed", async () => {

    // })

    // it("shouldn't allow settle an auction from a non claimer", async () => {

    // })

    // UTILS
    const getSwapperSigner = async () => {
        const impersonatedAddress = CONFIG.sampleUserAddress;
        await setBalance(
            impersonatedAddress,
            ethers.parseEther("100.0")
        );
        await impersonateAccount(impersonatedAddress);
        const impersonatedSigner = await ethers.getSigner(impersonatedAddress);
        return impersonatedSigner;
    }

})


