import { ethers } from 'ethers'
import dotenv from 'dotenv'
dotenv.config()
import {
  wethAddress,
  usdcAddress
} from './constants/tokenAddresses.js'
import {
  provider,
  wallet
} from './matic/matic.js'
import {
  sushiFactory,
  quickSwapFactory,
  polyzapFactory
} from './factories/factories.js'

// Our wallet address. Dev account right now.
const flashLoanerAddress = '0xc6ab04C59A14cD50c5d0BDA790dCeFD2484901cE'

// All of our contracts are likely clones of uniswap, so ABIs are the same
import UniswapV2Pair from './abis/IUniswapV2Pair.js'
import UniswapV2Factory from './abis/IUniswapV2Factory.js'

// Hardcode the number of each token we'd trade if we were to do so? I think?
const ETH_TRADE = 10
const USDC_TRADE = 3500

export const runBot = async () => {

  let sushiEthUSDC
  let quickSwapEthUSDC
  let polyzapEthUSDC

  const loadPairs = async () => {
    // This returns a method. Test it here: https://explorer-mainnet.maticvigil.com/address/0xc35DADB65012eC5796536bD9864eD8773aBc74C4/read-contract
    sushiEthUSDC = new ethers.Contract(
      await sushiFactory.getPair(wethAddress, usdcAddress),
      UniswapV2Pair.abi, wallet
    )
    quickSwapEthUSDC = new ethers.Contract(
      await quickSwapFactory.getPair(wethAddress, usdcAddress),
      UniswapV2Pair.abi, wallet
    )
    polyzapEthUSDC = new ethers.Contract(
      await polyzapFactory.getPair(wethAddress, usdcAddress),
      UniswapV2Pair.abi, wallet
    )
  }

  await loadPairs()

  provider.on('block', async (blockNumber) => {
    console.log('NEW BLOCK', blockNumber)
    
    /**
     * Sushi prices
     */
    // Execute the `getReserves` method on the method returned in `loadPairs` above.
    // Read about it here: https://uniswap.org/docs/v2/smart-contracts/pair/
    // function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    const sushiReserves = await sushiEthUSDC.getReserves()

    // NOTE: Make sure the "decimals" in `formatUnits` is correct (check the
    // token contract). For USDC it's fucking 6, so stupid.
    // Amount of USDC in the pool
    const reserve0Sushi = Number(ethers.utils.formatUnits(sushiReserves[0], 6))
    // Amount of WETH in the pool
    const reserve1Sushi = Number(ethers.utils.formatUnits(sushiReserves[1], 18))
    // Dividing them tells you how much of one you need to purchase 1 of the other,
    // in other words its relative price. This gives us the price of ETH, in USDC,
    // on SushiSwap.
    const priceSushiswap = reserve0Sushi / reserve1Sushi

    /**
     * Quickswap prices
     */
    const quickSwapReserves = await quickSwapEthUSDC.getReserves()
    const reserve0QuickSwap = Number(ethers.utils.formatUnits(quickSwapReserves[0], 6))
    const reserve1QuickSwap = Number(ethers.utils.formatUnits(quickSwapReserves[1], 18))
    const priceQuickSwap = reserve0QuickSwap / reserve1QuickSwap

    /**
     * Polyzap prices
     */
    const polyzapReserves = await polyzapEthUSDC.getReserves()
    const reserve0Polyzap = Number(ethers.utils.formatUnits(polyzapReserves[0], 6))
    const reserve1Polyzap = Number(ethers.utils.formatUnits(polyzapReserves[1], 18))
    const pricePolyzap = reserve0Polyzap / reserve1Polyzap
    
    /**
     * Determine if we should trade
     */
    // First, should we trade ETH from sushi to quickswap or vice versa?
    let whichDirection
    if (priceQuickSwap < priceSushiswap) {
      whichDirection = 'QUICKSWAP_TO_SUSHI'
    } else {
      whichDirection = 'SUSHI_TO_QUICKSWAP'
    }
    // Determine the basic spread (without fees yet)
    let percentageSpread
    if (whichDirection === 'QUICKSWAP_TO_SUSHI') {
      percentageSpread = ((priceSushiswap / priceQuickSwap - 1) * 100)
    } else {
      percentageSpread = ((priceQuickSwap / priceSushiswap - 1) * 100)
    }
    // .6% accounts for a .3% fee from Sushi and Quickswap.
    // Remember that Cometh is .5% on its own.
    const percentageSpreadAfterFees = percentageSpread - 0.6

    // Only attempt a trade if the % difference in prices EXCEEDS the % of fees
    // we'd be charged. In other words, this number must exceed 0.
    // We'll calc gas later.
    const shouldTrade = percentageSpreadAfterFees > 0

    console.log('--------------')
    console.log(`QUICKSWAP PRICE OF ETH (USDC) > ${priceQuickSwap}`)
    console.log(`SUSHISWAP PRICE OF ETH (USDC) > ${priceSushiswap}`)
    console.log(`POLYZAP PRICE OF ETH (USDC) > ${pricePolyzap}`)
    console.log(`PERCENTAGE SPREAD > ${percentageSpread}%`)
    console.log(`PERCENTAGE SPREAD AFTER FEES > ${percentageSpreadAfterFees}`)
    console.log(`PROFITABLE? > ${shouldTrade}`)
    console.log('--------------')

    if (!shouldTrade) return

    /**
     * Estimate gas
     */

    // const gasLimit = await sushiEthUSDC.estimateGas.swap(
    //   !shouldStartEth ? USDC_TRADE : 0, // usdc amount we're estimating trading
    //   shouldStartEth ? ETH_TRADE : 0, // or eth amount we're estimating trading
    //   flashLoanerAddress,
    //   ethers.utils.toUtf8Bytes('1')
    // )

    // const gasPrice = await wallet.getGasPrice()

    // const gasCost = Number(ethers.utils.formatEther(gasPrice.mul(gasLimit)))

    // const shouldSendTx = shouldStartEth
    //   ? (gasCost / ETH_TRADE) < spread
    //   : (gasCost / (USDC_TRADE / priceQuickSwap)) < spread

    // don't trade if gasCost is higher than the spread
    // if (!shouldSendTx) return
  })
}
