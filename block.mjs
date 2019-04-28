import SHA256 from 'crypto-js/sha256';

// Define a block
//
class Block {
  constructor({blockSize = 0, timestamp, previousHash = ''}) {
    this.blockSize = blockSize;
    this.previousHash = previousHash;
    this.timestamp = timestamp;
    this.transactions = [];
    this.hash = this.calculateHash();
    this.nonce = 0;
  }

  calculateHash() {
    return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
  }

  mineBlock(difficulty) {
    // Make sure hash has "difficulty" leading zeroes
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`BLOCK MINED hash: ${this.hash} nonce: ${this.nonce}`);
  }

  // return true if the block should be closed and mined - right now that's a size measure
  addTransaction(bc, transaction) {
    if(!transaction.validate()) {
      console.log(`Invalid Transaction - Signature invalid ${JSON.stringify(transaction)}`);
      return false;
    } else if(bc.getAccountBalance(transaction.from) < transaction.amount) {
      console.log(`Invalid Transaction - From account has insufficient funds ${JSON.stringify(transaction)}`);
      return false;
    }
    this.transactions.push(transaction);
    return this.transactions.length == this.blockSize;
  }
}

export default Block;
