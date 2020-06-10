# The-Bad-Spread-Market-Maer
 A bad hive-engine market maker.

How to setup:

Get A VPS, I recommend Privex Webbox because it has most things you need preinstalled. You can use either [Micro](https://pay.privex.io/order/package/webbox-se-micro?r=rishi556) or what I recommend, the [$5 one](https://pay.privex.io/order/package/webbox-se-v1?r=rishi556). If you chose to get one from elsewhere(probably more expensive) you can google how to install nodejs and npm onto your VPS.

Clone git by typing in `git clone https://github.com/Rishi556/The-Bad-Spread-Market-Maer.git`

Navigate to the created directory `cd The-Bad-Spread-Market-Maer` (Your file system might have it called something else, find out by typing in `ls` and when you find the folder, you can type in `cd FILENAMEHERE`)

Rename config.example.json to config.json `mv config.example.json config.json`

Modify config your liking in a editor. I recommend nano `nano config.json`
- your username within the "" it should be all lowercase
- your active key within the "" case sensative
- the symbol you want to have the bot to be trading within the "" all uppercase(you shouldn't have manual orders on this since it'll cancel it all)
- the maximum number of buy orders you'll want to have up at once
- the maximum number of sell orders you'll want to have up at once
- how much of the token you want to buy per order
- how much of the token you want to sell per order
- how often you want to refresh all orders

Save (Control X, then Y on nano)

Install pm2 with npm `npm i -g pm2`

Start the bot up `pm2 start app.js --name marketmaker`

If you want to monitor the bot, you can do so with `pm2 monit`

If you want to stop the bot, you can do so with `pm2 stop marketmaker`
