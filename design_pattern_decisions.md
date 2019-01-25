# Design Pattern Decisions

## Used patterns

### Fail Early
- All non view or pure functions have a decent amount of modifiers to check that the given inputs are valid (e.g. testing if a bounty exists before doing anything to it)
* Some modifier examples:
```solidity
/* Modifiers */

modifier isNotStoppedOrExpired() { require (!stopped && !isExpired(), "The contract is stopped or expired, this function can't be used"); _;}
modifier isStoppedOrExpired() { require (stopped || isExpired(), "The contract is not stopped or expired, this function can't be used"); _;}
modifier onlyOwner() { require (msg.sender == owner, "Only the contract owner can do this"); _;}
modifier onlyArbitrager() { require (msg.sender == arbitrager, "Only the contract arbitrager can do this"); _;}
modifier onlyBountyPoster(uint _identifier) { require (msg.sender == bounties[_identifier].poster, "Only the bounty poster can do this"); _;}
```
- All functions use internal actions (except WithdrawFunds using the .transfer() function), thus, limiting the potential failures coming from outside the realm of this contract
- All functions have only one route (no "if" style route) limiting the potential non accounted cases

### Restricting Access
- All the array type variables are private restricting their access from other contracts and forcing them to use the functions to indirectly access them
- Access to functions are restricted due to modifiers (e.g. onlyBountyPoster modifier restricting action to the original poster of the bounty)

### Auto Depreciate
- An Auto Depreciate (AD) is present to enable the easier switch to a future upgraded contract and avoid old users to keep on working with the old contract
- The AD freeze all functions and enable the withdrawal functions for recovering any reward or dispute costs leftover

* The function testing if the contract is still within the the allowed time period
```solidity
/** @dev Test if the contract is expired
  *
  */
function isExpired()
  view
  public
  returns (bool) {
    return (now > contractExpiration) ? true : false;
}
```

### Circuit breaker
- A circuit breaker (CB) exists that can be activated by the owner of the contract in of bug
- The CB freeze all functions and enable the withdrawal functions for recovering any reward or dispute costs leftover (similar to AD)

* The function stopping the contract
```solidity
/** @dev Freeze the contract (e.g. after finding a bug)
  */
function StopContract()
  external
  onlyOwner() {
    stopped = true;
    emit contractStoppedByOwner();
}
```

### Pull over Push Payments
- Splitting the logic is useful and has been implemented. Doing so allows to greatly reduce a lot of attack vectors linked to reentrancy and DoS style attacks.
- Using this design pattern also would also have decreased the new issues that were about to come with Constantinople with the cheaper SSTORE opcode

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
  * @param _amount the amount to be withdrawn
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

## Non used patterns

### Different contract stages
- While indirectly used via the state of the bounty and the proposals. It is not directly a contract stages but more state Struct stages

* The enums
```solidity
enum DisputeStatus { None, Reviewable, Declined, Accepted, Withdrawn }
enum ProposalStatus { Reviewable, Declined, Accepted }
enum BountyStatus { Open, Cancelled, Completed, Withdrawn }
```

### Speed Bump
- Not implemented as the modifiers protects against unwanted actions and there is a circuit breaker in case of a bug detection
