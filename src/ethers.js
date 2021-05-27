import { ethers } from 'ethers'
import dotenv from 'dotenv'
dotenv.config()

// Matic network urls: https://docs.matic.network/docs/develop/network-details/network/
const provider = new ethers.providers.JsonRpcProvider('https://rpc-mainnet.maticvigil.com')
// This key is for demo wallet address: 0xc6ab04C59A14cD50c5d0BDA790dCeFD2484901cE
const wallet = new ethers.Wallet(process.env.WALLET_KEY, provider)
// Our wallet address. Dev account right now.
const flashLoanerAddress = '0xc6ab04C59A14cD50c5d0BDA790dCeFD2484901cE'

// uni/sushiswap ABIs are the same
import UniswapV2Pair from './IUniswapV2Pair.js'
import UniswapV2Factory from './IUniswapV2Factory.js'

// Hardcode the number of each token we'd trade if we were to do so? I think?
const ETH_TRADE = 10
const USDC_TRADE = 3500

export const runBot = async () => {

  // List of contract addresses for sushi: https://dev.sushi.com/sushiswap/contracts
  // Make sure you pick the "alternative network" address for Matic
  const sushiFactory = new ethers.Contract(
    '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
    UniswapV2Factory.abi, wallet
  )
  const quickSwapFactory = new ethers.Contract(
    '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
    UniswapV2Factory.abi, wallet
  )

  // Address of WETH on Matic
  const wethAddress = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619'
  // Address of USDC on Matic
  const usdcAddress = '0x2791bca1f2de4661ed88a30c99a7a9449aa84174'

  let sushiEthUSDC
  let quickSwapEthUSDC

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
    // Amount of USDC in the pool
    const reserve0QuickSwap = Number(ethers.utils.formatUnits(quickSwapReserves[0], 6))
    // Amount of WETH in the pool
    const reserve1QuickSwap = Number(ethers.utils.formatUnits(quickSwapReserves[1], 18))
    const priceQuickSwap = reserve0QuickSwap / reserve1QuickSwap
    
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
