import { ethers } from 'ethers'
import dotenv from 'dotenv'
dotenv.config()

// Matic network urls:
// https://docs.matic.network/docs/develop/network-details/network/
export const provider =
  new ethers.providers.JsonRpcProvider('https://rpc-mainnet.maticvigil.com')

// This key is for demo wallet address: 0xc6ab04C59A14cD50c5d0BDA790dCeFD2484901cE
export const wallet = new ethers.Wallet(process.env.WALLET_KEY, provider)