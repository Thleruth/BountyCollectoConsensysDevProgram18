import React, { Component } from "react";

class Balance extends Component {
  state = {
    balance: 0,
  }

  componentDidMount = async () => {
    this.props.onRef(this);
    const balance = parseInt(await this.props.appState.contract.fetchMyBalance({from: this.props.appState.accounts[0]}));
    this.setState({balance});
  }

  componentDidUpdate = async () => {
    const balance = parseInt(await this.props.appState.contract.fetchMyBalance({from: this.props.appState.accounts[0]}));
    if (this.state.balance !== balance) {
      this.setState({balance});
    }
  }

  refreshBalance = async () => {
    const balance = parseInt(await this.props.appState.contract.fetchMyBalance({from: this.props.appState.accounts[0]}));
    this.setState({balance});
  }

  withdrawBalance  = async () =>  {
    await this.props.appState.contract.withdrawFunds(this.state.balance, {from: this.props.appState.accounts[0]})
    this.refreshBalance()
  }

  render () {
    return (
      <React.Fragment>
      <h3>My balance</h3>
      <table>
        <tbody>
          <tr>
            <th>Account</th>
            <th>Balance (in ETH)</th>
          </tr>
          <tr>
            <td>{this.props.appState.accounts[0]}</td>
            <td>{this.state.balance/1000000000000000000}</td>
            <td><button className="WithdrawBalance" id="WithdrawBalance" onClick={this.withdrawBalance}>Withdraw</button></td>
          </tr>
        </tbody>
      </table>
      </React.Fragment>
    )
  }
}

export default Balance;
