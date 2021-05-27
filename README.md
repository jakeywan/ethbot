# Exchanges
https://vfat.tools/polygon/

---------------
# Sushi

### Repo
https://dev.sushi.com/sushiswap/contracts

### Factory contract
0xc35DADB65012eC5796536bD9864eD8773aBc74C4

---------------
# Quickswap

### Repo:
https://github.com/QuickSwap/quickswap-core

### Factory contract
0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32

---------------
# Polyzap

### Notes
.25% trading fee

### Docs
https://docs.polyzap.finance/features/dex-amm

### Link
https://info.polyzap.finance/home

### Factory contract
0x34De5ce6c9a395dB5710119419A7a29baa435C88

---------------
# Dyfn

### Notes
.3% fee

### Link
https://exchange.dfyn.network/#/swap

### Docs
https://docs.dfyn.network/

### Factory contract
0xE7Fb3e833eFE5F9c441105EB65Ef8b261266423B



----------------------------

Note: it looks like Aave offers a "Flash loan" that only costs .09%. This is quite
a bit better than the .3% Uniswap offers.



----------------------------

I removed the gas calculations because I'm thinking it's just fractions of pennies:

```
    // NOTE: The computed veresion was erroring. Is it because the wallet has 0 ether?
    // See here: https://github.com/ethers-io/ethers.js/issues/1232
    // NOTE: I'm getting literal fractions of pennies to execute these trades,
    // maybe we just skip this step.
    try {
      // It would be better to calculate this, but this hardcoded value is larger
      // than an average uniswap swap in gas
      const gasLimit = 250000
      // This returns a BigNumber representing gas in gwei (1 gwei = 1e-9)
      const gasPrice = await wallet.getGasPrice()
      // The `formatEther` utility converts gwei to ETH
      const gasCost = Number(ethers.utils.formatEther(gasPrice.mul(gasLimit)))
      console.log('GAS COST IN MATIC', gasCost)

    } catch (err) {
      console.log('ERROR COMPUTING GAS', err.reason)
    }
```


------------------------------------

# Aave Flash Loans
https://docs.aave.com/developers/guides/flash-loans