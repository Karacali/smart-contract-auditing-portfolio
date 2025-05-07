// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title ImplementationV2_Corrected
/// @notice Safe upgrade of ImplementationV1 that preserves storage layout and adds new variables after existing ones
/// @dev All variables must follow the same order and type as V1 to avoid storage collision
contract ImplementationV2_Corrected is Ownable, ReentrancyGuard {
    // === Existing storage layout (unchanged from V1) ===

    /// @dev Stored in slot 0
    uint256 public counter;

    /// @dev Stored in slot 1
    address public manager;

    /// @dev Stored in slot 2
    bool public paused;

    /// @dev Stored in slot 3
    uint256 public totalBalance;

    // === New variables added safely after slot 3 ===

    /// @dev Stored in slot 4
    bool public isLocked;

    /// @dev Stored in slot 5
    bool public overStrong;

    // === New functions ===

    /// @notice Toggle lock status
    function setLocked(bool _state) public onlyOwner {
        isLocked = _state;
    }

    /// @notice Toggle overStrong flag
    function toggleOverStrong() public {
        overStrong = !overStrong;
    }

    /// @notice Increment the counter
    function increment() public {
        require(!paused, "Contract is paused");
        counter += 1;
    }

    /// @notice Deposit ETH into the contract
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "No ETH sent");
        totalBalance += msg.value;
    }

    /// @notice Withdraw ETH (only owner)
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

    /// @notice Set the manager address
    function setManager(address _mgr) external onlyOwner {
        require(_mgr != address(0), "Zero address");
        manager = _mgr;
    }
}
