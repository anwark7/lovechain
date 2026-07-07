// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LoveChain
 * @notice A relationship commitment escrow. Two partners lock native testnet ETH
 *         into a "love contract". Funds are only released through agreed outcomes:
 *         Wedding Unlock, Peaceful Exit, Breach Resolution, or a time-based Expiry
 *         fallback that guarantees funds are NEVER permanently stuck.
 *
 * @dev    TESTNET LEARNING PROJECT. Not financial or legal advice. Uses a
 *         pull-payment pattern for all payouts (see {claimPayout} / {withdraw}),
 *         reentrancy protection, and strict caller/permission validation.
 *
 *         Deposits are symmetric in the MVP: partner B must match partner A's
 *         deposit exactly (PRD §33.4). Only the evidence *URI/hash* is stored
 *         on-chain, never raw evidence (PRD §18).
 */
contract LoveChain is ReentrancyGuard, Ownable {
    // ─────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────

    /// @notice Basis-point denominator (100% = 10_000 bps).
    uint256 public constant BPS_DENOMINATOR = 10_000;

    /// @notice Exactly five witnesses per contract (PRD §26).
    uint256 public constant WITNESS_COUNT = 5;

    /// @notice Witness approvals required to validate a Wedding Unlock (3 of 5).
    uint256 public constant WEDDING_THRESHOLD = 3;

    /// @notice Witness approvals required to validate a Breach Claim (4 of 5).
    uint256 public constant BREACH_THRESHOLD = 4;

    // Platform fee tiers, in basis points (PRD §28.2).
    uint256 public constant WEDDING_FEE_BPS = 25; // 0.25%
    uint256 public constant PEACEFUL_FEE_BPS = 50; // 0.50%
    uint256 public constant BREACH_FEE_BPS = 100; // 1.00%
    uint256 public constant EXPIRED_FEE_BPS = 50; // 0.50%

    // ─────────────────────────────────────────────────────────────
    // Enums
    // ─────────────────────────────────────────────────────────────

    /// @notice Lifecycle state of a love contract (PRD §11).
    enum ContractStatus {
        PENDING_PARTNER, // created by A, awaiting B's acceptance + deposit
        ACTIVE, // both deposited, relationship running
        WEDDING_REQUESTED, // wedding unlock requested, awaiting confirm + votes
        MARRIAGE_CONFIRMED, // wedding validated, funds claimable
        BREAKUP_REQUESTED, // peaceful exit requested, awaiting other partner
        COOLING_PERIOD, // peaceful exit approved, cooling before finalize
        DISPUTED, // breach claim raised, in challenge/voting
        RESOLVED, // terminal: outcome decided, funds claimable
        CANCELLED, // terminal: cancelled while pending, A refunded
        EXPIRED // terminal: duration elapsed with no outcome, timeout withdrawal
    }

    /// @notice The concrete outcome that determines payout math & fee tier.
    /// @dev    Stored alongside {ContractStatus} because several outcomes collapse
    ///         into RESOLVED but need different fee/split logic at payout time.
    enum Outcome {
        NONE,
        WEDDING,
        PEACEFUL,
        BREACH_VALID,
        BREACH_REJECTED,
        EXPIRED
    }

    // ─────────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────────

    /// @notice A single love contract between two partners (PRD §13.1).
    struct LoveContract {
        uint256 id;
        address partnerA;
        address partnerB;
        uint256 depositA;
        uint256 depositB;
        uint256 createdAt;
        uint256 activatedAt; // set when B accepts; duration counts from here
        uint256 duration; // relationship term (seconds) from activation
        uint256 lastCheckInA;
        uint256 lastCheckInB;
        uint256 weddingRequestedAt; // start of the wedding approval window
        uint256 coolingEndsAt; // timestamp cooling period finishes
        ContractStatus status;
        Outcome outcome;
        bool partnerAConfirmedWedding;
        bool partnerBConfirmedWedding;
        bool partnerAClaimed;
        bool partnerBClaimed;
    }

    /// @notice A breach claim raised by one partner against the other (PRD §13.2).
    struct BreachClaim {
        address claimant;
        address accused;
        string evidenceURI;
        uint256 bondAmount;
        uint256 createdAt;
        uint256 votingEndsAt;
        uint256 approveVotes;
        uint256 rejectVotes;
        bool challenged;
        bool resolved;
        bool exists;
    }

    // ─────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────

    /// @notice Auto-incrementing id of the next contract to be created.
    uint256 public nextContractId;

    /// @notice contractId => love contract.
    mapping(uint256 => LoveContract) private _contracts;

    /// @notice contractId => the (up to five) witness addresses.
    mapping(uint256 => address[]) private _witnesses;

    /// @notice contractId => witness address => is a registered witness.
    mapping(uint256 => mapping(address => bool)) private _isWitness;

    /// @notice contractId => the free-text relationship rules.
    mapping(uint256 => string[]) private _rules;

    /// @notice contractId => the active breach claim (if any).
    mapping(uint256 => BreachClaim) private _claims;

    /// @notice contractId => witness address => has already voted.
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    /// @notice Pull-payment ledger: address => claimable wei.
    mapping(address => uint256) public pendingWithdrawals;

    /// @notice Total platform fees accrued to the owner, in wei.
    uint256 public accruedFees;

    // Configurable demo windows (seconds) — set at deploy (PRD §26 / §30).
    uint256 public coolingPeriod;
    uint256 public challengePeriod;
    uint256 public weddingWindow;

    /// @notice Share of the accused's deposit awarded to a claimant on a
    ///         VALID breach, in basis points (10_000 = 100%). Owner-configurable.
    uint256 public breachAwardBps;

    // ─────────────────────────────────────────────────────────────
    // Events — one (or more) per state transition, for the frontend.
    // ─────────────────────────────────────────────────────────────

    event ContractCreated(
        uint256 indexed contractId,
        address indexed partnerA,
        address indexed partnerB,
        uint256 depositA,
        uint256 duration
    );
    event ContractAccepted(uint256 indexed contractId, address indexed partnerB, uint256 depositB);
    event ContractCancelled(uint256 indexed contractId, address indexed partnerA, uint256 refund);
    event CheckedIn(uint256 indexed contractId, address indexed partner, uint256 timestamp);

    event WeddingRequested(uint256 indexed contractId, address indexed requester, string proofURI);
    event WeddingConfirmed(uint256 indexed contractId, address indexed partner);
    event WeddingVoteCast(uint256 indexed contractId, address indexed witness, uint256 approveVotes);
    event WeddingUnlocked(uint256 indexed contractId, uint256 approveVotes);
    event WeddingRequestExpired(uint256 indexed contractId);
    event WeddingBadge(uint256 indexed contractId, address indexed partnerA, address indexed partnerB);

    event PeacefulExitRequested(uint256 indexed contractId, address indexed requester);
    event PeacefulExitApproved(uint256 indexed contractId, address indexed approver, uint256 coolingEndsAt);
    event PeacefulExitFinalized(uint256 indexed contractId);

    event BreachClaimRaised(
        uint256 indexed contractId,
        address indexed claimant,
        address indexed accused,
        uint256 bondAmount,
        string evidenceURI
    );
    event BreachChallenged(uint256 indexed contractId, address indexed accused);
    event DisputeVoteCast(
        uint256 indexed contractId,
        address indexed witness,
        bool approveClaim,
        uint256 approveVotes,
        uint256 rejectVotes
    );
    event BreachResolved(uint256 indexed contractId, bool claimValid);

    event ContractExpired(uint256 indexed contractId);
    event Payout(uint256 indexed contractId, address indexed partner, uint256 amount);
    event Withdrawal(address indexed account, uint256 amount);
    event FeesWithdrawn(address indexed to, uint256 amount);
    event Funded(uint256 indexed contractId, address indexed to, uint256 amount);

    event BreachAwardBpsUpdated(uint256 newBps);
    event WindowsUpdated(uint256 coolingPeriod, uint256 challengePeriod, uint256 weddingWindow);

    // ─────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────

    error InvalidPartner();
    error InvalidDeposit();
    error InvalidDuration();
    error InvalidWitnesses();
    error DuplicateWitness();
    error WitnessIsPartner();
    error ContractNotFound();
    error WrongStatus();
    error NotPartner();
    error NotWitness();
    error AlreadyVoted();
    error DepositMismatch();
    error MissingProof();
    error MissingEvidence();
    error BondRequired();
    error NotYetExpired();
    error WindowNotElapsed();
    error WindowStillOpen();
    error AlreadyClaimed();
    error NothingToWithdraw();
    error NotBothConfirmed();
    error InvalidBps();

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    /**
     * @param _coolingPeriod   Peaceful-exit cooling window (seconds).
     * @param _challengePeriod Breach challenge + voting window (seconds).
     * @param _weddingWindow   Wedding approval window (seconds).
     * @param _breachAwardBps  Default share of accused deposit on valid breach (bps).
     */
    constructor(
        uint256 _coolingPeriod,
        uint256 _challengePeriod,
        uint256 _weddingWindow,
        uint256 _breachAwardBps
    ) Ownable(msg.sender) {
        if (_breachAwardBps > BPS_DENOMINATOR) revert InvalidBps();
        coolingPeriod = _coolingPeriod;
        challengePeriod = _challengePeriod;
        weddingWindow = _weddingWindow;
        breachAwardBps = _breachAwardBps;
    }

    // ─────────────────────────────────────────────────────────────
    // Modifiers / internal guards
    // ─────────────────────────────────────────────────────────────

    function _get(uint256 contractId) internal view returns (LoveContract storage c) {
        c = _contracts[contractId];
        if (c.partnerA == address(0)) revert ContractNotFound();
    }

    function _onlyPartner(LoveContract storage c) internal view {
        if (msg.sender != c.partnerA && msg.sender != c.partnerB) revert NotPartner();
    }

    // ─────────────────────────────────────────────────────────────
    // Admin (owner) configuration
    // ─────────────────────────────────────────────────────────────

    /// @notice Update the share of the accused deposit awarded on a valid breach.
    function setBreachAwardBps(uint256 newBps) external onlyOwner {
        if (newBps > BPS_DENOMINATOR) revert InvalidBps();
        breachAwardBps = newBps;
        emit BreachAwardBpsUpdated(newBps);
    }

    /// @notice Update the demo timing windows.
    function setWindows(
        uint256 _coolingPeriod,
        uint256 _challengePeriod,
        uint256 _weddingWindow
    ) external onlyOwner {
        coolingPeriod = _coolingPeriod;
        challengePeriod = _challengePeriod;
        weddingWindow = _weddingWindow;
        emit WindowsUpdated(_coolingPeriod, _challengePeriod, _weddingWindow);
    }
}
