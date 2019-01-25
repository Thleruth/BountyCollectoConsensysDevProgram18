import React, { Component } from "react";

class ReviewProposal extends Component {
  state = {
    bountyID: "",
    proposalID: "",
    reviewDescription: "",
    view: false,
  }

  constructor(props) {
    super(props);
    const bountyID = "";
    const proposalID = "";
    const reviewDescription = "";
    const view = false;
    this.state = {bountyID, proposalID, reviewDescription, view};
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  viewProposalReviewer(bountyID, proposalID) {
    this.setState({ bountyID, proposalID, view: true });
  }

  acceptProposal = async() => {
    if (this.state.reviewDescription) {
      try {
        await this.props.appState.contract.acceptProposal(this.state.bountyID, this.state.proposalID, this.state.reviewDescription, {from: this.props.appState.accounts[0]});
        this.props.onAcceptProposal(this.state.bountyID, this.state.proposalID);
      } catch (error) {
        console.log(error)
        alert("Fail to accept proposal");
      }
    } else {
      alert ("Missing description to accept proposal");
    }
    this.setState({ view: false, bountyID: "", proposalID: "", reviewDescription: ""});

  }

  declineProposal = async() => {
    if (this.state.reviewDescription) {
      try {
        await this.props.appState.contract.declineProposal(this.state.bountyID, this.state.proposalID, this.state.reviewDescription, {from: this.props.appState.accounts[0]});
        this.props.onDeclineProposal(this.state.bountyID, this.state.proposalID);
        // this.setState({status: "Accepted"})
      } catch (error) {
        console.log(error)
        alert("Fail to decline proposal");
      }
    } else {
      alert ("Missing description to decline proposal");
    }
    this.setState({ view: false, bountyID: "", proposalID: "", reviewDescription: ""});

  }

  conditionalRendering() {
    if (this.state.view) {
      return (
        <div className="ReviewProposal">
        <h3>Review Proposal #{this.state.proposalID} for bounty #{this.state.bountyID}</h3>
        <form>
          <label>Description<input value={this.state.reviewDescription} onChange={evt => {this.setState({reviewDescription: evt.target.value});}}/></label>
          <button onClick={(e) => {e.preventDefault(); this.acceptProposal()}}>Accept Proposal</button>
          <button onClick={(e) => {e.preventDefault(); this.declineProposal()}}>Decline Proposal</button>
        </form>
        </div>
      )
    }
  }

  render () {
    return (
      <React.Fragment>
      {this.conditionalRendering()}
      </React.Fragment>
    )
  }
}

export default ReviewProposal;
