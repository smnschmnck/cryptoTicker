import React, { useState } from 'react';
import { Line, defaults } from 'react-chartjs-2';
import { list } from './List';

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
  const [showChart, setShowChart] = useState(false);
  const [chart, setChart] = useState(<></>);
  return(
      <div className="PairView">
          <div className="PairContainer">
              <button className="GraphButton" onClick={async() => {setChart(await drawChart(props.pair, "1D")); setShowChart(!showChart)}}/>
              <p className="InfoView"><b>{firstCur}</b>: {props.price + secondCur}</p>
              <button className="DelButton" title="Delete" onClick={() => {
                  props.setCurrencyList(props.currencyList.filter(currency => currency.pair !== props.pair));
                  props.unsubscribe(props.pair);
              }}/>
          </div>
          {showChart ? <div>{chart}<ChartButtons setChart={setChart} pair={props.pair}/></div> : null}
      </div>
  );
}

const ChartButtons = (props: any) => {
  return(
    <div className="Buttons">
      <button className="GraphModeButton" onClick={async() => {props.setChart(await drawChart(props.pair, "1H"))}}>1H</button>
      <button className="GraphModeButton" onClick={async() => {props.setChart(await drawChart(props.pair, "1D"))}}>1D</button>
      <button className="GraphModeButton" onClick={async() => {props.setChart(await drawChart(props.pair, "1M"))}}>1M</button>
      <button className="GraphModeButton" onClick={async() => {props.setChart(await drawChart(props.pair, "1Y"))}}>1Y</button>
      <button className="GraphModeButton" onClick={async() => {props.setChart(await drawChart(props.pair, "ALL"))}}>ALL</button>
    </div>
  );
}

const drawChart = async(pair: string, mode: string) => {
    let time = (await getChartData(pair, mode)).time;
    let price = (await getChartData(pair, mode)).price;

    if(time[0] === "Error" || price[0] === "Error"){
      return(<p><b className="Err">Failed to fetch Graph Data</b></p>);
    }

    let crypto = pair.split("/")[0];
    let fiat = pair.split("/")[1];

    let dat = {labels: time,
      datasets: [{
        label: `${crypto}/${fiat}`,
        borderColor: "white",
        data: price,
        fill: true,
        pointRadius: 2.5
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

    let chart = <Line data={dat} options={opt}/>;
    return chart;
}

const getCur = (pair: string) => {
    let cryptoCur = pair.split("/")[0].toLowerCase();
    for(const entry of list){
      if(entry.symbol === cryptoCur && (! entry.id.includes("binance"))){
        return entry.id;
      }
    }
    return "Error";
}

const getChartData = async(pair: string, mode: string) => {
    let crypto = getCur(pair);
    if(crypto === "Error"){
      return {time: ["Error"], price: ["Error"]};
    }
    let fiat = pair.split("/")[1].toLowerCase();
    let days = "0";
    let interval = "";
  
    switch (mode) {
      case "ALL":
        days="max";
        interval="monthly";
        break;
      case "1Y":
        days="365";
        interval="weekly";
        break;
      case "1M":
        days = "30";
        interval="daily";
        break;
      case "1W":
        days = "7";
        interval="daily";
        break;
      case "1D":
        days = "1";
        interval="hourly";
        break;
      case "1H":
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
    if(mode !== '1H'){
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