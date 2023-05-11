const express = require("express");
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const useRemote = true;
const pool = new Pool({
  connectionString: process.env.PORT ? process.env.DATABASE_URL : 'postgres://zvwhpzzyzdtnvn:b5b2ae4b3286dc1ad89a45025ed832d1d8aa67288aa9452b74515cc494d33405@ec2-44-199-86-61.compute-1.amazonaws.com:5432/d8tiikhhmu01m9',
  ssl: {
    rejectUnauthorized: false
  }
});
const btcEthPairs = ['BTC', 'ETH']
const allowedPairs = ['ADA', 'EOS', 'XRP', 'LTC', 'BNB', 'ATOM', 'MATIC', 'MANA', 'SOL', 'ZEC', 'DASH', 'LUNA']
const profitMapper = {
  '1h': -1001719398169,
  '2h': -1001677674700,
  '4h': -1001561919134,
  '6h': -1001687049615,
  '8h': -1001597689417,
  '12h': -1001753185006,
  '1d': -1001660277723
}
const opovMapper = {
  '1h': [-1001653595043, -1001615511219],
  '2h': [-1001705827404, -1001679155331]
}
const monitorChannel = -1001604830476;
const btcEthChannel = -1001675992901;
const lowRiskChannel = -1001537406548;
const veryLowRiskChannel = -1001784385352;
const freeChannel = -1001503853311;
const app = express();
app.use(bodyParser.text({type: '*/*'}));

const TelegramBot = require('node-telegram-bot-api');
const Binance = require('node-binance-api');
const { defaultValues, tenAmendments, tutorialsKeyboard, blockingValues } = require("./consts");
const { Utils } = require("./Utils");
const { DBFacade } = require('./DBFacade');
const { initiateGroupsBot } = require("./GroupsBot");

const PORT = process.env.PORT || 3500;
const signalsToken = process.env.PORT ? '2034887899:AAGkTctM3TSSZjzW7areEcD8DHBETjuFJjU' : '2098933975:AAEnQfAlqOlnLN_HiPkJTN5Au3rLA3nZsgw';
const signalsBot = new TelegramBot(signalsToken, {polling: true});
const binance = new Binance();
const subscribers = new Set(); 
// const signalsAtRisk = {};
// const reversedSignals = {};

const userValues = {};
const db = new DBFacade(pool);
const utils = new Utils(signalsBot, binance, userValues, subscribers, uuidv4, db);
initiateGroupsBot(db, utils);
// initiateImmigrationsBot(db);
app.use(express.static("public"))

// define the first route
app.get("/", function (req, res) {
  res.send("<h1>CryptoBeast Bots are up</h1>")
}).get('/db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM configs');
    const results = { 'results': (result) ? result.rows : null};
    res.send('DB is up');
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
})

