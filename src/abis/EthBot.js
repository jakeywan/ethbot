const EthBot = [
	{
		"stateMutability": "payable",
		"type": "fallback"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "token0Address",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "token1Address",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount0Out",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "amount1Out",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "exchange0",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "exchange1",
				"type": "uint256"
			}
		],
		"name": "trade",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_sender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_amount0",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_amount1",
				"type": "uint256"
			},
			{
				"internalType": "bytes",
				"name": "_data",
				"type": "bytes"
			}
		],
		"name": "uniswapV2Call",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

export default EthBot
