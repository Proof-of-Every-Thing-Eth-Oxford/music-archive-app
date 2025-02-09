import fs from 'fs/promises';
import { Mina, NetworkId, PrivateKey, Field } from 'o1js';
import { MusicArchiveApp } from './MusicArchiveApp.js';

// check command line arg
const deployAlias = process.argv[2];
if (!deployAlias)
  throw Error(`Missing <deployAlias> argument.

Usage:
node build/src/interact.js <deployAlias>
`);
Error.stackTraceLimit = 1000;
const DEFAULT_NETWORK_ID = 'testnet';

// parse config and private key from file
const configJson = JSON.parse(await fs.readFile('config.json', 'utf8'));
const config = configJson.deployAliases[deployAlias];
const feepayerKeysBase58 = JSON.parse(
  await fs.readFile(config.feepayerKeyPath, 'utf8')
);
const zkAppKeysBase58 = JSON.parse(await fs.readFile(config.keyPath, 'utf8'));

const feepayerKey = PrivateKey.fromBase58(feepayerKeysBase58.privateKey);
const zkAppKey = PrivateKey.fromBase58(zkAppKeysBase58.privateKey);

// set up Mina instance
const Network = Mina.Network({
  networkId: (config.networkId ?? DEFAULT_NETWORK_ID) as NetworkId,
  mina: config.url,
});
const fee = Number(config.fee) * 1e9; // in nanomina
Mina.setActiveInstance(Network);

const feepayerAddress = feepayerKey.toPublicKey();
const zkAppAddress = zkAppKey.toPublicKey();
const zkApp = new MusicArchiveApp(zkAppAddress);

// compile the contract to create prover keys
console.log('compile the contract...');
await MusicArchiveApp.compile();

try {
  // example: call addLivenessHash() with some new hash (e.g. Field(98765))
  const newHash = Field(98765);

  console.log('build transaction and create proof...');
  const tx = await Mina.transaction({ sender: feepayerAddress, fee }, async () => {
    await zkApp.addLivenessHash(newHash);
  });
  await tx.prove();

  console.log('send transaction...');
  const sentTx = await tx.sign([feepayerKey]).send();
  if (sentTx.status === 'pending') {
    console.log(
      '\nSuccess! addLivenessHash transaction sent.\n' +
        '\nYour smart contract state will be updated' +
        '\nas soon as the transaction is included in a block:' +
        `\n${getTxnUrl(config.url, sentTx.hash)}`
    );
  }
} catch (err) {
  console.log('Error sending transaction:', err);
}

function getTxnUrl(graphQlUrl: string, txnHash?: string): string {
  if (!txnHash) return 'No transaction hash.';

  const hostName = new URL(graphQlUrl).hostname;
  const txnBroadcastServiceName = hostName
    .split('.')
    .filter((item: string) => item === 'minascan')?.[0];

  const networkName = graphQlUrl
    .split('/')
    .filter((item: string) => item === 'mainnet' || item === 'devnet')?.[0];

  if (txnBroadcastServiceName && networkName) {
    return `https://minascan.io/${networkName}/tx/${txnHash}?type=zk-tx`;
  }
  return `Transaction hash: ${txnHash}`;
}