app.post("/", function (req, res) {
  console.log(`webhook message recieved: ${req.body}`);
  const sig = req.body.split('\n').filter(l => l.length);
  let TPs = sig.filter(l => l.indexOf('TP') === 0).map(l => l.split(' - ')[1].split('$')[0] * 1);
  const type = TPs[0] < TPs[1] ? 'long' : 'short';
  const multiplier = Math.pow(10, Math.round(1 / TPs[0]).toString().length + 3);
  TPs = TPs.map(tp => type === 'long' ? tp * 0.9997 : tp * 1.0003).map(tp => Math.round(tp * multiplier) / multiplier);
  const ticker = sig.find(l => l.includes('USDT')).split('-')[0].split('PERP')[0];
  const stoploss = sig.find(l => l.includes('Стоп-лосс')).split(':')[1].split('$')[0]
  console.log(`generating signal: ${ticker} - ${type}`);
  binance.futuresPrices().then((prices, err) => {
    const exactPrice = prices[ticker];
    if (!err && exactPrice) {
      let entry = Math.round(exactPrice * (type === 'long' ? 1.001 : 0.999) * multiplier) / multiplier;
      if (entry > 1000) {
        entry = Math.round(entry);
      }
      const sigTxtAndRisk = utils.generateSignalText({
        token: ticker,
        leverage: 15,
        plainType: type,
        entries: [entry],
        tps: TPs.map(t => t > 1000 ? Math.round(t) : t),
        sl: stoploss > 1000 ? Math.round(stoploss) : stoploss,
        username: 'S7atory' 
      }, true);
      if (sig.type === 'long' && entry >= sig.TPs[0] || sig.type === 'short' && entry <= sig.TPs[0] ) {
        signalsBot.sendMessage(458754638, 'ignored message:');
        signalsBot.sendMessage(458754638, sigTxtAndRisk.text);
      } else {
        if (btcEthPairs.find(p => ticker.includes(p))) {
          utils.sendToCustomGroup(sigTxtAndRisk.text, btcEthChannel);
          utils.sendToCustomGroup(sigTxtAndRisk.text, freeChannel);
        } else if (allowedPairs.find(p => ticker.includes(p))) {
          utils.sendToSignalsBot(sigTxtAndRisk.text);
        } else {
          utils.sendToCustomGroup(sigTxtAndRisk.text, monitorChannel);
        }
      }
      res.send("<h1>Done</h1>")
    }
  })
})

// start the server listening for requests
app.listen(PORT, async () => {
  subscribers.add(PORT === 3500 ? -1001717462263
    : -514773178);
  console.log("Server is running...")
  await db.loadConfigs(userValues);
});

