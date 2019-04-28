import nacl from 'tweetnacl';
import { TextEncoder, TextDecoder } from 'util';

// Define a Transaction
//
class Transaction {
  constructor({from, to, nonce, amount, publicKey, secretKey}) {
    const encoder = new TextEncoder();
    this.from = from;
    this.to = to;
    this.nonce = nonce;
    this.amount = amount;
    this.publicKey = publicKey;
    let msgArray = encoder.encode('' + this.from + this.to + this.nonce + this.amount + this.publicKey);
    this.signature = nacl.sign.detached(msgArray, secretKey);
    console.log(this);
  }

  validate() {
    const encoder = new TextEncoder();
    let msgArray = encoder.encode('' + this.from + this.to + this.nonce + this.amount + this.publicKey);
    return  nacl.sign.detached.verify(msgArray, this.signature, this.publicKey);
  }
}

export default Transaction;
