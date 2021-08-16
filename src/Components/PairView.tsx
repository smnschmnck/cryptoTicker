import React, { useState } from "react";
import { Line, defaults } from 'react-chartjs-2';

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
    const[chart, setChart] = useState(<></>);
    const [showChart, setShowChart] = useState(false);
    return(
        <div className="PairView">
            <div className="PairContainer">
                <button className="GraphButton" onClick={async() => drawChart(setChart, props.pair, "day", showChart, setShowChart)}></button>
                <p className="InfoView"><b>{firstCur}</b>: {props.price + secondCur}</p>
                <button className="DelButton" title="Delete" onClick={() => {
                    props.setCurrencyList(props.currencyList.filter(currency => currency.pair !== props.pair));
                    props.unsubscribe(props.pair);
                }}/>
            </div>
            {showChart ? chart : null}
        </div>
    );
}

const drawChart = async(setChart: (el: JSX.Element) => void, pair: string, mode: string, showChart: boolean, setShowChart: (showChart: boolean) => void) => {

    setShowChart(!showChart);

    if(showChart) return;

    let time = (await getChartData(pair, mode)).time;
    let price = (await getChartData(pair, mode)).price;

    if(time[0] === "Error" || price[0] === "Error"){
      setChart(<p><b className="Err">Failed to fetch Graph Data</b></p>);
      return;
    }

    let crypto = pair.split("/")[0];
    let fiat = pair.split("/")[1];

    let dat = {labels: time,
      datasets: [{
        label: `${crypto}/${fiat}`,
        borderColor: "white",
        data: price,
        fill: true,
        pointRadius: 0
      }],
    };

    let opt = {
      legend: {
        labels: {
          fontColor: "#ffffff",
        }
      },
      tension: 0.5
    };

    defaults.color = "#ffffff";

    let chart = <div>
        <Line data={dat} options={opt}/>
        <div className="buttons">
            <button id="hour" onClick={async() => drawChart(setChart, pair, "hour", showChart, setShowChart)}>1H</button>
            <button id="day" onClick={async() => drawChart(setChart, pair, "day", showChart, setShowChart)}>1D</button>
            <button id="month" onClick={async() => drawChart(setChart, pair, "month", showChart, setShowChart)}>1M</button>
            <button id="year" onClick={async() => drawChart(setChart, pair, "year", showChart, setShowChart)}>1Y</button>
            <button id="all" onClick={async() => drawChart(setChart, pair, "all", showChart, setShowChart)}>All</button>
        </div>
      </div>;

    setChart(chart);
}

const getCur = async (pair: string) => {
    let cryptoCur = pair.split("/")[0].toLowerCase();

    try{
      let res = await fetch("https://api.coingecko.com/api/v3/coins/list");
      if(res.status >= 400 && res.status < 600){
          alert("Oh no! This currency seems to not exist!");
          return "Error";
      }
      let jsonList = await res.json();
      
      for(let x of jsonList){
          if((await x.symbol === cryptoCur) && (!JSON.stringify(await x.id).includes("binance"))){
              return x.id;
          }
      }
    }catch(err){
      console.error(`ERROR: ${err}`);
    }


    return "Error";
}

const getChartData = async(pair: string, mode: string) => {

    let crypto = await getCur(pair);
    if(crypto === "Error"){
      return {time: ["Error"], price: ["Error"]};
    }
    let fiat = pair.split("/")[1].toLowerCase();
    let days = "0";
    let interval = "";
  
    switch (mode) {
      case "all":
        days="max";
        interval="";
        break;
      case "year":
        days="365";
        interval="weekly";
        break;
      case "month":
        days = "30";
        interval="daily";
        break;
      case "week":
        days = "7";
        interval="daily";
        break;
      case "day":
        days = "1";
        interval="hourly";
        break;
      case "hour":
        days = "1";
        interval="minutely";
        break;
      default:
        break;
    }
    let reqUrl = `https://api.coingecko.com/api/v3/coins/${crypto}/market_chart?vs_currency=${fiat}&days=${days}&interval=${interval}`;

    let res = await fetch(reqUrl);
    if(res.status >= 400 && res.status < 600){
        alert("Oh no! This currency seems to not exist!");
        return {time: [""], price: []};
    }
    let json = await res.json();
    let arr = await json.prices;
    let time = [];
    let price = [];
    if(mode !== 'hour'){
      for(let entry of arr){
        let currentTime = await entry[0];
        let date = new Date(await currentTime);
        let dateString = `${date}`;
        if(interval === 'hourly'){
          dateString = dateString.substr(dateString.length - 48, 5);
        }else{
          dateString = date.toUTCString();
          dateString = dateString.substr(5,dateString.length-17);
        }
        time.push(dateString);
        price.push(await entry[1]);
      }
    }else{
      for(let i = await arr.length-15; i< await arr.length; i++){
        let entry = await arr[i];
        let currentTime = await entry[0];
        let date = new Date(await currentTime);
        let dateString = `${date}`;
        dateString = dateString.substr(dateString.length-48, 5);
        time.push(dateString);
        price.push(await entry[1]);
      }
    }

    return {time: time, price: price};
}