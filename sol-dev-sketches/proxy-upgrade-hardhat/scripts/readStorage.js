// scripts/readStorage.js

const { ethers } = require("hardhat");

async function main() {
  const proxyAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // replace with your proxy address

  console.log("Reading raw storage slots from proxy...\n");

  for (let i = 0; i <= 4; i++) {
    const slot = ethers.toBeHex(i, 32); // pad to 32 bytes
    const value = await ethers.provider.getStorage(proxyAddr, slot);
    console.log(`Slot ${i} → ${value}`);
  }

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
