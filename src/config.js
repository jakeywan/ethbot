import dotenv from 'dotenv'
dotenv.config()

export let nodeUrl
export let contractAddress

if (process.env.NODE_ENV === 'production') {
  nodeUrl = 'https://polygon-mainnet.infura.io/v3/c0c9dead82ea4b22a4da82089006c15d'
  contractAddress = '0x4f0522cD0cc91c3B4eF30962Ce62790633306d82'
} else if (process.env.NODE_ENV === 'development') {
  // local variables
  nodeUrl = 'http://127.0.0.1:8545/'
  contractAddress = '0xf5C3953Ae4639806fcbCC3196f71dd81B0da4348'
}

console.log('Node URL: ', nodeUrl)
console.log('Contract address: ', contractAddress)
