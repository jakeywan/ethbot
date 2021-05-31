import UniswapV2Factory from '../abis/IUniswapV2Factory.js'
import EthBot from '../abis/EthBot.js'
import { ethers } from 'ethers'
import { wallet } from '../matic/matic.js'
import dotenv from 'dotenv'
import IUniswapV2ERC20 from '../abis/IUniswapV2ERC20.js';
import { contractAddress } from '../config.js'
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

export const dfynFactory = new ethers.Contract(
  '0xE7Fb3e833eFE5F9c441105EB65Ef8b261266423B',
  UniswapV2Factory.abi, wallet
)

// this is our contract address
export const tradeFactory = new ethers.Contract(contractAddress, EthBot, wallet)

export const tokenFactory = (tokenAddress) => {
  return new ethers.Contract(tokenAddress, IUniswapV2ERC20.abi, wallet)
}
