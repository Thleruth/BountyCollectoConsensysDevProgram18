var BountyCollector = artifacts.require('BountyCollector')

contract('BountyCollector', function(accounts) {

  const owner = accounts[0];
  const arbitrager = accounts[0];
  const alice = accounts[1];
  const bob = accounts[2];
  const emptyAddress = '0x0000000000000000000000000000000000000000';

  it("Should add the bounty correctly", async() => {
    // Get needed constant(s)
    const bountyCollector = await BountyCollector.deployed();
    const disputeCost = (await bountyCollector.disputeCost.call()).toNumber();

    // Get initial test variable(s)
    const aliceBalanceBefore = await web3.eth.getBalance(alice).toNumber();

    // Add a bounty
    const name = "Evil Corp";
    const description = "Find issues with the logins";
    const value = parseInt(web3.toWei(2, "ether"));
	  const txAddBounty = await bountyCollector.addBounty(name, description, {from: alice, value: value});

    // Get end test variable(s)
    var identifier = -1;
    var eventEmitted = false;
    if (txAddBounty.logs[0].event === "NewBounty") {
		    identifier = txAddBounty.logs[0].args.identifier;
        eventEmitted = true;
	  }
    const aliceBalanceAfter = await web3.eth.getBalance(alice).toNumber();

    // Check that the data is as expected
    const result = await bountyCollector.fetchBounty.call(identifier);
    assert.equal(result[0], name, 'the name of the last added item does not match the expected value');
    assert.equal(result[1], description, 'the description does not match the expected value');
    assert.equal(result[2].toNumber(), value - disputeCost, 'The reward does not match the posted reward');
    assert.equal(result[3], alice, 'the address adding the bounty should be listed as the poster');
    assert.equal(result[4], 0, 'the status of bounty should be "Open" which is indexed at 0 in the Enum');
    assert.equal(result[5], 0, 'the proposals counter should be set to 0');
    assert.equal(result[6], 0, 'the rejected proposals counter should be set to 0');
    assert.equal(eventEmitted, true, 'Should emit a New Bounty event');
    assert.isBelow(aliceBalanceAfter, aliceBalanceBefore - value, "Alice's balance should be below the the original minus the reward and dispute cost(below to account for the var. in gasPrice)");
  })

  it("Should post a proposal correctly", async() => {
    // Get needed constant(s)
    const bountyCollector = await BountyCollector.deployed();

    // Add a bounty (previously tested)
    const name = "Evil Corp";
    const descriptionBounty = "Find issues with the logins";
    const value = parseInt(web3.toWei(3, "ether"));
    const txAddBounty = await bountyCollector.addBounty(name, descriptionBounty, {from: alice, value: value});
    const identifierBounty = txAddBounty.logs[0].args.identifier;

    // Add a proposal
    const descriptionProposal = "42 always works as password";
    const txPostProposal = await bountyCollector.postProposal(identifierBounty, descriptionProposal, {from: bob});

    // Get end test variable(s)
    var eventEmitted = false;
    if (txPostProposal.logs[0].event === "NewProposal") {
        identifierProposal = txPostProposal.logs[0].args.proposalIdentifier;
        eventEmitted = true;
    }

    // Check that the data is as expected
    const result = await bountyCollector.fetchProposal.call(identifierBounty, identifierProposal);
    assert.equal(result[0], descriptionProposal, 'the description does not match the expected value');
    assert.equal(result[1], bob, 'The adress posting the proposal should be listed as poster');
    assert.equal(result[2], "", 'the review of the proposal should be initiated as ""');
    assert.equal(result[3], 0, 'the status of bounty should be "Reviewable" which is indexed at 0 in the Enum');
    assert.equal(eventEmitted, true, 'Should emit a New Proposal event');
  })

  it("Should accept the proposal and withdraw correctly", async() => {
    // Get needed constant(s)
    const bountyCollector = await BountyCollector.deployed();
    const disputeCost = (await bountyCollector.disputeCost.call()).toNumber();

    // Add bounty and proposal (previously tested)
    const name = "Evil Corp";
    const descriptionBounty = "Find issues with the logins";
    const value = parseInt(web3.toWei(3, "ether"));
    const txAddBounty = await bountyCollector.addBounty(name, descriptionBounty, {from: alice, value: value});
    const identifierBounty = txAddBounty.logs[0].args.identifier;
    const descriptionProposal = "42 always works as password";
    const txPostProposal = await bountyCollector.postProposal(identifierBounty, descriptionProposal, {from: bob});
    const identifierProposal = txPostProposal.logs[0].args.proposalIdentifier;

    // Get initial test variable(s)
    const bobBalanceBefore = await web3.eth.getBalance(bob).toNumber();
    const aliceBalanceBefore = await web3.eth.getBalance(alice).toNumber();

    // Accept proposal
    const review = "Nice find! We changed it"
    const txAcceptProposal = await bountyCollector.acceptProposal(identifierBounty, identifierProposal, review, {from: alice});
    const eventAcceptProposalEmitted = (txAcceptProposal.logs[0].event === "AcceptedProposal") ? true : false;

    // Withdraw funds
    const txWithdrawnFundsBob = await bountyCollector.withdrawFunds(value - disputeCost, {from: bob});
    const txWithdrawnFundsAlice = await bountyCollector.withdrawFunds(disputeCost, {from: alice});

    // Get end test variable(s)
    var eventsWithdrawnEmitted = (txWithdrawnFundsBob.logs[0].event === "WithdrawnFunds") ? true : false;
    eventsWithdrawnEmitted = (txWithdrawnFundsAlice.logs[0].event === "WithdrawnFunds") ? eventsWithdrawnEmitted : false;
    const bobBalanceAfter = await web3.eth.getBalance(bob).toNumber();
    const aliceBalanceAfter = await web3.eth.getBalance(alice).toNumber();

    // Check that the data is as expected
    const resultProposal = await bountyCollector.fetchProposal.call(identifierBounty, identifierProposal);
    const resultBounty = await bountyCollector.fetchBounty.call(identifierBounty);
    assert.equal(resultProposal[2], review, 'the review of the proposal does not match the expected value');
    assert.equal(resultProposal[3], 2, 'the status of bounty should be "Accepted" which is indexed at 2 in the Enum');
    assert.equal(resultBounty[4], 2, 'the status of bounty should be "Completed" which is indexed at 2 in the Enum');
    assert.equal(resultBounty[5], 1, 'the proposals counter should be 1');
    assert.equal(resultBounty[6], 0, 'the rejected proposals counter should still be 0');
    assert.equal(eventAcceptProposalEmitted, true, 'Should emit an Accept Proposal event');
    assert.equal(eventsWithdrawnEmitted, true, 'Should emit withdrawn funds events');
    assert.isBelow(bobBalanceAfter, bobBalanceBefore + value, "Bob's balance should increased by a bit less the reward (incl. gas fee due to posting the proposal)");
    assert.isAbove(bobBalanceAfter, bobBalanceBefore, "Bob's balance should be higher than its initial");
    assert.isAbove(aliceBalanceAfter, aliceBalanceBefore, "Alice's balance should be higher than its initial (as she got the dispute cost back)");
  })

  it("Should decline the proposal correctly", async() => {
    // Get needed constant(s)
    const bountyCollector = await BountyCollector.deployed();

    // Add bounty and proposal (previously tested)
    const name = "Evil Corp";
    const descriptionBounty = "Find issues with the logins";
    const value = parseInt(web3.toWei(3, "ether"));
    const txAddBounty = await bountyCollector.addBounty(name, descriptionBounty, {from: alice, value: value});
    const identifierBounty = txAddBounty.logs[0].args.identifier;
    const descriptionProposal = "default credentials are still in place";
    const txPostProposal = await bountyCollector.postProposal(identifierBounty, descriptionProposal, {from: bob});
    const identifierProposal = txPostProposal.logs[0].args.proposalIdentifier;

    // Decline proposal
    const review = "No that is not true";
    const txDeclineProposal = await bountyCollector.declineProposal(identifierBounty, identifierProposal, review, {from: alice});
    const eventEmitted = (txDeclineProposal.logs[0].event === "DeclinedProposal") ? true : false;

    // Check that the data is as expected
    const resultProposal = await bountyCollector.fetchProposal.call(identifierBounty, identifierProposal);
    const resultBounty = await bountyCollector.fetchBounty.call(identifierBounty);
    assert.equal(resultProposal[2], review, 'the review of the proposal does not match the expected value');
    assert.equal(resultProposal[3], 1, 'the status of bounty should be "Declined" which is indexed at 1 in the Enum');
    assert.equal(resultBounty[4], 0, 'the status of bounty should still be "Open" which is indexed at 0 in the Enum');
    assert.equal(resultBounty[5], 1, 'the proposals counter should be 1');
    assert.equal(resultBounty[6], 1, 'the rejected proposals counter should still be 1');
    assert.equal(eventEmitted, true, 'adding an item should emit a Decline Proposal event');
  })

  it("Should cancel the bounty correctly", async() => {
    // Get needed constant(s)
    const bountyCollector = await BountyCollector.deployed();
    const disputeCost = (await bountyCollector.disputeCost.call()).toNumber();

    // Add bounty and proposal (previously tested)
    const name = "Evil Corp";
    const descriptionBounty = "Find issues with the logins";
    const value = parseInt(web3.toWei(3, "ether"));
    const txAddBounty = await bountyCollector.addBounty(name, descriptionBounty, {from: bob, value: value});
    const identifierBounty = txAddBounty.logs[0].args.identifier;

    // Get initial test variable(s)
    const bobBalanceBefore = await web3.eth.getBalance(bob).toNumber();

    // Cancel bounty
    const txCancelBounty = await bountyCollector.cancelBounty(identifierBounty, {from: bob});
    const eventCancelEmitted = (txCancelBounty.logs[0].event === "CancelledBounty") ? true : false;

    // Withdraw funds (tested previously)
    await bountyCollector.withdrawFunds(value, {from: bob});

    // Get end test variable(s)
    const bobBalanceAfter = await web3.eth.getBalance(bob).toNumber();

    // Check that the data is as expected
    const resultBounty = await bountyCollector.fetchBounty.call(identifierBounty);
    assert.equal(resultBounty[4], 1, 'the status of bounty should still be "Declined" which is indexed at 1 in the Enum');
    assert.equal(eventCancelEmitted, true, 'Should emit a cancel Bounty event');
    assert.isAbove(bobBalanceAfter, bobBalanceBefore, "Bob's balance should be higher than its initial");
  })

  it("Should open a dispute correctly", async() => {
    // Get needed constant(s)
    const bountyCollector = await BountyCollector.deployed();
    const disputeCost = (await bountyCollector.disputeCost.call()).toNumber();

    // add Bounty, proposal, and decline it (tested before)
    const name = "Evil Corp";
    const descriptionBounty = "Find issues with the logins";
    const value = parseInt(web3.toWei(3, "ether"));
    const txAddBounty = await bountyCollector.addBounty(name, descriptionBounty, {from: alice, value: value});
    const identifierBounty = txAddBounty.logs[0].args.identifier;
    const descriptionProposal = "default credentials are still in place";
    const txPostProposal = await bountyCollector.postProposal(identifierBounty, descriptionProposal, {from: bob});
    const identifierProposal = txPostProposal.logs[0].args.proposalIdentifier;
    const review = "No that is not true";
    const txDeclineProposal = await bountyCollector.declineProposal(identifierBounty, identifierProposal, review, {from: alice});

    // Open a dispute
    const reviewOfReview = "Yes it is, I changed your admin account profile picture to proof it";
    const txOpenDispute = await bountyCollector.disputeProposalReview(identifierBounty, identifierProposal, reviewOfReview, {from: bob, value: disputeCost});

    // Get end test variable(s)
    var eventNewDisputeEmitted = false;
    var disputeIdentifier = -1;
    if (txOpenDispute.logs[0].event === "NewDispute") {
        disputeIdentifier = txOpenDispute.logs[0].args.disputeIdentifier;
        eventNewDisputeEmitted = true;
    }

    // Check that the data is as expected
    const resultDispute = await bountyCollector.fetchDispute.call(disputeIdentifier);
    const resultProposal = await bountyCollector.fetchProposal.call(identifierBounty, identifierProposal);
    assert.equal(resultDispute[0].toNumber(), identifierBounty, 'the dispute should have the correct bounty identifier stored');
    assert.equal(resultDispute[1].toNumber(), identifierProposal, 'the dispute should have the correct proposal identifier stored');
    assert.equal(resultDispute[3], reviewOfReview, 'the dispute review should be correct');
    assert.equal(resultDispute[4], 1, 'the status of bounty should be "Reviewable" which is indexed at 1 in the Enum');
    assert.equal(resultProposal[6].toNumber(), disputeIdentifier, 'The dispute identifier should be stored in the proposal');
    assert.equal(eventNewDisputeEmitted, true, 'Should emit a new Dispute event');
  })

  it("Should decline a dispute correctly", async() => {
    // Get needed constant(s)
    const bountyCollector = await BountyCollector.deployed();
    const disputeCost = (await bountyCollector.disputeCost.call()).toNumber();

    // Add bounty, proposal, decline proposal, and open dispute (tested previously)
    const name = "Evil Corp";
    const descriptionBounty = "Find issues with the logins";
    const value = parseInt(web3.toWei(3, "ether"));
    const txAddBounty = await bountyCollector.addBounty(name, descriptionBounty, {from: alice, value: value});
    const identifierBounty = txAddBounty.logs[0].args.identifier;
    const descriptionProposal = "default credentials are still in place";
    const txPostProposal = await bountyCollector.postProposal(identifierBounty, descriptionProposal, {from: bob});
    const identifierProposal = txPostProposal.logs[0].args.proposalIdentifier;
    const review = "No that is not true";
    const txDeclineProposal = await bountyCollector.declineProposal(identifierBounty, identifierProposal, review, {from: alice});
    const reviewOfReview = "Yes it is, I changed your admin account profile picture to proof it";
    const txOpenDispute = await bountyCollector.disputeProposalReview(identifierBounty, identifierProposal, reviewOfReview, {from: bob, value: disputeCost});
    var disputeIdentifier = txOpenDispute.logs[0].args.disputeIdentifier;

    // Get initial test variable(s)
    const arbitragerBalanceBefore = await web3.eth.getBalance(arbitrager).toNumber();

    // Decline dispute
    const txDeclineDispute = await bountyCollector.declineDispute(disputeIdentifier, {from: arbitrager});
    const eventEmitted = (txDeclineDispute.logs[0].event === "DeclinedDispute") ? true : false;

    // Withdrawl (tested previously)
    await bountyCollector.withdrawFunds(disputeCost, {from: arbitrager});

    // Get end test variable(s)
    const arbitragerBalanceAfter = await web3.eth.getBalance(arbitrager).toNumber();

    // Check that the data is as expected
    const resultDispute = await bountyCollector.fetchDispute.call(disputeIdentifier);
    assert.equal(resultDispute[4], 2, 'the status of bounty should be "Declined" which is indexed at 2 in the Enum');
    assert.equal(eventEmitted, true, 'Should emit a Declined Dispute event');
    assert.isAbove(arbitragerBalanceAfter, arbitragerBalanceBefore, "The arbitrager's balance should be higher than its initial (as she got the dispute cost)");
  })

  it("Should accept a dispute correctly", async() => {
    // Get needed constant(s)
    const bountyCollector = await BountyCollector.deployed();
    const disputeCost = (await bountyCollector.disputeCost.call()).toNumber();

    // Add bounty, proposal, decline proposal, and open dispute (tested previously)
    const name = "Evil Corp";
    const descriptionBounty = "Find issues with the logins";
    const value = parseInt(web3.toWei(3, "ether"));
    const txAddBounty = await bountyCollector.addBounty(name, descriptionBounty, {from: alice, value: value});
    const identifierBounty = txAddBounty.logs[0].args.identifier;
    const descriptionProposal = "default credentials are still in place";
    const txPostProposal = await bountyCollector.postProposal(identifierBounty, descriptionProposal, {from: bob});
    const identifierProposal = txPostProposal.logs[0].args.proposalIdentifier;
    const review = "No that is not true";
    const txDeclineProposal = await bountyCollector.declineProposal(identifierBounty, identifierProposal, review, {from: alice});
    const reviewOfReview = "Yes it is, I changed your admin account profile picture to proof it";
    const txOpenDispute = await bountyCollector.disputeProposalReview(identifierBounty, identifierProposal, reviewOfReview, {from: bob, value: disputeCost});
    var disputeIdentifier = txOpenDispute.logs[0].args.disputeIdentifier;

    // Get initial test variable(s)
    const bobBalanceBefore = await web3.eth.getBalance(bob).toNumber();
    const arbitragerBalanceBefore = await web3.eth.getBalance(arbitrager).toNumber();

    // Accept dispute
    const txAcceptDispute = await bountyCollector.acceptDispute(disputeIdentifier, {from: arbitrager});

    // Withdrawal (tested previously)
    await bountyCollector.withdrawFunds(disputeCost, {from: arbitrager});
    await bountyCollector.withdrawFunds(value, {from: bob});

    // Get end test variable(s)
    const eventAcceptedProposal = (txAcceptDispute.logs[0].event === "AcceptedProposal") ? true : false;
    const eventAcceptedDispute = (txAcceptDispute.logs[1].event === "AcceptedDispute") ? true : false;
    const arbitragerBalanceAfter = await web3.eth.getBalance(arbitrager).toNumber();
    const bobBalanceAfter = await web3.eth.getBalance(bob).toNumber();

    // Check that the data is as expected
    const resultDispute = await bountyCollector.fetchDispute.call(disputeIdentifier);
    const resultProposal = await bountyCollector.fetchProposal.call(identifierBounty, identifierProposal);
    const resultBounty = await bountyCollector.fetchBounty.call(identifierBounty);
    assert.equal(resultProposal[3], 2, 'the status of bounty should be "Accepted" which is indexed at 2 in the Enum');
    assert.equal(resultBounty[4], 2, 'the status of bounty should be "Completed" which is indexed at 2 in the Enum');
    assert.equal(resultDispute[4], 3, 'the status of bounty should be "Accepted" which is indexed at 3 in the Enum');
    assert.equal(eventAcceptedProposal, true, 'Should emit an Accepted Proposal event');
    assert.equal(eventAcceptedDispute, true, 'Should emit an Accepted Dispute event');
    assert.isAbove(bobBalanceAfter, bobBalanceBefore, "Bob's balance should be higher than its initial (as he got the reward and dispute cost back)");
    assert.isAbove(arbitragerBalanceAfter, arbitragerBalanceBefore, "The arbitrager's balance should be higher than its initial (as she got the dispute cost)");
  })

  it("Should withdraw a dispute correctly", async() => {
    // Get needed constant(s)
    const bountyCollector = await BountyCollector.deployed();
    const disputeCost = (await bountyCollector.disputeCost.call()).toNumber();

    // Add bounty, proposal, decline proposal, and open dispute (tested previously)
    const name = "Evil Corp";
    const descriptionBounty = "Find issues with the logins";
    const value = parseInt(web3.toWei(3, "ether"));
    const txAddBounty = await bountyCollector.addBounty(name, descriptionBounty, {from: alice, value: value});
    const identifierBounty = txAddBounty.logs[0].args.identifier;
    const descriptionProposal = "default credentials are still in place";
    const txPostProposal = await bountyCollector.postProposal(identifierBounty, descriptionProposal, {from: bob});
    const identifierProposal = txPostProposal.logs[0].args.proposalIdentifier;
    const review = "No that is not true";
    const txDeclineProposal = await bountyCollector.declineProposal(identifierBounty, identifierProposal, review, {from: alice});
    const reviewOfReview = "Yes it is, I changed your admin account profile picture to proof it";
    const txOpenDispute = await bountyCollector.disputeProposalReview(identifierBounty, identifierProposal, reviewOfReview, {from: bob, value: disputeCost});
    var disputeIdentifier = txOpenDispute.logs[0].args.disputeIdentifier;

    // Get initial test variable(s)
    const bobBalanceBefore = await web3.eth.getBalance(bob).toNumber();

    // Withdraw dispute
    const txWithdrawDispute = await bountyCollector.withdrawDispute(disputeIdentifier, {from: bob});
    const eventEmitted = (txWithdrawDispute.logs[0].event === "WithdrawnDispute") ? true : false;

    // Withdrawal (tested previously)
    await bountyCollector.withdrawFunds(disputeCost, {from: bob});

    // Get end test variable(s)
    const bobBalanceAfter = await web3.eth.getBalance(bob).toNumber();

    // Check that the data is as expected
    const resultDispute = await bountyCollector.fetchDispute.call(disputeIdentifier);
    const resultProposal = await bountyCollector.fetchProposal.call(identifierBounty, identifierProposal);
    assert.equal(resultProposal[6], 0, 'the proposal should have a dispute identifier of 0 (null dispute)');
    assert.equal(resultDispute[4], 4, 'the status of bounty should be "Withdrawn" which is indexed at 0 in the Enum');
    assert.equal(eventEmitted, true, 'Should emit a Withdrawn Dispute event');
    assert.isAbove(bobBalanceAfter, bobBalanceBefore, "Bob's balance should be higher than its initial (as he got his dispute cost back)");
  })

});
