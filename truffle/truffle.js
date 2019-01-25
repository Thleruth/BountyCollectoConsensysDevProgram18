const path = require("path");
// var HDWalletProvider = require("truffle-hdwallet-provider");
// const MNEMONIC = 'CHANGEME';
// const INFURANODEACCESS = 'CHANGEME'

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    // Infura node
    // ropsten-: {
    //   provider: function() {
    //     return new HDWalletProvider(MNEMONIC, INFURANODEACCESS)
    //   },
    //   network_id: 3,
    // }
    // Local node
    ropsten: {
      host: "localhost",
      port: 8545,
      network_id: 3,
    }
  }
};
