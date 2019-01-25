import React, { Component } from "react";
import Bounty from "./Bounty";
import ListGroup from './common/ListGroup';

import "./css/Bounties.css";

class Bounties extends Component {
  state = {
    bountiesID: [],
    bountyUpdateCount: [],
    bountyUpdateIndex: [],
    statusFilters: ["all", "open", "cancelled", "completed", "withdrawn"],
    selectedStatus: "open",
    posterFilters: ["all", "others", "me"],
    selectedOwner: "all"
  }

  componentDidMount = async() => {
    this.props.onRef(this);
    const bountiesCounter = parseInt(await this.props.appState.contract.bountiesCounter());
    var bountiesID = [];
    for (var i = bountiesCounter; i >= 1; i--) {
      bountiesID.push(i);
    }
    this.setState({bountiesID})
  }


  listBounties = async() => {
    const bountiesCounter = parseInt(await this.props.appState.contract.bountiesCounter());
    var bountiesID = []
    for (var i = bountiesCounter; i >= 1; i--) {
      bountiesID.push(i);
    }
    this.setState({bountiesID})
  }

  addBounty(bountyID) {
    var bountiesID = this.state.bountiesID;
    bountiesID.unshift(parseInt(bountyID));
    this.setState({bountiesID})
  }

  updateBounty(bountyID) {
    const bountyUpdateCount = this.state.bountyUpdateCount
    const bountyUpdateIndex = this.state.bountiesID.length - bountyID
    if (this.state.bountyUpdateCount[bountyUpdateIndex]) {
      bountyUpdateCount[bountyUpdateIndex]++;
    } else {
      bountyUpdateCount[bountyUpdateIndex] = 1;
    }
    this.setState({bountyUpdateCount, bountyUpdateIndex});
  }

  populateBounties() {
    if (this.state.bountiesID.length > 0) {
      var bounties = [];
      for (let i = 0; i < this.state.bountiesID.length; i++) {
        if (this.state.bountiesID[i] >= 0) {
          const bountyUpdate = (i === this.state.bountyUpdateIndex) ? this.state.bountyUpdateCount[i] : 0;
          var item = (<tr key={this.state.bountiesID[i]}><Bounty
            appState={this.props.appState}
            bountyID={this.state.bountiesID[i]}
            bountyUpdate={bountyUpdate}
            selectedStatus={this.state.selectedStatus}
            selectedOwner={this.state.selectedOwner}
            onCancelBounty={() => {this.props.onCancelBounty()}}
            onWithdrawBounty={() => {this.props.onWithdrawBounty()}}
            contractStatus={this.props.contractStatus}
            onViewProposals={(bountyID, viewedProposalBountyPoster, viewedProposalsCounter, viewedRejectedProposalsCounter, status) => {
              this.props.onViewProposals(bountyID, viewedProposalBountyPoster, viewedProposalsCounter, viewedRejectedProposalsCounter, status)}}
            onAddProposal={bountyID => {this.props.onAddProposal(bountyID)}}
          /></tr>)
          bounties.push(item);
          }
        }
        return bounties;
    }
  }

  conditionalFiltersRendering() {
    if (this.props.bountiesCounter > 0) {
      return(
        <div className="bounty-status-filter">
          <ListGroup
            name="Status"
            items={this.state.statusFilters}
            onItemSelect={this.handleStatusSelect}
            selectedItem={this.state.selectedStatus}
          />
          <ListGroup
            name="Poster"
            items={this.state.posterFilters}
            onItemSelect={this.handleOwnerSelect}
            selectedItem={this.state.selectedOwner}
          />
        </div>
      )
    } else {
      return;
    }
  }

 handleStatusSelect = status => {
   this.setState({selectedStatus: status})
 }

 handleOwnerSelect = owner => {
   this.setState({selectedOwner: owner})
 }

  render() {
    return(
      <React.Fragment>
      <h3>Bounties</h3>
      <div className="column">
        {this.conditionalFiltersRendering()}
        <div className="shown-bounties">
          <table>
            <tbody>
              <tr>
                <th>Identifier</th>
                <th>Name</th>
                <th>Description</th>
                <th>Reward (in ETH)</th>
                <th>Status</th>
                <th>Proposals Counter</th>
                <th>Reviewable Proposals Counter</th>
              </tr>
              {this.populateBounties()}
            </tbody>
          </table>
        </div>
      </div>
      </React.Fragment>

    )
  }
}

export default Bounties;
