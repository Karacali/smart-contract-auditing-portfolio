const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Storage Collision Demo", function () {
  let proxy, implV1, implV2, owner, user;

  before(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy ImplementationV1
    const ImplV1 = await ethers.getContractFactory("ImplementationV1");
    implV1 = await ImplV1.deploy();
    await implV1.waitForDeployment();

    // Deploy Proxy pointing to ImplV1
    const Proxy = await ethers.getContractFactory("Proxy");
    proxy = await Proxy.deploy(await implV1.getAddress());
    await proxy.waitForDeployment();

    // Use ImplementationV1 ABI to interact through proxy
    this.proxyAsV1 = await ImplV1.attach(await proxy.getAddress());

    // Call increment()
    await this.proxyAsV1.increment();
  });

  it("should corrupt counter when upgrading to ImplementationV2_Broken", async function () {
    const rawBefore = await ethers.provider.getStorage(proxy.getAddress(), 0);
    console.log("🔍 Slot 0 before upgrade (counter):", rawBefore);

    // Deploy Broken ImplementationV2
    const ImplV2 = await ethers.getContractFactory("ImplementationV2_Broken");
    implV2 = await ImplV2.deploy();
    await implV2.waitForDeployment();

    // Upgrade
    await proxy.setImplementation(await implV2.getAddress());

    const proxyAsV2 = await ImplV2.attach(await proxy.getAddress());

    const rawAfter = await ethers.provider.getStorage(proxy.getAddress(), 0);
    console.log("⚠️ Slot 0 after upgrade (isLocked):", rawAfter);

    const isLocked = await proxyAsV2.isLocked();
    console.log("🔒 isLocked() read from proxy:", isLocked);

    expect(isLocked).to.equal(true); // because counter was 1, now interpreted as true
  });
});
