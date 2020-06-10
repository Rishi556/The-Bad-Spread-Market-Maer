let axios = require("axios")
let config = require("../config.json")

let rpcAPI = "https://api.hive-engine.com/rpc/contracts"
let symbol = config.symbol

let metricsQuery = {id: 0,jsonrpc: "2.0",method: "findOne", params: {contract: "market", table: "metrics", query: {symbol : symbol}, limit: 1000, offset: 0, indexes: []}}

function getAskAndBid(callback){
  axios.post(rpcAPI, metricsQuery).then((resMetrics) => {
    let data = resMetrics.data.result
    let lowestAsk = parseFloat(data.lowestAsk)
    let highestBid = parseFloat(data.highestBid)
    callback({lowestAsk : lowestAsk, highestBid : highestBid})
  })
}

module.exports = {
  getAskAndBid
}