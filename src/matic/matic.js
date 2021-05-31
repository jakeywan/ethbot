import { ethers } from 'ethers'
import { nodeUrl } from '../config.js'
import dotenv from 'dotenv'
dotenv.config()

export const provider =
  new ethers.providers.JsonRpcProvider(nodeUrl)

export const wallet = new ethers.Wallet(process.env.WALLET_KEY, provider)