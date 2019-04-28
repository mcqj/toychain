import Transaction from './transaction';
import Block from './block';

const DEFAULT_REWARD = 10;
const DEFAULT_DIFFICULTY = 4;
const BLOCK_SIZE = 10;

// Define the Blockchain
//
class Blockchain {
  /**
   * @param {*} genesisNode URL on which you start the blockchain. Is set to port 4000 with global var.
   */
  constructor({genesisNode, difficulty = DEFAULT_DIFFICULTY, reward = DEAFULT_REWARD}) {
    this.currentBlock = this.createGenesisBlock();
    this.chain = [];
    this.nodes = [+genesisNode]
    this.difficulty = difficulty;
    this.pendingTransactions = [];
    this.miningReward = reward;
  }

  createGenesisBlock() {
    return new Block( {
      blockSize: BLOCK_SIZE,
      timestamp: Date.parse("2019-01-01"),
      previousHash: "0"
    });
  }

  // Add a new node to the list of active nodes
  // Simulate the network by putting each node on a different port
  //
  addNode(port) {
    if (!this.nodes.includes(port)) {
      this.nodes.push(port);

      // Implement gossiping to share info on new nodes constantly
      // Too complex to implement here
      // Iterate over the nodes we know and send each a msg about new node
    }
  }

  removeNode(port) {
    nodes = nodes.filter(node => node !== port)
  }

  retrieveNodes() {
    return this.nodes;
  }

  updateBlockchain(newChain) {
    this.chain = newChain;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }
/*
  minePendingTransactions(miningRewardAddress) {
    // Create a block containing all pending transactions
    let block = new Block({
      timestamp: Date.now(),
      transactions: this.pendingTransactions,
      previousHash: this.getLatestBlock().hash
    });
    block.mineBlock(this.difficulty);

    console.log('Block successfully mined!');
    this.chain.push(block);

    this.pendingTransactions = [
      new Transaction({to: miningRewardAddress, amount: this.miningReward})
    ];
  } */

  addTransaction(transaction){
    if(this.currentBlock.addTransaction(this, transaction)) {
      this.currentBlock.mineBlock(this.difficulty);
      console.log('Block successfully mined!');
      this.chain.push(this.currentBlock);
      this.currentBlock = new Block({
        blockSize: BLOCK_SIZE,
        timestamp: Date.now(),
        previousHash: this.currentBlock.hash
      });
    }
  }

  // Getting the balance of tokens at an address involves iterating over the entire chain
  //
  getAccountBalance(account){
    let balance = 0;

    // Iterate over the blocks in the chain
    for(const block of this.chain) {
      // Iterate over the transactions in the block
      debugger;
      for(const trans of block.transactions) {
        if(trans.from === account) {
          balance -= trans.amount;
        }
        if(trans.to === account) {
          balance += trans.amount;
        }
      }
    }
    return balance;
  }

  // For validation purposes only - not needed operationally
  validateChain() {
    for (let i = 1; i < this.chain.length; i++){
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}

// Export the Interface 
//
export {
  Block, Transaction, Blockchain
}
