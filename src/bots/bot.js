import { ethers } from 'ethers'
import dotenv from 'dotenv'
dotenv.config()
import { provider } from '../matic/matic.js'
import { tokenFactory } from '../factories/factories.js'
import { ETH_TRADE } from '../constants/tradeAmountDefaults.js'
import { loadPair } from '../pairs/pairs.js'
import { executeTrade } from '../executeTrade.js'

export const bot = async (tokenA, tokenB) => {

  let sushiPair
  let quickSwapPair
  let polyzapPair
  let dfynPair

  // NOTE: so far we are agnostic about the order of tokenA and tokenB
  const loadPairs = async () => {
    sushiPair = await loadPair(tokenA, tokenB, 'SUSHI')
    quickSwapPair = await loadPair(tokenA, tokenB, 'QUICKSWAP')
    polyzapPair = await loadPair(tokenA, tokenB, 'POLYZAP')
    dfynPair = await loadPair(tokenA, tokenB, 'DFYN')
  }
  await loadPairs()

  // GET CANONICAL TOKEN ORDERS & DECIMALS
  let token0 = sushiPair.token0()
  let token1 = sushiPair.token1()
  let token0Factory = await tokenFactory(token0)
  let token1Factory = await tokenFactory(token1)
  let token0Decimals = await token0Factory.decimals()
  let token1Decimals = await token1Factory.decimals()
  let token0Name = await token0Factory.name()
  let token1Name = await token1Factory.name()

  console.log(`Listening to ${token0Name}-${token1Name} pools...`)

  provider.on('block', async (blockNumber) => {
    try {

      let nullAddress = '0x0000000000000000000000000000000000000000'
      let priceSushiswap
      let priceQuickSwap
      let pricePolyzap
      let priceDfyn

      // If a pair doesn't exist, it's address will be the null address
      if (sushiPair.address !== nullAddress) {
        // SUSHI. Note that we'll always divide reserve0 / reserve1 to get price.
        const sushiReserves = await sushiPair.getReserves()
        const reserve0Sushi = Number(ethers.utils.formatUnits(sushiReserves[0], token0Decimals))
        const reserve1Sushi = Number(ethers.utils.formatUnits(sushiReserves[1], token1Decimals))
        priceSushiswap = reserve1Sushi / reserve0Sushi
      }
      if (quickSwapPair.address !== nullAddress) {
        // QUICKSWAP
        const quickSwapReserves = await quickSwapPair.getReserves()
        const reserve0QuickSwap = Number(ethers.utils.formatUnits(quickSwapReserves[0], token0Decimals))
        const reserve1QuickSwap = Number(ethers.utils.formatUnits(quickSwapReserves[1], token1Decimals))
        priceQuickSwap = reserve1QuickSwap / reserve0QuickSwap
      }
      if (quickSwapPair.address !== nullAddress) {
        // POLYZAP
        const polyzapReserves = await polyzapPair.getReserves()
        const reserve0Polyzap = Number(ethers.utils.formatUnits(polyzapReserves[0], token0Decimals))
        const reserve1Polyzap = Number(ethers.utils.formatUnits(polyzapReserves[1], token1Decimals))
        pricePolyzap = reserve1Polyzap / reserve0Polyzap
      }
      if (dfynPair.address !== nullAddress) {
        // DFYN
        const dfynReserves = await dfynPair.getReserves()
        const reserve0Dfyn = Number(ethers.utils.formatUnits(dfynReserves[0], token0Decimals))
        const reserve1Dfyn = Number(ethers.utils.formatUnits(dfynReserves[1], token1Decimals))
        priceDfyn = reserve1Dfyn / reserve0Dfyn
      }
      
      // FIND LOWEST AND HIGHEST PRICES
      const priceList = []
      if (priceSushiswap) priceList.push(priceSushiswap)
      if (priceQuickSwap) priceList.push(priceQuickSwap)
      if (pricePolyzap) priceList.push(pricePolyzap)
      if (priceDfyn) priceList.push(priceDfyn)
        
      let min = Math.min.apply(Math, priceList)
      let max = Math.max.apply(Math, priceList)

      // Note which exchanges have the highest and lowest prices, using their codes
      let exchange0 // lowest price
      let exchange1 // highest price
      if (priceSushiswap === min) exchange0 = 0
      if (priceSushiswap === max) exchange1 = 0
      if (priceQuickSwap === min) exchange0 = 1
      if (priceQuickSwap === max) exchange1 = 1
      if (pricePolyzap === min) exchange0 = 2
      if (pricePolyzap === max) exchange1 = 2
      if (priceDfyn === min) exchange0 = 3
      if (priceDfyn === max) exchange1 = 3

      // DETERMINE IF WE SHOULD TRADE
      // Get the basic spread (without fees yet)
      let percentageSpread = (max / min - 1) * 100
      // Subtract fees (assume .3% each swap)
      const percentageSpreadAfterFees = percentageSpread - 0.6
      // Only attempt a trade if we're still above 0
      const shouldTrade = percentageSpreadAfterFees > 0.02

      if (!shouldTrade) return

      console.log(`--------------${token0Name}-${token1Name}--------------`)

      if (priceSushiswap) console.log('SUSHISWAP PRICE               =>', parseFloat(priceSushiswap.toFixed(9)))
      if (priceQuickSwap) console.log('QUICKSWAP PRICE               =>', parseFloat(priceQuickSwap.toFixed(9)))
      if (pricePolyzap) console.log('POLYZAP PRICE                 =>', parseFloat(pricePolyzap.toFixed(9)))
      if (priceDfyn) console.log('DFYN PRICE                    =>', parseFloat(priceDfyn.toFixed(9)))
      console.log('LARGEST PERCENTAGE SPREAD     =>', percentageSpread.toFixed(3) + ' %')
      console.log('LARGEST SPREAD AFTER FEES     =>', percentageSpreadAfterFees.toFixed(3) + ' %')
      console.log('PROFITABLE?                   =>', shouldTrade)

      // EXECUTE TRANSACTION
      const amountToBuy = 5 * (token0Decimals * 10)
      executeTrade(
        token0, // always in order
        token1, // always in order
        amountToBuy, 
        0, // since we always divide token0 / token1 to get price, we're always buying token0
        exchange0, // buying from here
        exchange1 // selling to here
      )
    } catch (err) {
      console.log('ERROR', err)
    }

  })
}
