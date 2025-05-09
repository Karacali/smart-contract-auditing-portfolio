import { ethers } from "hardhat";
import { expect } from "chai";

describe("GuessTheNewNumberChallenge", function () {
  it("should solve the challenge using attacker contract", async () => {
    // Get the default test signer (our attacker EOA)
    const [attacker] = await ethers.getSigners();
    console.log("Attacker address:", attacker.address);

    // 1. Deploy the vulnerable challenge contract with exactly 1 ether
    const ChallengeFactory = await ethers.getContractFactory("GuessTheNewNumberChallenge");
    const challenge = await ChallengeFactory.connect(attacker).deploy({
      value: ethers.utils.parseEther("1.0"),
    });
    await challenge.deployed();
    console.log("Challenge contract deployed at:", challenge.address);

    // 2. Deploy the attacker contract and fund it with 1 ether
    const AttackerFactory = await ethers.getContractFactory("GuessTheNewNumberAttacker");
    const attackerContract = await AttackerFactory.connect(attacker).deploy(challenge.address, {
      value: ethers.utils.parseEther("1.0"),
    });
    await attackerContract.deployed();
    console.log("Attacker contract deployed at:", attackerContract.address);

    // 3. Perform the attack from the attacker contract
    const tx = await attackerContract.attack();
    const receipt = await tx.wait();
    console.log("Attack transaction completed in block:", receipt.blockNumber);

    // 4. Confirm the challenge is solved by checking isComplete()
    const isComplete = await challenge.isComplete();
    console.log("Challenge isComplete() result:", isComplete);
    expect(isComplete).to.equal(true);

    // 5. Check attacker's contract final balance (should be 0 after tx.origin.transfer)
    const finalBalance = await ethers.provider.getBalance(attackerContract.address);
    console.log("Attacker contract final balance:", ethers.utils.formatEther(finalBalance), "ETH");
    expect(finalBalance).to.equal(0);

    console.log("Challenge successfully solved!");
  });
});
