import UniswapV2Factory from '../abis/IUniswapV2Factory.js'
import { ethers } from 'ethers'
import { wallet } from '../matic/matic.js'
import dotenv from 'dotenv'
dotenv.config()


export const sushiFactory = new ethers.Contract(
  '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  UniswapV2Factory.abi, wallet
)

export const quickSwapFactory = new ethers.Contract(
  '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
  UniswapV2Factory.abi, wallet
)

export const polyzapFactory = new ethers.Contract(
  '0x34De5ce6c9a395dB5710119419A7a29baa435C88',
  UniswapV2Factory.abi, wallet
)