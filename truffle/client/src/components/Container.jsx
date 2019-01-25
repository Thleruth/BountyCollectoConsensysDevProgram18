import React, { Component } from "react";
import AddBounty from "./AddBounty";
import AddProposal from "./AddProposal";
import ReviewProposal from "./ReviewProposal";
import AddDispute from "./AddDispute";
import Disputes from "./Disputes";
import Bounties from "./Bounties";
import Proposals from "./Proposals";
import Balance from "./Balance";

class Container extends Component {
  state = {
    bountiesCounter: "",
    disputesCounter: "",
    viewedProposalsBountyID: "",
    viewedProposalBountyPoster: "",
    viewedProposalsCounter: "",
    viewedRejectedProposalsCounter: "",
    viewProposalsBountyStatus: "",
    disputeCost: "",
    expirationTime: "",
    disputeTime: "",
    arbitragerAddress: "",
    ownerAddress: "",
    contractStatus: "active",
    newContractAddressInput: "",
    newContractAddress: "0x0000000000000000000000000000000000000000",
  }

  componentDidMount = async () => {
    const bountiesCounter = parseInt(await this.props.appState.contract.bountiesCounter());
    const disputesCounter = parseInt(await this.props.appState.contract.disputesCounter());
    const disputeCost = parseInt(await this.props.appState.contract.disputeCost());
    var expirationTime = new Date(Date().valueOf(parseInt(await this.props.appState.contract.contractExpiration())));
    expirationTime = expirationTime.toUTCString();
    const disputeTime = parseInt(await this.props.appState.contract.disputeAllowance()/86400);
    const arbitragerAddress = await this.props.appState.contract.arbitrager();
    const ownerAddress = await this.props.appState.contract.owner();
    var contractStatus = "active";
    if (await this.props.appState.contract.isExpired()) contractStatus = "expired";
    else if (await this.props.appState.contract.stopped()) contractStatus = "stopped";
    const newContractAddress = await this.props.appState.contract.newContractAddress();
    this.setState({ bountiesCounter, disputesCounter, disputeCost, expirationTime, disputeTime, arbitragerAddress, ownerAddress , contractStatus, newContractAddress});
  }

  refreshBounties = async(bountyID) => {
    var bountiesCounter = parseInt(await this.props.appState.contract.bountiesCounter());
    this.bounties.addBounty(bountyID);
    this.setState({bountiesCounter});
  }

  addDispute = async(proposalID, disputeID) => {
    const disputesCounter = parseInt(await this.props.appState.contract.disputesCounter());
    this.setState({disputesCounter});
    this.disputes.addDispute(disputeID);
    this.proposals.updateProposal(proposalID, true);
  }

  refreshBounty(bountyID) {
    this.bounties.updateBounty(bountyID);
  }

  addProposal(bountyID) {
    this.refreshBounty(bountyID);
    if (this.state.viewedProposalsBountyID === bountyID) {
      const viewedProposalsCounter = this.state.viewedProposalsCounter + 1;
      this.setState({viewedProposalsCounter});
    }
  }

  declineProposal(bountyID, proposalID) {
    this.refreshBounty(bountyID);
    this.proposals.updateProposal(proposalID, true);
  }

  acceptProposal(bountyID, proposalID) {
    this.refreshBounty(bountyID);
    this.proposals.updateProposal(proposalID, false);
    this.balanceManager.refreshBalance();
  }

  viewProposals(viewedProposalsBountyID, viewedProposalBountyPoster, viewedProposalsCounter, viewedRejectedProposalsCounter, status) {
    this.setState({viewedProposalsBountyID, viewedProposalBountyPoster, viewedProposalsCounter, viewedRejectedProposalsCounter, viewProposalsBountyStatus: status});
  }

  viewProposalAdder(bountyID) {
    this.proposalAdder.viewProposalAdder(bountyID);
  }

  viewProposalReviewer(bountyID, proposalID) {
    this.proposalReviewer.viewProposalReviewer(bountyID, proposalID);
  }

  viewDisputeAdder(bountyID, proposalID) {
    this.disputeAdder.viewDisputeAdder(bountyID, proposalID);
  }

  acceptDispute(bountyID) {
    this.balanceManager.refreshBalance();
    this.refreshBounty(bountyID)
  }

  declineDispute() {
    this.balanceManager.refreshBalance();
  }

  withdrawDispute() {
    this.balanceManager.refreshBalance();
  }

  stopContract = async() => {
    await this.props.appState.contract.StopContract({from: this.props.appState.accounts[0]});
    this.setState({contractStatus: "stopped"});
  }

  setNewContractAddress = async() => {
    await this.props.appState.contract.setNewContractAddress(this.state.newContractAddressInput, {from: this.props.appState.accounts[0]});
    this.setState({newContractAddress: this.state.newContractAddressInput});
  }

  conditionalDisputesRendering() {
    if (this.state.disputesCounter >= 1) {
      return (
        <Disputes
          appState={this.props.appState}
          onRef={ref => (this.disputes = ref)}
          arbitragerAddress={this.state.arbitragerAddress}
          disputesCounter={this.state.disputesCounter}
          onAcceptDispute={(bountyID) => this.acceptDispute(bountyID)}
          onDeclineDispute={() => this.declineDispute()}
          onWithdrawDispute={() => this.withdrawDispute()}
        />)
    } else {
      return;
    }
  }

