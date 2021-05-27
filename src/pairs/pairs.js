import {
  sushiFactory,
  quickSwapFactory,
  polyzapFactory,
  dfynFactory
} from '../factories/factories.js'
import UniswapV2Pair from '../abis/IUniswapV2Pair.js'
import { ethers } from 'ethers'
import { wallet } from '../matic/matic.js'

export const loadPair = async (token1, token2, platform) => {
  let executionFactory
  if (platform === 'SUSHI') executionFactory = sushiFactory
  if (platform === 'QUICKSWAP') executionFactory = quickSwapFactory
  if (platform === 'POLYZAP') executionFactory = polyzapFactory
  if (platform === 'DFYN') executionFactory = dfynFactory
  // This returns a method. Test it here: https://explorer-mainnet.maticvigil.com/address/0xc35DADB65012eC5796536bD9864eD8773aBc74C4/read-contract
  return new ethers.Contract(
    await executionFactory.getPair(token1, token2),
    UniswapV2Pair.abi, wallet
  )
}
