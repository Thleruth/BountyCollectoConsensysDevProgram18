    import React, { Component } from "react";

class AddProposal extends Component {
  state = {
    proposalDescription: "",
    bountyID: "",
    view: false,
  }

  constructor(props) {
    super(props);
    const proposalDescription = "";
    const bountyID = "";
    const view = false;
    this.state = {proposalDescription, bountyID, view};
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  viewProposalAdder(bountyID) {
    this.setState({ bountyID, view: true });
  }

  addProposal = async () => {
    const identifier = this.state.bountyID;
    const description = this.state.proposalDescription;
    if (identifier >= 0 && description) {
      if (identifier <= this.props.bountiesCounter) {
        try {
          await this.props.appState.contract.postProposal(identifier, description, {from: this.props.appState.accounts[0]});
        } catch (error) {
          console.log(error)
          alert("Fail to post Proposal");
        }
      } else {
        alert ("Identifier does not exist")
      }
    } else {
      alert ("Missing elements to send a Proposal");
    }
    this.setState({ view: false, proposalDescription: "" });
    this.props.onAddProposal(identifier)
  }

  conditionalRendering() {
    if (this.state.view) {
      return (
        <div className="addProposal">
        <h3>Add proposal for bounty #{this.state.bountyID}</h3>
        <form>
          <label>Description<input value={this.state.proposalDescription} onChange={evt => {this.setState({proposalDescription: evt.target.value});}}/></label>
          <button onClick={(e) => {e.preventDefault(); this.addProposal()}}>Confirm Proposal</button>
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

export default AddProposal;
