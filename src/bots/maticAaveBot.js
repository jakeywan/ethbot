import { ethers } from 'ethers'
import dotenv from 'dotenv'
dotenv.config()
import {
  maticAddress,
  aaveAddress
} from '../constants/tokenAddresses.js'
import {
  provider,
  wallet
} from '../matic/matic.js'
import {
  sushiFactory,
  quickSwapFactory,
  polyzapFactory
} from '../factories/factories.js'
import { ETH_TRADE } from '../constants/tradeAmountDefaults.js'
import { loadPair } from '../pairs/pairs.js'

const aaveDecimals = 18
const maticDecimals = 18

export const maticAaveBot = async () => {

  console.log('Listening to MATIC-AAVE pools...')

  let sushiEthUSDC
  let quickSwapEthUSDC
  let polyzapEthUSDC

  const loadPairs = async () => {
    sushiEthUSDC = await loadPair(maticAddress, aaveAddress, 'SUSHI')
    quickSwapEthUSDC = await loadPair(maticAddress, aaveAddress, 'QUICKSWAP')
    polyzapEthUSDC = await loadPair(maticAddress, aaveAddress, 'POLYZAP')
  }

  await loadPairs()

  provider.on('block', async (blockNumber) => {
    try {

      /**
       * Sushi prices
       * https://analytics-polygon.sushi.com/pairs/0x8531c4e29491fe6e5e87af6054fc20fccf0b4290
       */
      // Execute the `getReserves` method on the method returned in `loadPairs` above.
      // Read about it here: https://uniswap.org/docs/v2/smart-contracts/pair/
      // function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
      const sushiReserves = await sushiEthUSDC.getReserves()

      // NOTE: Make sure the "decimals" in `formatUnits` is correct (check the
      // token contract). For USDC it's fucking 6, so stupid.
      // Amount of USDC in the pool
      const reserve0Sushi = Number(ethers.utils.formatUnits(sushiReserves[0], maticDecimals))
      // Amount of WETH in the pool
      const reserve1Sushi = Number(ethers.utils.formatUnits(sushiReserves[1], aaveDecimals))
      // Dividing them tells you how much of one you need to purchase 1 of the other,
      // in other words its relative price. This gives us the price of ETH, in USDC,
      // on SushiSwap.
      const priceSushiswap = reserve0Sushi / reserve1Sushi

      /**
       * Quickswap prices
       * https://info.quickswap.exchange/pair/0xf6b87181bf250af082272e3f448ec3238746ce3d
       */
      const quickSwapReserves = await quickSwapEthUSDC.getReserves()
      const reserve0QuickSwap = Number(ethers.utils.formatUnits(quickSwapReserves[0], maticDecimals))
      const reserve1QuickSwap = Number(ethers.utils.formatUnits(quickSwapReserves[1], aaveDecimals))
      const priceQuickSwap = reserve0QuickSwap / reserve1QuickSwap

      /**
       * Polyzap prices
       * https://info.polyzap.finance/pair/0x6c17bdba740d8b7b2914a96f3c1f70a0c7765c6f
       */
      const polyzapReserves = await polyzapEthUSDC.getReserves()
      const reserve0Polyzap = Number(ethers.utils.formatUnits(polyzapReserves[0], maticDecimals))
      const reserve1Polyzap = Number(ethers.utils.formatUnits(polyzapReserves[1], aaveDecimals))
      const pricePolyzap = reserve0Polyzap / reserve1Polyzap

      /**
       * Find the lowest and highest price for ETH among exchanges, as that will
       * be our best arb opportunity (if any)
       */
      const priceList = [
        priceSushiswap,
        priceQuickSwap,
        pricePolyzap
      ]
      let min = Math.min.apply(Math, priceList)
      let max = Math.max.apply(Math, priceList)

      let lowestPriceExchange
      let highestPriceExchange
      // Lowest
      if (priceList[0] === min) lowestPriceExchange = 'SUSHI'
      if (priceList[1] === min) lowestPriceExchange = 'QUICKSWAP'
      if (priceList[2] === min) lowestPriceExchange = 'POLYZAP'
      // Highest
      if (priceList[0] === max) highestPriceExchange = 'SUSHI'
      if (priceList[1] === max) highestPriceExchange = 'QUICKSWAP'
      if (priceList[2] === max) highestPriceExchange = 'POLYZAP'
      
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

      if (!shouldTrade) return

      console.log('--------------MATIC-AAVE--------------')
      console.log('QUICKSWAP PRICE               =>', parseFloat(priceQuickSwap.toFixed(3)))
      console.log('SUSHISWAP PRICE               =>', parseFloat(priceSushiswap.toFixed(3)))
      console.log('POLYZAP PRICE                 =>', parseFloat(pricePolyzap.toFixed(3)))
      console.log('LARGEST PERCENTAGE SPREAD     =>', percentageSpread.toFixed(3) + ' %')
      console.log('LARGEST SPREAD AFTER FEES     =>', percentageSpreadAfterFees.toFixed(3) + ' %')
      console.log('PROFITABLE?                   =>', shouldTrade)

      /**
       * EXECUTE TRANSACTION
       */
      // let executionFactory
      // if (lowestPriceExchange === 'SUSHI') executionFactory = sushiEthUSDC
      // if (lowestPriceExchange === 'QUICKSWAP') executionFactory = quickSwapEthUSDC
      // if (lowestPriceExchange === 'POLYZAP') executionFactory = polyzapEthUSDC
      // if (lowestPriceExchange === 'DFYN') executionFactory = dfynEthUSDC
    } catch (err) {
      console.log('ERROR', err)
    }
    
    
  })
}
