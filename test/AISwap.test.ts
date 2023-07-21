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

    // RECLAIM AUCTION FUNDS
    it("should reclaim an auction funds", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);
        const timeStamp = await time.latest();

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

        const auction = await aiSwap.auctions(1);

        expect(auction.auctionId).to.be.equal(1);
        expect(auction.tokenInputAddress).to.be.equal(wethTokenAddress);
        expect(auction.tokenOutputAddress).to.be.equal(usdcTokenAddress);
        expect(auction.tokenInputAmount).to.be.equal(inputAmount);
        expect(auction.minimumTokenOutputAmount).to.be.equal(minimumOutputAmount);
        expect(auction.creationTime).to.be.equal(timeStamp + 1);
        expect(auction.claimingTime).to.be.equal(0);
        expect(auction.claimer).to.be.equal(ethers.ZeroAddress);
        expect(auction.owner).to.be.equal(swapperSigner.address);
        expect(auction.auctionStatus).to.be.equal(AuctionStatus.EXPIRED);
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

    // CLAIM
    it("should claim an auction", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);
        const timeStamp = await time.latest();
        await aiSwap.connect(swapperSigner).createAuction({
            tokenInputAddress: wethTokenAddress,
            tokenOutputAddress: usdcTokenAddress,
            tokenInputAmount: inputAmount,
            minimumTokenOutputAmount: minimumOutputAmount,
        });

        const claimerSigner = await getClaimerSigner();

        const newClaimTimestamp = await time.latest();
        await expect(aiSwap.connect(claimerSigner).claimAuction(1))
            .to.emit(aiSwap, "AuctionClaimed")
            .withArgs(1, newClaimTimestamp + 1, claimerSigner.address, AuctionStatus.CLAIMED);

        const auction = await aiSwap.auctions(1);
        expect(auction.auctionId).to.be.equal(1);
        expect(auction.tokenInputAddress).to.be.equal(wethTokenAddress);
        expect(auction.tokenOutputAddress).to.be.equal(usdcTokenAddress);
        expect(auction.tokenInputAmount).to.be.equal(inputAmount);
        expect(auction.minimumTokenOutputAmount).to.be.equal(minimumOutputAmount);
        expect(auction.creationTime).to.be.equal(timeStamp + 1);
        expect(auction.claimingTime).to.be.equal(newClaimTimestamp + 1);
        expect(auction.claimer).to.be.equal(await claimerSigner.getAddress());
        expect(auction.owner).to.be.equal(swapperSigner.address);
        expect(auction.auctionStatus).to.be.equal(AuctionStatus.CLAIMED);
    })

    it("shouldn't allow to claim an auction when the period has passed", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);
        const timeStamp = await time.latest();

        await aiSwap.connect(swapperSigner).createAuction({
            tokenInputAddress: wethTokenAddress,
            tokenOutputAddress: usdcTokenAddress,
            tokenInputAmount: inputAmount,
            minimumTokenOutputAmount: minimumOutputAmount,
        });


        // move time to pass auction period
        const auctionPeriod = await aiSwap.AUCTION_PERIOD();

        await time.increase(auctionPeriod);

        const claimerSigner = await getClaimerSigner();

        await expect(aiSwap.connect(claimerSigner).claimAuction(1))
            .to.be.revertedWithCustomError(aiSwap, "AuctionPeriodPassed");
    })

    it("shouldn't allow to claim an auction that is not open", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);
        const timeStamp = await time.latest();

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

        const claimerSigner = await getClaimerSigner();

        await expect(aiSwap.connect(claimerSigner).claimAuction(1))
            .to.be.revertedWithCustomError(aiSwap, "AuctionIsNotOpen");
    })

    // SETTLE

    it("should settle an auction", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);
        const timeStamp = await time.latest();
        await aiSwap.connect(swapperSigner).createAuction({
            tokenInputAddress: wethTokenAddress,
            tokenOutputAddress: usdcTokenAddress,
            tokenInputAmount: inputAmount,
            minimumTokenOutputAmount: minimumOutputAmount,
        });

        const claimerSigner = await getClaimerSigner();

        const newClaimTimestamp = await time.latest();
        await expect(aiSwap.connect(claimerSigner).claimAuction(1))
            .to.emit(aiSwap, "AuctionClaimed")
            .withArgs(1, newClaimTimestamp + 1, claimerSigner.address, AuctionStatus.CLAIMED);

        const auction = await aiSwap.auctions(1);
        expect(auction.auctionId).to.be.equal(1);
        expect(auction.tokenInputAddress).to.be.equal(wethTokenAddress);
        expect(auction.tokenOutputAddress).to.be.equal(usdcTokenAddress);
        expect(auction.tokenInputAmount).to.be.equal(inputAmount);
        expect(auction.minimumTokenOutputAmount).to.be.equal(minimumOutputAmount);
        expect(auction.creationTime).to.be.equal(timeStamp + 1);
        expect(auction.claimingTime).to.be.equal(newClaimTimestamp + 1);
        expect(auction.claimer).to.be.equal(await claimerSigner.getAddress());
        expect(auction.owner).to.be.equal(swapperSigner.address);
        expect(auction.auctionStatus).to.be.equal(AuctionStatus.CLAIMED);

        const challengePeriod = await aiSwap.CHALLENGE_PERIOD();

        await time.increase(challengePeriod);

        await expect(aiSwap.connect(claimerSigner).settleAuction(1))
            .to.emit(aiSwap, "AuctionSettled")
            .withArgs(1, AuctionStatus.SETTLED);

        const auctionAgain = await aiSwap.auctions(1);
        expect(auctionAgain.auctionId).to.be.equal(1);
        expect(auctionAgain.tokenInputAddress).to.be.equal(wethTokenAddress);
        expect(auctionAgain.tokenOutputAddress).to.be.equal(usdcTokenAddress);
        expect(auctionAgain.tokenInputAmount).to.be.equal(inputAmount);
        expect(auctionAgain.minimumTokenOutputAmount).to.be.equal(minimumOutputAmount);
        expect(auctionAgain.creationTime).to.be.equal(timeStamp + 1);
        expect(auctionAgain.claimingTime).to.be.equal(newClaimTimestamp + 1);
        expect(auctionAgain.claimer).to.be.equal(await claimerSigner.getAddress());
        expect(auctionAgain.owner).to.be.equal(swapperSigner.address);
        expect(auctionAgain.auctionStatus).to.be.equal(AuctionStatus.SETTLED);
    })

    it("shouldn't allow settle an auction that is not claimed", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);
        const timeStamp = await time.latest();
        await aiSwap.connect(swapperSigner).createAuction({
            tokenInputAddress: wethTokenAddress,
            tokenOutputAddress: usdcTokenAddress,
            tokenInputAmount: inputAmount,
            minimumTokenOutputAmount: minimumOutputAmount,
        });

        const claimerSigner = await getClaimerSigner();

        const challengePeriod = await aiSwap.CHALLENGE_PERIOD();

        await time.increase(challengePeriod);

        await expect(aiSwap.connect(claimerSigner).settleAuction(1))
            .to.revertedWithCustomError(aiSwap, "AuctionIsNotClaimed");
    })

    it("shouldn't allow settle an auction from a non claimer", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);
        const timeStamp = await time.latest();
        await aiSwap.connect(swapperSigner).createAuction({
            tokenInputAddress: wethTokenAddress,
            tokenOutputAddress: usdcTokenAddress,
            tokenInputAmount: inputAmount,
            minimumTokenOutputAmount: minimumOutputAmount,
        });

        const claimerSigner = await getClaimerSigner();

        const newClaimTimestamp = await time.latest();
        await expect(aiSwap.connect(claimerSigner).claimAuction(1))
            .to.emit(aiSwap, "AuctionClaimed")
            .withArgs(1, newClaimTimestamp + 1, claimerSigner.address, AuctionStatus.CLAIMED);

        const auction = await aiSwap.auctions(1);
        expect(auction.auctionId).to.be.equal(1);
        expect(auction.tokenInputAddress).to.be.equal(wethTokenAddress);
        expect(auction.tokenOutputAddress).to.be.equal(usdcTokenAddress);
        expect(auction.tokenInputAmount).to.be.equal(inputAmount);
        expect(auction.minimumTokenOutputAmount).to.be.equal(minimumOutputAmount);
        expect(auction.creationTime).to.be.equal(timeStamp + 1);
        expect(auction.claimingTime).to.be.equal(newClaimTimestamp + 1);
        expect(auction.claimer).to.be.equal(await claimerSigner.getAddress());
        expect(auction.owner).to.be.equal(swapperSigner.address);
        expect(auction.auctionStatus).to.be.equal(AuctionStatus.CLAIMED);

        const challengePeriod = await aiSwap.CHALLENGE_PERIOD();

        await time.increase(challengePeriod);

        await expect(aiSwap.connect(deployer).settleAuction(1))
            .to.be.revertedWithCustomError(aiSwap, "InvalidClaimer");
    })

    it("shouldn't settle an auction if the ChallengePeriodInProgress", async () => {
        const inputAmount = ethers.parseEther("10");
        const minimumOutputAmount = ethers.parseEther("10000");

        const swapperSigner = await getSwapperSigner();
        await wethToken.connect(swapperSigner).approve(aiSwapAddress, inputAmount);
        const timeStamp = await time.latest();
        await aiSwap.connect(swapperSigner).createAuction({
            tokenInputAddress: wethTokenAddress,
            tokenOutputAddress: usdcTokenAddress,
            tokenInputAmount: inputAmount,
            minimumTokenOutputAmount: minimumOutputAmount,
        });

        const claimerSigner = await getClaimerSigner();

        const newClaimTimestamp = await time.latest();
        await expect(aiSwap.connect(claimerSigner).claimAuction(1))
            .to.emit(aiSwap, "AuctionClaimed")
            .withArgs(1, newClaimTimestamp + 1, claimerSigner.address, AuctionStatus.CLAIMED);

        const auction = await aiSwap.auctions(1);
        expect(auction.auctionId).to.be.equal(1);
        expect(auction.tokenInputAddress).to.be.equal(wethTokenAddress);
        expect(auction.tokenOutputAddress).to.be.equal(usdcTokenAddress);
        expect(auction.tokenInputAmount).to.be.equal(inputAmount);
        expect(auction.minimumTokenOutputAmount).to.be.equal(minimumOutputAmount);
        expect(auction.creationTime).to.be.equal(timeStamp + 1);
        expect(auction.claimingTime).to.be.equal(newClaimTimestamp + 1);
        expect(auction.claimer).to.be.equal(await claimerSigner.getAddress());
        expect(auction.owner).to.be.equal(swapperSigner.address);
        expect(auction.auctionStatus).to.be.equal(AuctionStatus.CLAIMED);

        await expect(aiSwap.connect(claimerSigner).settleAuction(1))
            .to.be.revertedWithCustomError(aiSwap, "ChallengePeriodInProgress");
    })

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

    const getClaimerSigner = async () => {
        const impersonatedAddress = CONFIG.marketMakerAddress;
        await setBalance(
            impersonatedAddress,
            ethers.parseEther("100.0")
        );
        await impersonateAccount(impersonatedAddress);
        const impersonatedSigner = await ethers.getSigner(impersonatedAddress);
        return impersonatedSigner;
    }
})


