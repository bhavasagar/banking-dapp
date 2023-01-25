import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import Modal from './Model';

import bankArtifact from "./artifacts/contracts/Bank.sol/Bank.json";
import maticArtifact from "./artifacts/contracts/Matic.sol/Matic.json";
import shibArtifact from "./artifacts/contracts/Shib.sol/Shib.json";
import usdtArtifact from "./artifacts/contracts/Usdt.sol/Usdt.json";

function App() {

  const [provider, setProvider] = useState(undefined);
  const [signer, setSigner] = useState(undefined);
  const [signerAddress, setsignerAddress] = useState(undefined);
  const [bankContract, setBankContract] = useState(undefined);
  const [tokenContracts, setTokenContracts] = useState({});
  const [tokenBalances, setTokenBalances] = useState({})
  const [tokenSymbols, setTokenSymbols] = useState([]);

  const [amount, setAmount] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [isDeposit, setIsDeposit] = useState(undefined);
  const [selectedSymbol, setSelectedSymbol] = useState(undefined);

  const toBytes32 = text => (ethers.utils.formatBytes32String(text));
  const toString = bytes32 => (ethers.utils.parseBytes32String(bytes32));
  const toWei = ether => (ethers.utils.parseEther(ether));
  const toEther = wei => (ethers.utils.formatEther(wei).toString());
  const toRound = num => (Number(num).toFixed(2));

  useEffect(() => {
    const init = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);

      const bankContract = new ethers.Contract("0x5FbDB2315678afecb367f032d93F642f64180aa3", bankArtifact.abi);
      setBankContract(bankContract);

      const result = await bankContract.connect(provider).getWhitelistedSymbols();
      const symbols = result.map(s => toString(s));
      setTokenSymbols(symbols); 
      getTokenContracts(symbols, bankContract, provider);      
    }

    init();
  });

  const getTokenContract = async (symbol, bankContract, provider) => {
    const address = await bankContract.connect(provider).getWhitelistedTokenAddress(toBytes32(symbol));
    const abi = symbol === "Matic" ? maticArtifact.abi : symbol === "Shib" ? shibArtifact.abi : usdtArtifact.abi;
    const tokenContract = new ethers.Contract(address, abi);
    return tokenContract;
  }
  
  const getTokenContracts = async (symbols, bankContract, provider) => {
    symbols.map(async symbol => {
      const contract = await getTokenContract(symbol, bankContract, provider);
      setTokenContracts(prevContracts => ({...prevContracts, [symbol]: contract}));      
    })
  }

  const isConnected = () => (signer !== undefined);
  
  const getSigner = async provider => {
    provider.send("eth_requestAccounts", []);

    const signer = provider.getSigner();

    const address = await signer.getAddress();
    setsignerAddress(address);

    return signer;
  }

  const connectWallet = async () => {
    const signer = await getSigner(provider);
    setSigner(signer);
    console.log("Calling token balances");
    getTokenBalances(signer);
  }

  const getTokenBalance = async (symbol, signer) => {
    const balance = await bankContract.connect(signer).getTokenBalance(toBytes32(symbol));
    return toEther(balance);
  }

  const getTokenBalances = (signer) => {
    tokenSymbols.map(async (symbol) => {
      const balance = await getTokenBalance(symbol, signer);
      console.log(`${symbol}: ${balance}`);
      setTokenBalances(prev => ({...prev, [symbol]: balance}));
    })
  }

  
  const depositTokens = (wei, symbol) => {
    console.log(wei)
    if (symbol === 'Eth') {
      signer.sendTransaction({
        to: bankContract.address,
        value: wei
      }).then( () =>  (getTokenBalances(signer)));
    } else {
      const tokenContract = tokenContracts[ symbol ]
      tokenContract.connect(signer).approve(bankContract.address, wei)
        .then(() => {
          bankContract.connect(signer).depositTokens(wei, toBytes32(symbol)).then(res => {
            console.log(res);
            console.log(" Refreshing...  ");
            getTokenBalances(signer);
          }) ;
        })
    }
  }

  const withdrawTokens = (wei, symbol) => {
    if (symbol === 'Eth') {
      bankContract.connect(signer).withdrawEther(wei).then( () =>  (getTokenBalances(signer)));
    } else {
      bankContract.connect(signer).withdrawToken(toBytes32(symbol), wei).then( (res) =>  {
        console.log(" Refreshing.. ", res);
        getTokenBalances(signer);
      });;
    }
  }

  const depositOrWithdraw = (e, symbol) => {
    e.preventDefault();
    const wei = toWei(amount)
    console.log(wei, amount, typeof(amount), typeof(wei));

    if(isDeposit) {
      depositTokens(wei, symbol)
    } else {
      withdrawTokens(wei, symbol)
    }
  }

  const displayModal = (symbol) => {
    setSelectedSymbol(symbol)
    setShowModal(true)
  }

  return (
    <div className="App">
      {
        isConnected() ? (
          <div>
            <div>
            <p>
              Welcome {signerAddress?.substring(0,10)}...
            </p>
            <div>
              <div className="list-group">
                <div className="list-group-item">
                  {Object.keys(tokenBalances).map((symbol, idx) => (
                    <div className=" row d-flex py-3" key={idx}>

                      <div className="col-md-3">
                        <div>{symbol.toUpperCase()}</div>
                      </div>

                      <div className="d-flex gap-4 col-md-3">
                        <small className="opacity-50 text-nowrap">{toRound(tokenBalances[symbol])}</small>
                      </div>

                      <div className="d-flex gap-4 col-md-6">
                        <button onClick={ () => displayModal(symbol) } className="btn btn-primary">Deposit/Withdraw</button>
                        <Modal
                          show={showModal}
                          onClose={() => setShowModal(false)}
                          symbol={selectedSymbol}
                          depositOrWithdraw={depositOrWithdraw}
                          isDeposit={isDeposit}
                          setIsDeposit={setIsDeposit}
                          setAmount={setAmount}
                        />
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
          </div>
        ) : (
          <button onClick={connectWallet} className="btn btn-lg btn-primary">Connect Wallet</button>
        )
      }
    </div>
  );
}

export default App;