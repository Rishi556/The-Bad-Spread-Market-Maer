let hive = require("@hiveio/hive-js");
let config = require("../config.json");
let place_orders = require("./place_orders.js");
let axios = require("axios");

let rpcAPI = "https://api.hive-engine.com/rpc/contracts";

function cancelOrders(){
  let buyOrderQuery = {id: 0,jsonrpc: "2.0",method: "find",params: {contract: "market", table: "buyBook", query: {account : config.username, symbol : config.symbol}, limit: 1000, offset: 0, indexes: [{index: "_id", descending: true}]}};
  axios.post(rpcAPI, buyOrderQuery).then((resMetrics) => {
    let buy = [];
    for (i in resMetrics.data.result){
      buy.push(resMetrics.data.result[i].txId)
    }
    let sellOrderQuery = {id: 0,jsonrpc: "2.0",method: "find",params: {contract: "market", table: "sellBook", query: {account : config.username, symbol : config.symbol}, limit: 1000, offset: 0, indexes: [{index: "_id", descending: true}]}};
    axios.post(rpcAPI, sellOrderQuery).then((resMetrics) => {
      let sell = [];
      for (i in resMetrics.data.result){
        sell.push(resMetrics.data.result[i].txId)
      }
      let c = 0;
      let toCancelBuy = []
      for (i in buy){
        toCancelBuy.push({"contractName":"market","contractAction":"cancel","contractPayload":{"type":`buy`,"id":`${buy[i]}`}})
        if (toCancelBuy.length === 10){
          cancelOrder(toCancelBuy, c);
          c++
        }
      }
      cancelOrder(toCancelBuy, c);
      c++
      let toCancelSell = []
      for (i in sell){
        toCancelSell.push({"contractName":"market","contractAction":"cancel","contractPayload":{"type":`sell`,"id":`${sell[i]}`}})
        if (toCancelSell.length === 10){
          cancelOrder(toCancelSell, c);
          c++
        }
      }
      cancelOrder(toCancelSell, c);
      c++
      setTimeout(() => {
        place_orders.placeOrders()
      }, 4000 * c)
      
    })
  })
}

function cancelOrder(cancelJson, c){
  setTimeout(() => {
    hive.broadcast.customJson(config.privateActiveKey, [config.username], null, "ssc-mainnet-hive", JSON.stringify(cancelJson), (err) => {
      if (err){
        console.log(`Error canceling orders`)
      } else {
        console.log(`Successfully canceled orders `)
      }
    })
  }, c * 4000)
}

module.exports = {
  cancelOrders
};