let hive = require("@hiveio/hive-js")
let config = require("../config.json")
let place_orders = require("./place_orders.js")
let axios = require("axios")

let rpcAPI = "https://api.hive-engine.com/rpc/contracts"

function cancelOrders(){
  let buyOrderQuery = {id: 0,jsonrpc: "2.0",method: "find",params: {contract: "market", table: "buyBook", query: {account : config.username, symbol : config.symbol}, limit: 1000, offset: 0, indexes: [{index: "_id", descending: true}]}}
  axios.post(rpcAPI, buyOrderQuery).then((resMetrics) => {
    let buy = []
    for (i in resMetrics.data.result){
      buy.push(resMetrics.data.result[i].txId)
    }
    let sellOrderQuery = {id: 0,jsonrpc: "2.0",method: "find",params: {contract: "market", table: "sellBook", query: {account : config.username, symbol : config.symbol}, limit: 1000, offset: 0, indexes: [{index: "_id", descending: true}]}}
    axios.post(rpcAPI, sellOrderQuery).then((resMetrics) => {
      let sell = []
      for (i in resMetrics.data.result){
        sell.push(resMetrics.data.result[i].txId)
      }
      let c = 1
      let max = buy.length + sell.length
      for (i in buy){
        cancelOrder("buy", buy[i], c, max)
        c++
      }
      for (i in sell){
        cancelOrder("sell", sell[i], c, max)
        c++
      }
      if (max == 0){
        place_orders.placeOrders()
      }
    })
  })
}

function cancelOrder(type, id, count, max){
  setTimeout(() => {
    let cancelJson = {"contractName":"market","contractAction":"cancel","contractPayload":{"type":`${type}`,"id":`${id}`}}
    console.log(`Attempting to cancel ${type} order with id ${id}.`)
    hive.broadcast.customJson(config.privateActiveKey, [config.username], null, "ssc-mainnet-hive", JSON.stringify(cancelJson), (err, result) => {
      if (err){
        console.log(`Error canceling order with id ${id}.`)
      } else {
        console.log(`Successfully canceled order with id ${id}.`)
      }
      if (count == max){
        setTimeout(() => {
          place_orders.placeOrders()
        }, 10 * 1000)
      }
    })
  }, count * 4000)
}

module.exports = {
  cancelOrders
}