import React, { Component } from "react";
import Dispute from "./Dispute";
import ListGroup from './common/ListGroup';


class Disputes extends Component {
  state = {
    disputesID: [],
    statusFilters: ["all", "reviewable", "declined", "accepted", "withdrawn"],
    selectedStatus: "reviewable",
  }

  componentDidMount = async () => {
    this.props.onRef(this);
    const disputeCounter = this.props.disputesCounter;
    var disputesID = []
    for (var i = disputeCounter; i >= 1; i--) {
      disputesID.push(i);
    }
    this.setState({disputesID})
  }

  addDispute(disputeID) {
    if (this.state.disputesID.length !== 1) {
      var disputesID = this.state.disputesID;
      disputesID.unshift(parseInt(disputeID));
      this.setState({disputesID})
    }
  }

  populateDisputes() {
    if (this.state.disputesID.length > 0) {
      var disputes = [];
      for (let i = 0; i < this.state.disputesID.length; i++) {
        if (this.state.disputesID[i] > 0) {
          var item = (<tr key={this.state.disputesID[i]}><Dispute
            appState={this.props.appState}
            disputeID={this.state.disputesID[i]}
            selectedStatus={this.state.selectedStatus}
            onAcceptDispute={(bountyID) => this.props.onAcceptDispute(bountyID)}
            onDeclineDispute={() => this.props.onDeclineDispute()}
            onWithdrawDispute={() => this.props.onWithdrawDispute()}
            arbitragerAddress={this.props.arbitragerAddress}
          /></tr>)
          disputes.push(item);
          }
        }
        return disputes;
    }
  }

 handleStatusSelect = status => {
   this.setState({selectedStatus: status})
 }

 render() {
   return(
     <React.Fragment>
     <h3>My disputes</h3>
     <div className="column">
       <div className="dispute-status-filter">
         <ListGroup
           name="Status"
           items={this.state.statusFilters}
           onItemSelect={this.handleStatusSelect}
           selectedItem={this.state.selectedStatus}
         />
       </div>
       <div className="shown-disputes">
         <table>
         <tbody>
          <tr>
            <th>Identifier</th>
            <th>Bounty Name</th>
            <th>Bounty Description</th>
            <th>Proposal Description</th>
            <th>Proposal Review</th>
            <th>Status</th>
          </tr>
        {this.populateDisputes()}
        </tbody>
        </table>
      </div>
    </div>
    </React.Fragment>
    )
  }
}

export default Disputes;
