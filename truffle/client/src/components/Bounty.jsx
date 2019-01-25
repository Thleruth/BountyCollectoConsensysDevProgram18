import React, { Component } from "react";
import "./css/Bounty.css";

class Bounty extends Component {
  state = {
    identifier: "",
    name: "",
    description: "",
    reward: "",
    poster: "",
    status: "",
    proposalsCounter: "",
    rejectedProposalsCounter: "",
  }

  componentDidUpdate = async () =>   {
    if (this.props.bountyUpdate) {
      const id = this.props.bountyID;
      const bountyJson = await this.props.appState.contract.fetchBounty(id);
      const identifier = id;
      const name = bountyJson["name"];
      const description = bountyJson["description"];
      const reward  = parseInt(bountyJson["reward"])/1000000000000000000;
      const poster = bountyJson["poster"];
      const status = this.statusCodeToString(parseInt(bountyJson["status"]));
      const proposalsCounter = parseInt(bountyJson["proposalsCounter"]);
      const rejectedProposalsCounter = parseInt(bountyJson["rejectedProposalsCounter"]);
      if (this.state.proposalsCounter !== proposalsCounter || this.state.rejectedProposalsCounter !== rejectedProposalsCounter || this.state.status !== status) {
        this.setState({ identifier, name, description, reward, poster, status, proposalsCounter, rejectedProposalsCounter});
      }
    }
  }

  componentDidMount = async () => {
    const id = this.props.bountyID;
    const bountyJson = await this.props.appState.contract.fetchBounty(id);
    const identifier = id;
    const name = bountyJson["name"];
    const description = bountyJson["description"];
    const reward  = parseInt(bountyJson["reward"])/1000000000000000000;
    const poster = bountyJson["poster"]; // Might not be useful as (could make two components, one for my bounties and one for all bounties)
    const status = this.statusCodeToString(parseInt(bountyJson["status"]));
    const proposalsCounter = parseInt(bountyJson["proposalsCounter"]);
    const rejectedProposalsCounter = parseInt(bountyJson["rejectedProposalsCounter"]);
    this.setState({ identifier, name, description, reward, poster, status, proposalsCounter, rejectedProposalsCounter});
  }

  statusCodeToString(code) {
    if (code === 0) return "open";
    else if (code === 1) return "cancelled";
    else if (code === 2) return "completed"
    else if (code === 3) return "withdrawn"
  }

  cancelBounty = async() => {
    await this.props.appState.contract.cancelBounty(this.state.identifier, {from: this.props.appState.accounts[0]});
    this.setState({status: "cancelled"});
    this.props.onCancelBounty();
  }

  withdrawBounty = async() => {
    await this.props.appState.contract.EmergencyWithdrawBounty(this.state.identifier, {from: this.props.appState.accounts[0]});
    this.setState({status: "withdrawn"});
    this.props.onWithdrawBounty();
  }

  isCorrectOwner(selectedOwner) {
    if (selectedOwner === "me") {
      return (this.props.appState.accounts[0].toUpperCase() === this.state.poster.toUpperCase()) ? true : false;
    }
    if (selectedOwner === "others") {
      return (this.props.appState.accounts[0].toUpperCase() === this.state.poster.toUpperCase()) ? false : true;
    } else {
      return true;

    }
  }

  cancelButtonRendering() {
    if (this.props.contractStatus === "active" && this.props.appState.accounts[0].toUpperCase() === this.state.poster.toUpperCase() &&
      this.state.status === "open" && this.state.proposalsCounter === this.state.rejectedProposalsCounter) {
      return <td><button className="cancelBountyButton" id="cancelBountyButton" onClick={this.cancelBounty}>Cancel</button></td>
    }
  }

  withdrawButtonRendering() {
    if (this.props.contractStatus !== "active" && this.props.appState.accounts[0].toUpperCase() === this.state.poster.toUpperCase()) {
      return <td><button className="withdrawBountyButton" id="withdrawBountyButton" onClick={this.withdrawBounty}>Withdraw</button></td>
    }
  }

  viewProposalsButtonRendering() {
    if (this.state.proposalsCounter) {
      return <td><button className="viewProposalsBountyButton" id="viewProposalsBountyButton" onClick={(bountyID, viewedProposalBountyPoster, viewedProposalsCounter, viewedRejectedProposalsCounter, status) => {this.props.onViewProposals(this.state.identifier, this.state.poster, this.state.proposalsCounter, this.state.rejectedProposalsCounter, this.state.status)}}>View Proposals</button></td>
    }
  }

  addProposalButtonRendering() {
    if (this.props.appState.accounts[0].toUpperCase() !== this.state.poster.toUpperCase() && this.state.status === "open") {
      return <td><button className="addProposalButton" id="addProposalButton" onClick={bountyID => {this.props.onAddProposal(this.state.identifier)}}>Add Proposal</button></td>
    }
  }

  render() {
    var reviewablePropoposalsCounter = this.state.proposalsCounter - this.state.rejectedProposalsCounter;
    if (this.state.status === "completed" || this.state.status === "cancelled" || this.state.status === "withdrawn") reviewablePropoposalsCounter = 0;
    if ((this.props.selectedStatus === "all" || this.props.selectedStatus === this.state.status) && this.isCorrectOwner(this.props.selectedOwner)) {
      return(
        <React.Fragment>
          <td>{this.state.identifier}</td>
          <td>{this.state.name}</td>
          <td>{this.state.description}</td>
          <td>{this.state.reward}</td>
          <td>{this.state.status}</td>
          <td>{this.state.proposalsCounter}</td>
          <td>{reviewablePropoposalsCounter}</td>
          {this.addProposalButtonRendering()}
          {this.viewProposalsButtonRendering()}
          {this.cancelButtonRendering()}
          {this.withdrawButtonRendering()}
        </React.Fragment>
        )
    } else {
      return (null);
    }
  }
}

// e.preventDefault(),
export default Bounty;
