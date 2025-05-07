// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title ImplementationV2_Broken
/// @notice This is an intentionally incorrect upgrade of the logic contract to demonstrate a storage collision.
/// @dev This contract will overwrite slot 0 (previously used by `counter`) with a `bool` variable, causing data corruption.
contract ImplementationV2_Broken is Ownable, ReentrancyGuard {
    /// @dev This variable occupies slot 0, overwriting the `counter` value from V1
    bool public isLocked;              // ❌ STORAGE COLLISION

    /// @dev Remains in slot 1, same as in V1
    address public manager;

    /// @dev Occupies slot 2, same as in V1
    bool public paused;

    /// @dev Occupies slot 3, same as in V1
    uint256 public totalBalance;

    /// @dev New variable added in slot 4 (safe)
    bool public overStrong;

    /// @notice Sets the isLocked flag
    function setLocked(bool _state) public onlyOwner {
        isLocked = _state;
    }

    /// @notice Toggles the overStrong flag
    function toggleOverStrong() public {
        overStrong = !overStrong;
    }

    /// @notice Accepts ETH deposits
    function deposit() external payable nonReentrant {
        require(!paused, "Contract is paused");
        totalBalance += msg.value;
    }

    /// @notice Withdraws ETH, only allowed for the contract owner
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "Insufficient balance");
        totalBalance -= amount;
        payable(owner()).transfer(amount);
    }
}


/**

Variable	Storage Slot	V1	        V2_Broken	        Status
slot 0	    uint256	counter	            bool isLocked	    ❌ Collision
slot 1	    address	manager	            manager	            ✅ Safe
slot 2	    bool,bool	paused+active	paused	            ✅ Safe
slot 3	    uint256	totalBalance	    totalBalance	    ✅ Safe
slot 4	    –	–	                    overStrong	        ✅ New addition



 */