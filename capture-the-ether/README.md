# Capture The Ether – Lotteries Challenge Solutions

This repository contains practical solutions to the **Lotteries** category of [CaptureTheEther](https://capturetheether.com/challenges/lotteries/), a CTF designed to teach smart contract security by example.

Each challenge is solved using a custom attacker contract (when necessary), with automated Hardhat tests simulating and verifying the exploits locally.

---

## 📁 Project Structure

```bash
contracts/
└── lotteries/
    ├── GuessTheNumber.sol
    ├── GuessTheNewNumber.sol
    ├── GuessTheNewNumberAttacker.sol
    ├── GuessTheRandomNumber.sol
    ├── GuessTheSecretNumber.sol
    ├── PredictTheBlockhash.sol
    ├── PredictTheFuture.sol
    └── PredictTheFutureAttacker.sol

test/
└── lotteries/
    ├── guess-the-number.test.ts
    ├── guess-the-new-number.test.ts
    ├── guess-the-random-number.test.ts
    ├── guess-the-secret-number.test.ts
    ├── predict-the-blockhash.ts
    └── predict-the-future.test.ts
````

---

## ✅ Solved Challenges & Files

| Challenge               | Challenge Contract         | Attacker Contract (if any)        | Test File                         |
| ----------------------- | -------------------------- | --------------------------------- | --------------------------------- |
| Guess the Number        | `GuessTheNumber.sol`       | –                                 | `guess-the-number.test.ts`        |
| Guess the New Number    | `GuessTheNewNumber.sol`    | `GuessTheNewNumberAttacker.sol`   | `guess-the-new-number.test.ts`    |
| Guess the Random Number | `GuessTheRandomNumber.sol` | *planned*                         | `guess-the-random-number.test.ts` |
| Guess the Secret Number | `GuessTheSecretNumber.sol` | inline brute-force in test        | `guess-the-secret-number.test.ts` |
| Predict the Future      | `PredictTheFuture.sol`     | `PredictTheFutureAttacker.sol`    | `predict-the-future.test.ts`      |
| Predict the Block Hash  | `PredictTheBlockhash.sol`  | – (no attacker contract required) | `predict-the-blockhash.ts`        |

---

## 🧪 How to Run

```bash
npm install          # install dependencies
npx hardhat test     # run all tests
npx hardhat test test/lotteries/predict-the-future.test.ts  # run a single test
```

You can customise `.env` if required for network configuration (e.g. `ARCHIVE_URL`, `MNEMONIC`).

---

## Focus Areas

* Weak randomness exploitation
* Predictable block state (blockhash, timestamp)
* Storage slot brute-forcing
* Block number timing strategies
* Solidity 0.4.x attack surface

---

## Disclaimer

This repository is for **educational purposes only**. All exploits are demonstrated in local test networks and not intended for malicious use.

