//SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error AuctionDoesNotExist();
error AuctionIsNotOpen();
error OnlyAuctionOwner();
error AuctionIsNotExpired();
error AuctionPeriodPassed();
error AuctionIsNotClaimed();
error InvalidClaimer();
error ChallengePeriodInProgress();

// Contract that allows you to cross chain swap tokens in a trustless way using a permissionless auction mechanism
contract AISwap {
    uint256 public constant AUCTION_PERIOD = 1 minutes; // @dev You could think about this like a way to guarantee a fast swap
    uint256 public constant CHALLENGE_PERIOD = 5 minutes; // @dev This is the time that the claimer has to wait in order to settle the auction

    struct Auction {
        uint256 auctionId;
        address tokenInputAddress;
        address tokenOutputAddress;
        uint256 tokenInputAmount;
        uint256 minimumTokenOutputAmount;
        uint256 creationTime; // @dev This is the time when the auction is created
        uint256 claimingTime; // @dev This is the time when the auction is claimed
        address claimer; // @dev This is the address of the claimer
        address owner; // @dev This is the address of the owner of the auction
        AuctionStatus auctionStatus;
    }

    struct AuctionOrder {
        address tokenInputAddress;
        address tokenOutputAddress;
        uint256 tokenInputAmount;
        uint256 minimumTokenOutputAmount;
    }

    enum AuctionStatus {
        OPEN,
        CLAIMED,
        SETTLED,
        EXPIRED
    }

    uint256 public auctionCount;

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => bool) public auctionExists;

    event AuctionCreated(
        uint256 auctionId,
        address tokenInputAddress,
        address tokenOutputAddress,
        uint256 tokenInputAmount,
        uint256 minimumTokenOutputAmount,
        uint256 creationTime,
        AuctionStatus auctionStatus
    );

    event AuctionClaimed(
        uint256 auctionId,
        address tokenInputAddress,
        address tokenOutputAddress,
        uint256 tokenInputAmount,
        uint256 minimumTokenOutputAmount,
        uint256 creationTime,
        uint256 claimingTime,
        address claimer,
        address owner,
        AuctionStatus auctionStatus
    );

    // TODO
    event AuctionSettled();

    // Swapper Functions
    function createAuction(AuctionOrder calldata _order) external {
        uint256 auctionId = ++auctionCount;
        uint256 creationTime = block.timestamp;

        auctions[auctionId] = Auction(
            auctionId,
            _order.tokenInputAddress,
            _order.tokenOutputAddress,
            _order.tokenInputAmount,
            _order.minimumTokenOutputAmount,
            creationTime,
            0, // @dev claiming time is zero at creation
            address(0), // @dev claimer is zero at creation
            msg.sender, // @dev owner is the sender
            AuctionStatus.OPEN
        );

        auctionExists[auctionId] = true;

        // transfer tokens to this contract
        IERC20(_order.tokenInputAddress).transferFrom(msg.sender, address(this), _order.tokenInputAmount);

        emit AuctionCreated(
            auctionId,
            _order.tokenInputAddress,
            _order.tokenOutputAddress,
            _order.tokenInputAmount,
            _order.minimumTokenOutputAmount,
            creationTime,
            AuctionStatus.OPEN
        );
    }

    function reclaimAuction(uint256 _auctionId) external onlyValidAuctionIds(_auctionId) onlyAuctionOwner(_auctionId) {
        // @dev only open auctions that expired can be reclaimed
        if (auctions[_auctionId].auctionStatus != AuctionStatus.OPEN) {
            revert AuctionIsNotOpen();
        }

        // @dev only expired auctions can be reclaimed
        if (block.timestamp < auctions[_auctionId].creationTime + AUCTION_PERIOD) {
            revert AuctionIsNotExpired();
        }

        auctions[_auctionId].auctionStatus = AuctionStatus.EXPIRED;

        // transfer tokens back to the owner
        IERC20(auctions[_auctionId].tokenInputAddress).transfer(
            auctions[_auctionId].owner, auctions[_auctionId].tokenInputAmount
        );
    }

    // Claimer Functions
    function claimAuction(uint256 _auctionId) external onlyValidAuctionIds(_auctionId) {
        // @dev only open auctions can be claimed
        if (auctions[_auctionId].auctionStatus != AuctionStatus.OPEN) {
            revert AuctionIsNotOpen();
        }

        // @dev only auctions that are within the auction period can be claimed
        if (block.timestamp > auctions[_auctionId].creationTime + AUCTION_PERIOD) {
            revert AuctionPeriodPassed();
        }

        auctions[_auctionId].auctionStatus = AuctionStatus.CLAIMED;
        auctions[_auctionId].claimingTime = block.timestamp;
        auctions[_auctionId].claimer = msg.sender;
    }

    function settleAuction(uint256 _auctionId) external onlyValidAuctionIds(_auctionId) {
        // @dev auction has to be CLAIMED
        if (auctions[_auctionId].auctionStatus != AuctionStatus.CLAIMED) {
            revert AuctionIsNotClaimed();
        }

        // @dev cannot claim before the challenge period ends
        if (block.timestamp < auctions[_auctionId].claimingTime + CHALLENGE_PERIOD) {
            revert ChallengePeriodInProgress();
        }

        // @dev only claimer can settle
        if (auctions[_auctionId].claimer != msg.sender) {
            revert InvalidClaimer();
        }

        auctions[_auctionId].auctionStatus = AuctionStatus.SETTLED;

        // @dev transfer input tokens to the claimer
        IERC20(auctions[_auctionId].tokenInputAddress).transfer(
            auctions[_auctionId].claimer, auctions[_auctionId].tokenInputAmount
        );
    }

    // Modifiers
    modifier onlyValidAuctionIds(uint256 _auctionId) {
        if (!auctionExists[_auctionId]) {
            revert AuctionDoesNotExist();
        }
        _;
    }

    modifier onlyAuctionOwner(uint256 _auctionId) {
        if (auctions[_auctionId].owner != msg.sender) {
            revert OnlyAuctionOwner();
        }
        _;
    }
}
