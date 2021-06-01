import express from 'express'
import http from 'http'
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()
import {
  wethAddress,
  usdcAddress,
  daiAddress,
  maticAddress,
  btcAddress,
  aaveAddress,
  krillAddress,
  chainlinkAddress
} from './constants/tokenAddresses.js'
import { loader } from './utilities/loader.js'
import { bot } from './bots/bot.js'

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

// ETH-USDC
bot(wethAddress, usdcAddress)
// ETH-MATIC
bot(wethAddress, maticAddress)
// MATIC-AAVE
bot(maticAddress, aaveAddress)
// MATIC-USDC
bot(maticAddress, usdcAddress)
// ETH-DAI
bot(wethAddress, daiAddress)
// MATIC-BTC
bot(maticAddress, btcAddress)
// USDC-KRILL
bot(usdcAddress, krillAddress)
// LINK-ETH
bot(chainlinkAddress, wethAddress)

loader()
