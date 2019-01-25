const BountyCollector = artifacts.require('../contracts/BountyCollector.sol');
const SaferMath = artifacts.require('../contracts/library/SaferMath.sol');

module.exports = function(deployer) {
  deployer.deploy(SaferMath).then(() => {
        deployer.deploy(BountyCollector);
  });
  deployer.link(SaferMath, BountyCollector);
  return deployer.deploy(BountyCollector, 2628000, 86400, 500000000); // set Depreciation to 1 month, dispute to 1 day and dispute cost to 0.5 ETH
};
