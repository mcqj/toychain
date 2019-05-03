import fastifyM from 'fastify';
import nodeM from './node';

const fastify = fastifyM({ logger: true })

function updateTransactions(request) {
  console.log('Update transactions');
}

function updateChain(request) {
  console.log('Update chain');
}

// Declare routes
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
});

// Run the server!
const start = async (node) => {
  try {
    await fastify.listen();
    let myPort = fastify.server.address().port;
    fastify.log.info(`server listening on ${myPort}`);
    node.start(myPort);
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

let seeds = [];
if(process.argv.length > 2) {
  seeds = seeds.concat(process.argv.slice(2));
  console.log(`Seeds: ${seeds}`);
}

let node = nodeM(seeds);
start(node);

node.send("TEST");
