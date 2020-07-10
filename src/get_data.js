let axios = require("axios");
let config = require("../config.json");

let rpcAPI = "https://api.hive-engine.com/rpc/contracts";
let symbol = config.symbol;
let account = config.username;

let metricsQuery = {id: 0,jsonrpc: "2.0",method: "findOne", params: {contract: "market", table: "metrics", query: {symbol : symbol}, limit: 1000, offset: 0, indexes: []}};

function getAskAndBid(callback){
  axios.post(rpcAPI, metricsQuery).then((resMetrics) => {
    let data = resMetrics.data.result;
    let lowestAsk = parseFloat(data.lowestAsk);
    let highestBid = parseFloat(data.highestBid);
    callback({lowestAsk : lowestAsk, highestBid : highestBid})
  })
}

let getBalancesQuery = {id: 0,jsonrpc: "2.0",method: "find", params: {contract: "tokens", table: "balances", query: {account: account}, limit: 1000, offset: 0, indexes: []}};

function getBalances(callback){
  axios.post(rpcAPI, getBalancesQuery).then((resMetrics) => {
    let data = resMetrics.data.result;
    let swapHiveBalance = 0.0;
    let counterCurrencyBalance = 0.0;
    for (let i = 0; i < data.length; i++) {
      let currency_data = data[i];
      if (currency_data.symbol === symbol) {
        counterCurrencyBalance = parseFloat(currency_data.balance);
      } else if (currency_data.symbol === "SWAP.HIVE") {
        swapHiveBalance = parseFloat(currency_data.balance);
      }
    }

    callback({hive: swapHiveBalance, counter: counterCurrencyBalance});
  });
}

module.exports = {
  getAskAndBid,
  getBalances
};