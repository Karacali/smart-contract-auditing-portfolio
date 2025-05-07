const { ethers } = require("hardhat");

async function main() {
  const proxyAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // replace with your proxy address

  console.log("Deploying ImplementationV2_Corrected...");
  const ImplV2Corrected = await ethers.getContractFactory("ImplementationV2_Corrected");
  const implV2 = await ImplV2Corrected.deploy();
  await implV2.waitForDeployment();
  const implV2Address = await implV2.getAddress();
  console.log("ImplementationV2_Corrected deployed to:", implV2Address);

  console.log("\nUpgrading proxy to ImplementationV2_Corrected...");
  const Proxy = await ethers.getContractAt("Proxy", proxyAddress);
  const tx = await Proxy.setImplementation(implV2Address);
  await tx.wait();
  console.log("Proxy now points to ImplementationV2_Corrected.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
