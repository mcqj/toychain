import SHA256 from 'crypto-js/sha256';

function calculateHash(block) {
  return SHA256(block.previousHash + block.timestamp + JSON.stringify(block.transactions) + block.nonce).toString();
}

function mineBlock(block) {
  // Make sure hash has "difficulty" leading zeroes
  block.hash = '';
  block.nonce = 0;
  while (block.hash.substring(0, block.difficulty) !== Array(block.difficulty + 1).join("0")) {
    //    while(BigInt('0x' + this.hash) >= 0x0000fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn) {
    block.nonce++;
    block.hash = calculateHash(block);
  }
  console.log(`BLOCK MINED hash: ${block.hash} nonce: ${block.nonce}`);
}

// return true if the block should be closed and mined - right now that's a size measure
function addTransaction(bc, transaction) {
  if(!transaction.validate()) {
    console.log(`Invalid Transaction - Signature invalid ${JSON.stringify(transaction)}`);
    return false;
  } else if(bc.getAccountBalance(transaction.from) < transaction.amount) {
    console.log(`Invalid Transaction - From account has insufficient funds ${JSON.stringify(transaction)}`);
    // return false;
  }
  this.transactions.push(transaction);
  return this.transactions.length == this.blockSize;
}

function mintCoin(bc, transaction) {
}


function block({difficulty = 1, blockSize = 0, timestamp, previousHash = '', transactions}) {
  let api = {
    difficulty: difficulty,
    blockSize: blockSize,
    timestamp: timestamp,
    previousHash: previousHash,
    transactions: transactions,
    nonce: 0,
    hash: '',
    mineBlock: mineBlock,
    calculateHash: calculateHash,
  };
  mineBlock(api);

  return api;
}

export default block;
