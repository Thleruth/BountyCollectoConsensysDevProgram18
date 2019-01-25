import React, { Component } from "react";

class AddBounty extends Component {
  state = {
    bountyName: "",
    boutyDescription: "",
    bountyValue: "",
  }

  constructor(props) {
    super(props)
    const bountyName = "";
    const bountyDescription = "";
    const bountyValue = "";
    this.state = {bountyName, bountyDescription, bountyValue};
  }

  addBounty = async (name, description, value) => {
    const ethValue = value * 1000000000000000000; // I would use web3.utils.toWei but somehow did not work (could not pass the args without errors)
    if (name && description && value) {
      try {
        const responseAddBounty = await this.props.appState.contract.addBounty(name, description, {from: this.props.appState.accounts[0], value: ethValue});
        const bountyID = parseInt(responseAddBounty["logs"]["0"]["args"]["0"]); // I am catching the event as payable is not returning the value
        await this.props.appState.contract.fetchBounty(bountyID);
        this.props.onAddBounty(bountyID);
      } catch (error) {
        console.log(error)
        alert("Fail to post Bounty");
      }
    } else {
      alert ("Missing elements to send a bounty");
    }
  }

  render () {
    return (
      <div className="addBounty">
      <h3>Add bounty</h3>
      <form>
        <label>Name<input value={this.state.bountyName} onChange={evt => {this.setState({bountyName: evt.target.value});}}/> </label>
        <label>Description<input value={this.state.bountyDescription} onChange={evt => {this.setState({bountyDescription: evt.target.value});}}/></label>
        <label>Reward<input value={this.state.bountyValue} onChange={evt => {this.setState({bountyValue: evt.target.value});}}/></label>
        <button onClick={(e) => {e.preventDefault(); this.addBounty(this.state.bountyName, this.state.bountyDescription, this.state.bountyValue)}}>Add Bounty</button>
      </form>
      </div>
    )
  }
}

export default AddBounty;
