import nacl from 'tweetnacl';
import nacl_util from 'tweetnacl-util';
import { transaction, block, blockchain } from './bc.mjs';

const NODE1 = 4000;
const NODE2 = 4002;

const DIFFICULTY = 3;
const MINING_REWARD = 10;

const PRIME_LENGTH = 60;

const USER1 = "James";
const USER2 = "Emily";
const MINER = "Jake";

function createKey() {
  let key = nacl.sign.keyPair();
//  console.log(`Generated Key : ${JSON.stringify(key)}`);
  return key;
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

class User {
  constructor( name ) {
    this.name = name;
    this.nonce = 0;
    let key = createKey();
    this.publicKey = key.publicKey;
    this.secretKey = key.secretKey;
    this.address = buf2hex(nacl.hash(key.publicKey).slice(-20));
  }
}

function addTransactions(numTxs, from, to, amount, miner) {
  // Let's do some transactions
  for(let i = 0; i < numTxs; i++) {
    // Add a transaction to the chain, transferring coins from one user to another
    toyChain.addTransaction(
      transaction({
        from: from.address,
        to: to.address,
        nonce: from.nonce,
        amount: amount,
        publicKey: from.publicKey,
        secretKey: from.secretKey
      })
    );
  }
}

function logChain() {
  console.log(JSON.stringify(toyChain.chain, null, 2));
};

let toyChain = blockchain({difficulty: DIFFICULTY, reward: MINING_REWARD});

logChain();

let user1 = new User(USER1);
let user2 = new User(USER2);
let miner = new User(MINER);

addTransactions(15, user1, user2, 100, user1);
addTransactions(15, user2, user1, 25, miner);

console.log(`${user1.name}'s (0x${user1.address}) balance is ${toyChain.getAccountBalance(user1.address)}`);
console.log(`${user2.name}'s (0x${user2.address}) balance is ${toyChain.getAccountBalance(user2.address)}`);
console.log(`${miner.name}'s (0x${miner.address}) balance is ${toyChain.getAccountBalance(miner.address)}`);

console.log(`Validate Chain returns ${toyChain.validateChain()}`);
