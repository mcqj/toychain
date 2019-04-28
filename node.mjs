import uuid from 'uuid';
import axios from 'axios';

const HEARTBEAT_PERIOD = 3 * 1000;
const NODE_TIMEOUT = 10 * 1000;

let id = uuid(),
  nodeListUpdated = false,
  nodeList = new Map(),
  seeds= [];

function updateNodeList(request) {
      console.log(request.body);
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
            console.log(`Remove node: ${key} - ${node}`);
            nodeRemovalList.set(key, node);
          } else {
            console.log(err);
          }
        }
      }
    }
    for(let [key, node] of nodeRemovalList) {
      let xx = nodeList.delete(key);
      console.log(`XX ${key} - ${xx}`);
    }
  }
  if(!response) {   // if none of the nodes in the list respond, try contacting seeds
    for(let i = 0, len = seeds.length; i < len; i++) {
      let url = `http://localhost:${seeds[i]}/nodelist`;
      try {
        let response = await axios.post(url, Object.assign({}, ...[...nodeList.entries()].map(([k, v]) => ({[k]: v}))));
      }
      catch(err) {
        console.log(err);
      }
    }
  }
}

function start(port) {
  nodeList.set(id, {
    timestamp: Date.now(),
    port: port,
  });
}

// Heartbeat function to contact other nodes
//
function heartbeat() {
  console.log('Send Updates');
  console.log(nodeList);
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
  };

  seeds = initSeeds || [];

  if (!Array.isArray(seeds)) {
    throw new TypeError('Seeds must be an array')
  }

  setInterval(heartbeat, HEARTBEAT_PERIOD);
  return api;
}

export default node;
