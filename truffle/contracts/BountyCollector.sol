pragma solidity ^0.4.23;

import "./library/SaferMath.sol";

/** @title Bounty Collector. */
contract BountyCollector {
    using SaferMath for uint;

    /* Enums and Structs */

    enum DisputeStatus { None, Reviewable, Declined, Accepted, Withdrawn }
    enum ProposalStatus { Reviewable, Declined, Accepted }
    enum BountyStatus { Open, Cancelled, Completed, Withdrawn }

    struct Dispute {
      uint identifier;
      uint bountyIdentifier;
      uint proposalIdentifier;
      uint timestamp;
      string review;
      DisputeStatus status;
    }

    struct Proposal {
      uint identifier;
      uint timestampCreation;
      string description;
      address poster;
      string review;
      uint timestampReview;
      ProposalStatus status;
      uint disputeIdentifier;
    }

    struct Bounty {
        uint identifier;
        uint timestamp;
        string name;
        string description;
        uint reward;
        address poster;
        BountyStatus status;
        mapping (uint => Proposal) proposals;
        uint proposalsCounter;
        uint rejectedProposalsCounter;
    }

    /* State variables */

    uint public bountiesCounter;
    uint public disputesCounter;
    address public owner;
    address public arbitrager;
    bool public stopped;
    uint public contractExpiration;
    address public newContractAddress;
    uint public disputeAllowance;
    uint public disputeCost;

    mapping (uint => Dispute) private disputes;
    mapping (uint => Bounty) private bounties;
    mapping (address => uint) private balances;

    /* Events */

    event contractStoppedByOwner();
    event contractStoppedByAutoDepreciate();
    event NewBounty(uint identifier);
    event CancelledBounty(uint identifier);
    event WithdrawnBounty(uint identifier);
    event NewProposal(uint bountyIdentifier, uint proposalIdentifier);
    event DeclinedProposal(uint bountyIdentifier, uint proposalIdentifier);
    event AcceptedProposal(uint bountyIdentifier, uint proposalIdentifier);
    event NewDispute(uint disputeIdentifier, uint bountyIdentifier, uint proposalIdentifier);
    event DeclinedDispute(uint identifier);
    event AcceptedDispute(uint identifier);
    event WithdrawnDispute(uint identifier);
    event WithdrawnFunds(address withdrawnAddress, uint amount);
    event newContractAddressSet(address newContractAddress);

    /* Modifiers */

    modifier isNotStoppedOrExpired() { require (!stopped && !isExpired(), "The contract is stopped or expired, this function can't be used"); _;}
    modifier isStoppedOrExpired() { require (stopped || isExpired(), "The contract is not stopped or expired, this function can't be used"); _;}
    modifier onlyOwner() { require (msg.sender == owner, "Only the contract owner can do this"); _;}
    modifier onlyArbitrager() { require (msg.sender == arbitrager, "Only the contract arbitrager can do this"); _;}
    modifier onlyBountyPoster(uint _identifier) { require (msg.sender == bounties[_identifier].poster, "Only the bounty poster can do this"); _;}
    modifier onlyNonBountyPoster(uint _identifier) { require (msg.sender != bounties[_identifier].poster, "Only a non bounty poster can do this"); _;}
    modifier onlyProposalPoster(uint _bountyIdentifier, uint _proposalIdentifier) { require (msg.sender == bounties[_bountyIdentifier].proposals[_proposalIdentifier].poster, "Only the proposal poster can do this"); _;}
    modifier bountyExists(uint _identifier) {require (_identifier != 0 && bountiesCounter >= _identifier, "Bounty identifier does not exist"); _;}
    modifier openBounty(uint _identifier)  {require (bounties[_identifier].status == BountyStatus.Open, "Bounty must be open"); _;}
    modifier correctlyFundedForDispute() { require ( msg.value == disputeCost, "The dispute should be funded with the dispute cost"); _;}
    modifier sufficientlyFundedForDisputeAndReward() { require ( msg.value >= disputeCost, "The dispute should be funded with the dispute cost"); _;}
    modifier sufficientlyFunded(uint _amount) { require (balances[msg.sender] >= _amount, "No sufficient funds to be withdrawn"); _;}

    modifier proposalExists(uint _bountyIdentifier, uint _proposalIdentifier) {
        require(_proposalIdentifier != 0 && bounties[_bountyIdentifier].proposalsCounter >= _proposalIdentifier, "The proposal identifier given does not exist");
         _;
    }

    modifier latestProposal(uint _bountyIdentifier, uint _proposalIdentifier) {
        require(_proposalIdentifier == bounties[_bountyIdentifier].rejectedProposalsCounter.add(1), "This can only be run on the latest proposal");
        _;
    }

    modifier noOpenProposal(uint _bountyIdentifier) {
        require(bounties[_bountyIdentifier].proposalsCounter == bounties[_bountyIdentifier].rejectedProposalsCounter, "There is at least one not reviewed proposal");
        _;
    }

    modifier reviewableDispute(uint _identifier)  {require (disputes[_identifier].status == DisputeStatus.Reviewable, "Dispute must be reviewable"); _;}

    /**
    * case 1: Not in dispute period with a reviewable dispute
    * case 2: In dispute period with a resolved dispute
    */
    modifier isNotDisputable(uint _bountyIdentifier) {
      require ((bounties[_bountyIdentifier].proposals[bounties[_bountyIdentifier].rejectedProposalsCounter].timestampReview.add(disputeAllowance) < now &&
        disputes[bounties[_bountyIdentifier].proposals[bounties[_bountyIdentifier].rejectedProposalsCounter].disputeIdentifier].status != DisputeStatus.Reviewable) ||
        (bounties[_bountyIdentifier].proposals[bounties[_bountyIdentifier].rejectedProposalsCounter].timestampReview.add(disputeAllowance) > now &&
        disputes[bounties[_bountyIdentifier].proposals[bounties[_bountyIdentifier].rejectedProposalsCounter].disputeIdentifier].status == DisputeStatus.Declined ||
        disputes[bounties[_bountyIdentifier].proposals[bounties[_bountyIdentifier].rejectedProposalsCounter].disputeIdentifier].status == DisputeStatus.Accepted),
        "The previous proposal can still be disputed.");
      _;
    }

    /**
    * Initial proposal is rejected, in the dispute period, and with no open dispute
    */
    modifier isDisputable(uint _bountyIdentifier, uint _proposalIdentifier) {
      require ( (bounties[_bountyIdentifier].proposals[_proposalIdentifier].status == ProposalStatus.Declined &&
        bounties[_bountyIdentifier].proposals[_proposalIdentifier].timestampReview.add(disputeAllowance) > now &&
        bounties[_bountyIdentifier].proposals[_proposalIdentifier].disputeIdentifier == 0),
        "The proposal was not rejected, the dispute period is passed, or a dispute was already posted");
      _;
    }

    modifier openDispute(uint _identifier) {
      require ( disputes[_identifier].status == DisputeStatus.Reviewable, "This can only be used on an open dispute");
      _;
    }

    modifier onlyDisputePoster(uint _identifier) {
      require (bounties[disputes[_identifier].bountyIdentifier].proposals[disputes[_identifier].proposalIdentifier].poster == msg.sender,
        "Only the disputer poster can do this");
      _;
    }

    /* Constructor */

    /** @dev Constructor
      * @param _durationSec The contract duration in seconds
      * @param _disputeAllowanceSec The proposal dispute time allowance in seconds
      * @param _disputeCostValueGwei The proposal dispute cost in Gwei
      */
    constructor(uint _durationSec, uint _disputeAllowanceSec, uint _disputeCostValueGwei) public {
        owner = msg.sender;
        arbitrager = owner;
        bountiesCounter = 0;
        disputesCounter = 0;
        disputeCost = _disputeCostValueGwei.multiply(1000000000);
        disputeAllowance = _disputeAllowanceSec;
        contractExpiration = now.add(_durationSec);
        disputes[0] = Dispute({identifier: 0, bountyIdentifier: 0, proposalIdentifier: 0, timestamp: 0, review: "", status: DisputeStatus.None});
    }


    /* functions */

    /** @dev Add a bounty
      * @param _name The name of the bounty
      * @param _description An explanation of the bounty
      */
    function addBounty(string _name, string _description)
      external
      payable
      isNotStoppedOrExpired() sufficientlyFundedForDisputeAndReward() {
        bounties[bountiesCounter.add(1)] = Bounty({identifier: bountiesCounter.add(1), timestamp: now, name: _name, description: _description, reward: msg.value.subtract(disputeCost), poster: msg.sender, status: BountyStatus.Open, proposalsCounter: 0, rejectedProposalsCounter: 0});
        bountiesCounter += 1;
        emit NewBounty(bountiesCounter);
    }

    /** @dev Cancel a bounty
      * @param _identifier The identifier of the bounty to be cancelled
      */
    function cancelBounty(uint _identifier)
      external
      isNotStoppedOrExpired() bountyExists(_identifier) onlyBountyPoster(_identifier) openBounty(_identifier) noOpenProposal(_identifier) isNotDisputable(_identifier) {
        Bounty storage bounty = bounties[_identifier];
        bounty.status = BountyStatus.Cancelled;
        balances[bounty.poster] += bounty.reward.add(disputeCost);
        emit CancelledBounty(_identifier);
    }

    /** @dev Post a proposal to a bounty
      * @param _bountyIdentifier The identifier of the bounty to post the proposal on
      * @param _description The explanation of the proposal
      */
    function postProposal(uint _bountyIdentifier, string _description)
      external
      isNotStoppedOrExpired() bountyExists(_bountyIdentifier) onlyNonBountyPoster(_bountyIdentifier) openBounty(_bountyIdentifier)
      {
        Bounty storage bounty = bounties[_bountyIdentifier];
        bounty.proposals[bounty.proposalsCounter.add(1)] = Proposal({identifier: bounty.proposalsCounter.add(1), timestampCreation: now, description: _description, poster: msg.sender, review: "", timestampReview: 0, status: ProposalStatus.Reviewable, disputeIdentifier: 0});
        bounty.proposalsCounter += 1;
        emit NewProposal(_bountyIdentifier, bounty.proposalsCounter);
    }

    /** @dev Accept a proposal
      * @param _bountyIdentifier The identifier of the bounty that has the proposal to be accepted
      * @param _proposalIdentifier The identifier of the proposal to be accepted
      * @param _review The review of the proposal
      */
    function acceptProposal(uint _bountyIdentifier, uint _proposalIdentifier, string _review)
      external
      isNotStoppedOrExpired() bountyExists(_bountyIdentifier) proposalExists(_bountyIdentifier, _proposalIdentifier) onlyBountyPoster(_bountyIdentifier) openBounty(_bountyIdentifier) latestProposal(_bountyIdentifier, _proposalIdentifier) isNotDisputable(_bountyIdentifier) {
        uint bountyIdentifier = _bountyIdentifier;
        uint proposalIdentifier = _proposalIdentifier;
        Bounty storage bounty = bounties[bountyIdentifier];
        Proposal storage proposal = bounty.proposals[proposalIdentifier];
        proposal.review = _review;
        proposal.timestampReview = now;
        proposal.status = ProposalStatus.Accepted;
        bounty.status = BountyStatus.Completed;
        balances[proposal.poster] += bounty.reward;
        balances[bounty.poster] += disputeCost;
        emit AcceptedProposal(bountyIdentifier, proposalIdentifier);
    }

    /** @dev Decline a proposal
      * @param _bountyIdentifier The identifier of the bounty that has the proposal to be declined
      * @param _proposalIdentifier The identifier of the proposal to be declined
      * @param _review The review of the proposal
      */
    function declineProposal(uint _bountyIdentifier, uint _proposalIdentifier, string _review)
      external
      isNotStoppedOrExpired() bountyExists(_bountyIdentifier) proposalExists(_bountyIdentifier, _proposalIdentifier) onlyBountyPoster(_bountyIdentifier) openBounty(_bountyIdentifier) latestProposal(_bountyIdentifier, _proposalIdentifier) isNotDisputable(_bountyIdentifier) {
        Bounty storage bounty = bounties[_bountyIdentifier];
        Proposal storage proposal = bounty.proposals[_proposalIdentifier];
        proposal.review = _review;
        proposal.timestampReview = now;
        proposal.status = ProposalStatus.Declined;
        bounty.rejectedProposalsCounter += 1;
        emit DeclinedProposal(_bountyIdentifier, _proposalIdentifier);
    }

    /** @dev Open a dispute on a proposal review
      * @param _bountyIdentifier The identifier of the bounty that has the proposal to be declined
      * @param _proposalIdentifier The identifier of the proposal to be declined
      * @param _review The review of the dispute
      */
    function disputeProposalReview(uint _bountyIdentifier, uint _proposalIdentifier, string _review)
      external
      payable
      isNotStoppedOrExpired() bountyExists(_bountyIdentifier) proposalExists(_bountyIdentifier, _proposalIdentifier) onlyProposalPoster(_bountyIdentifier, _proposalIdentifier) openBounty(_bountyIdentifier) isDisputable(_bountyIdentifier, _proposalIdentifier) correctlyFundedForDispute() {
        disputes[disputesCounter.add(1)] = Dispute({identifier: disputesCounter.add(1), bountyIdentifier: _bountyIdentifier, proposalIdentifier: _proposalIdentifier, timestamp: now, review: _review, status: DisputeStatus.Reviewable});
        bounties[_bountyIdentifier].proposals[_proposalIdentifier].disputeIdentifier = disputesCounter.add(1);
        disputesCounter += 1;
        emit NewDispute(disputesCounter, _bountyIdentifier, _proposalIdentifier);
      }

    /** @dev Decline a dispute
      * @param _identifier The identifier of the dispute to be declined
      */
    function declineDispute(uint _identifier)
      external
      isNotStoppedOrExpired() onlyArbitrager() openDispute(_identifier) {
        disputes[_identifier].status = DisputeStatus.Declined;
        balances[owner] += disputeCost;
        emit DeclinedDispute(_identifier);
    }

    /** @dev Accept a dispute
      * @param _identifier The identifier of the dispute to be declined
      */
    function acceptDispute(uint _identifier)
      external
      isNotStoppedOrExpired() onlyArbitrager() openDispute(_identifier) {
        Dispute storage dispute = disputes[_identifier];
        uint bountyIdentifier = dispute.bountyIdentifier;
        uint proposalIdentifier = dispute.proposalIdentifier;
        Bounty storage bounty = bounties[bountyIdentifier];
        Proposal storage proposal = bounty.proposals[proposalIdentifier];
        dispute.status = DisputeStatus.Accepted;
        proposal.status = ProposalStatus.Accepted;
        bounty.status = BountyStatus.Completed;
        balances[proposal.poster] += bounty.reward.add(disputeCost);
        balances[owner] += disputeCost;
        emit AcceptedProposal(bountyIdentifier, proposalIdentifier);
        emit AcceptedDispute(_identifier);
    }

    /** @dev Fetch a bounty
      * @param _identifier The identifier of the bounty to be fetched
      * @return name The name of the bounty
      * @return description An explanation of the bounty
      * @return reward The reward of the bounty in Wei
      * @return poster The address of the bounty poster
      * @return status The current status of the bounty
      * @return proposalsCounter How many proposals were posted for this bounty
      * @return rejectedProposalsCounter How many proposals were rejected for this bounty
      * @return timestamp the timestamp of the bounty creation (EPOCH)
      */
    function fetchBounty(uint _identifier)
      external
      view
      returns (string memory name, string memory description, uint reward, address poster, uint status, uint proposalsCounter, uint rejectedProposalsCounter, uint timestamp) {
        Bounty memory bounty = bounties[_identifier];
        name = bounty.name;
        description = bounty.description;
        reward = bounty.reward;
        poster = bounty.poster;
        status = uint(bounty.status);
        proposalsCounter = bounty.proposalsCounter;
        rejectedProposalsCounter = bounty.rejectedProposalsCounter;
        timestamp = bounty.timestamp;
    }

    /** @dev Fetch a proposal
     * @param _bountyIdentifier The identifier of the bounty that has the proposal to be fetched
     * @param _proposalIdentifier The identifier of the proposal to be feteched
     * @return poster The address of the proposal poster
     * @return review The review of the proposal
     * @return status The status of the proposal
     * @return timestampCreation the timestamp of the proposal creation (EPOCH)
     * @return timestampReview the timestamp of the review of the proposal creation (EPOCH)
     */
    function fetchProposal(uint _bountyIdentifier, uint _proposalIdentifier)
      external
      view
      returns (string memory description, address poster, string memory review, ProposalStatus status, uint timestampReview, uint timestampCreation, uint disputeIdentifier) {
        Proposal memory proposal = bounties[_bountyIdentifier].proposals[_proposalIdentifier];
        description = proposal.description;
        poster = proposal.poster;
        status = proposal.status;
        review = proposal.review;
        timestampCreation = proposal.timestampCreation;
        timestampReview = proposal.timestampReview;
        disputeIdentifier = proposal.disputeIdentifier;
    }

    /** @dev Fetch a dispute
      * @param _identifier The identifier of the dispute to be fetched
      * @return bountyIdentifier The identifier of the bounty the disputed proposal is about
      * @return proposalIdentifier The identifier the propsosal disputed is about
      * @return timestamp The timestamp of the dispute creation
      * @return review The review of the dispute
      * @return status The status of the dispute
      */
    function fetchDispute(uint _identifier)
      external
      view
      returns (uint bountyIdentifier, uint proposalIdentifier, uint timestamp, string memory review, uint status) {
        Dispute memory dispute = disputes[_identifier];
        bountyIdentifier = dispute.bountyIdentifier;
        proposalIdentifier = dispute.proposalIdentifier;
        timestamp = dispute.timestamp;
        review = dispute.review;
        status = uint(dispute.status);
    }

    /** @dev Fetch the user's balance
      * @return balance The user's balance
      */
    function fetchMyBalance()
      external
      view
      returns (uint balance) {
        balance = balances[msg.sender];
    }

    /** @dev Withdrawal function to take from own balances
      * @param _amount the amount to be withdrawn
      */
    function withdrawFunds(uint _amount)
      external
      payable
      sufficientlyFunded(_amount) {
      balances[msg.sender] -= _amount;
      msg.sender.transfer(_amount);
      emit WithdrawnFunds(msg.sender, _amount);
    }

    /** @dev Withdraw a dispute
      * @param _identifier The identifier of the dispute to be declined
      */
    function withdrawDispute(uint _identifier)
      external
      onlyDisputePoster(_identifier) openDispute(_identifier) {
        uint bountyIdentifier = disputes[_identifier].bountyIdentifier;
        uint proposalIdentifier = disputes[_identifier].proposalIdentifier;
        Proposal storage proposal = bounties[bountyIdentifier].proposals[proposalIdentifier];
        proposal.disputeIdentifier = 0;
        disputes[_identifier].status = DisputeStatus.Withdrawn;
        balances[proposal.poster] += disputeCost;
        emit WithdrawnDispute(_identifier);
    }


    /** @dev Withdrawal an open bounty once the contract is stopped or expired
      * @param _identifier The identifier of the bounty that has to be withdrawn from
      */
    function EmergencyWithdrawBounty(uint _identifier)
      external
      isStoppedOrExpired() bountyExists(_identifier) openBounty(_identifier) onlyBountyPoster(_identifier) {
        Bounty storage bounty = bounties[_identifier];
        bounty.status = BountyStatus.Withdrawn;
        balances[bounty.poster] += bounty.reward.add(disputeCost);
        emit WithdrawnBounty(_identifier);
    }

    /** @dev Freeze the contract (e.g. after finding a bug)
      */
    function StopContract()
      external
      onlyOwner() {
        stopped = true;
        emit contractStoppedByOwner();
    }

    /** @dev Test if the contract is expired
      *
      */
    function isExpired()
      view
      public
      returns (bool) {
        return (now > contractExpiration) ? true : false;
    }

    /** @dev Set new contract address
      * @param _newContractAddress the new contract address
      */
    function setNewContractAddress(address _newContractAddress)
      public
      onlyOwner() isStoppedOrExpired() {
        newContractAddress = _newContractAddress;
        emit newContractAddressSet(newContractAddress);
    }

    /** @dev Fallback function
      */
    function()
      external
      payable {
        revert();
    }
}
