import pino from 'pino';
const logger = pino({
  prettyPrint: { colorize: true }
});
logger.level = 'debug';
import transaction from './transaction';
import block from './block';

const DEFAULT_REWARD = 10;
const DEFAULT_DIFFICULTY = 3;
const BLOCK_SIZE = 10;

let chain,
  currentBlock,
  initialDifficulty;

let pendingTransactions = [];

function createGenesisBlock() {
  return block( {
    difficulty: initialDifficulty,
    blockSize: BLOCK_SIZE,
    timestamp: Date.parse("2019-01-01"),
    previousHash: "0"
  });
}

function updateBlockchain(newChain) {
  chain = newChain;
}

function getLatestBlock() {
  return chain[this.chain.length - 1];
}

function addBlock(block) {
  for(let tx of block.transactions) {
    for(let i = pendingTransactions.length - 1; i >= 0; i--) {
      if(tx.signature === pendingTransactions[i].signature) {
        pendingTransactions.splice(i, 1);
        break;
      }
    }
  }
  chain.set(currentBlock.hash, currentBlock);
}

function addTransaction(transaction){
  logger.debug('Function: addTransaction');
  if(!transaction.validate()) {
    return false;
  }
  logger.debug(`pendingTransactions.length = ${pendingTransactions.length}`);
  // Don't add to pending transaction queue if its already there
  if(pendingTransactions.find(tx => Buffer.from(tx.signature).compare(Buffer.from(transaction.signature)) ===0)) {
    return false;
  }
  pendingTransactions.push(transaction);
  if(pendingTransactions.length >= BLOCK_SIZE) { 
    currentBlock = block({
      difficulty: initialDifficulty,
      blockSize: pendingTransactions.length,
      timestamp: Date.now(),
      previousHash: currentBlock.hash,
      transactions: [...pendingTransactions],
    });
    // Add the block to the chain
    addBlock(currentBlock);
  }
  return true;
}

// Getting the balance of tokens at an address involves iterating over the entire chain
//
function getAccountBalance(account){
  let balance = 0;

  // Iterate over the blocks in the chain
  for(const block of this.chain.values()) {
    // Iterate over the transactions in the block
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

// Returns true if the header is valid
//
function validateBlockHdr(block) {
  if(block.calculateHash(block) != block.hash) {
    return false;
  }
  if(!chain.get(block.previousHash)) {
    return false;
  }
  return true;
}

// Validate this block
function validateBlock(block) {
  if(!validateBlockHdr(block)) {
    return false;
  }
  return true;
}


// For validation purposes only - not needed operationally
function validateChain() {
  let skipGenesis = true;
  for(const block of chain.values()) {
    if(skipGenesis) {
      skipGenesis = false;
      continue;
    }
    if(!validateBlock(block)) {
      return false;
    }
  }
  return true;
}

function blockchain({genesisNode, difficulty = DEFAULT_DIFFICULTY, reward = DEAFULT_REWARD}) {
  initialDifficulty = difficulty;
  currentBlock = createGenesisBlock();
  chain = new Map();
  let api = {
    difficulty: initialDifficulty,
    miningReward: reward,
    chain: chain,
    currentBlock: currentBlock,
    addTransaction: addTransaction,
    getAccountBalance: getAccountBalance,
    validateBlock: validateBlock,
    validateChain: validateChain,
  }
  return api;
}

// Export the Interface 
//
export {
  block, transaction, blockchain
}