signalsBot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (msg.text && msg.text.toString().includes('Exchange') && msg.from.username === 'Crypto_Beast') {
    let txt = msg.text.toString().split('\n');
    const dest = txt.find(l => l.includes('Scalping')) ? -1001544087928 : -1001322574386;
    txt = txt.filter(line => ![
      'The following trade', 'Channel:', 'Client:', 'Trailing', 'Stop:', 'Trigger:', '458754638', 'Exchange', 'Leverage', 'Percentage'
    ].some(v => line.includes(v)));
    let i = 0;
    while (i < txt.length) {
      if (txt[i] === '') {
        if (i + 1 === txt.length) {
          txt.pop();
        } else if (i === 0 || txt[i + 1] === '') {
          txt.splice(i, 1);
        } else  {
          i++;
        }
      } else {
        i++;
      }
    }
    pair = txt[0].substr(2, txt[0].length - 4);
    let tpIdx = txt.findIndex(l => l.includes('Take-Profit Orders')) + 1;
    const isLong = txt.find(l => l.includes('Type:')).includes('Long');
    while (txt[tpIdx][1] === ')') {
      let index = txt[tpIdx].split(' ')[0];
      let val = txt[tpIdx].split(' ')[1] * 1;
      val *= (isLong ? 0.9997 : 1.0003);
      const multiplier = Math.pow(10, Math.round(1 / val).toString().length + 3);
      val = Math.round(val * multiplier) / multiplier;
      val = val > 1000 ? Math.round(val) : val;
      txt[tpIdx] = index + ' ' + val;
      tpIdx++;
    }
    txt.splice(0, 1, `🐗🐗${pair}🐗🐗`);
    txt.splice(1, 0, 'Exchange: Binance Futures');
    txt.splice(3, 0, `Leverage: Cross (${dest === -1001544087928 ? '15' : '8'}.0X)`);
    txt.push('', 'Signal By: @Crypto_Beast');
    txt = txt.join('\n').replace('✅', '').replace('(Long)', '(Long)  🟢').replace('(Short)', '(Short)  🔴');
    //signalsBot.sendMessage(chatId, txt);
    signalsBot.sendMessage(dest, txt);
  } else if (msg.text && msg.text.toString().includes('Сигнал') && msg.from.username === 'Crypto_Beast') {
    let txt = msg.text.toString().split('\n');
    let version = txt.splice(0, 1)[0] === 'opov' ? 2 : 1;
    const isLong = txt[0].includes('Buy');
    const timeframe = txt[0].split(' ').find(w => w.endsWith(':')).split(':')[0];
    const dest = version === 1 ? profitMapper[timeframe] : opovMapper[timeframe][isLong ? 0 : 1];
    const promoter = isLong ? 0.9997 : 1.0003
    txt.splice(0, 1);
    const signals = [{}];
    txt.forEach(line => {
      if (line.length) {
        const currSignal = signals[signals.length - 1];
        if (line.includes('USDT')) {
          currSignal.ticker = line.trim();
        } else if (line.includes('Тейк')) {
          if (!currSignal.TPs) {
            currSignal.TPs = [];
          }
          let val = line.split(': ')[1] * promoter;
          const multiplier = Math.pow(10, Math.round(1 / val).toString().length + 3);
          val = Math.round(val * multiplier) / multiplier;
          val = val > 1000 ? Math.round(val) : val;
          currSignal.TPs.push(val);
        } else if (line.includes('Стоп')) {
          currSignal.sl = line.split(': ')[1] * 1;  
        }
      } else {
        signals.push({});
      }
    })
    signals.forEach(signal => {
      binance.futuresPrices().then((prices, err) => {
        const exactPrice = prices[signal.ticker];
        if (!err && exactPrice) {
          const multiplier = Math.pow(10, Math.round(1 / exactPrice).toString().length + 3);
          let entry = Math.round(exactPrice * (isLong ? 1.001 : 0.999) * multiplier) / multiplier;
          if (entry > 1000) {
            entry = Math.round(entry);
          }
          const sigTxtAndRisk = utils.generateSignalText({
            token: signal.ticker,
            leverage: 10,
            plainType: isLong ? 'long' : 'short',
            entries: [entry],
            tps: signal.TPs,
            sl: signal.sl > 1000 ? Math.round(signal.sl) : signal.sl,
            username: 'Crypto_Beast' 
          }, true);
          //signalsBot.sendMessage(chatId, sigTxt);
          signalsBot.sendMessage(dest, sigTxtAndRisk.text + `\nBased on candles of ${timeframe}`);
          if (timeframe === '1h') {
            return;
          }
          if (sigTxtAndRisk.risk >= 10 && sigTxtAndRisk.risk < 19) {
            signalsBot.sendMessage(veryLowRiskChannel, sigTxtAndRisk.text + `\nBased on candles of ${timeframe}`);
          } else if (sigTxtAndRisk.risk < 40 && sigTxtAndRisk.risk > 19) {
            signalsBot.sendMessage(lowRiskChannel, sigTxtAndRisk.text + `\nBased on candles of ${timeframe}`);
          }
        }
      })
    })
  }
});

signalsBot.onText(/\/prices/, msg => {
  binance.futuresPrices().then(prices => {
    let res = '';
    Object.keys(prices).sort((a, b) => a.localeCompare(b)).forEach(s => {
      if (!(s.includes('_') || s.endsWith('BUSD'))) {
        res += `\n${s.replace('USDT', '/USDT')} = ${prices[s]} USDT`;
      }
    });
    signalsBot.sendMessage(msg.chat.id, res);
  });
  
});
// signalsBot.onText(/\/html/, (msg) => {
//   signalsBot.sendMessage(msg.chat.id,"<b>bold</b> \n <i>italic</i> \n <em>italic with em</em> \n <a href=\"http://www.example.com/\">inline URL</a> \n <code>inline fixed-width code</code> \n <pre>pre-formatted fixed-width code block</pre>" ,{parse_mode : "HTML"});
// })
// signalsBot.onText(/\/testKeyboard/, (msg) => {
//   if (msg.from.username !== 'Crypto_Beast') {
//     return;
//   }
//   signalsBot.sendMessage(msg.chat.id,"testing keyboard" ,{
//     reply_markup: {
//         "inline_keyboard": [
//           [
//             {
//               text: "url button",
//               url: "http://google.com"
//             },
//             {
//               text: "group button",
//               url: "https://t.me/joinchat/LgWrywx9obRhNjlk"
//             }
//           ],
//           [
//             {
//               text: "callback button",
//               callback_data: "testKeyboard:button1"
//             },
//             {
//               text: "Forward",
//               switch_inline_query: "/l btc"
//             }
//           ]
//         ]
//       }
//   });
// })
signalsBot.onText(/\/start/, (msg) => {
  signalsBot.sendMessage(msg.chat.id, `Welcome ${msg.from.first_name}, I'm CryptoBeast's helper signalsBot`);
});

