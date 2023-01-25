# Getting Started with WEB3.0 dApp

## Available Scripts

First, start local network using hardhat, by:

### `npx hardhat node`

This will create the RPC localhost url which we can use to connect with metamask to test this application.
By default the account is loaded with gas and three tokens.
Use `private key` of index 1 account on metamask. 
Tokens can be imported by using import token option on metamask extension using the address logged by running below step.
**NOTE: use the bank address in App.js**

Then, in file directory, you can deploy solidity contracts by:

### `npx hardhat run --network localhost <path to deploy script>`

In the client directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.


Glimpse of app after connecting to Metamask wallet.
![image](https://user-images.githubusercontent.com/56720922/214471557-de880e42-accf-4fc4-9b09-20875a798593.png)
