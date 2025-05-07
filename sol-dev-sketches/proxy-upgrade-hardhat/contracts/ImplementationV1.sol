// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title ImplementationV1
/// @notice This is the first version of the logic contract used behind the Proxy.
/// @dev Designed to be used via delegatecall from Proxy, so storage layout is critical.
contract ImplementationV1 is Ownable, ReentrancyGuard {
    /// @notice A sample counter
    uint256 public counter;            // slot 0

    /// @notice An account related to logic (can be admin, treasury etc.)
    address public manager;            // slot 1

    /// @notice Status flags
    bool public paused;                // slot 2 (byte 0)
    bool public active;                // slot 2 (byte 1) - packed with paused

    /// @notice Stores how much value has been deposited
    uint256 public totalBalance;       // slot 3

    /// @notice Increment the counter
    function increment() public {
        require(!paused, "Contract is paused");
        counter += 1;
    }

    /// @notice Deposit ETH into the contract
    /// @dev Protects against reentrancy
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "No ETH sent");
        totalBalance += msg.value;
    }

    /// @notice Withdraw ETH (owner only)
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        totalBalance -= amount;
        payable(owner()).transfer(amount);
    }

    /// @notice Pause contract functionality
    function pause() external onlyOwner {
        paused = true;
    }

    /// @notice Resume contract functionality
    function unpause() external onlyOwner {
        paused = false;
    }

    /// @notice Set a manager address
    function setManager(address _mgr) external onlyOwner {
        require(_mgr != address(0), "Zero address");
        manager = _mgr;
    }
}
