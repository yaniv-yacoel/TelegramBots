const { defaultValues, closeRow, hop, drop, hopEng } = require("./consts");

class Utils {
    constructor(signalsBot, binance, userValues, subscribers, uuid, db) {
        this.signalsBot = signalsBot;
        this.binanceAPI = binance;
        this.userValues = userValues;
        this.subscribers = subscribers;
        this.signalsStorage = {};
        this.uuid = uuid;
        this.db = db
    }
    getSignalType(type) {
        switch (type) {
          case 'long': 
           return 'Signal Type: Regular (Long) 🟢';
           break;
         case 'short': 
           return 'Signal Type: Regular (Short) 🔴';
           break;
         case 'break-long': 
           return 'Trade Type: Breakout (Long) ⬆️🟢';
           break;
         case 'break-short': 
           return 'Trade Type: Breakout (Short) ⬇️🔴';
           break;
        }
    };
    sendSignalToUser(signal, msg) {
      this.signalsBot.sendMessage(msg.chat.id, this.generateSignalText(signal).text, {
        reply_markup: {
            "inline_keyboard": [
              [
                {
                  text: "Edit",
                  callback_data: JSON.stringify({type: 'edit::sig', id: signal.uuid})
                },
                {
                  text: "Looks Great !",
                  callback_data: JSON.stringify({type: 'edit::ack', id: signal.uuid})
                }
              ]
            ]
          }
        }
      );
    }
    sendToSignalsBot(message) {
        this.subscribers.forEach(sub => this.signalsBot.sendMessage(sub, message));
    };
    sendToCustomGroup(message, channelID) {
      this.signalsBot.sendMessage(channelID, message);
    };
    generateSignalWithoutPrices(symbol, type, msg, customValues, publish = false) {
      let pair = this.fixPair(symbol);
      const p = pair.replace('/', '').toUpperCase();
      const ret = new Promise((resolve, reject) => {
        this.binanceAPI.futuresPrices().then((prices, err) => {
          const exactPrice = prices[p];
          if (!err && exactPrice) {
            let currentPrice = Math.round(exactPrice * (type === 'long' ? 1.001 : 0.999) * 1000000) / 1000000;
            if (currentPrice > 1000) {
              currentPrice = Math.round(currentPrice);
            }
            const vals = customValues ? customValues : this.getUserValues(msg ? msg.from.username : 'Crypto_Beast');
            const signal = this.generateSignal([pair, `${currentPrice}`, type, vals.take, vals.numTargets, vals.sl, vals.leverage], publish ? 'S7atory' : msg.from.username, publish);
            signal.uuid = this.uuid().substr(0, 10);
            this.signalsStorage[signal.uuid] = signal;
            if (msg) {
              this.sendSignalToUser(signal, msg);
            } else if (publish) {
              this.sendToSignalsBot(signal.text);
            }
            resolve(signal);
          } else if (msg) {
            this.signalsBot.sendMessage(msg.chat.id, `Wrong symbol pairs.\n Try again.`);
            reject();
          }
        });
      });
      return ret;
    }
    setUserValues(msg) {
        const user = msg.from.username;
        this.userValues[user] = this.userValues[user] ? this.userValues[user] : JSON.parse(JSON.stringify(defaultValues));
        this.signalsBot.sendMessage(msg.chat.id, `OK ${user}, lets set your signal generator settings.
Your current settings are:
Take: ${this.userValues[user].take}%
SL: ${this.userValues[user].sl}%
Number of targets: ${this.userValues[user].numTargets},
Leverage: ${this.userValues[user].leverage}.
What do you want to change?` ,{
          reply_markup: {
              "inline_keyboard": [
                [
                  {
                    text: "Stop Loss %",
                    callback_data: JSON.stringify({type: 'select::sl', msg: user})
                  },
                  {
                    text: "Take Profit %",
                    callback_data: JSON.stringify({type: 'select::tp', msg: user})
                  }
                ],
                [
                  {
                    text: "# of Targets",
                    callback_data: JSON.stringify({type: 'select::targets', msg: user})
                  },
                  {
                    text: "Leverage",
                    callback_data: JSON.stringify({type: 'select::leverage', msg: user})
                  }
                ],
                closeRow
              ]
            }
        });
    };
    generateSignal(params, username, publish) {
      let values = {
        token: params[0].toUpperCase(),
        leverage: params[6],
        plainType: params[2],
        entries: [],
        tps: [],
        sl: null,
        ts: new Date().getTime(),
        username: 'S7atory'
      };
      let sumEntries = 0;
      if (params[2].includes('break')) {
        values.entries.push(params[1])
        sumEntries = params[1] * 1;
      } else {
        values.entries = params[1].split(',');
        values.entries.forEach((param, idx) => {
            sumEntries += param * 1;
        });
      }
      if (params[2].includes('short')) {
        params[3] = -1 * params[3];
        params[5] = -1 * params[5];
      }
      const avgEntry = sumEntries / params[1].split(',').length; 
      const targetPrice = avgEntry * (100 + params[3] * 1) / 100;
      const profitStep = (targetPrice - avgEntry) / params[4]; 
      for (var i = 0; i < params[4] * 1; i++) {
        let val = Math.round((avgEntry + profitStep * (i + 1)) * 1000000) / 1000000;
        if (val > 1000) {
          val = Math.round(val);
        }
        values.tps.push(val);
      }
      let stop = avgEntry * (100 - params[5] * 1) / 100;
      stop  = Math.round(stop * 1000000) / 1000000;
      if (stop > 1000) {
        stop = Math.round(stop);
      }
      values.sl = stop;
      if (username) {
        values.username = publish ? 'S7atory' : username;
      }
      values.text = this.generateSignalText(values, publish).text;
      return values;
    }

