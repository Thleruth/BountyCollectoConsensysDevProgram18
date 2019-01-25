import React, { Component } from "react";
import BountyCollectorContract from "./contracts/BountyCollector.json";
import getWeb3 from "./utils/getWeb3";
import truffleContract from "truffle-contract";

import Container from "./components/Container";

import "./App.css";

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    contract: null,
  };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const Contract = truffleContract(BountyCollectorContract);
      Contract.setProvider(web3.currentProvider);
      const instance = await Contract.deployed();

      // Set web3, accounts, and contract to the state, and then proceed with an
      web3.currentProvider.publicConfigStore.on('update', this.updateInterface);
      this.setState({ web3, accounts, contract: instance });
      } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.log(error);
    }
  };

  updateInterface = async(data) => {
    const accounts = [data["selectedAddress"] ];
    // the checksum is not handled with the selectedAddress, that's a easy work around
    if (accounts[0].toUpperCase() !== this.state.accounts[0].toUpperCase()) {
      this.setState({accounts});
    }
  }

  // check the onReview
  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
      return (
        <div className="App">
          <Container
            appState={this.state}
          />
        </div>
      );
  }
}

export default App;
