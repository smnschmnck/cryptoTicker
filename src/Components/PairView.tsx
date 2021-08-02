import React from "react";

interface Currency{
    pair: string;
    price: string;
}

interface PairViewProps extends Currency{
    currencyList: Currency[]; 
    setCurrencyList: (currencyList: Currency[]) => void;
    unsubscribe: (pair: string) => void;
}

export const PairView: React.FC<PairViewProps> = (props) => {
    let firstCur = props.pair.split("/")[0];
    let secondCur = props.pair.split("/")[1];
    return(
        <div className="PairView">
            <p className="InfoView"><b>{firstCur}</b>: {props.price + secondCur}</p>
            <button className="DelButton" title="Delete" onClick={() => {
                props.setCurrencyList(props.currencyList.filter(currency => currency.pair !== props.pair));
                props.unsubscribe(props.pair);
            }}/>
        </div>
    );
}