signalsBot.onText(/\/create (\w.+)/, (msg, match) => {
  const params = match[1].split(' ');
  if (params.length !== 7) {
    signalsBot.sendMessage(msg.chat.id, 'Wrong number of params, Please try again.\nFormat should be:\n/create [coins-pair] [entry-price/s] [long/short/break-long/break-short] [take percentage] [number-of-takes] [stop percentage] [leverage]');
    return;
  }
  signalsBot.sendMessage(msg.chat.id, utils.generateSignal(params, msg.from.username));
});

signalsBot.onText(/\/(long|l) (\w.+)/, (msg, match) => {
  utils.generateSignalWithoutPrices(match[2], 'long', msg);
});

signalsBot.onText(/\/(short|s) (\w.+)/, (msg, match) => {
  utils.generateSignalWithoutPrices(match[2], 'short', msg);
});

// signalsBot.onText(/\/signals_at_risk/,async (msg) => {
//   const res = await db.getAllSignalsAtRisk();
//   const parsed = res.map(r => r.token).join('\n')
//   signalsBot.sendMessage(msg.chat.id, parsed);
// });

signalsBot.onText(/\/reset/, (msg) => {
  const username = msg.from.username;
  delete userValues[username];
  db.removeUserValues(username);
  signalsBot.sendMessage(msg.chat.id, `Custom values were reset for ${username}`);
});

signalsBot.onText(/\/my_values/, (msg) => {
  const username = msg.from.username;
  const userVals = userValues[username];
  if (userVals) {
    signalsBot.sendMessage(msg.chat.id, `Current setting for ${username} are:
Take: ${userValues[username].take}%
SL: ${userValues[username].sl}%
Number of targets: ${userValues[username].numTargets},
Leverage: ${userValues[username].leverage}`);
  } else {
    signalsBot.sendMessage(msg.chat.id, `No custom values for ${username}`);
  }
});

