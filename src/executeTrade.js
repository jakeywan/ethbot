import { tradeFactory } from './factories/factories.js'

/**
 * Send a `trade` txn to our smart contract. Params:
 * @param token0Address
 * @param token1Address
 * @param amount0Out // one of these amounts will be zero
 * @param amount1Out
 * @param exchange0 // enum of 0, 1, 2, or 3, corresponding to SUSHI, QUICKSWAP, POLYZAP, DFYN
 * @param exchange1
 */

export const executeTrade = (
  token0Address,
  token1Address,
  amount0Out,
  amount1Out,
  exchange0,
  exchange1
) => {
  console.log('Executing trade!')
  tradeFactory.trade(
    token0Address,
    token1Address,
    amount0Out,
    amount1Out,
    exchange0,
    exchange1
  ).catch(err => {
    console.log('EXECUTION ERROR-------', err.error.message)
  })
}
