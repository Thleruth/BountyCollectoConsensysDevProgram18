import React, { Component } from "react";
import Proposal from "./Proposal";

class Proposals extends Component {
  state = {
    proposalUpdateCount: [],
    proposalUpdateIndex: [],
    open: true,
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  updateProposal(proposalID, open) {
    const proposalUpdateCount = this.state.proposalUpdateCount
    const proposalUpdateIndex = proposalID
    if (this.state.proposalUpdateCount[proposalUpdateIndex]) {
      proposalUpdateCount[proposalUpdateIndex]++;
    } else {
      proposalUpdateCount[proposalUpdateIndex] = 1;
    }
    this.setState({proposalUpdateCount, proposalUpdateIndex, open});
  }

  populateProposals(bountyID, proposalsCounter) {
    if (proposalsCounter >= 0) {
      var latestProposalID = this.props.latestProposalID;
      var proposals = [];
      for (let i = 1; i <= proposalsCounter; i++) {
        var proposalUpdate = 0;
        if (i === this.state.proposalUpdateIndex) {
          proposalUpdate = this.state.proposalUpdateCount[i];
        }
        const open = (this.props.bountyStatus === "open") ? true : this.state.open
        if (i <= proposalsCounter) {
          proposals.push(<tr key={bountyID.toString() + ":" + i.toString()}><Proposal
            appState={this.props.appState}
            open={open}
            bountyID={bountyID}
            bountyPoster={this.props.bountyPoster}
            proposalUpdate={proposalUpdate}
            proposalID={i}
            latestProposal={latestProposalID}
            onReviewProposal={(bountyID, proposalID) => {this.props.onReviewProposal(bountyID, proposalID)}}
            onAddDispute={(bountyID, proposalID) => {this.props.onAddDispute(bountyID, proposalID)}}
          /></tr>);
      }
     }
     return proposals
   }
 }

 conditionalRendering() {
   return (
     <div className="Proposals">
       <h3>Proposals for bounty #{this.props.bountyID}</h3>
       <table>
         <tbody>
           <tr>
             <th>Identifier</th>
             <th>Description</th>
             <th>Review</th>
             <th>Status</th>
           </tr>
           {this.populateProposals(this.props.bountyID, this.props.proposalsCounter)}
         </tbody>
       </table>
     </div>
   )
 }

  render() {
    return(
      <React.Fragment>
        {this.conditionalRendering()}
      </React.Fragment>
    )
  }
}

export default Proposals;
