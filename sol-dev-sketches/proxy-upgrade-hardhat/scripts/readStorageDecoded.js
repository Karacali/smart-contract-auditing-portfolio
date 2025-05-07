const { ethers } = require("hardhat");

function decodeStorageValue(slotIndex, rawValue) {
  const valueBN = BigInt(rawValue);
  switch (slotIndex) {
    case 0:
      return {
        name: "counter / isLocked",
        type: valueBN <= 1n ? "bool" : "uint256",
        value: valueBN <= 1n ? Boolean(valueBN) : valueBN.toString(),
      };
    case 1:
      return {
        name: "manager",
        type: "address",
        value: ethers.getAddress("0x" + rawValue.slice(-40)),
      };
    case 2:
      return {
        name: "paused (and possibly active)",
        type: "byte flags (bools)",
        value: `hex=${rawValue} | paused=${Boolean(Number(rawValue) & 1)}`,
      };
    case 3:
      return {
        name: "totalBalance",
        type: "uint256",
        value: valueBN.toString(),
      };
    case 4:
      return {
        name: "overStrong",
        type: "bool",
        value: Boolean(valueBN),
      };
    default:
      return {
        name: `slot ${slotIndex}`,
        type: "raw",
        value: rawValue,
      };
  }
}

async function main() {
  const proxyAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // replace with your proxy address

  console.log(`Reading storage from proxy at ${proxyAddr}...\n`);

  for (let i = 0; i <= 4; i++) {
    const slot = ethers.toBeHex(i, 32); // 32-byte padded slot index
    const rawValue = await ethers.provider.getStorage(proxyAddr, slot);
    const decoded = decodeStorageValue(i, rawValue);

    console.log(`Slot ${i} - ${decoded.name}`);
    console.log(`  Type:  ${decoded.type}`);
    console.log(`  Value: ${decoded.value}\n`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
