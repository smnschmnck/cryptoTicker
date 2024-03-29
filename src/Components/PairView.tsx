import dayjs from 'dayjs';
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

export const PairView: React.FC<PairViewProps> = ({pair, price, currencyList, setCurrencyList, unsubscribe}) => {
  let firstCur = pair.split("/")[0];
  let secondCur = pair.split("/")[1];
  const [showChart, setShowChart] = useState(false);
  const [chart, setChart] = useState(<></>);
  return(
      <div className="PairView">
          <div className="PairContainer">
              <button className="GraphButton" onClick={async() => {setChart(await drawChart(pair, "1D")); setShowChart(!showChart)}}/>
              <p className="InfoView"><b>{firstCur}</b>: {price + secondCur}</p>
              <button className="DelButton" title="Delete" onClick={() => {
                  setCurrencyList(currencyList.filter(currency => currency.pair !== pair));
                  unsubscribe(JSON.stringify([pair]));
              }}/>
          </div>
          {showChart ? <div>{chart}<ChartButtons setChart={setChart} pair={pair}/></div> : null}
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
        let date = dayjs(await currentTime)
        let dateString = "";
        if(interval === 'hourly'){
          dateString = date.format("HH:mm");
        }else{
          dateString = date.format("DD.MM.YYYY");
        }
        time.push(dateString);
        price.push(await entry[1]);
      }
    }else{
      for(let i = await arr.length-15; i< await arr.length; i++){
        let entry = await arr[i];
        let currentTime = await entry[0];
        let date = dayjs(await currentTime);
        let dateString = "";
        dateString = date.format("HH:mm");
        time.push(dateString);
        price.push(await entry[1]);
      }
    }

    return {time: time, price: price};
}

interface ChartButtonsProps{
  pair: string;
  setChart: (chart: JSX.Element) => void;
}

const ChartButtons:React.FC<ChartButtonsProps> = ({pair, setChart}) => {
  let buttonArray = [
    {className: "GraphModeButton", mode: "1H"},
    {className: "GraphModeButtonSelected", mode: "1D"},
    {className: "GraphModeButton", mode: "1W"},
    {className: "GraphModeButton", mode: "1M"},
    {className: "GraphModeButton", mode: "1Y"},
    {className: "GraphModeButton", mode: "ALL"},
  ];
  const[buttonList, setButtonList] = useState(buttonArray);

  interface ChartButtonProps{
    className: string;
    mode: string;
  }

  const ChartButton: React.FC<ChartButtonProps> = ({className, mode}) => {
    const unBold = () => {
      let bListCopy = [...buttonList];
      bListCopy.forEach(button => {
        button.className = "GraphModeButton";
      });
      setButtonList(bListCopy);
    }

    const makeBold = () => {
      let bListCopy = [...buttonList];
      bListCopy.forEach(button => {
        if(button.mode === mode){
          button.className = "GraphModeButtonSelected";
        }
      });
      setButtonList(bListCopy);
    }

    return(
      <button className={className} onClick={async() => {
        unBold();
        makeBold();
        setChart(await drawChart(pair, mode));
      }}>{mode}</button>
      );
  }

  return(
    <div className="Buttons">
      {buttonList.map(button => <ChartButton className={button.className} mode={button.mode}/>)}
    </div>
  );
}