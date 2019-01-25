# ConsenSys Developer Program Final Project

This project is for the consenSys 2018 developer program and serves as my final project. This project includes smart contracts to create a bounty DApp where users can post pre-funded bounties, submit proposals to bounties, review proposals, and dispute proposal reviews thanks to an arbitraging system. The contracts handle the flow of the rewards through the process in a decentralized fashion. Additionally, a React interface is present to interact more easily with the deployed contracts.

## User stories

Two main types of users can interact with the contracts:
- Bounty posters can:
  * post a bounty (and pre-fund the bounty reward and dispute cost)
  * cancel a bounty (and indirectly recover the bounty reward and dispute cost)
  * withdraw a bounty [in case of contract freeze or auto-depreciate] (and indirectly recover the bounty reward and dispute cost)
  * review its proposals:
    - Accept proposal (and indirectly recover the dispute cost and award the bounty reward)
    - Decline proposal
  * withdraw funds (to withdraw the indirectly recovered funds)
- Proposal posters can:
  * post proposals
  * dispute any declined proposals (and pre-fund the dispute cost)
  * withdraw a dispute (and indirectly recover the dispute cost)
  * withdraw funds (to withdraw the indirectly recovered funds)

Additionally, two other types of users can interact with the contract:
- Contract owner can
  * Initially set the contract parameters at contract construction time (dispute time, dispute cost, and contract live span)
  * trigger a freeze in case of a contract bug which allows all users to withdraw any left over bounty reward and/or dispute costs
  * set the new Contract address after a freeze or an auto-depreciation
- Proposal arbitrager can:
  * review any disputes:
    - Accept a dispute (and indirectly recover the dispute cost and award the bounty reward)
    - Decline a dispute (and indirectly recover the dispute cost)
  * withdraw funds (to withdraw the indirectly recovered funds)

All the actions taken by the users will be directly reflected in the UI upon 1 block confirmation (no need to reload, thanks React :))

NB: It is my first interaction with React let alone Javascript for web interface. Thus, the interface could be most likely done more professionally. However, it is fully functional and allow to play with the contract in a more easy fashion. That being said, one could definitely make it more eye pleasing.

## Setup

### Prerequisites

To run the following setup, the project requires
- [git](https://www.liquidweb.com/kb/install-git-ubuntu-16-04-lts/)
- [npm](https://www.npmjs.com/get-npm)
- [truffle v4.1.14](https://truffleframework.com/docs/truffle/getting-started/installation)
- [ganache-cli](https://github.com/trufflesuite/ganache-cli) - To deploy the contract locally
- [geth](https://github.com/ethereum/go-ethereum/wiki/Installing-Geth) - to run a node and deploy the contract externally
- [Infura API key] (https://infura.io/register) - to use an Infura node and deploy the contract externally
- [HDWalletProvider](https://github.com/trufflesuite/truffle-hdwallet-provider) - to use an Infura node and deploy the contract externally
- A browser with web3 functionality (Chrome with Metamask is used below)

The setup was run using Ubuntu 16.04

### Installing

## Running the tests

This project has 9 tests to test the lifecycles of the contract function.

To run the test first start ganache-cli:
```
$ ganache-cli
```

Then run the test with truffle:
```
$ truffle test
```

Results:
```
Using network 'development'.

Compiling ./contracts/BountyCollector.sol...
Compiling ./contracts/library/SaferMath.sol...


  Contract: BountyCollector
    ✓ Should add the bounty correctly (448ms)
    ✓ Should post a proposal correctly (227ms)
    ✓ Should accept the proposal and withdraw correctly (936ms)
    ✓ Should decline the proposal correctly (243ms)
    ✓ Should cancel the bounty correctly (501ms)
    ✓ Should open a dispute correctly (323ms)
    ✓ Should decline a dispute correctly (638ms)
    ✓ Should accept a dispute correctly (1051ms)
    ✓ Should withdraw a dispute correctly (570ms)


  9 passing (5s)
```

### Deployment

The project can either be run locally or deployed on the Ropsten testnet

#### Local deployment

1) Clone the repository and enter the truffle project

```
$ git clone [URL of this project]
$ cd BountyCollectorConsensysDevProgram18/truffle/
```

2) In a new terminal window, start a development blockchain with:
```
$ ganache-cli (in another terminal window)
```
3) Take note of the Mnemonic and import into Metamask. Make sure you are switch to Private network with port 8545. If succesful you should see accounts pre-funded with 100ETH
4) Compile and migrate the contracts:
```
$ truffle compile
$ truffle --network development migrate
```
5) In a new terminal window, start your local dev server with:
```
$ cd client/
$ npm run start
```
6) Your browser should redirect you to the interface if not you can access it via localhost:3000

#### Ropsten deployment

1) Start your own Ethereum and wait til it is synced
```
$ geth --testnet --rpc
```
In a new terminal window, run this:
```
$ geth --testnet attach (to the javascript console)
$ personal.unlockAccount(eth.coinbase, "yourPassword", "LoggedDuration") (change argument 2 and 3)
```
2) In a new terminal window, clone the repository
```
$ git clone [URL Of this project]
$ cd BountyCollectorConsensysDevProgram18/truffle/
```
3) Compile and migrate the contracts:
```
$ truffle compile
$ truffle --network ropsten migrate
```
4) In a new terminal window, start your local dev server with:
```
$ cd client/
$ npm run start
```
5) Your browser should redirect you to the interface if not you can access it via localhost:3000


#### Alternatives

Alternatively for deploying on Ropsten an Infura node could be used, follow the steps above but instead of step 1 do the followings:
1) Uncomment lines 17-22 in truffle.js
2) comment lines 24-28 in truffle.js
3) Change the strings "CHANGEME"

Alternatively for both local and Ropsten deployment the interface could be deploy externally with (step 5 in local and 4 for Ropsten):

Run instead of:

```
$ npm run start
```
The followings:

```
$ npm run build
```
and then deploy the build content to a server or IPFS

## Design Patterns Decisions

Key design patterns have been followed, For more details, see [design_pattern_decisions.md](design_pattern_decisions.md) file

## Avoiding Common Attack vectors

Steps have been taken to reduce the amount of attack vectors, For more details, see [avoiding_common_attacks.md](avoiding_common_attacks.md) file

## Interaction with pre-deployed contracts and interface

This project has been deployed to Ropsten and an interface is hosted via IPFS. For more details, see [deployed_addresses.txt](deployed_addresses.txt) file

## Improvements

While this project has been built with all the required specifications within the allowed time, some suggestions for improvements have been made and can be seen in  [improvement_suggestions.txt](improvement_suggestions.txt) file

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
