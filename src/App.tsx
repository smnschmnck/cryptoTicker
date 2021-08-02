import React, { useState } from 'react';
import './App.css';
import { PairView } from './Components/PairView'
import { assetPairs } from './AssetPairs';
import loader from './img/loader.gif';
const socket = new WebSocket('wss://ws.kraken.com');

interface Currency{
  pair: string;
  price: string;
}

const App = () => {
  const[currencyList, setCurrencyList] = useState<Currency[]>([]);
  const[pairInput, setPairInput] = useState("");
  const[connectionEst, setConnectionEst] = useState(false);

  socket.onmessage = ({data}) =>{
    let msg = JSON.parse(data);

    if(msg.status==="error"){
      alert(msg.errorMessage);
      return;
    }

    if(msg.status==="subscribed"){
      for(let i = 0; i<currencyList.length; i++){
        if(currencyList[i].pair === msg.pair){
          alert("Pair already added!");
          return;
        }
      }
      setCurrencyList([...currencyList,{pair: msg.pair, price: "..."}])
      return;
    }

    if(msg[2] === "ticker"){
      let arr = [...currencyList];
      arr.forEach(currency => {
        if(currency.pair === msg[3]){
          currency.price = parseFloat(msg[1].c[0]).toLocaleString("de-DE");
        }
      });
      setCurrencyList(arr);
      return;
    }
  }

  socket.onopen = () => {
    setConnectionEst(true);
  }

  let loading = <div className="Loader">
      <img className="LoadGif" src={loader} alt="Loading"/>
      <p className="Waiting">Waiting for Connection</p>
    </div>;

  let page = 
  <div className="App">
    <h1><b>Crypto</b>Ticker</h1>
    <div className="Ticker">
        {currencyList.map(entry => <PairView 
            key={entry.pair} 
            pair={entry.pair} 
            price={entry.price} 
            currencyList={currencyList} 
            setCurrencyList={setCurrencyList}
            unsubscribe={unsubscribe}/>)
        }
        {currencyList.length===0 ? <h3><b>Add Crypto Trading Pair </b>(i.e. ETH/EUR)</h3> : null}
        <form className="AddPair" onSubmit={event=>event.preventDefault()} onClick={() => document.getElementById('PairInput')?.focus()} autoComplete="off">
          <input id="PairInput" className="PairInput" value={pairInput} onChange={e => setPairInput(e.target.value.toUpperCase())} placeholder={"Add pair..."} autoFocus list="PairList"/>
          <datalist id="PairList">
            {assetPairs.filter(pair => pair.match("^"+pairInput)).map(pair => <option key={pair}>{pair}</option>)}
          </datalist>
          <button title="Add" className="AddButton" onClick={() => {subscribeToPair(pairInput, currencyList, setCurrencyList); setPairInput("");}}/>
        </form>
    </div>
    <div className="Storage">
      <button className="StorageButton" onClick={() => clearCurrencyList(currencyList, setCurrencyList)} title="Clear">Clear</button>
      <button className="StorageButton" onClick={() => localStorage.setItem("list", JSON.stringify(currencyList.map(entry => entry.pair)))} title="Save in Browser">Save in Browser</button>
      <button className="StorageButton" onClick={() => subscribeFromLocalStorage(currencyList, setCurrencyList)} title="Retrieve last Config">Retrieve last Config</button>
    </div>
  </div>;

  return(
    connectionEst ? page : loading);
}

const subscribeToPair = (pair: string, currencyList: Currency[], setCurrencyList: (currencyList: Currency[]) => void) => {
  let sub = {
    "event": "subscribe",
    "pair": [
      pair
    ],
    "subscription": {
      "name": "ticker"
    }
  };

  socket.send(JSON.stringify(sub));
}

const subscribeFromLocalStorage = (currencyList: Currency[], setCurrencyList: (currencyList: Currency[]) => void) => {
  let localCurrencyList = JSON.parse(localStorage.list);
  clearCurrencyList(currencyList, setCurrencyList);
  for(let i = 0; i<localCurrencyList.length; i++){
    subscribeToPair(localCurrencyList[i], currencyList, setCurrencyList);
  }
}

const clearCurrencyList =  (currencyList: Currency[], setCurrencyList: (currencyList: Currency[]) => void) => {
  let currencyListCopy = [...currencyList];
  for(let i = 0; i<currencyListCopy.length; i++){
    unsubscribe(currencyListCopy[i].pair);
  }
  setCurrencyList([]);
}

const unsubscribe = (pair: string) => {
  let unSub = {
    "event": "unsubscribe",
    "pair": [
      pair
    ],
    "subscription": {
      "name": "ticker"
    }
  };

  socket.send(JSON.stringify(unSub));
}

socket.onclose = () => {
  alert("Connection Lost. Please Reload");
  window.location.reload();
}

export default App;