# Creating a Blockchain in Javascript
As a means to understanding the principles of how a Blockchain works, how
better to do it than implementing one. We've chosen to implement our simple
Blcokchain in Javascript.

## Overall Structure
The `Blockchain` is a linked list of Blocks where the linkage is
cryptographically hashed. A `Block` consists of a list of transactions.
A `Transaction` records the transfer of an asset (e.g. Coin) from one account
to another.

## Transaction
The transaction consists of the `to` and `from` addresses and the
`amount` transferred between them.

```javascript
{
  fromAddress: '',
  toAddress: '',
  amount: 0,
  publicKey: '',
  signature: ''
}
```

## Block
The Block contains a set of `transactions`. Furthermore, it contains a
timestamp. Finally, the Block contains a cryptographic hash of its contents,
which includes the hash of the previous block.

```javascript
{
  previousHash: ``,
  timestamp: '',
  transactions: [],
  hash: ''
  nonce: '',
}
```
It's this inclusion of the hash of the previous block that leads to the `chain`
characteristic of Blockchain.

## Gossiping

