# **MusicArchiveApp: Verifiable Liveness Recording Authentication**

## **Overview**
MusicArchiveApp is a **Mina zkApp** smart contract that provides cryptographic **timestamping and verification** of liveness recordings. By leveraging **Zero-Knowledge Proofs (ZKPs)** and Mina's lightweight blockchain, this contract ensures that a recorded event is **authentic, tamper-proof, and provably linked** to a specific moment in time.

## **How It Works**
1. **Hash Storage & Timestamping**  
   - Users submit a **hash of their liveness recording**.
   - The smart contract **updates its stored state** by hashing the **new submission and the previous stored hash**, ensuring an immutable history of recordings.
   - This enables a **timestamped proof** that the submission occurred **at a specific time**.

2. **Zero-Knowledge Proof Verification**  
   - Users can later generate **ZK proofs** to verify:
     - The recording was **generated at the challenge moment**.
     - The liveness detection model confirmed the authenticity of the recording.
     - The recording corresponds to an **echo from an object** in an expected image (private input).
   - This ensures privacy while providing **cryptographic guarantees** about the event.

## **Smart Contract Details**
### **State Variables**
- **storedHash (Field)** – Stores the hash of the latest submission.

### **Methods**
- `submitRecording(recordingHash: Field)`
  - Updates `storedHash` to **H(recordingHash, previous storedHash)**.
  - Ensures an immutable chain of submissions.
  - Provides a verifiable timestamp for each submission.

## **Deployment & Testing**
### **Setup**
Ensure you have Mina zkApp dependencies installed:
```sh
npm install
```

### **Deploy the Contract**
```sh
npm run deploy
```

### **Run Tests**
```sh
npm run test
```

## **Use Cases**
- **Verifiable Liveness Authentication** – Ensuring a user’s **presence at a specific moment**.
- **Tamper-Proof Event Recording** – Timestamping **sound-based** authentication events.
- **Privacy-Preserving Verification** – Proving authenticity **without exposing raw data**.

## **Next Steps**
- Integrate **recursive ZKPs** for on-chain verification.
- Expand use cases to **object authentication & event proofs**.
- Enhance **UI & integration** with Web3 platforms.

