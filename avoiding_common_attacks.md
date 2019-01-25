# Avoid Common Attacks

This document investigates the major Exploits and Dangers and how they apply to this contracts in this project

### External Reentrancy
- The only external call on this contract is the .transfer(). To mitigate the risk of bad actors taking over the code flow, the withdrawal logic is used. Therefore, .transfer() is called in an isolated function after handling all the state variables changes
  * Example of the logic:
```solidity
/** @dev Decline a dispute
  * @param _identifier The identifier of the dispute to be declined
  */
function declineDispute(uint _identifier)
  external
  isNotStoppedOrExpired() onlyArbitrager() openDispute(_identifier) {
    disputes[_identifier].status = DisputeStatus.Declined;
    balances[owner] += disputeCost;
    emit DeclinedDispute(_identifier);
}

...

/** @dev Withdrawal function to take from own balances
  * @param amount the amount to be withdrawn
  */
function withdrawFunds(uint _amount)
  external
  payable
  sufficientlyFunded(_amount) {
  balances[msg.sender] -= _amount;
  msg.sender.transfer(_amount);
  emit WithdrawnFunds(msg.sender, _amount);
}
```

### Cross Reentrancy
- While some functions access the same state variables, thanks to the modifiers (e.g. you can't cancel and approve at the same time as you can only cancel if there is no proposal left), the possibility of cross Reentrancy is controlled

### Integer Overflow and Underflow
- A side library for the uint was built to check for over/under flow. Therefore, this risk is mitigated
  * Implementation and example of one library function
```solidity
import "./library/SaferMath.sol";

/** @title Bounty Collector. */
contract BountyCollector {
    using SaferMath for uint;
...

library SaferMath {

    /**
      * @dev Add two values safely
      * @param a the first element to add
      * @param b the second element to add
      * @return result the result of the addition
      */
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 result = a + b;
        assert(result - a == b);
        return result;
    }

```
- On top of the first element, the functions barely used arithmetic actions directly influenceable by the user

### Transaction Ordering and Timestamp Dependence
- An user could read the mempool and reproduce the transaction with a higher gas fee and take the position of the original poster. Therefore, in the case of this contract, it is an attack vector. If time would allow it, I would build the suggestions I have written in the improvement_suggestions.txt file to mitigate it

### Denial of Service
- The only external attack vector is in the withdrawFunds function and this function only has access to the balance of the user. Thus, there is no much a malicious user can do to DoS this contract.

### Force Sending Ether
- Not really an issue as the contract does not rely on the contract balance but on the user balances and the state variables controlled by the contract
