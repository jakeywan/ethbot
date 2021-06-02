import { ethers } from 'ethers'
import dotenv from 'dotenv'
dotenv.config()
import { provider } from '../matic/matic.js'
import { tokenFactory } from '../factories/factories.js'
import { ETH_TRADE } from '../constants/tradeAmountDefaults.js'
import { loadPair } from '../pairs/pairs.js'
import { executeTrade } from '../executeTrade.js'
import { sushiPairUrl, quickSwapPairUrl, dfynPairUrl } from '../constants/pairUrls.js'

const sushiFee = .25
const polyzapFee = .25
const quickswapFee = .3
const dfynFee = .3

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

      // We need to enforce a minimum liquidity value to attempt a trade. Since
      // it's difficult to establish a universal minimum threshold, let's just
      // say that one of the pairs in the pool must have more than 1,000 tokens
      // If a pair doesn't exist, it's address will be the null address
      if (sushiPair.address !== nullAddress) {
        // SUSHI. Note that we'll always divide reserve1 / reserve0 to get price.
        const sushiReserves = await sushiPair.getReserves()
        const reserve0Sushi = Number(ethers.utils.formatUnits(sushiReserves[0], token0Decimals))
        const reserve1Sushi = Number(ethers.utils.formatUnits(sushiReserves[1], token1Decimals))
        if (reserve0Sushi > 3000 || reserve1Sushi > 3000) {
          // We must ALWAYS calculate price in this direction, so we can assume
          // that reserve0/token0/amount0In is always the starting direction.
          priceSushiswap = reserve1Sushi / reserve0Sushi
        }
      }
      if (quickSwapPair.address !== nullAddress) {
        // QUICKSWAP
        const quickSwapReserves = await quickSwapPair.getReserves()
        const reserve0QuickSwap = Number(ethers.utils.formatUnits(quickSwapReserves[0], token0Decimals))
        const reserve1QuickSwap = Number(ethers.utils.formatUnits(quickSwapReserves[1], token1Decimals))
        if (reserve0QuickSwap > 3000 || reserve1QuickSwap > 3000) {
          priceQuickSwap = reserve1QuickSwap / reserve0QuickSwap
        }
      }
      if (polyzapPair.address !== nullAddress) {
        // POLYZAP
        const polyzapReserves = await polyzapPair.getReserves()
        const reserve0Polyzap = Number(ethers.utils.formatUnits(polyzapReserves[0], token0Decimals))
        const reserve1Polyzap = Number(ethers.utils.formatUnits(polyzapReserves[1], token1Decimals))
        if (reserve0Polyzap > 3000 || reserve1Polyzap > 3000) {
          pricePolyzap = reserve1Polyzap / reserve0Polyzap
        }
      }
      if (dfynPair.address !== nullAddress) {
        // DFYN
        const dfynReserves = await dfynPair.getReserves()
        const reserve0Dfyn = Number(ethers.utils.formatUnits(dfynReserves[0], token0Decimals))
        const reserve1Dfyn = Number(ethers.utils.formatUnits(dfynReserves[1], token1Decimals))
        if (reserve0Dfyn > 3000 || reserve1Dfyn > 3000) {
          priceDfyn = reserve1Dfyn / reserve0Dfyn
        }
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
      let fee0 // fee of exchange0
      let fee1 // fee of exchange1
      if (priceSushiswap === min) {
        exchange0 = 0
        fee0 = sushiFee
      }
      if (priceSushiswap === max) {
        exchange1 = 0
        fee1 = sushiFee
      }
      if (priceQuickSwap === min) {
        exchange0 = 1
        fee0 = quickswapFee
      }
      if (priceQuickSwap === max) {
        exchange1 = 1
        fee1 = quickswapFee
      }
      if (pricePolyzap === min) {
        exchange0 = 2
        fee0 = polyzapFee
      }
      if (pricePolyzap === max) {
        exchange1 = 2
        fee1 = polyzapFee
      }
      if (priceDfyn === min) {
        exchange0 = 3
        fee0 = dfynFee
      }
      if (priceDfyn === max) {
        exchange1 = 3
        fee1 = dfynFee
      }

      // DETERMINE IF WE SHOULD TRADE
      // Get the basic spread (without fees yet)
      let percentageSpread = (max / min - 1) * 100
      // Subtract fees (assume .3% each swap)
      const percentageSpreadAfterFees = percentageSpread - fee0 - fee1
      // Only attempt a trade if we're still above 0
      const shouldTrade = percentageSpreadAfterFees > 0.05
      // TODO: we should also calculate price impact give the reserves, and make
      // sure to only trade an exact amount which still keeps us in the black

      if (!shouldTrade) return

      console.log(`--------------${token0Name}-${token1Name}--------------`)
      console.log('BLOCK NUMBER ', blockNumber)
      if (priceSushiswap) {
        console.log('SUSHISWAP PRICE               =>', parseFloat(priceSushiswap.toFixed(9)))
        console.log('SUSHI PAIR URL: ', sushiPairUrl + sushiPair.address)
      }
      if (priceQuickSwap) {
        console.log('QUICKSWAP PRICE               =>', parseFloat(priceQuickSwap.toFixed(9)))
        console.log('QUICKSWAP PAIR URL: ', quickSwapPairUrl + quickSwapPair.address)
      }
      if (pricePolyzap) {
        console.log('POLYZAP PRICE                 =>', parseFloat(pricePolyzap.toFixed(9)))
        console.log('POLYZAP PAIR URL: ', polyzapPairUrl + polyzapPair.address)
      }
      if (priceDfyn) {
        console.log('DFYN PRICE                    =>', parseFloat(priceDfyn.toFixed(9)))
        console.log('DFYN PAIR URL: ', dfynPairUrl + dfynPairUrl.address)
      }
      console.log('LARGEST PERCENTAGE SPREAD     =>', percentageSpread.toFixed(3) + ' %')
      console.log('LARGEST SPREAD AFTER FEES     =>', percentageSpreadAfterFees.toFixed(3) + ' %')
      console.log('PROFITABLE?                   =>', shouldTrade)

      // EXECUTE TRANSACTION
      const amountToBuy = String(ethers.utils.parseUnits('1', token0Decimals))

      executeTrade(
        token0, // always in order
        token1, // always in order
        amountToBuy,
        // since we always divide token1 / token0 to get price, we're always
        // buying token0 (example: token0 is 2300 DAI in pool, token1 is 1 ETH
        // in pool, giving us 2300 / 1, meaning 2300 is the price of ETH in DAI,
        // so we want to buy ETH wherever it's cheapest).
        0,
        exchange0, // buying from here
        exchange1 // selling to here
      )
      
    } catch (err) {
      console.log('ERROR', err.error.message.error)
    }

  })
}