signalsBot.onText(/\/set/, msg => {
  utils.setUserValues(msg);
}); 
signalsBot.on("callback_query", (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = JSON.parse(callbackQuery.data);
  const user = data.msg;
  msg.from.username = user;
  userValues[user] = userValues[user] ? userValues[user] : JSON.parse(JSON.stringify(defaultValues));
  if (data.type.includes('select::') || data.type.includes('edit::') || data.type.includes('::close')) {
    signalsBot.deleteMessage(msg.chat.id, msg.message_id);
  }
  let signal;
  if (data.type === 'edit::sl' || data.type === 'edit::tp' || data.type === 'edit::en' || data.type === 'edit::sig') {
    signal = utils.getFromSignalsStorage(data.id, msg);
    if (!signal) {
      return;
    }
  }
  signalsBot.answerCallbackQuery(callbackQuery.id).then(() => {
    switch (data.type) {
      case 'select::tp':
        signalsBot.sendMessage(msg.chat.id, `Current take profit is ${userValues[user].take}%\nPlease send me the desired take profit percentages.`, { 
          reply_markup: { 
            force_reply: true 
          }
        }).then(sentMessage => {
          signalsBot.onReplyToMessage(sentMessage.chat.id,
            sentMessage.message_id,
            reply => {
              userValues[user].take = [reply.text * 1];
              signalsBot.sendMessage(msg.chat.id, `Done! Take profit was set to ${userValues[user].take}`);
              db.updateUserValues(user, userValues[user]);
              setTimeout(() => utils.setUserValues(msg), 200);
            })
        });
        break;
      case 'select::sl':
        signalsBot.sendMessage(msg.chat.id, `Current Stoploss is ${userValues[user].sl}%\nPlease send me the desired stoploss percentages.`, { 
          reply_markup: { 
            force_reply: true 
          }
        }).then(sentMessage => {
          signalsBot.onReplyToMessage(sentMessage.chat.id,
            sentMessage.message_id,
            reply => {
              userValues[user].sl = [reply.text * 1];
              signalsBot.sendMessage(msg.chat.id, `Done! Stoploss was set to ${userValues[user].sl}%`);
              db.updateUserValues(user, userValues[user]);
              setTimeout(() => utils.setUserValues(msg), 200);
            });
        });
        break;
      case 'select::leverage':
        signalsBot.sendMessage(msg.chat.id, `Current leverage is ${userValues[user].leverage}%\nPlease send me the desired leverage.`, { 
          reply_markup: { 
            force_reply: true 
          }
        }).then(sentMessage => {
          signalsBot.onReplyToMessage(sentMessage.chat.id,
            sentMessage.message_id,
            reply => {
              userValues[user].leverage = [reply.text * 1];
              signalsBot.sendMessage(msg.chat.id, `Done! Leverage was set to ${userValues[user].leverage}`);
              db.updateUserValues(user, userValues[user]);
              setTimeout(() => utils.setUserValues(msg), 200);
            })
        });
        break;
      case 'select::targets':
        signalsBot.sendMessage(msg.chat.id, `Current # of targets are ${userValues[user].numTargets}%\nPlease send me the desired number of targets.`, { 
          reply_markup: { 
            force_reply: true 
          }
        }).then(sentMessage => {
          signalsBot.onReplyToMessage(sentMessage.chat.id,
            sentMessage.message_id,
            reply => {
              userValues[user].numTargets = [reply.text * 1];
              signalsBot.sendMessage(msg.chat.id, `Done! # of targets were set to ${userValues[user].numTargets}`);
              db.updateUserValues(user, userValues[user]);
              setTimeout(() => utils.setUserValues(msg), 200);
            })
        });
      case 'edit::sig':
        if (!signal) {
          return;
        }    
        signalsBot.sendMessage(msg.chat.id, `<b>Editing signal:</b>\n<b>What would you like to edit?</b>\n\n${signal.text}`, {
          parse_mode : "HTML",
          reply_markup: { 
            "inline_keyboard": [[
              {
                text: "Entry",
                callback_data: JSON.stringify({type:'edit::en', id: signal.uuid})
              },
              {
                text: "TPs",
                callback_data: JSON.stringify({type:'edit::tp', id: signal.uuid})
              },
              {
                text: "SL",
                callback_data: JSON.stringify({type:'edit::sl', id: signal.uuid})
              }
            ], 
            [
              {
                text: "Back",
                callback_data: JSON.stringify({type:'edit::back', id: signal.uuid})
              }
            ]]
          }
        });
        break;  
      case 'edit::en':
        if (signal.entries.length === 1) {
          signalsBot.sendMessage(msg.chat.id, `Current Entry price is ${signal.entries[0]}\nSend me a new entry price please.`, { 
            reply_markup: { 
              force_reply: true 
            }
          }).then(sentMessage => {
            signalsBot.onReplyToMessage(sentMessage.chat.id,
              sentMessage.message_id,
              reply => {
                signalsBot.sendMessage(msg.chat.id, 'Done!');
                signal.entries = [reply.text * 1];
                signal.text = utils.generateSignalText(signal).text;
                utils.updateSignalsStorage(data.id, signal);
                setTimeout(() => utils.sendSignalToUser(signal, msg), 100);
              })
          });
        } else {
          let txt = `Choose entry to edit [1 - ${signal.entries.length}]:`;
          signal.entries.forEach((e, i) => txt += `\n${i + 1}) ${e}`);
          signalsBot.sendMessage(msg.chat.id, txt, { 
            reply_markup: { 
              force_reply: true 
            }
          }).then(sentMessage1 => {
            signalsBot.onReplyToMessage(sentMessage1.chat.id,
              sentMessage1.message_id,
              reply => {
                let editedEntry = reply.text * 1;
                if (isNaN(editedEntry) || editedEntry < 1 || editedEntry > signal.entries.length) {
                  signalsBot.sendMessage(msg.chat.id, `Entry number must be a number between 1 and ${signal.entries.length}\n Lets try again.`) 
                  utils.sendSignalToUser(signal, msg);
                } else {
                  editedEntry--;
                  signalsBot.sendMessage(msg.chat.id, `Entry #${editedEntry + 1} was chosen, which is currently ${signal.entries[editedEntry]}\nSend me a new entry price please.`, { 
                    reply_markup: { 
                      force_reply: true 
                    }
                  }).then(sentMessage2 => {
                    signalsBot.onReplyToMessage(sentMessage2.chat.id,
                      sentMessage2.message_id,
                      reply => {
                        signalsBot.sendMessage(msg.chat.id, 'Done!');
                        signal.entries[editedEntry] = reply.text;
                        signal.text = utils.generateSignalText(signal).text;
                        utils.updateSignalsStorage(data.id, signal);
                        setTimeout(() => utils.sendSignalToUser(signal, msg), 100);
                      })
                  });
                }
              });
          });
        }
        break;
      case 'edit::tp':
        signalsBot.answerCallbackQuery(callbackQuery.id).then(() => {
          let txt = `Choose take profit to edit [1 - ${signal.tps.length + 1}]:`;
          signal.tps.forEach((e, i) => txt += `\n${i + 1}) ${e}`);
          txt += `\n${signal.tps.length + 1}) New Take Profit`
          signalsBot.sendMessage(msg.chat.id, txt, { 
            reply_markup: { 
              force_reply: true 
            }
          }).then(sentMessage1 => {
            signalsBot.onReplyToMessage(sentMessage1.chat.id,
              sentMessage1.message_id,
              reply => {
                let editedEntry = reply.text * 1;
                if (isNaN(editedEntry) || editedEntry < 1 || editedEntry > signal.tps.length + 1) {
                  signalsBot.sendMessage(msg.chat.id, `Take profit number must be a number between 1 and ${signal.tps.length + 1}\n Lets try again.`) 
                  utils.sendSignalToUser(signal, msg);
                } else {
                  editedEntry--;
                  let userMsg = ''
                  if (editedEntry === signal.tps.length) {
                    userMsg = 'Please send me the new take profit value';
                  } else {
                    userMsg = `Take profit #${editedEntry + 1} was chosen, which is currently ${signal.tps[editedEntry]}\nSend me a new take profit price please\n(send 0 to remove it).`                    
                  }
                  signalsBot.sendMessage(msg.chat.id, userMsg, { 
                    reply_markup: { 
                      force_reply: true 
                    }
                  }).then(sentMessage2 => {
                    signalsBot.onReplyToMessage(sentMessage2.chat.id,
                      sentMessage2.message_id,
                      reply => {
                        signalsBot.sendMessage(msg.chat.id, 'Done!');
                        if (reply.text * 1 === 0) {
                          signal.tps.splice(editedEntry, 1);
                        } else {
                          signal.tps[editedEntry] = reply.text;
                        }
                        const reverseComperison = signal.plainType.includes('long') ? 1 : -1; 
                        signal.tps = signal.tps.sort((a, b) => a * reverseComperison < b * reverseComperison ? -1 : 1)
                        signal.text = utils.generateSignalText(signal).text;
                        utils.updateSignalsStorage(data.id, signal);
                        setTimeout(() => utils.sendSignalToUser(signal, msg), 100);
                      });
                  });
                }
              })
          });
        });
        break;
      case 'edit::sl':
        signalsBot.sendMessage(msg.chat.id, `Current Stoploss is ${signal.sl}\nSend me a new Stoploss price please.`, { 
          reply_markup: { 
            force_reply: true 
          }
        }).then(sentMessage => {
          signalsBot.onReplyToMessage(sentMessage.chat.id,
            sentMessage.message_id,
            reply => {
              signalsBot.sendMessage(msg.chat.id, 'Done!');
              signal.sl = reply.text * 1;
              signal.text = utils.generateSignalText(signal).text;
              utils.updateSignalsStorage(data.id, signal);
              setTimeout(() => utils.sendSignalToUser(signal, msg), 100);
            })
        });
        break;
      case 'edit::back':
        signal = utils.signalsStorage[data.id];
        utils.sendSignalToUser(signal, msg);
        break;
      case 'edit::ack':
        signal = utils.signalsStorage[data.id];
        delete utils.signalsStorage[data.id];;
        signalsBot.sendMessage(msg.chat.id, signal.text);
        break;
      case '::close':
        break; 
      default :
        signalsBot.sendMessage(msg.chat.id, 'Unrecognised parameter');
    }
  });
});