    generateSignalText(values, publish = false) {
      let res = `🐗🐗 ${values.token} 🐗🐗\nExchange: Binance Futures\nLeverage: Cross (${values.leverage}X)\n${this.getSignalType(values.plainType)}\n\n`;
      const tpPercentages = [];
      if (values.plainType.includes('break')) {
        if (values.plainType.includes('long')) {
            res += `Entry above:\n 1) ${values.entries[0]}\n`;
        } else {
            res += `Entry below:\n 1) ${values.entries[0]}\n`;
        }
      } else {
        res += `Entry Targets:\n`;
        values.entries.forEach((param, idx) => {
          res += `${idx + 1}) ${param}\n`;
        });
      }
      if (values.tps.length) {
        res += '\nTake-Profit Targets:\n';
        values.tps.forEach((tp, idx) => {
          res += `${idx + 1}) ${tp}\n`;
          tpPercentages.push((Math.abs((tp / values.entries[0]) * 100 - 100) * values.leverage).toFixed(1));
        });
      }
      res += `\nStop Targets:\n1) ${values.sl}`;
      const risk = Math.abs((values.sl / values.entries[0]) * 100 - 100) * values.leverage;
      res += `\n\nRisk: ${risk.toFixed(1)}%, TPs: ${tpPercentages.join('%, ')}%`;
      res += `\n\nSignal By: @${values.username}`;
      console.log(`Generating signal: ${values.token} - ${values.plainType} by ${values.username}`)
      if (publish) {
        console.log(`Published for all registered accounts`)
      // } else {
      //   res += `כרגע איתותים אלו בבדיקה, יכול להיות שהם גם טובים, על אחריותכם`
      }
      return {text: res, risk};
  }
  fixPair(pair) {
        if (!pair.toUpperCase().endsWith('USDT')) {
          return pair + 'usdt';
        } else {
          return pair;
        }
    };
    getUserValues(username) {
        return this.userValues[username] ? this.userValues[username] : defaultValues;
    }

    generateSignalEditorKeyboard(signal) {
      const keyboard = [];

    }

