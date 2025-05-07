// scripts/deploy.js

const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ImplementationV1...");
  const ImplV1 = await ethers.getContractFactory("ImplementationV1");
  const implV1 = await ImplV1.deploy();
  await implV1.waitForDeployment();
  const implV1Address = await implV1.getAddress();
  console.log("✅ ImplementationV1 deployed to:", implV1Address);

  console.log("\nDeploying Proxy...");
  const Proxy = await ethers.getContractFactory("Proxy");
  const proxy = await Proxy.deploy(implV1Address);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log("✅ Proxy deployed to:", proxyAddress);

  console.log(`\nTo interact with proxy, use ABI of ImplementationV1 and address: ${proxyAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
