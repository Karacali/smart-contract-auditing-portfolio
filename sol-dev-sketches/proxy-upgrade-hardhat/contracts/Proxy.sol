// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Basic Transparent Upgradeable Proxy Contract
/// @notice This proxy delegates all calls to an implementation contract using delegatecall.
/// @dev The proxy stores the implementation address and forwards calls to it. Only the owner can change the implementation.
contract Proxy {
    /// @notice Address of the current implementation contract
    address public implementation;

    /// @notice Address of the proxy owner (has permission to upgrade implementation)
    address public owner;

    /// @notice Ensures that only the owner can execute certain functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    /// @param _impl Address of the initial implementation contract
    constructor(address _impl) {
        implementation = _impl;
        owner = msg.sender;
    }

    /// @notice Updates the address of the implementation contract
    /// @dev Can only be called by the owner. Does not perform any safety checks.
    /// @param _newImpl Address of the new implementation
    function setImplementation(address _newImpl) external onlyOwner {
        implementation = _newImpl;
    }

    /// @notice Called when no other function matches
    /// @dev Forwards the call to the current implementation using delegatecall
    fallback() external payable {
        _delegate(implementation);
    }

    /// @notice Called on receiving plain ether without data
    /// @dev Forwards the call to the implementation using delegatecall
    receive() external payable {
        _delegate(implementation);
    }

    /// @dev Internal function that delegates the call to the implementation
    /// @param _impl The address to which the call should be delegated
    function _delegate(address _impl) internal {
        assembly {
            // Copy incoming call data to memory starting at 0
            calldatacopy(0, 0, calldatasize())

            // Delegate the call to the implementation contract
            let result := delegatecall(gas(), _impl, 0, calldatasize(), 0, 0)

            // Copy the returned data to memory starting at 0
            returndatacopy(0, 0, returndatasize())

            // Forward the returned data to the original caller
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
}
