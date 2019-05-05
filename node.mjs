import pino from 'pino';
const logger = pino({
  prettyPrint: { colorize: true }
});
logger.level = 'info';
import uuid from 'uuid';
import axios from 'axios';
import { transaction, block } from './bc';

const HEARTBEAT_PERIOD = 3 * 1000;
const NODE_TIMEOUT = 10 * 1000;

let id = uuid(),
  nodeListUpdated = false,
  nodeList = new Map(),
  seeds= [];

function updateNodeList(request) {
      logger.debug(request.body);
      let newNodeList = new Map(Object.entries(request.body));
      // Merge the two nodeLists to create the latest set of information
      for(let [key, newNode] of newNodeList) {
        let node = nodeList.get(key);
        if(node) {
          if(newNode.timestamp > node.timestamp) {
            node.timestamp = newNode.timestamp;
            nodeListUpdated = true;     // Mark as updated
          }
        } else if(newNode.timestamp + NODE_TIMEOUT > Date.now()) {
          nodeList.set(key, newNode);
          nodeListUpdated = true;       // Mark as updated
        }
      }
    }

// Send a message to all of the nodes in the network
//
async function send(msg) {
  for(let [key, node] of nodeList) {
    if(key !== id) {            // Don't send to ourself
      let url = `http://localhost:${node.port}/transaction`;
      try {
        let response = await axios.post(url, msg);
        let data = response.data;          // Might want to check for ACK?
        response = true;
      }
      catch(err) {
        logger.error(err);
      }
    }
  }
}

// Send the list of active nodes to all other nodes
//
async function sendNodeList() {
  let response = false;
  if(nodeListUpdated) {
    let nodeRemovalList = new Map();
    for(let [key, node] of nodeList) {
      if(key !== id) {
        let url = `http://localhost:${node.port}/nodelist`;
        try {
          let response = await axios.post(url, Object.assign({}, ...[...nodeList.entries()].map(([k, v]) => ({[k]: v}))));
          let data = response.data;          // Might want to check for ACK?
          response = true;
        }
        catch(err) {
          if(node.timestamp + NODE_TIMEOUT <= Date.now()) {
            logger.debug(`Remove node: ${key} - ${node}`);
            nodeRemovalList.set(key, node);
          } else {
            logger.error(err);
          }
        }
      }
    }
    for(let [key, node] of nodeRemovalList) {
      nodeList.delete(key);
    }
  }
  if(!response) {   // if none of the nodes in the list respond, try contacting seeds
    for(let i = 0, len = seeds.length; i < len; i++) {
      let url = `http://localhost:${seeds[i]}/nodelist`;
      try {
        let response = await axios.post(url, Object.assign({}, ...[...nodeList.entries()].map(([k, v]) => ({[k]: v}))));
      }
      catch(err) {
        logger.error(err);
      }
    }
  }
}

async function sendTransaction(tx) {
  for(let [key, node] of nodeList) {
    debugger;
    // Don't send to ourself or repeat
    if(key !== id && !tx.nodePorts.find((port) => port === node.port)) {
      let url = `http://localhost:${node.port}/transaction`;
      try {
        tx.nodePorts.push(node.port);
        logger.debug(`Send ${tx.signature} to ${node.port}`);
        let response = await axios.post(url, tx.serialize());
      }
      catch(err) {
        logger.error(err);
      }
    }
  }
}

function start(port) {
  nodeList.set(id, {
    timestamp: Date.now(),
    port: port,
  });
  setInterval(heartbeat, HEARTBEAT_PERIOD);
}

// Heartbeat function to contact other nodes
//
function heartbeat() {
  // Update the timestamp of this node
  let node = nodeList.get(id);
  node.timestamp = Date.now();
  nodeList.set(id, node);
  sendNodeList();
}


// Create the node
//
function node(initSeeds) {
  let api = {
    id: id,
    nodeList: nodeList,
    start: start,
    updateNodeList: updateNodeList,
    send: send,
    sendTransaction: sendTransaction,
  };

  seeds = initSeeds || [];

  if (!Array.isArray(seeds)) {
    throw new TypeError('Seeds must be an array')
  }

  return api;
}

export default node;
