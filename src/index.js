import express from 'express'
import http from 'http'
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()
import {
  wethAddress,
  usdcAddress
} from './constants/tokenAddresses.js'
import { ethUSDCBot } from './bots/ethUSDCBot.js'
import { ethDaiBot } from './bots/ethDaiBot.js'
import { maticBtcBot } from './bots/maticBtcBot.js'
import { loader } from './utilities/loader.js'
import { ethMaticBot } from './bots/ethMaticBot.js'
import { maticAaveBot } from './bots/maticAaveBot.js'
import { maticUSDCBot } from './bots/maticUSDCBot.js'

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

// RUN BOT
ethUSDCBot()
ethDaiBot()
maticBtcBot()
ethMaticBot()
maticAaveBot()
maticUSDCBot()
loader()