signalsBot.onText(/\/help/, (msg) => {
  signalsBot.sendMessage(msg.chat.id, `/create [coins-pair] [entry-price/s] [long/short/break-long/break-short] [take percentage] [number-of-takes] [stop percentage] [leverage]

  Example:
  /create btc/usdt 47000,46000 long 5 3 7 10
  Will generate the following trade:\n
  🐗🐗 BTC/USDT 🐗🐗
  Exchange: Binance Futures
  Leverage: Cross (10.0X)\n
  Signal Type: Regular (Long) 🟢
  Entry Targets:
  1) 47000
  2) 46000\n
  Take-Profit Targets:
  1) 47283
  2) 48066
  3) 48850\n
  Stop Targets:
  1) 43245
  
  @Username`);

  signalsBot.sendMessage(msg.chat.id, `/create_fast [coins-pair] [long/short]
A shorthand is /long [coins-pair]   OR   /short [coins-pair]   OR   /l [coins-pair]   OR   /s [coins-pair]
Will create a long/short signal with entry=current price. 
Take and loss will be set from global values.
Current global values are:
Take: ${defaultValues.take}%
SL: ${defaultValues.sl}%
Number of targets: ${defaultValues.numTargets},
Leverage: ${defaultValues.leverage}

Example:
/create btc/usdt long   OR   /long btc   OR   /l btc`);
  signalsBot.sendMessage(msg.chat.id, `/set - Will set a new defaults for the asking user.
/reset - will reset the custom values back to default values.
/my_values - will show the user's custom values.`);
  signalsBot.sendMessage(msg.chat.id, `/prices - Will show all Binance Futures tokens prices.`);
});