  conditionalProposalsRendering() {
    if (this.state.viewedProposalsBountyID >= 1) {
      return (
        <Proposals
          appState = {this.props.appState}
          bountyID = {this.state.viewedProposalsBountyID}
          bountyStatus = {this.state.viewProposalsBountyStatus}
          bountyPoster = {this.state.viewedProposalBountyPoster}
          proposalsCounter = {this.state.viewedProposalsCounter}
          latestProposalID = {this.state.viewedRejectedProposalsCounter + 1}
          onReviewProposal = {(bountyID, proposalID) => {this.viewProposalReviewer(bountyID, proposalID)}}
          onAddDispute = {(bountyID, proposalID) => {this.viewDisputeAdder(bountyID, proposalID)}}
          onRef = {ref => (this.proposals = ref)}
        />
      )
    } else {
      return;
    }
  }

  conditionalAddProposalRendering() {
    return (
      <AddProposal
        appState={this.props.appState}
        bountiesCounter={this.state.bountiesCounter}
        onRef={ref => (this.proposalAdder = ref)}
        onAddProposal={bountyID => this.addProposal(bountyID)}
      />
    )
  }

  conditionalReviewProposalRendering() {
    return (
      <ReviewProposal
        appState={this.props.appState}
        onRef={ref => (this.proposalReviewer = ref)}
        onDeclineProposal={(bountyID, proposalID) => {this.declineProposal(bountyID, proposalID)}}
        onAcceptProposal={(bountyID, proposalID) => {this.acceptProposal(bountyID, proposalID)}}
      />
    )
  }

  conditionalDisputeAdderRendering() {
    return (
      <AddDispute
        appState={this.props.appState}
        onRef={ref => (this.disputeAdder = ref)}
        disputeCost={this.state.disputeCost}
        onAddDispute={this.addDispute}
      />
    )
  }

  conditionalStopContractButtonRendering() {
    if (this.props.appState.accounts[0].toUpperCase() === this.state.ownerAddress.toUpperCase() && this.state.contractStatus === "active") {
      return <td><button className="stopContractButton" id="stopContractButton" onClick={this.stopContract}>Stop Contract</button></td>
    }
  }

  conditionalNewContractAddressInputHeader() {
    if (this.state.newContractAddress === "0x0000000000000000000000000000000000000000" && this.props.appState.accounts[0].toUpperCase() === this.state.ownerAddress.toUpperCase() && this.state.contractStatus !== "active") {
      return <th>New Contract Address Input</th>
    }
  }

  conditionalNewContractAddressHeader() {
    if (this.state.newContractAddress !== "0x0000000000000000000000000000000000000000") {
      return <th>New Contract Address</th>
    }
  }

  conditionalNewContractAddressInput() {
    if (this.state.newContractAddress === "0x0000000000000000000000000000000000000000" && this.props.appState.accounts[0].toUpperCase() === this.state.ownerAddress.toUpperCase() && this.state.contractStatus !== "active") {
      return <label><input value={this.state.newContractAddressInput} onChange={evt => {this.setState({newContractAddressInput: evt.target.value});}}/></label>
    }
  }

  conditionalNewContractAddress() {
    if (this.state.newContractAddress !== "0x0000000000000000000000000000000000000000") {
      return  <td>{this.state.newContractAddress}</td>
    }
  }

  conditionalSetNewContractAddressButton() {
    if (this.state.newContractAddress === "0x0000000000000000000000000000000000000000" && this.props.appState.accounts[0].toUpperCase() === this.state.ownerAddress.toUpperCase() && this.state.contractStatus !== "active") {
      return <td><button className="stopContractButton" id="stopContractButton" onClick={this.setNewContractAddress}>Set</button></td>
    }
  }


  render() {
    return (
      <React.Fragment>
        <h1>Bounties Collector</h1>
        <h3>Contract Information</h3>
        <table>
          <tbody>
            <tr>
              <th>Bounties Counter</th>
              <th>Contract Expiration</th>
              <th>Dispute Cost (in ETH)</th>
              <th>Dispute time (in hour)</th>
              <th>Contract Address</th>
              <th>Contract Status</th>
              {this.conditionalNewContractAddressInputHeader()}
              {this.conditionalNewContractAddressHeader()}
            </tr>
            <tr>
              <td>{this.state.bountiesCounter}</td>
              <td>{this.state.expirationTime}</td>
              <td>{this.state.disputeCost/1000000000000000000}</td>
              <td>{this.state.disputeTime}</td>
              <td>{this.props.appState.contract.address}</td>
              <td>{this.state.contractStatus}</td>
              {this.conditionalStopContractButtonRendering()}
              {this.conditionalNewContractAddressInput()}
              {this.conditionalSetNewContractAddressButton()}
              {this.conditionalNewContractAddress()}
            </tr>
          </tbody>
        </table>
        <Balance
          appState={this.props.appState}
          onRef={ref => (this.balanceManager = ref)}
        />
        {this.conditionalDisputesRendering()}
        <AddBounty
          appState={this.props.appState}
          onAddBounty={(bountyID) => this.refreshBounties(bountyID)}
        />
        <Bounties
          appState={this.props.appState}
          bountiesCounter={this.state.bountiesCounter}
          onRef={ref => (this.bounties = ref)}
          onCancelBounty={() => this.balanceManager.refreshBalance()}
          onWithdrawBounty={() => this.balanceManager.refreshBalance()}
          contractStatus={this.state.contractStatus}
          onViewProposals={(bountyID, viewedProposalBountyPoster, proposalsCounter, viewedRejectedProposalsCounter, status) => this.viewProposals(bountyID, viewedProposalBountyPoster, proposalsCounter, viewedRejectedProposalsCounter, status)}
          onAddProposal={bountyID => {this.viewProposalAdder(bountyID)}}
        />
        {this.conditionalProposalsRendering()}
        {this.conditionalDisputeAdderRendering()}
        {this.conditionalAddProposalRendering()}
        {this.conditionalReviewProposalRendering()}
      </React.Fragment>
    );
  }
}

export default Container;
