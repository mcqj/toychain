import nacl from 'tweetnacl';
import { TextEncoder, TextDecoder } from 'util';

function transaction({from, to, amount, publicKey, secretKey}) {
  const encoder = new TextEncoder();
  let salt = Array.prototype.map.call(new Uint8Array(nacl.randomBytes(10)), x => ('00' + x.toString(16)).slice(-2)).join('');

  let msgArray = encoder.encode('' + from + to + salt + amount + publicKey);
  let signature = nacl.sign.detached(msgArray, secretKey);

  let api = {
    from: from,
    to: to,
    salt: salt,
    amount: amount,
    publicKey: publicKey,
    secretKey: secretKey,
    msgArray: msgArray,
    signature: signature,

    validate: function() {
      const encoder = new TextEncoder();
      let vmsgArray = encoder.encode('' + from + to + salt + amount + publicKey);
      return  nacl.sign.detached.verify(vmsgArray, signature, publicKey);
    },
  };

  return api;
}

export default transaction;
