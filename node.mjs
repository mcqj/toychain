import pino from 'pino';
const logger = pino({
  prettyPrint: { colorize: true },
  level: 'info',
});
import uuid from 'uuid';
import axios from 'axios';
import crypto from 'crypto';
import QuickLRU from 'quick-lru';

import { transaction, block } from './bc';

const sentMsgCache = new QuickLRU({maxSize: 1000});

const HEARTBEAT_PERIOD = 3 * 1000;
const NODE_TIMEOUT = 10 * 1000;

let id = uuid(),
  nodeListUpdated = false,
  nodeList = new Map(),
  seeds= [];

function updateNodeList(request) {
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

// Send a message to all of the nodes in the network, except ourself and the origin
//
async function send(msg, endPoint, origin = 0) {
  // Create a hash of the message
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(msg));
  const digest = hash.digest('hex');
  let ports = [origin];
  if(sentMsgCache.has(digest)) {
    ports = sentMsgCache.get(digest);
  }
  // 
  for(let [key, node] of nodeList) {
    if((key !== id) || (ports.find(port => port === node.port))) {            // Don't send to ourself
      let url = `http://localhost:${node.port}/${endPoint}`;
      logger.debug(`Send to ${url}`);
      try {
        let response = await axios.post(url, msg);
        let data = response.data;          // Might want to check for ACK?
        ports.push(node.port);
      }
      catch(err) {
        logger.error(err);
      }
    }
  }
  sentMsgCache.set(digest, ports);
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
  send(tx.serialize(), 'transaction', 0);
}

async function sendBlock(block) {
  send(block.serialize(block), 'block', 0);
}

async function XsendTransaction(tx) {
  for(let [key, node] of nodeList) {
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
    sendBlock: sendBlock,
  };

  seeds = initSeeds || [];

  if (!Array.isArray(seeds)) {
    throw new TypeError('Seeds must be an array')
  }

  return api;
}

export default node;