// const initiateMarkPriceStream = () => {
//   binance.futuresMarkPriceStream( prices => {
//     const symbolsAtRisk = Object.keys(signalsAtRisk);
//     const relevantData = prices.filter(t => symbolsAtRisk.includes(t.symbol));
//     const stoppedOut = utils.scanSignalsAtRisk(signalsAtRisk, relevantData);
//     stoppedOut.forEach(trade => {
//       if (reversedSignals[trade.token]) {
//         console.log(`stopped out ${trade.token} twice, back to normal direction, doing nothing`);
//         delete reversedSignals[trade.token];
//         db.clearReversedSignal(trade.token);
//         utils.sendToSignalsBot(`stopped out ${trade.token} twice, back to normal direction, doing nothing`);
//       } else {
//         console.log(`stopped out ${trade.token}, reversing direction`);
//         utils.sendToSignalsBot(`${trade.token} was stopped out, should send ${trade.plainType.includes('long') ? 'short' : 'long'} signal now`);
//         utils.generateSignalWithoutPrices(trade.token, trade.plainType.includes('long') ? 'short' : 'long', '', null, true);
//         reversedSignals[trade.token] = true;
//         db.addReversedSignal(trade.token);
//       }
//     });
//   });
// }

setInterval(() => {
  utils.cleanEditingSignals()
}, 60000)