import IAavePriceOracle from '../abis/IAavePriceOracle.js'
import ethers from 'ethers'
import { wallet } from '../matic/matic.js'
import {
  daiAddress
} from '../constants/tokenAddresses.js'

const aaveContract = new ethers.Contract(
  '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
  IAavePriceOracle, wallet
)

// FIX: This isn't working yet.
export const fetchAavePrice = async (address) => {
  console.log('fetching aave')
  try {
    let price = await aaveContract.getAssetPrice(daiAddress)
    console.log('price', price)
    return price
  } catch (err) {
    console.log('ERR', err)
  }
}
