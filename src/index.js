import express from 'express'
import http from 'http'
import { BeaconWallet } from '@taquito/beacon-wallet'
import { TezosToolkit } from '@taquito/taquito'
import { InMemorySigner } from '@taquito/signer'
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

const server = express()

let port = ''
let host = ''
if (process.env.NODE_ENV === 'production') {
  // IMPORTANT: In production, the port must be inferred from env variables,
  // because Heroku sets them dynamically
  port = process.env.PORT || 1337
  host = '0.0.0.0'
} else if (process.env.NODE_ENV === 'development') {
  // Running development server at localhost:1337
  port = 1337 // Will be accessed via localhost
  host = 'localhost'
}

http.createServer(server).listen(port, host)

console.log('Server running at:', host + port)

// See here for docs: https://tezostaquito.io/docs/quick_start
// https://mainnet.smartpy.io
const Tezos = new TezosToolkit('https://mainnet-tezos.giganode.io')

// TODO: Use the faucet funds/keys to test
Tezos.setProvider({
  signer: new InMemorySigner(process.env.WALLET_KEY),
  config: { confirmationPollingIntervalSecond: 1 }
})

// TODO: Listener on specific HEN accounts
// Ideas for listeners: https://tezos.stackexchange.com/questions/3181/listen-for-operations-of-a-deployed-contract
const startListener = () => {
  const sub = Tezos.stream.subscribeOperation({
    destination: 'KT1Hkg5qeNhfwpKW4fXvq7HGZB9z2EnmCCA9'
  })
  sub.on('data', data => {
    // Address of user who performed action
    const tezAddress = data.source
    // Method used (we're looking for 'swap')
    const methodType = data.parameters.entrypoint
    // Only proceed on swaps
    if (methodType !== 'swap') return
    console.log('SWAP', tezAddress)
    // Only proceed if it's an artist we're looking for
    const isJohn = tezAddress === 'tz1gqaKjfQBhUMCE6LhbkpuittRiWv5Z6w38'
    const isXCopy = tezAddress === 'tz1R8kQK1CR59su3GYpPBFHxrBokNPYWaM42'
    const isFiedler = tezAddress === 'tz1XuPRJJEdEumLcuJc4pdzejqs58qBFJSCW'
    const isSarah = tezAddress === 'tz1ZRWhMYGxFfXnXc74bS2L991q6G5nEs6nf'
    const objectId = data.parameters.value.args[1].args[0].int
    if (isJohn || isXCopy || isFiedler || isSarah) {
      // TODO: This is where we call GetOBJKT with our id, then iterate through
      // the swaps to call collect on one
      console.log('TRIGGER', objectId, tezAddress, data)
      makePurchase(objectId)
    }
  })
}

// This takes an object id and returns data (including swaps available)
const GetOBJKT = (id) => {
  return new Promise((resolve, reject) => {
    axios
      .get(`https://51rknuvw76.execute-api.us-east-1.amazonaws.com/dev/objkt?id=${id}`)
      .then((res) => {
        resolve(res.data.result)
      })
      .catch((e) => reject(e)) // TODO: send error message to context. have an error component to display the error
  })
}

// Execute collect method on a swap
// See here for HEN code: https://tzkt.io/KT1Hkg5qeNhfwpKW4fXvq7HGZB9z2EnmCCA9/entrypoints
const collect = (swapId, swapAmount) => {
  console.log('COLLECT', swapId, swapAmount)
  return Tezos.wallet
    // HEN contract
    .at('KT1Hkg5qeNhfwpKW4fXvq7HGZB9z2EnmCCA9')
    .then((contract) =>
      contract.methods
        // Object amount is number of objkts you want
        .collect(parseFloat(1), parseFloat(swapId))
        .send({ amount: parseFloat(swapAmount), mutez: true, fee: 1100000 })
    )
    .then(operation => {
      console.log('OPERATION', operation.opHash, operation._included)
      operation.confirmation().then(res => {
        console.log('CONFIRMATION?', res)
      })
    })
    .catch((e) => {
      console.log('error', e)
    })
}

const makePurchase = (objectId) => {
  console.log('PURCHASE', objectId)
  GetOBJKT(objectId).then(data => {
    let swapId = null
    let swapAmount = 9999999999999999999999
    let swapsAvail = null
    // Find the cheapest swap, in case they have diff pricing
    data.swaps.forEach(swap => {
      const id = swap.swap_id
      const amount = swap.xtz_per_objkt
      if (parseFloat(swapAmount) > parseFloat(amount)) {
        swapId = id
        swapAmount = amount
        swapsAvail = swap.objkt_amount
      }
    })
    // Don't collect if there are too many swaps available. I.e. if this isn't
    // going to be a low mint number. First we check the length of the swaps array
    // then we check the swapsAvail (swap.objkt_amount) which will be greater than
    // 1 in the case of new swaps.
    console.log('SWAPS AVAIL', data.swaps.length, swapsAvail, swapAmount)
    if (parseFloat(data.swaps.length) > 26) return
    if (parseFloat(swapsAvail) > 26) return
    // Don't collect if price isn't 25 XTZ or below
    if (parseFloat(swapAmount) > (26 * 1000000)) return
    // This is the cheapest swap, now execute
    collect(swapId, swapAmount)
  })
}

startListener()
