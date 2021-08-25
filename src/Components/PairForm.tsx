import { useState, useRef } from "react";
import { assetPairs } from '../Assets/AssetPairs';

interface Currency{
    pair: string;
    price: string;
}

interface PairFormProps{
    currencyList: Currency[];
    setCurrencyList: (currencyList: Currency[]) => void;
    subscribeToPair: (pair: string, currencyList: Currency[], setCurrencyList: (currencyList: Currency[]) => void) => void;
}

export const PairForm: React.FC<PairFormProps> = ({subscribeToPair, currencyList, setCurrencyList}) => {
    const[cursor, setCursor] = useState(-1);
    const scrollHere = useRef<null | HTMLButtonElement>(null)
    const[focusOnInp, setFocusOnInp] = useState(false);
    const[filteredAssetPairs, setFilteredAssetPairs] = useState(assetPairs);
    const[pairInput, setPairInput] = useState("");

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

    const resetPairInput = () => {
      setPairInput("");
      setFilteredAssetPairs(assetPairs);
      setCursor(-1);
      scrollToTop();
    }

    const handleKeyDown = (key: string) => {
        if(key === "Enter"){
          let subPair = "";
          if(cursor < 0){
            subPair = pairInput;
          }else{
            subPair = filteredAssetPairs[cursor];
          }
          subscribeToPair(JSON.stringify([subPair]), currencyList, setCurrencyList); 
          resetPairInput();
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

    return (<div className="PairForm">
    <div className="AddPair" 
      onClick={() => document.getElementById('PairInput')?.focus()}>
        <input id="PairInput" 
          className="PairInput" 
          onFocus={() => setFocusOnInp(true)} 
          onBlur={() => {
            setCursor(-1);
            scrollToTop();
            setFocusOnInp(false);
          }} 
          value={pairInput} 
          onChange={e => {
            setPairInput(e.target.value.toUpperCase());
            setCursor(-1);
            scrollToTop();
            setFilteredAssetPairs(assetPairs.filter((pair) => pair.match("^"+e.target.value.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));
          }}
          onKeyDown={e => handleKeyDown(e.key)}
          placeholder={"Add pair..."} 
          autoFocus
          autoComplete="off"/>
        <button 
          title="Add" 
          className="AddButton" 
          onClick={() => {
            subscribeToPair(JSON.stringify([pairInput]), currencyList, setCurrencyList); 
            resetPairInput();
          }
        }/>
    </div>
    {focusOnInp ? <div className="PairList" id="pairList">
        {filteredAssetPairs.map((pair, i) => 
          <button className={cursor === i ? "assButtActive" :"assButt"} 
            ref={cursor === i ? scrollHere : null}
            key={i} 
            onMouseDown={() => {
              subscribeToPair(JSON.stringify([pair]), currencyList, setCurrencyList);
              resetPairInput();
          }}>{pair}</button>)
        }
    </div> : null}
  </div>);
}

const scrollToTop = () => {
  let pairList = document.getElementById("pairList");
  if(pairList){
    pairList.scrollTop = 0;
  }
}