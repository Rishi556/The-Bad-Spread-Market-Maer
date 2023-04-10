const config = require("../config.json");
const hive = require("@hiveio/hive-js");
const hiveEngine = require("./get_data.js");

const { symbol, buyOrdersQuantity, sellOrdersQuantity, maxBuyOrders, maxSellOrders, orderSpread, maxTokenforSymbol } = config;

function placeOrders() {
  hiveEngine.getBalances((balances) => {
    hiveEngine.getAskAndBid((prices) => {
      const avg = (prices.highestBid + prices.lowestAsk) / 2;
      const spreadPercent = orderSpread / 100;
      const spreadAmount = avg * spreadPercent;
      const bidChanges = ((avg - spreadAmount - prices.highestBid) / maxBuyOrders).toFixed(8);
      const askChanges = ((prices.lowestAsk - spreadAmount - avg) / maxSellOrders).toFixed(8);

      let buyIncrease = 1;
      let sellIncrease = 1;
      let orders = [];

      const {
        avgBuyPrice,
        buyOrderCount,
        totalBuyHive,
        totalBuyPart,
      } = placeBuyOrders(prices, bidChanges, askChanges, balances, orders, buyIncrease);
      const {
        avgSellPrice,
        sellOrderCount,
        totalSellPart,
        totalSellHive,
      } = placeSellOrders(prices, bidChanges, askChanges, balances, orders, sellIncrease);
    
      console.log(
        `Placing ${buyOrderCount} buy orders. Total SWAP.HIVE spent: ${totalBuyHive.toFixed(3)}. Estimated gain in ${symbol}: ${totalBuyPart.toFixed(3)}. Average buy order price: ${avgBuyPrice.toFixed(8)} ${symbol} per SWAP.HIVE`
      );
      console.log(
        `Placing ${sellOrderCount} sell orders. Total ${symbol} spent: ${totalSellPart.toFixed(3)}. Estimated gain in SWAP.HIVE: ${totalSellHive.toFixed(3)}. Average sell order price: ${avgSellPrice.toFixed(8)} ${symbol} per SWAP.HIVE`
      );
    
      submitBatchOrders(orders);
    });
  });
}

function placeBuyOrders(prices, bidChanges, askChanges, balances, orders, buyIncrease) {
  if (balances.counter >= maxTokenforSymbol) {
    console.log(`Not placing buy orders. ${symbol} balance is ${balances.counter} which is greater than the maximum of ${maxTokenforSymbol} ${symbol}`)
    return {
      avgBuyPrice: 0,
      buyOrderCount: 0,
      totalBuyHive: 0,
      totalBuyPart: 0,
  }
  }
  let totalBuyPrice = 0;
  let buyOrderCount = 0;
  let totalBuyHive = 0;
  let totalBuyPart = 0;

  for (let i = 0; i < maxBuyOrders; i++) {
    const requiredHive = buyOrdersQuantity * (prices.highestBid + (askChanges * buyIncrease));

    if (balances.hive > requiredHive) {
      const buyPrice = prices.highestBid + (askChanges * buyIncrease);
      placeOrder("buy", buyOrdersQuantity, buyPrice, orders);
      totalBuyPrice += buyPrice;
      buyOrderCount++;
      totalBuyHive += requiredHive;
      totalBuyPart += buyOrdersQuantity;
      buyIncrease++;
      balances.hive -= requiredHive;
    } else if (balances.hive > 0) {
      const newBuyOrderQuantity = Math.floor((balances.hive / requiredHive) * 1000) / 1000;
      const buyPrice = prices.highestBid + (askChanges * buyIncrease);
      placeOrder("buy", newBuyOrderQuantity, buyPrice, orders);
      totalBuyPrice += buyPrice;
      buyOrderCount++;
      totalBuyHive += balances.hive;
      totalBuyPart += newBuyOrderQuantity;
      buyIncrease++;
      balances.hive -= requiredHive;
    }
  }

  return {
    avgBuyPrice: totalBuyPrice / buyOrderCount,
    buyOrderCount,
    totalBuyHive,
    totalBuyPart,
  };
}

function placeSellOrders(prices, bidChanges, askChanges, balances, orders, sellIncrease) {
  let totalSellPrice = 0;
  let sellOrderCount = 0;
  let totalSellPart = 0;
  let totalSellHive = 0;

  for (let i = 0; i < maxSellOrders; i++) {
    if (balances.counter > sellOrdersQuantity) {
      const sellPrice = prices.lowestAsk - (bidChanges * sellIncrease);
      placeOrder("sell", sellOrdersQuantity, sellPrice, orders);
      totalSellPrice += sellPrice;
      sellOrderCount++;
      totalSellPart += sellOrdersQuantity;
      totalSellHive += sellOrdersQuantity * sellPrice;
      sellIncrease++;
      balances.counter -= sellOrdersQuantity;
    } else if (balances.counter > 0) {
      const sellPrice = prices.lowestAsk - (bidChanges * sellIncrease);
      placeOrder("sell", balances.counter, sellPrice, orders);
      totalSellPrice += sellPrice;
      sellOrderCount++;
      totalSellPart += balances.counter;
      totalSellHive += balances.counter * sellPrice;
      sellIncrease++;
      balances.counter = 0;
    }
  }

  return {
    avgSellPrice: totalSellPrice / sellOrderCount,
    sellOrderCount,
    totalSellPart,
    totalSellHive,
  };
}


function placeOrder(type, amount, price, orders) {
  const token = type === "buy" ? "SWAP.HIVE" : symbol;

  const orderJSON = {
    contractName: "market",
    contractAction: type,
    contractPayload: { symbol, quantity: `${amount.toFixed(8)}`, price: `${price.toFixed(8)}` },
  };

  orders.push(orderJSON);
}

function submitBatchOrders(orders) {
  hive.broadcast.customJson(
    config.privateActiveKey,
    [config.username],
    null,
    "ssc-mainnet-hive",
    JSON.stringify(orders),
    (err) => {
      if (err) {
        console.log("Error placing orders.");
        console.log(err)
      } else {
        console.log("Successfully placed orders.");
      }
    }
  );
}

module.exports = {
  placeOrders,
};
