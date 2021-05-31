import dotenv from 'dotenv'
dotenv.config()

export let nodeUrl
export let contractAddress

if (process.env.NODE_ENV === 'production') {
  nodeUrl = 'https://polygon-mainnet.infura.io/v3/c0c9dead82ea4b22a4da82089006c15d'
  // nodeUrl = ` https://practical-kilby:${process.env.CHAINSTACK_KEY}@nd-706-446-875.p2pify.com` // chainstack mainnet node
  contractAddress = '0x5Fd1615aC53051Fa3Db00a6472ed5e5fC84e4e8f'
} else if (process.env.NODE_ENV === 'development') {
  // local variables
  nodeUrl = 'http://127.0.0.1:8545/'
  contractAddress = '0xA3307BF348ACC4bEDdd67CCA2f7F0c4349d347Db'
}

console.log('Node URL: ', nodeUrl)
console.log('Contract address: ', contractAddress)
