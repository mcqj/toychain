import pino from 'pino';
const logger = pino({
  prettyPrint: { colorize: true },
  level: 'debug',
});
import transaction from './transaction';
import crypto from 'crypto';

/*
function calculateHash(block) {
  return SHA256(block.previousHash + block.timestamp + JSON.stringify(block.transactions) + block.nonce).toString();
} */

function calculateHash(block) {
  const hash = crypto.createHash('sha256');
  hash.update(block.previousHash + block.timestamp + JSON.stringify(block.transactions) + block.nonce + block.height);
  return hash.digest('hex');
}

function mineBlock(block) {
  // Make sure hash has "difficulty" leading zeroes
  block.hash = '';
  block.nonce = Math.floor(Math.random() * 20000);
  while (block.hash.substring(0, block.difficulty) !== Array(block.difficulty + 1).join("0")) {
    //    while(BigInt('0x' + this.hash) >= 0x0000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn) {
    block.nonce++;
    block.hash = calculateHash(block);
  }
  logger.debug(`BLOCK MINED hash: ${block.hash} nonce: ${block.nonce}`);
}

// return true if the block should be closed and mined - right now that's a size measure
function addTransaction(bc, transaction) {
  if(!transaction.validate()) {
    logger.debug(`Invalid Transaction - Signature invalid ${JSON.stringify(transaction)}`);
    return false;
  } else if(bc.getAccountBalance(transaction.from) < transaction.amount) {
    logger.debug(`Invalid Transaction - From account has insufficient funds ${JSON.stringify(transaction)}`);
    // return false;
  }
  this.transactions.push(transaction);
  return this.transactions.length == this.blockSize;
}

function mintCoin(bc, transaction) {
}

function serialize(blk) {
  let transactions = [];
  for(let tx of blk.transactions) {
    transactions.push(tx.serialize());
  }
  return {
    difficulty: blk.difficulty,
    blockSize: blk.blockSize,
    timestamp: blk.timestamp,
    previousHash: blk.previousHash,
    height: blk.height,
    transactions: transactions,
    nonce: blk.nonce,
    hash: blk.hash,
  }
}

function block({difficulty = 1, blockSize = 0, timestamp, hash = '', previousHash = '', height, transactions}) {
  logger.debug(`Block height: ${height}`);
  let api = {
    difficulty: difficulty,
    blockSize: blockSize,
    timestamp: timestamp,
    previousHash: previousHash,
    height: height,
    transactions: transactions,
    nonce: 0,
    hash: hash,
    mineBlock: mineBlock,
    calculateHash: calculateHash,
    serialize: serialize,

    deserialize: function(blk) {
      this.transactions = blk.transactions;   // Q: This is a reference - should it be copied?
      for(let tx of this.transactions) {
        tx = transaction(tx);
        tx.deserialize(tx);
      }
      this.difficulty = blk.difficulty;
      this.blockSize = blk.blockSize;
      this.timestamp = blk.timestamp;
      this.previousHash = blk.previousHash;
      this.height = blk.height;
      this.nonce = blk.nonce;
      this.hash = blk.hash;
    },
  };
  if(hash === '') {
    mineBlock(api);
  }

  return api;
}

export default block;
