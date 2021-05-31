import dotenv from 'dotenv'
dotenv.config()

export let nodeUrl
export let contractAddress

if (process.env.NODE_ENV === 'production') {
  nodeUrl = 'https://polygon-mainnet.infura.io/v3/c0c9dead82ea4b22a4da82089006c15d'
  contractAddress = '0x5Fd1615aC53051Fa3Db00a6472ed5e5fC84e4e8f'
} else if (process.env.NODE_ENV === 'development') {
  // local variables
  nodeUrl = 'http://127.0.0.1:8545/'
  contractAddress = '0xf5C3953Ae4639806fcbCC3196f71dd81B0da4348'
}

console.log('Node URL: ', nodeUrl)
console.log('Contract address: ', contractAddress)
