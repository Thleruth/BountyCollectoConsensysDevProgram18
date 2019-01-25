import React, { Component } from "react";

class AddDispute extends Component {
  state = {
    bountyID: "",
    proposalID: "",
    disputeDescription: "",
    view: false,
  }

  constructor(props) {
    super(props)
    const bountyID = "";
    const proposalID = "";
    const disputeDescription = "";
    const view = false;
    this.state = {bountyID, proposalID, disputeDescription, view};
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  viewDisputeAdder(bountyID, proposalID) {
    this.setState({bountyID, proposalID, view: true });
  }

  addDispute = async () => {
    const bountyID = this.state.bountyID;
    const proposalID = this.state.proposalID;
    const disputeDescription = this.state.disputeDescription;
    const disputeCost = this.props.disputeCost;
    var disputeID = 0;
    if (bountyID >= 0 && proposalID >= 0 && disputeDescription) {
      try {
        const tx = await this.props.appState.contract.disputeProposalReview(bountyID, proposalID, disputeDescription, {from: this.props.appState.accounts[0], value: disputeCost});
        disputeID = parseInt(tx["logs"]["0"]["args"]["0"]); // I am catching the event as payable is not returning the value
      } catch (error) {
        console.log(error)
        alert("Fail to make a dispute");
      }
    } else {
      alert ("Missing elements to make a Dispute");
    }
    this.setState({ view: false, bountyID: "", proposalID: "", disputeDescription:"" });
    this.props.onAddDispute(proposalID, disputeID);
  }

  conditionalRendering() {
    if (this.state.view) {
      return (
        <div className="addDispute">
        <h3>Dispute proposal #{this.state.proposalID} for bounty #{this.state.bountyID}</h3>
        <form>
          <label>Description<input value={this.state.disputeDescription} onChange={evt => {this.setState({disputeDescription: evt.target.value});}}/></label>
          <button onClick={(e) => {e.preventDefault(); this.addDispute()}}>Add Dispute</button>
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

export default AddDispute;