    generateNumbersKeyboard(type, payload, ...nums) {
        const keyboard = [];
        for (let i=0; i * 4 < nums.length; i++) {
          const row = [];
          for (let j=0; j<4 && i * 4 + j < nums.length; j++) {
            row.push({
              text: `${nums[i*4 + j]}`,
              callback_data: JSON.stringify({type, msg: payload, value: nums[i*4 + j]})
            });
          }
          keyboard.push(row);
        }
        keyboard.push(closeRow);
        return keyboard;
      }
    hop(token, msg, bot = this.signalsBot) {
      let counter = 0;
      const hopper = token === 'TATA' ? hopEng : hop;
      const interval = setInterval(() => {
        bot.sendMessage(msg.chat.id, hopper[counter % 3].replace('${1}', token));
        if (counter === 8) {
          clearInterval(interval);
        }
        counter++;
      }, 2000);
    }
    drop(token, msg) {
      let counter = 0;
      const interval = setInterval(() => {
        this.signalsBot.sendMessage(msg.chat.id, drop[counter % 3].replace('${1}', token));
        if (counter === 8) {
          clearInterval(interval);
        }
        counter++;
      }, 2000);
    }
    updateSignalsStorage(id, signal) {
      signal.ts = new Date().getTime();
      this.signalsStorage[id] = signal;
    }
    cleanEditingSignals() {
      const idsToBeRemoved = [];
      const now = new Date().getTime();
      Object.keys(this.signalsStorage).forEach(id => {
        if (now - this.signalsStorage[id].ts > 60000) {
          idsToBeRemoved.push(id);
        }
      });
      idsToBeRemoved.forEach(id => {
        delete this.signalsStorage[id];
      })
    }
    getFromSignalsStorage(id, msg) {
      const signal = this.signalsStorage[id];
      if (signal === undefined) {
        this.signalsBot.sendMessage(msg.chat.id, 'Too much idle time, please start over again');
      }
      return signal;
    }
    // scanSignalsAtRisk(signalsAtRisk, dataList) {
    //   const defaultSL = 0.03;
    //   const stoppedOut = [];
    //   if (dataList.length) {
    //     dataList.forEach(data => {
    //       const token = data.symbol;
    //       const signal = signalsAtRisk[token];
    //       const isLong = signal.plainType.includes('long');
    //       const entryPrice = signal.sl / (isLong ? 1 - defaultSL : 1 + defaultSL);
    //       const currentPrice = Number.parseFloat(data.markPrice);
    //       const minus1 = isLong ? entryPrice * 0.99 : entryPrice * 1.01;
    //       const minus2 = isLong ? entryPrice * 0.98 : entryPrice * 1.02;
    //       if (isLong && (signal.sl >= currentPrice) 
    //         || !isLong && (signal.sl <= currentPrice)) {
    //         stoppedOut.push(signal);
    //         delete signalsAtRisk[token];
    //         this.db.clearSignalAtRisk(token);
    //       } else if (isLong && (signal.tps[0] <= currentPrice)
    //         || !isLong && (signal.tps[0] >= currentPrice)) {
    //           this.sendToSignalsBot.apply(this, [`${token} hit 1st target, ${currentPrice}, and no longer at risk`]);  
    //         delete signalsAtRisk[token];
    //         this.db.clearSignalAtRisk(token);
    //       } else if (!signal.notified1 && (isLong && (minus1 >= currentPrice)
    //         || !isLong && (minus1 <= currentPrice))) {
    //         this.sendToSignalsBot.apply(this, [`${token} is at 1% loss`]);  
    //         signal.notified1 = true;
    //       } else if (!signal.notified2 && (isLong && (minus2 >= currentPrice)
    //       || !isLong && (minus2 <= currentPrice))) {
    //         this.sendToSignalsBot.apply(this, [`${token} is at 2% loss`]);  
    //         signal.notified2 = true;
    //       }
    //     });
    //   }
    //   return stoppedOut;
    // }

    isNaturalNumber(n) {
      n = n.toString(); // force the value incase it is not
      var n1 = Math.abs(n),
          n2 = parseInt(n, 10);
      return !isNaN(n1) && n2 === n1 && n1.toString() === n;
  }
}

exports.Utils = Utils;