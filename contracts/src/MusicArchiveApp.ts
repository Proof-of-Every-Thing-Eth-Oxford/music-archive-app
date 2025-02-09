import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Poseidon,
} from 'o1js';

/**
 * This contract stores a single Field `storedHash`.
 * By calling `addLivenessHash(newHash)`, the user sets:
 * 
 *    storedHash = Poseidon.hash([ storedHash, newHash ])
 * 
 * This effectively "chains" new submissions onto an ongoing digest of
 * all liveness or echo recordings. Each transaction calling `addLivenessHash`
 * can also be used to timestamp the existence of that newHash at block-produce
 * time. The user can prove to others (off-chain) that they had the data matching
 * newHash at this block, bridging the story that a "model or system attested
 * that the image and its echo recording matched some condition."
 */
export class MusicArchiveApp extends SmartContract {
  // Store a single Field which is the "aggregated" hash of everything so far
  @state(Field) storedHash = State<Field>();

  // The init() method is called when the contract is first deployed.
  init() {
    super.init();
    // Set initial storedHash to Field(0) or any sentinel value
    this.storedHash.set(Field(0));
  }

  /**
   * Adds a new hash to the on-chain digest by combining (old storedHash) with (newHash)
   * using Poseidon hashing, which is typically the cheapest / fastest built-in hash in o1js.
   * 
   * This also timestamps the transaction at the block level, so that we know
   * that 'newHash' was posted at or before the final block that includes this transaction.
   */
  @method async addLivenessHash(newHash: Field) {
    // Get the current state from the blockchain
    const currentHash = this.storedHash.get();
    // Link circuit value to on-chain value
    this.storedHash.requireEquals(currentHash);

    // Combine them with Poseidon
    const nextHash = Poseidon.hash([currentHash, newHash]);

    // Update on-chain state
    this.storedHash.set(nextHash);
  }
}