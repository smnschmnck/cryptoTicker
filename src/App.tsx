import React, { useRef, useState } from 'react';
import './App.css';
import { PairView } from './Components/PairView'
import { assetPairs } from './AssetPairs';
const socket = new WebSocket('wss://ws.kraken.com');

interface Currency{
  pair: string;
  price: string;
}

const App = () => {
  const[currencyList, setCurrencyList] = useState<Currency[]>([]);
  const[pairInput, setPairInput] = useState("");
  const[connectionEst, setConnectionEst] = useState(false);
  const[focusOnInp, setFocusOnInp] = useState(false);
  const scrollHere = useRef<null | HTMLButtonElement>(null)
  const topEl = useRef<null | HTMLButtonElement>(null)

  document.onkeydown = function(evt) {
    evt = evt || window.event;
    let isEscape = false;
    if ("key" in evt) {
        isEscape = (evt.key === "Escape" || evt.key === "Esc");
    }
    if (isEscape && document.activeElement === document.getElementById('PairInput')){
      document.getElementById('PairInput')?.blur();
    }
  };

  socket.onmessage = ({data}) =>{
    let msg = JSON.parse(data);

    if(msg.status==="error"){
      alert(msg.errorMessage);
      return;
    }

    if(msg.status==="subscribed"){
      let pair = msg.pair;
      if(pair.includes("XBT")){
        pair = pair.replace("XBT", "BTC");
      }
      if(pair.includes("XDG")){
        pair = pair.replace("XDG", "DOGE");
      }
      for(let i = 0; i<currencyList.length; i++){
        if(currencyList[i].pair === pair){
          alert("Pair already added!");
          return;
        }
      }
      setCurrencyList([...currencyList,{pair: pair, price: "..."}])
      return;
    }

    if(msg[2] === "ticker"){
      let arr = [...currencyList];
      let tickerPair = msg[3];
      if(tickerPair.includes("XBT")){
        tickerPair = tickerPair.replace("XBT", "BTC");
      }
      if(tickerPair.includes("XDG")){
        tickerPair = tickerPair.replace("XDG", "DOGE");
      }
      arr.forEach(currency => {
        if(currency.pair === tickerPair){
          currency.price = parseFloat(msg[1].c[0]).toLocaleString("de-DE");
        }
      });
      setCurrencyList(arr);
      return;
    }
  }

  socket.onopen = () => {
    if(localStorage.emergencyList){
      subscribeToPair(localStorage.emergencyList, currencyList, setCurrencyList);
    }
    localStorage.removeItem("emergencyList");
    setConnectionEst(true);
  }

  socket.onclose = () => {
    console.log("Connection Lost. Please Reload");
    localStorage.setItem("emergencyList", JSON.stringify(currencyList.map(entry => entry.pair)))
    window.location.reload();
  }

  let loading = <div className="Loader">
      <div className="Spinner"></div>
      <p className="Waiting">Waiting for Connection</p>
    </div>;

  const[cursor, setCursor] = useState(-1);

  const handleKeyDown = (key: string) => {
    if(key === "Enter"){
      let subPair = "";
      if(cursor < 0){
        subPair = pairInput;
      }else{
        subPair = filteredAssetPairs[cursor];
      }
      subscribeToPair(JSON.stringify([subPair]), currencyList, setCurrencyList); 
      setPairInput("");
      setCursor(-1);
      let pairList = document.getElementById("pairList");
      if(pairList){
        pairList.scrollTop = 0;
      }
      setFilteredAssetPairs(assetPairs);
    }else{
      if(scrollHere.current){
        scrollHere.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if(key === "ArrowUp" && cursor >= 0){
        setCursor(cursor-1);
      }else if(key === "ArrowDown" && cursor < filteredAssetPairs.length -1){
        setCursor(cursor+1);
      }
    }
  }

  const[filteredAssetPairs, setFilteredAssetPairs] = useState(assetPairs);

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
        {currencyList.length === 0 ? <h3><b>Add Crypto Trading Pair </b>(i.e. ETH/EUR)</h3> : null}
        <div className="PairForm">
          <div className="AddPair" 
            onClick={() => document.getElementById('PairInput')?.focus()}>
              <input id="PairInput" 
                className="PairInput" 
                onFocus={() => setFocusOnInp(true)} 
                onBlur={() => setFocusOnInp(false)} 
                value={pairInput} 
                onChange={e => {
                  setPairInput(e.target.value.toUpperCase());
                  setCursor(-1);
                  let pairList = document.getElementById("pairList");
                  if(pairList){
                    pairList.scrollTop = 0;
                  }
                  setFilteredAssetPairs(assetPairs.filter((pair) => pair.match("^"+e.target.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));
                }}
                onKeyDown={e => handleKeyDown(e.key)}
                placeholder={"Add pair..."} 
                autoFocus
                autoComplete="off"/>
              <button 
                title="Add" 
                className="AddButton" 
                onClick={() => {subscribeToPair(JSON.stringify([pairInput]), currencyList, setCurrencyList); setPairInput("");}}/>
          </div>
          {focusOnInp ? <div className="PairList" id="pairList">
              {filteredAssetPairs.map((pair, i) => 
                <button className={cursor === i ? "assButtActive" :"assButt"} 
                  ref={cursor === i ? scrollHere : cursor === 0 ? topEl : null}
                  key={i} 
                  onMouseDown={() => {
                    subscribeToPair(JSON.stringify([pair]), currencyList, setCurrencyList);
                    setPairInput("");
                }}>{pair}</button>)
              }
          </div> : null}
        </div>
    </div>
    <div className="Storage">
      <button className="StorageButton" onClick={() => clearCurrencyList(currencyList, setCurrencyList)} title="Clear">Clear</button>
      <button className="StorageButton" onClick={() => saveToLocalStorage(currencyList)} title="Save in Browser">Save</button>
      <button className="StorageButton" 
        onClick={() => subscribeFromLocalStorage(currencyList, setCurrencyList)} 
        title="Retrieve last Config">Load</button>
    </div>
  </div>;

  return(
    connectionEst ? page : loading);
}

const subscribeToPair = (pair: string, currencyList: Currency[], setCurrencyList: (currencyList: Currency[]) => void) => {

  let jsonPair = {};

  try{
    jsonPair = JSON.parse(pair);
  }catch(err){
    localStorage.setItem("list", "[]");
    return;
  }

  let sub = {
    "event": "subscribe",
    "pair": jsonPair,
    "subscription": {
      "name": "ticker"
    }
  };

  socket.send(JSON.stringify(sub));
}

const saveToLocalStorage = (currencyList: Currency[]) => {
    localStorage.setItem("list", JSON.stringify(currencyList.map(entry => entry.pair)));
}

const subscribeFromLocalStorage = (currencyList: Currency[], setCurrencyList: (currencyList: Currency[]) => void) => {
  clearCurrencyList(currencyList, setCurrencyList);
  subscribeToPair(localStorage.list, currencyList, setCurrencyList);
}

const clearCurrencyList =  (currencyList: Currency[], setCurrencyList: (currencyList: Currency[]) => void) => {
  unsubscribe(JSON.stringify(currencyList.map(entry => entry.pair)));
  setCurrencyList([]);
}

const unsubscribe = (pair: string) => {
  let jsonPair = JSON.parse(pair);

  let unSub = {
    "event": "unsubscribe",
    "pair": jsonPair,
    "subscription": {
      "name": "ticker"
    }
  };

  socket.send(JSON.stringify(unSub));
}

export default App;