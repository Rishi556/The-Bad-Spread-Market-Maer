let cancel_current_orders = require('./src/cancel_current_orders.js')
let config = require("./config.json")

cancel_current_orders.cancelOrders()
setInterval(() => {
  cancel_current_orders.cancelOrders()
}, 1000 * 60 * config.updateMinutes)