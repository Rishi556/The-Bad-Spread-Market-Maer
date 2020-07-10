let config = require("../config.json");
let hive = require("@hiveio/hive-js");
let hiveEngine = require("./get_data.js");
let axios = require("axios");

let symbol = config.symbol;
let buyOrderQuantity = config.buyOrdersQuantity;
let sellOrderQuantity = config.sellOrdersQuantity;
let maxBuyOrders = config.maxBuyOrders;
let maxSellOrders = config.maxSellOrders;

let rpcAPI = "https://api.hive-engine.com/rpc/contracts";

function placeOrders(){
  hiveEngine.getBalances((balances) => {
    hiveEngine.getAskAndBid((prices) => {
      let avg = (prices.highestBid + prices.lowestAsk) / 2;
      let bidChanges = ((avg - prices.highestBid) / maxBuyOrders).toFixed(8);
      let askChanges = ((prices.lowestAsk - avg) / maxSellOrders).toFixed(8);
      let c = 1;
      let buyIncrease = 1;
      let sellIncrease = 1;
      for (let i = 0; i < maxBuyOrders; i++){
        if (balances.hive > (buyOrderQuantity * (prices.highestBid + (askChanges * buyIncrease)))) {
          placeOrder("buy", buyOrderQuantity, prices.highestBid + (askChanges * buyIncrease), c);
          buyIncrease++;
          c++;
          balances.hive -= (buyOrderQuantity * (prices.highestBid + (askChanges * buyIncrease)));
        } else if (balances.hive > 0) {
            let newBuyOrderQuantity = Math.floor((balances.hive / (prices.highestBid + (askChanges * buyIncrease))) * 1000) / 1000;
            placeOrder("buy", newBuyOrderQuantity, prices.highestBid + (askChanges * buyIncrease), c);
            buyIncrease++;
            c++;
            balances.hive -= (buyOrderQuantity * (prices.highestBid + (askChanges * buyIncrease)));
        }
      }
      for (let i = 0; i < maxSellOrders; i++){
        if (balances.counter > sellOrderQuantity) {
          placeOrder("sell", sellOrderQuantity, prices.lowestAsk - (bidChanges * sellIncrease), c);
          sellIncrease++;
          c++;
          balances.counter -= sellOrderQuantity;
        } else if(balances.counter > 0) {
          placeOrder("sell", balances.counter, prices.lowestAsk - (bidChanges * sellIncrease), c);
          sellIncrease++;
          c++;
          balances.counter = 0;
        }
      }

    });
  });
}

function placeOrder(type, amount, price, count){
  setTimeout(() => {
    let queryBalance;
    let requiredAmount;
    let token;
    if (type === "buy"){
      queryBalance = {id: 0,jsonrpc: "2.0",method: "findOne", params : {contract: "tokens", table: "balances", query: {symbol : "SWAP.HIVE", account : config.username}, limit: 1, offset: 0, indexes : []}};
      requiredAmount = amount * price;
      token = "SWAP.HIVE"
    } else {
      queryBalance = {id: 0,jsonrpc: "2.0",method: "findOne", params : {contract: "tokens", table: "balances", query: {symbol : symbol, account : config.username}, limit: 1, offset: 0, indexes : []}};
      requiredAmount = amount;
      token = symbol
    }
    console.log(`Attempting to place ${type} order. Required amount is ${requiredAmount.toFixed(3)} ${token}.`);
    axios.post(rpcAPI, queryBalance).then((res) => {
      let balance = parseFloat(res.data.result.balance);
      if (balance > requiredAmount){
        let orderJSON = {"contractName":"market","contractAction": `${type}`,"contractPayload":{"symbol": `${symbol}` ,"quantity": `${amount}`, "price": `${price.toFixed(8)}`}};
        hive.broadcast.customJson(config.privateActiveKey, [config.username], null, "ssc-mainnet-hive", JSON.stringify(orderJSON), (err) => {
          if (err){
            console.log(`Error placing order.`)
          } else {
            console.log(`Successfully placed order.`)
          }
        })
      } else {
        console.log(`Not enough of a balance to place the order. You needed ${requiredAmount.toFixed(3)} ${token} but only had ${balance}.`)
      }
    })
  }, count * 4000)
}

module.exports = {
  placeOrders
};