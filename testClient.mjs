import axios from 'axios';
import nacl from 'tweetnacl';
import nacl_util from 'tweetnacl-util';
import { transaction, block, blockchain } from './bc.mjs';

const USER1 = "James";
const USER2 = "Emily";

function createKey() {
  let key = nacl.sign.keyPair();
//  console.log(`Generated Key : ${JSON.stringify(key)}`);
  return key;
}

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

class User {
  constructor( name ) {
    this.name = name;
    let key = createKey();
    this.publicKey = key.publicKey;
    this.secretKey = key.secretKey;
    this.address = buf2hex(nacl.hash(key.publicKey).slice(-20));
  }
}

async function postTransactions(numTxs, from, to, amount, url) {  // Let's do some transactions
  for(let i = 0; i < numTxs; i++) {
    // Send a transaction to the server, transferring coins from one user to another
    let tx = transaction({
      from: from.address,
      to: to.address,
      amount: amount,
      publicKey: from.publicKey,
    });
    tx.sign(from.secretKey);
    console.log(JSON.stringify(tx));
    try {
      let response = await axios.post(url, tx.serialize());
    }
    catch(err) {
      console.log(err);
    }
  }
}


let user1 = new User(USER1);
let user2 = new User(USER2);

if(process.argv.length < 3) {
  console.log('Usage: "node testClient <server port>"');
  process.exit(1);
}

let url = `http://localhost:${process.argv[2]}/transaction`;

postTransactions(1, user1, user2, 100, url);
//postTransactions(15, user2, user1, 25, url);



