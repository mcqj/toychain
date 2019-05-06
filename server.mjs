import pino from 'pino';
const logger = pino({
  prettyPrint: {
    colorize: true
  },
  level: 'debug',
});
import fastifyM from 'fastify';
import nodeM from './node';
import { transaction, block, blockchain } from './bc.mjs';

const fastify = fastifyM({
  logger: {
    level: 'warn'
  }
});

const DIFFICULTY = 3;
const MINING_REWARD = 10;

function updateTransactions(request) {
  logger.debug('Update transactions');
  let tx = transaction(request.body);
  tx.deserialize(tx);
  logger.debug(JSON.stringify(tx));
  // If we already have the transaction, we won't add it and therefore won't send it
  let height = toyChain.getLatestBlock().height;
  logger.debug(`Height ${height}`);
  if(toyChain.addTransaction(tx)) {
    node.sendTransaction(tx);
    logger.debug('Send transaction');
  }
  let latestBlock = toyChain.getLatestBlock();
  if(latestBlock.height > height) {
    node.sendBlock(latestBlock);
  }
}

// A new block is being proposed, update the chain if valid
function updateChain(request) {
  logger.debug('Update chain');
  let blk = block(request.body);
  blk.deserialize(blk);
  if(toyChain.addBlock(blk)) {
    node.sendBlock(blk);
  }
}

// Declare routes
fastify.get('/status', async(request, reply) => {
  return {
    height: toyChain.getLatestBlock().height,
    latestBlock: toyChain.getLatestBlock().hash,
  };
});

fastify.get('/block/:hash', async(request, reply) => {
  return toyChain.findBlock(request.params.hash);
});

fastify.post('/nodelist', async(request, reply) => {
  node.updateNodeList(request);
  return {};
});

fastify.post('/transaction', async(request, reply) => {
  updateTransactions(request);
  return {};
});

fastify.post('/block', async(request, reply) => {
  updateChain(request);
  return {};
});

// Run the server!
const start = async (node) => {
  try {
    await fastify.listen();
    let myPort = fastify.server.address().port;
    logger.info(`server listening on ${myPort}`);
    node.start(myPort);
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

let seeds = [];
if(process.argv.length > 2) {
  seeds = seeds.concat(process.argv.slice(2));
  logger.debug(`Seeds: ${seeds}`);
}

let toyChain = blockchain({difficulty: DIFFICULTY, reward: MINING_REWARD});

let node = nodeM(seeds);
start(node);

node.send("TEST");
