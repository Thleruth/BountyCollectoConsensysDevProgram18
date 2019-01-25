import React, { Component } from "react";

class Proposal extends Component {
  state = {
    identifier: "",
    description: "",
    poster: "",
    review: "",
    status: "",
    disputeIdentifier: "",
  }

  componentDidMount = async () => {
    const proposalID = this.props.proposalID;
    const bountyID = this.props.bountyID;
    const proposalJson = await this.props.appState.contract.fetchProposal(bountyID, proposalID);
    const identifier = proposalID;
    const description = proposalJson["description"];
    const poster = proposalJson["poster"];
    var review = proposalJson["review"];
    if (review === "") review = "None";
    const status = this.statusCodeToString(parseInt(proposalJson["status"]));
    const disputeIdentifier = proposalJson["disputeIdentifier"].toNumber();
    this.setState({ identifier, description, poster, review, status, disputeIdentifier});
  }

  componentDidUpdate = async () => {
    if (this.props.proposalUpdate) {
      const proposalID = this.props.proposalID;
      const bountyID = this.props.bountyID;
      const proposalJson = await this.props.appState.contract.fetchProposal(bountyID, proposalID);
      const identifier = proposalID;
      const description = proposalJson["description"];
      const poster = proposalJson["poster"];
      var review = proposalJson["review"];
      if (review === "") review = "None";
      const status = this.statusCodeToString(parseInt(proposalJson["status"]));
      const disputeIdentifier = proposalJson["disputeIdentifier"].toNumber()
      if (this.state.status !== status || this.state.disputeIdentifier !== disputeIdentifier) {
        this.setState({ identifier, description, poster, review, status, disputeIdentifier});
      }
    }
  }

  statusCodeToString(code) {
    if (code === 0) return "Reviewable";
    else if (code === 1) return "Declined";
    else if (code === 2) return "Accepted"
  }

  disputeButtonConditionalRendering() {
    if (this.props.latestProposal === this.state.identifier + 1 && this.props.appState.accounts[0].toUpperCase() === this.state.poster.toUpperCase()
      && this.state.status === "Declined" && this.props.open === true && this.state.disputeIdentifier === 0) {
      return <td><button className="disputeProposalButton" id="disputeProposalButton" onClick={(bountyID, proposalID) => {this.props.onAddDispute(this.props.bountyID, this.props.proposalID)}}>Dispute</button></td>
    }
  }

  reviewButtonConditionalRendering() {
    if (this.props.latestProposal === this.state.identifier && this.props.appState.accounts[0].toUpperCase() === this.props.bountyPoster.toUpperCase()
      && this.state.status === "Reviewable" && this.props.open === true) {
      return <td><button className="reviewProposalButton" id="reviewProposalButton" onClick={(bountyID, proposalID) => {this.props.onReviewProposal(this.props.bountyID, this.props.proposalID)}}>Review</button></td>
    }
  }

  render() {
    return(
      <React.Fragment>
        <td>{this.state.identifier}</td>
        <td>{this.state.description}</td>
        <td>{this.state.review}</td>
        <td>{this.state.status}</td>
        {this.reviewButtonConditionalRendering()}
        {this.disputeButtonConditionalRendering()}
      </React.Fragment>
      )
  }
}
export default Proposal;
