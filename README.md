# Toychain
This is a simple implementation of a Blockchain in Javascript to explore the technologies involved.
It requires nodejs version 10 or later.

A simple gossip protocol operates over http connections. Currently, it is set up to run in
multiple windows on the same machine, using different port numbers. This could easily be changed
to use full URLs operating over a network.

## Getting Started
Install the dependencies:-

```bash
npm install
```

To start the first server:-

```bash
npm run server
```

The server will display the port number on which it is running, which will be needed
when starting other servers that are to join the cluster.

To start subsequent servers:-

```bash
npm run server -- <port1> .. <portn>
```

<port1> .. <portn> is a space separated list of one or more (seed) servers that are already
members of the gossip cluster. As long as the new server can successfully contact at
least one member, it will discover all members of the cluster.

To send some transactions, you can try:-

```bash
npm run testClient -- <port>
```

where port is the port number of a running server in the cluster.

