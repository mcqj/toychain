import pino from 'pino';
const logger = pino({
  prettyPrint: { colorize: true },
  level: 'debug',
});
import nacl from 'tweetnacl';
import nacl_util from 'tweetnacl-util';
import { TextEncoder, TextDecoder } from 'util';

function transaction({from, to, amount, publicKey, signature = '', salt = ''}) {

  const encoder = new TextEncoder();
  let api = {
    from: from,
    to: to,
    salt: salt,
    amount: amount,
    publicKey: publicKey,
    signature: signature,
    nodePorts:[],

    sign: function(secretKey) {
      this.salt = [].slice.call(nacl.randomBytes(10)).map(x => ('00' + x.toString(16)).slice(-2)).join('');
      let msgArray = encoder.encode('' + this.from + this.to + this.salt + this.amount + this.publicKey);
      this.signature = nacl.sign.detached(msgArray, secretKey);
    },

    validate: function() {
      const encoder = new TextEncoder();
      let vmsgArray = encoder.encode('' + this.from + this.to + this.salt + this.amount + this.publicKey);
      return  nacl.sign.detached.verify(vmsgArray, this.signature, this.publicKey);
    },

    serialize: function() {
      return {
        from: this.from,
        to: this.to,
        salt: this.salt,
        amount: this.amount,
        publicKey: nacl_util.encodeBase64(this.publicKey),
        signature: nacl_util.encodeBase64(this.signature),
      }
    },

    deserialize: function(tx) {
      this.from = tx.from;
      this.to = tx.to;
      this.salt = tx.salt;
      this.amount = tx.amount;
      this.publicKey = nacl_util.decodeBase64(tx.publicKey);
      this.signature = nacl_util.decodeBase64(tx.signature);
    },
        
  };

  return api;
}

export default transaction;
