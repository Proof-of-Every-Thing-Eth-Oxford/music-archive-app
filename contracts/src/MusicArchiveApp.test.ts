import { AccountUpdate, Field, Mina, PrivateKey, PublicKey } from 'o1js';
import { MusicArchiveApp } from './MusicArchiveApp';

const proofsEnabled = false;

describe('MusicArchiveApp', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: MusicArchiveApp;

  beforeAll(async () => {
    if (proofsEnabled) {
      await MusicArchiveApp.compile();
    }
  });

  beforeEach(async () => {
    // NOTE the `await` here
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);

    [deployerAccount, senderAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new MusicArchiveApp(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('deploys the MusicArchiveApp contract', async () => {
    await localDeploy();
    const storedHash = zkApp.storedHash.get();
    expect(storedHash).toEqual(Field(0));
  });

  it('updates storedHash after calling addLivenessHash', async () => {
    await localDeploy();

    // your test logic here...
  });
});