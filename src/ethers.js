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
  polyzapFactory,
  dfynFactory
} from './factories/factories.js'
import { ETH_TRADE } from './constants/tradeAmountDefaults.js'
import { loadPair } from './pairs/pairs.js'

export const runBot = async (tokenA, tokenADecimals, tokenB, tokenBDecimals) => {

  let sushiEthUSDC
  let quickSwapEthUSDC
  let polyzapEthUSDC
  let dfynEthUSDC

  const loadPairs = async () => {
    sushiEthUSDC = await loadPair(tokenA, tokenB, 'SUSHI')
    quickSwapEthUSDC = await loadPair(tokenA, tokenB, 'QUICKSWAP')
    polyzapEthUSDC = await loadPair(tokenA, tokenB, 'POLYZAP')
    dfynEthUSDC = await loadPair(tokenA, tokenB, 'DFYN')
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
    const reserve0Sushi = Number(ethers.utils.formatUnits(sushiReserves[0], tokenBDecimals))
    // Amount of WETH in the pool
    const reserve1Sushi = Number(ethers.utils.formatUnits(sushiReserves[1], tokenADecimals))
    // Dividing them tells you how much of one you need to purchase 1 of the other,
    // in other words its relative price. This gives us the price of ETH, in USDC,
    // on SushiSwap.
    const priceSushiswap = reserve0Sushi / reserve1Sushi

    /**
     * Quickswap prices
     */
    const quickSwapReserves = await quickSwapEthUSDC.getReserves()
    const reserve0QuickSwap = Number(ethers.utils.formatUnits(quickSwapReserves[0], tokenBDecimals))
    const reserve1QuickSwap = Number(ethers.utils.formatUnits(quickSwapReserves[1], tokenADecimals))
    const priceQuickSwap = reserve0QuickSwap / reserve1QuickSwap

    /**
     * Polyzap prices
     */
    const polyzapReserves = await polyzapEthUSDC.getReserves()
    const reserve0Polyzap = Number(ethers.utils.formatUnits(polyzapReserves[0], tokenBDecimals))
    const reserve1Polyzap = Number(ethers.utils.formatUnits(polyzapReserves[1], tokenADecimals))
    const pricePolyzap = reserve0Polyzap / reserve1Polyzap

    /**
     * Dfyn prices
     */
    const dfynReserves = await dfynEthUSDC.getReserves()
    const reserve0Dfyn = Number(ethers.utils.formatUnits(dfynReserves[0], tokenBDecimals))
    const reserve1Dfyn = Number(ethers.utils.formatUnits(dfynReserves[1], tokenADecimals))
    const priceDfyn = reserve0Dfyn / reserve1Dfyn

    /**
     * Find the lowest and highest price for ETH among exchanges, as that will
     * be our best arb opportunity (if any)
     */
    const priceList = [
      priceSushiswap,
      priceQuickSwap,
      pricePolyzap,
      priceDfyn
    ]
    let min = Math.min.apply(Math, priceList)
    let max = Math.max.apply(Math, priceList)

    let lowestPriceExchange
    let highestPriceExchange
    // Lowest
    if (priceList[0] === min) lowestPriceExchange = 'SUSHI'
    if (priceList[1] === min) lowestPriceExchange = 'QUICKSWAP'
    if (priceList[2] === min) lowestPriceExchange = 'POLYZAP'
    if (priceList[3] === min) lowestPriceExchange = 'DFYN'
    // Highest
    if (priceList[0] === max) highestPriceExchange = 'SUSHI'
    if (priceList[1] === max) highestPriceExchange = 'QUICKSWAP'
    if (priceList[2] === max) highestPriceExchange = 'POLYZAP'
    if (priceList[3] === max) highestPriceExchange = 'DFYN'

    console.log('HIGHEST PRICE', max, highestPriceExchange)
    console.log('LOWEST PRICE', min, lowestPriceExchange)
    
    /**
     * Determine if we should trade
     */
    // Determine the basic spread (without fees yet)
    let percentageSpread = (max / min - 1) * 100
    
    // .3% fee from Sushi and Quickswap
    // .5% fee Cometh
    // .25% fee Polyzap
    const percentageSpreadAfterFees = percentageSpread - 0.6

    // Only attempt a trade if the % difference in prices EXCEEDS the % of fees
    // we'd be charged. In other words, this number must exceed 0.
    // We'll calc gas later.
    const shouldTrade = percentageSpreadAfterFees > 0

    console.log('--------------')
    console.log('TOKEN PAIR                    =>', tokenA, tokenB)
    console.log('QUICKSWAP PRICE               =>', parseFloat(priceQuickSwap.toFixed(3)))
    console.log('SUSHISWAP PRICE               =>', parseFloat(priceSushiswap.toFixed(3)))
    console.log('POLYZAP PRICE                 =>', parseFloat(pricePolyzap.toFixed(3)))
    console.log('DFYN PRICE                    =>', parseFloat(priceDfyn.toFixed(3)))
    console.log('LARGEST PERCENTAGE SPREAD     =>', percentageSpread.toFixed(3) + ' %')
    console.log('LARGEST SPREAD AFTER FEES     =>', percentageSpreadAfterFees.toFixed(3) + ' %')
    console.log('PROFITABLE?                   =>', shouldTrade)
    console.log('--------------')

    if (!shouldTrade) return

    /**
     * EXECUTE TRANSACTION
     */
    // let executionFactory
    // if (lowestPriceExchange === 'SUSHI') executionFactory = sushiEthUSDC
    // if (lowestPriceExchange === 'QUICKSWAP') executionFactory = quickSwapEthUSDC
    // if (lowestPriceExchange === 'POLYZAP') executionFactory = polyzapEthUSDC
    // if (lowestPriceExchange === 'DFYN') executionFactory = dfynEthUSDC

    
    
  })
}
