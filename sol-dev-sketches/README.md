# Solidity Dev Sketches

This repo contains my Solidity learning sketches and experiments.

## Projects

### proxy-upgrade-hardhat

This project demonstrates how to build a simple upgradeable proxy pattern using manual `delegatecall` in Solidity, including how to properly manage storage layout during upgrades.

#### Purpose

- Understand how low-level proxy contracts work.
- Demonstrate storage layout risks (storage collision).
- Practice safe contract upgrades.
- Read and decode raw storage slots.


#### How to Use

##### 1. Start Local Node
```bash
npx hardhat node
````

### 2. Deploy Proxy and V1

```bash
npx hardhat run scripts/deploy.js --network localhost
```

##### 3. Upgrade to Broken Implementation

```bash
npx hardhat run scripts/upgrade.js --network localhost
```

##### 4. Upgrade to Corrected Implementation

```bash
npx hardhat run scripts/upgrade-corrected.js --network localhost
```

##### 5. Inspect Proxy Storage

```bash
npx hardhat run scripts/readStorageDecoded.js --network localhost
```

#### Key Concepts

* **delegatecall**: Forwards execution while using the proxy's storage.
* **Storage layout**: Must be preserved exactly across upgrades to avoid data corruption.
* **Storage collision**: Occurs when new variables overwrite existing storage slots.
* **Upgradeability**: Managed by `setImplementation()` in the proxy contract.

#### Notes

This project is for educational purposes only. For production systems, use audited patterns such as OpenZeppelin's Transparent or UUPS Proxy implementations.

