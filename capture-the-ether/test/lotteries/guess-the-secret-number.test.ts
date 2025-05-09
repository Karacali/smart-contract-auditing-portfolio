import { expect } from "chai";
import { ethers } from "hardhat";

describe("GuessTheSecretNumberChallenge", function () {


    // Generic brute-force based on hash value from storage
  async function bruteForceFromStorage(challengeAddress: string): Promise<number> {
    const hash = await ethers.provider.getStorageAt(challengeAddress, 0);
    
    for (let i = 0; i < 256; i++) {
      const encoded = ethers.utils.solidityPack(["uint8"], [i]); // mimics abi.encodePacked
      const computedHash = ethers.utils.keccak256(encoded);
      if (computedHash === hash) {
        return i;
      }
    }

    throw new Error("Secret number not found");
  }



  it("it should solve the challenge by guessing the correct secret number", async function () {
    // Retrieve attacker address from Hardhat test accounts
    const [attacker] = await ethers.getSigners();
    console.log("Attacker address:", attacker.address);

    // Load the contract factory for GuessTheNumberChallenge
    const Challenge = await ethers.getContractFactory("GuessTheSecretNumberChallenge");

    // Deploy the contract and send 1 ether during deployment
    const challenge = await Challenge.connect(attacker).deploy({
      value: ethers.utils.parseEther("1.0"),
    });
    await challenge.deployed();
    console.log("Contract deployed at address:", challenge.address);

    // Check contract balance before making the guess
    let contractBalance = await ethers.provider.getBalance(challenge.address);
    console.log("Contract balance before guess:", ethers.utils.formatEther(contractBalance), "ETH");
    expect(contractBalance).to.equal(ethers.utils.parseEther("1.0"));

    const secret = await bruteForceFromStorage(challenge.address);
    console.log("Secret number found:", secret);


    const tx = await challenge.connect(attacker).guess(secret, {
      value: ethers.utils.parseEther("1.0"),
    });
    await tx.wait();


    // Check contract balance after making the guess
    contractBalance = await ethers.provider.getBalance(challenge.address);
    console.log("Contract balance after guess:", ethers.utils.formatEther(contractBalance), "ETH");
    expect(contractBalance).to.equal(0);

    console.log("Challenge solved successfully");
  });

});
