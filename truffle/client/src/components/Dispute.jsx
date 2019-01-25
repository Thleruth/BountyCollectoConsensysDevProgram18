import React, { Component } from "react";

class Dispute extends Component {
  state = {
    identifier: "",
    bountyID: "",
    bountyName: "",
    bountyDescription: "",
    bountyPoster: "",
    proposalDescription: "",
    proposalPoster: "",
    proposalReview: "",
    status: "",
  }

  componentDidMount = async () => {
    const identifier = this.props.disputeID;
    const disputeJson = await this.props.appState.contract.fetchDispute(identifier);
    const bountyID = disputeJson["bountyIdentifier"];
    const proposalID = disputeJson["proposalIdentifier"];
    const bountyJson = await this.props.appState.contract.fetchBounty(bountyID);
    const proposalJson = await this.props.appState.contract.fetchProposal(bountyID, proposalID);
    const bountyName = bountyJson["name"];
    const bountyDescription = bountyJson["description"];
    const bountyPoster = bountyJson["poster"];
    const proposalDescription = proposalJson["description"];
    const proposalPoster = proposalJson["poster"];
    const proposalReview = proposalJson["review"];
    const status = this.statusCodeToString(parseInt(disputeJson["status"]));
    this.setState({ identifier, bountyID, bountyName, bountyDescription, bountyPoster, proposalDescription, proposalPoster, proposalReview, status});
  }

  statusCodeToString(code) {
    if (code === 0) return "none";
    else if (code === 1) return "reviewable";
    else if (code === 2) return "declined"
    else if (code === 3) return "accepted"
    else if (code === 4) return "withdrawn"

  }

  acceptDispute = async() => {
    await this.props.appState.contract.acceptDispute(this.state.identifier, {from: this.props.appState.accounts[0]});
    this.setState({status: "accepted"});
    this.props.onAcceptDispute(this.state.bountyID);
  }

  declineDispute = async() => {
    await this.props.appState.contract.declineDispute(this.state.identifier, {from: this.props.appState.accounts[0]});
    this.setState({status: "declined"});
    this.props.onDeclineDispute();
  }

  withdrawDispute = async() => {
    await this.props.appState.contract.withdrawDispute(this.state.identifier, {from: this.props.appState.accounts[0]});
    this.setState({status: "withdrawn"});
    this.props.onWithdrawDispute();
  }

  reviewButtonsRendering() {
    if (this.state.status === "reviewable" && this.props.appState.accounts[0].toUpperCase() === this.props.arbitragerAddress.toUpperCase()) {
      return (
        <React.Fragment>
          <td><button className="declineDisputeButton" id="declineDisputeButton" onClick={this.acceptDispute}>Accept</button></td>
          <td><button className="acceptDisputeButton" id="acceptDisputeButton" onClick={this.declineDispute}>Decline</button></td>
        </React.Fragment>
      )
    }
  }

  withdrawButtonsRendering() {
    if (this.state.status === "reviewable" && this.props.appState.accounts[0].toUpperCase() === this.state.proposalPoster.toUpperCase()) {
      return (
        <React.Fragment>
          <td><button className="withdrawDisputeButton" id="withdrawDisputeButton" onClick={this.withdrawDispute}>Withdraw</button></td>
        </React.Fragment>
      )
    }
  }

  render() {
    if ((this.props.selectedStatus === "all" || this.props.selectedStatus === this.state.status) &&
        (this.props.appState.accounts[0].toUpperCase() === this.state.bountyPoster.toUpperCase() ||
        this.props.appState.accounts[0].toUpperCase() === this.state.proposalPoster.toUpperCase() ||
        this.props.appState.accounts[0].toUpperCase() === this.props.arbitragerAddress.toUpperCase())) {
      return(
        <React.Fragment>
          <td>{this.state.identifier}</td>
          <td>{this.state.bountyName}</td>
          <td>{this.state.bountyDescription}</td>
          <td>{this.state.proposalDescription}</td>
          <td>{this.state.proposalReview}</td>
          <td>{this.state.status}</td>
          {this.reviewButtonsRendering()}
          {this.withdrawButtonsRendering()}
        </React.Fragment>
        )
    } else {
      return (null);
    }
  }
}
export default Dispute;
