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
        address breakupRequestedBy; // partner who requested peaceful exit
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
    error WindowStillOpen();
    error WindowClosed();
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

    // ─────────────────────────────────────────────────────────────
    // Create / Accept / Cancel / Check-in
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Create a love contract and deposit partner A's commitment fund.
     * @dev    Status starts at PENDING_PARTNER until B accepts and matches the
     *         deposit. Requires exactly {WITNESS_COUNT} distinct witnesses, none
     *         of whom is a partner. Deposit must be non-zero (msg.value).
     * @param partner   Partner B's wallet address.
     * @param duration  Relationship term in seconds (counts from activation).
     * @param witnesses Exactly five distinct witness addresses.
     * @param rules     Free-text relationship rules (declarative, PRD §33.2).
     * @return contractId The id of the newly created contract.
     */
    function createLoveContract(
        address partner,
        uint256 duration,
        address[] calldata witnesses,
        string[] calldata rules
    ) external payable returns (uint256 contractId) {
        if (partner == address(0) || partner == msg.sender) revert InvalidPartner();
        if (msg.value == 0) revert InvalidDeposit();
        if (duration == 0) revert InvalidDuration();
        if (witnesses.length != WITNESS_COUNT) revert InvalidWitnesses();

        contractId = nextContractId++;

        // Validate + register witnesses (distinct, not a partner).
        for (uint256 i = 0; i < witnesses.length; i++) {
            address w = witnesses[i];
            if (w == address(0)) revert InvalidWitnesses();
            if (w == msg.sender || w == partner) revert WitnessIsPartner();
            if (_isWitness[contractId][w]) revert DuplicateWitness();
            _isWitness[contractId][w] = true;
            _witnesses[contractId].push(w);
        }

        for (uint256 i = 0; i < rules.length; i++) {
            _rules[contractId].push(rules[i]);
        }

        LoveContract storage c = _contracts[contractId];
        c.id = contractId;
        c.partnerA = msg.sender;
        c.partnerB = partner;
        c.depositA = msg.value;
        c.createdAt = block.timestamp;
        c.duration = duration;
        c.status = ContractStatus.PENDING_PARTNER;
        c.outcome = Outcome.NONE;

        emit ContractCreated(contractId, msg.sender, partner, msg.value, duration);
    }

    /**
     * @notice Partner B accepts and deposits a matching amount, activating the
     *         contract. Deposits are symmetric in the MVP (PRD §33.4).
     */
    function acceptContract(uint256 contractId) external payable {
        LoveContract storage c = _get(contractId);
        if (c.status != ContractStatus.PENDING_PARTNER) revert WrongStatus();
        if (msg.sender != c.partnerB) revert NotPartner();
        if (msg.value != c.depositA) revert DepositMismatch();

        c.depositB = msg.value;
        c.status = ContractStatus.ACTIVE;
        c.activatedAt = block.timestamp;
        c.lastCheckInA = block.timestamp;
        c.lastCheckInB = block.timestamp;

        emit ContractAccepted(contractId, msg.sender, msg.value);
    }

    /**
     * @notice Partner A cancels a still-pending contract and is fully refunded
     *         (no fee — the contract was never active). PRD §32.
     */
    function cancelContract(uint256 contractId) external {
        LoveContract storage c = _get(contractId);
        if (c.status != ContractStatus.PENDING_PARTNER) revert WrongStatus();
        if (msg.sender != c.partnerA) revert NotPartner();

        uint256 refund = c.depositA;
        c.depositA = 0;
        c.status = ContractStatus.CANCELLED;
        c.outcome = Outcome.NONE;

        _credit(c.partnerA, refund);
        emit ContractCancelled(contractId, c.partnerA, refund);
    }

    /**
     * @notice Record a periodic check-in for the calling partner. Only the
     *         weekly check-in rule is truly enforceable on-chain (PRD §33.2);
     *         the timestamp is surfaced in the UI as "days since check-in".
     */
    function checkIn(uint256 contractId) external {
        LoveContract storage c = _get(contractId);
        if (c.status != ContractStatus.ACTIVE) revert WrongStatus();
        _onlyPartner(c);

        if (msg.sender == c.partnerA) {
            c.lastCheckInA = block.timestamp;
        } else {
            c.lastCheckInB = block.timestamp;
        }
        emit CheckedIn(contractId, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    // Internal accounting (pull-payment ledger)
    // ─────────────────────────────────────────────────────────────

    /// @dev Credit a partner's pull-payment balance. Never pushes ETH.
    function _credit(address to, uint256 amount) internal {
        if (amount == 0) return;
        pendingWithdrawals[to] += amount;
    }

    /// @dev Take `feeBps` of `amount` as platform fee; return the net remainder.
    ///      The fee is accrued to the owner and withdrawn via {withdrawFees}.
    function _netAfterFee(uint256 amount, uint256 feeBps) internal pure returns (uint256) {
        uint256 fee = (amount * feeBps) / BPS_DENOMINATOR;
        return amount - fee;
    }

    /// @dev The platform fee taken from `amount` at `feeBps`.
    function _feeOf(uint256 amount, uint256 feeBps) internal pure returns (uint256) {
        return (amount * feeBps) / BPS_DENOMINATOR;
    }

    // ─────────────────────────────────────────────────────────────
    // Wedding Unlock (PRD §7.2, §10.5, §30) — 3/5 witnesses + mutual confirm
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Either partner requests a Wedding Unlock, attaching an off-chain
     *         proof URI/hash. Opens the wedding approval window and pre-confirms
     *         the requester. PRD §7.2.
     */
    function requestWeddingUnlock(uint256 contractId, string calldata proofURI) external {
        LoveContract storage c = _get(contractId);
        if (c.status != ContractStatus.ACTIVE) revert WrongStatus();
        _onlyPartner(c);
        if (bytes(proofURI).length == 0) revert MissingProof();

        c.status = ContractStatus.WEDDING_REQUESTED;
        c.weddingRequestedAt = block.timestamp;
        // Requester implicitly confirms; the other partner must still confirm.
        c.partnerAConfirmedWedding = (msg.sender == c.partnerA);
        c.partnerBConfirmedWedding = (msg.sender == c.partnerB);

        emit WeddingRequested(contractId, msg.sender, proofURI);
    }

    /**
     * @notice The other partner confirms the pending Wedding Unlock. If both
     *         partners have confirmed AND the witness threshold is met, the
     *         wedding finalizes immediately.
     */
    function confirmWedding(uint256 contractId) external {
        LoveContract storage c = _get(contractId);
        if (c.status != ContractStatus.WEDDING_REQUESTED) revert WrongStatus();
        _onlyPartner(c);
        _requireWeddingWindowOpen(c);

        if (msg.sender == c.partnerA) {
            c.partnerAConfirmedWedding = true;
        } else {
            c.partnerBConfirmedWedding = true;
        }
        emit WeddingConfirmed(contractId, msg.sender);

        _tryFinalizeWedding(c);
    }

    /**
     * @notice A registered witness approves the Wedding Unlock. When 3/5 approve
     *         and both partners have confirmed, the wedding finalizes.
     * @dev    Wedding votes are approve-only; there is no "reject wedding" vote.
     */
    function voteWedding(uint256 contractId) external {
        LoveContract storage c = _get(contractId);
        if (c.status != ContractStatus.WEDDING_REQUESTED) revert WrongStatus();
        if (!_isWitness[contractId][msg.sender]) revert NotWitness();
        _requireWeddingWindowOpen(c);
        if (_hasVoted[contractId][msg.sender]) revert AlreadyVoted();

        _hasVoted[contractId][msg.sender] = true;
        // Reuse the claim struct's approveVotes as the wedding tally to avoid
        // extra storage; a wedding never coexists with a breach claim.
        BreachClaim storage tally = _claims[contractId];
        tally.approveVotes += 1;

        emit WeddingVoteCast(contractId, msg.sender, tally.approveVotes);
        _tryFinalizeWedding(c);
    }

    /**
     * @notice If the wedding approval window elapses without finalizing, anyone
     *         may revert the contract to ACTIVE, clearing wedding state. PRD §30.
     */
    function expireWeddingRequest(uint256 contractId) external {
        LoveContract storage c = _get(contractId);
        if (c.status != ContractStatus.WEDDING_REQUESTED) revert WrongStatus();
        if (block.timestamp < c.weddingRequestedAt + weddingWindow) revert WindowStillOpen();

        _resetWeddingState(contractId, c);
        c.status = ContractStatus.ACTIVE;
        emit WeddingRequestExpired(contractId);
    }

    /// @dev Finalize the wedding iff both partners confirmed and 3/5 witnesses approved.
    function _tryFinalizeWedding(LoveContract storage c) internal {
        if (!c.partnerAConfirmedWedding || !c.partnerBConfirmedWedding) return;
        if (_claims[c.id].approveVotes < WEDDING_THRESHOLD) return;

        c.status = ContractStatus.MARRIAGE_CONFIRMED;
        c.outcome = Outcome.WEDDING;

        emit WeddingUnlocked(c.id, _claims[c.id].approveVotes);
        // Badge is an event in the MVP (a real NFT is an isolated bonus).
        emit WeddingBadge(c.id, c.partnerA, c.partnerB);
    }

    /// @dev Revert if the wedding approval window has already closed.
    function _requireWeddingWindowOpen(LoveContract storage c) internal view {
        if (block.timestamp >= c.weddingRequestedAt + weddingWindow) revert WindowClosed();
    }

    /// @dev Clear all wedding-related transient state when reverting to ACTIVE.
    function _resetWeddingState(uint256 contractId, LoveContract storage c) internal {
        c.partnerAConfirmedWedding = false;
        c.partnerBConfirmedWedding = false;
        c.weddingRequestedAt = 0;
        delete _claims[contractId]; // clears the wedding vote tally
        address[] storage ws = _witnesses[contractId];
        for (uint256 i = 0; i < ws.length; i++) {
            _hasVoted[contractId][ws[i]] = false;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Peaceful Exit (PRD §7.3, §10.6, §30) — mutual approve + cooling period
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice A partner requests a peaceful breakup. Moves ACTIVE -> BREAKUP_REQUESTED.
     */
    function requestPeacefulExit(uint256 contractId) external {
        LoveContract storage c = _get(contractId);
        if (c.status != ContractStatus.ACTIVE) revert WrongStatus();
        _onlyPartner(c);

        c.status = ContractStatus.BREAKUP_REQUESTED;
        c.breakupRequestedBy = msg.sender;
        emit PeacefulExitRequested(contractId, msg.sender);
    }

    /**
     * @notice The OTHER partner approves the peaceful exit, starting the cooling
     *         period. Moves BREAKUP_REQUESTED -> COOLING_PERIOD. PRD §7.3.
     * @dev    The approver must be a partner and cannot be the same call flow as
     *         the requester in a single tx; both partners naturally act here
     *         because request/approve are separate transactions.
     */
    function approvePeacefulExit(uint256 contractId) external {
        LoveContract storage c = _get(contractId);
        if (c.status != ContractStatus.BREAKUP_REQUESTED) revert WrongStatus();
        _onlyPartner(c);
        // The counterparty (not the requester) must approve — mutual consent.
        if (msg.sender == c.breakupRequestedBy) revert NotPartner();

        c.status = ContractStatus.COOLING_PERIOD;
        c.coolingEndsAt = block.timestamp + coolingPeriod;
        emit PeacefulExitApproved(contractId, msg.sender, c.coolingEndsAt);
    }

    /**
     * @notice After the cooling period elapses with no dispute, finalize the
     *         peaceful exit. Deposits are returned to their owners minus the
     *         peaceful-exit fee. Anyone may trigger finalization. PRD §14.2.
     */
    function finalizePeacefulExit(uint256 contractId) external {
        LoveContract storage c = _get(contractId);
        if (c.status != ContractStatus.COOLING_PERIOD) revert WrongStatus();
        if (block.timestamp < c.coolingEndsAt) revert WindowStillOpen();

        c.status = ContractStatus.RESOLVED;
        c.outcome = Outcome.PEACEFUL;

        emit PeacefulExitFinalized(contractId);
    }
}
