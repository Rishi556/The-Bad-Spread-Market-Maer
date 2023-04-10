const hive = require("@hiveio/hive-js");
const config = require("../config.json");
const placeOrders = require("./place_orders.js");
const axios = require("axios");

const rpcAPI = "https://engine.deathwing.me/contracts";

async function cancelOrders() {
  // Retrieve buy and sell orders
  const buyOrders = await getOrders("buyBook");
  const sellOrders = await getOrders("sellBook");

  // Create an array to hold all cancel order actions
  let cancelOrderActions = [];

  // Add buy orders to cancel order actions array
  for (const order of buyOrders) {
    cancelOrderActions.push({
      contractName: "market",
      contractAction: "cancel",
      contractPayload: { type: "buy", id: order },
    });
  }

  // Add sell orders to cancel order actions array
  for (const order of sellOrders) {
    cancelOrderActions.push({
      contractName: "market",
      contractAction: "cancel",
      contractPayload: { type: "sell", id: order },
    });
  }

  // Cancel all orders in a single transaction
  if (cancelOrderActions.length > 0) {
    await cancelOrder(cancelOrderActions);
  }

  // Log the number of canceled buy and sell orders
  console.log(
    `Successfully canceled ${buyOrders.length} buy orders and ${sellOrders.length} sell orders.`
  );

  // Place new orders after canceling previous ones
  placeOrders.placeOrders();
}




async function getOrders(orderType) {
  const query = {
    id: 0,
    jsonrpc: "2.0",
    method: "find",
    params: {
      contract: "market",
      table: orderType,
      query: { account: config.username, symbol: config.symbol },
      limit: 1000,
      offset: 0,
      indexes: [{ index: "_id", descending: true }],
    },
  };

  const res = await axios.post(rpcAPI, query);
  return res.data.result.map((order) => order.txId);
}

function batchOrders(orders, type) {
  const batchSize = 10;
  const batchedOrders = [];

  for (let i = 0; i < orders.length; i += batchSize) {
    const batch = orders.slice(i, i + batchSize).map((orderId) => ({
      contractName: "market",
      contractAction: "cancel",
      contractPayload: { type, id: orderId },
    }));

    batchedOrders.push(batch);
  }

  return batchedOrders;
}

async function cancelOrder(cancelJson) {
  return new Promise((resolve, reject) => {
    hive.broadcast.customJson(
      config.privateActiveKey,
      [config.username],
      null,
      "ssc-mainnet-hive",
      JSON.stringify(cancelJson),
      (err) => {
        if (err) {
          console.log("Error canceling orders");
          reject(err);
        } else {
          console.log("Successfully canceled orders");
          resolve();
        }
      }
    );
  });
}

module.exports = {
  cancelOrders,
};
