import { ethers } from 'ethers'
import dotenv from 'dotenv'
dotenv.config()

// My infura node to use in prod:
// https://polygon-mainnet.infura.io/v3/c0c9dead82ea4b22a4da82089006c15d
export const provider =
  new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545/')

// This key is for demo wallet address: 0xc6ab04C59A14cD50c5d0BDA790dCeFD2484901cE
export const wallet = new ethers.Wallet(process.env.WALLET_KEY, provider)