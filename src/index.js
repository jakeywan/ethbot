import express from 'express'
import http from 'http'
import axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()
import { runBot } from './ethers.js'
import {
  wethAddress,
  usdcAddress
} from './constants/tokenAddresses.js'

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
runBot(wethAddress, 18, usdcAddress, 6)