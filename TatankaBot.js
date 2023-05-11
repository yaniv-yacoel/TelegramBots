const TelegramBot = require("node-telegram-bot-api");
const moment = require("moment");
const { tatankaInfo, tatankaBuy, tatankaHelp, tatankaKeyboard, TATAContract } = require("./consts");
const { initiateTatankaBotClient } = require("./TatankaBotClient");

const tatankaToken = process.env.PORT ? '2060822676:AAHYbwUFe2rC_VCprQ41eBz0cPD-hM-qL3Q' : '2104184964:AAG2n7P8_Dk7EHFejfJqiAfQbbsqsc44CPc';
const tatankaBot = new TelegramBot(tatankaToken, {polling: true});
const signalsGroup = -1001732942695;
const osintGroup = -1001782611595;
const emitterGroup = -709885907;
const tatankaBotClient = initiateTatankaBotClient();
exports.initiateTatankaBot = (db, utils) => {
    let tataValue = 0;
    let lastGraph;
    const scanAndBanFromSignals = () => {
        db.getAllTataUsers().then(rows => {
            rows.forEach((row, idx) => {
                setTimeout(() => {
                    const wallet = row.wallet;
                    const userId = Number.parseInt(row.user_id);
                    tatankaBotClient.getAddressBalance(wallet).then(async data => {
                        const tataEntry = data.data.items.find(item => item.contract_address === '0x256f624aDb3aCA12Be4C00b8B42A7C22F926d3Bf');
                        const balance = tataEntry.balance / Math.pow(10, tataEntry.contract_decimals);
                        if (balance < 10000) {
                            tatankaBot.sendMessage(userId, "Your TATA balance is below 10,000, kicking you from TATA Signals Channel");
                            db.removeTataUser(userId);
                            tatankaBot.banChatMember(signalsGroup, userId);
                        }
                    });
                }, idx * 5000);
            })
        })
    }
    const scanAndBanFromOsint = () => {
        db.getAllOsintUsers().then(rows => {
            rows.forEach((row, idx) => {
                setTimeout(() => {
                    const wallet = row.wallet;
                    const userId = Number.parseInt(row.user_id);
                    tatankaBotClient.getAddressBalance(wallet).then(async data => {
                        const tataEntry = data.data.items.find(item => item.contract_address === '0x256f624aDb3aCA12Be4C00b8B42A7C22F926d3Bf');
                        const balance = tataEntry.balance / Math.pow(10, tataEntry.contract_decimals);
                        if (balance < 30000) {
                            tatankaBot.sendMessage(userId, "Your TATA balance is below 30,000, kicking you from Osint Channel");
                            db.removeTataUser(userId);
                            tatankaBot.banChatMember(osintGroup, userId);
                        }
                    });
                }, idx * 5000);
            })
        })
    }
    scanAndBanFromSignals();
    scanAndBanFromOsint();
    tatankaBot.sendMessage(emitterGroup, '/price');
    setInterval(() => {
        tatankaBot.sendMessage(emitterGroup, '/price');
    }, 10 * 60 * 1000);
    setInterval(() => {
        scanAndBanFromSignals()
    }, 60000 * 60 * 12);
    setInterval(() => {
        scanAndBanFromOsint()
    }, 60000 * 60 * 12);
    tatankaBot.on('message', (msg) => {
        if (msg.text) {
            const msgText = msg.text.toString();
            let reply = '';
            if (msgText.includes('/my_balance') && msgText.split(' ').length < 2) {
                reply = 'Please add your wallet public address to get this command work.\nFor example: \n\n<pre>/my_balance 0x947a385Ff71...</pre>';        
            } else if (msgText.includes('/get_signals') && msgText.split(' ').length < 2) {
                reply = 'Please add your wallet public address to get this command work.\nFor example: \n\n<pre>/get_signals 0x947a385Ff71...</pre>';
            } else if (msgText.includes('/join_osint') && msgText.split(' ').length < 2) {
                reply = 'Please add your wallet public address to get this command work.\nFor example: \n\n<pre>/join_osint 0x947a385Ff71...</pre>';
            }
            if (reply) {
                 tatankaBot.sendMessage(msg.chat.id, reply, {parse_mode : "HTML"});   
            }
        } else if (msg.caption && msg.chat.type === 'private') {
            tatankaBot.deleteMessage(msg.chat.id, msg.message_id);
            const txt = msg.caption.split('\n');
            tataValue = txt.find(t => t.includes('Price')).split('$')[1] * 1;
            lastGraph = msg.photo[2].file_id;
        } else if (msg.new_chat_member && msg.chat.id === -1001628873526) {
            const member = msg.new_chat_member;
            let name = member.first_name ? member.first_name : '';
            name += member.last_name ? ` ${member.last_name}` : '';
            name = name ? name : (msg.username || '');
            signalsBot.sendMessage(msg.chat.id, `Is it a plain? Is it a bird? NO! It's a new TATA Hodler!\nWelcome to our community ${name}!`)
        }
    });
    tatankaBot.onText(/\/tata_value/, (msg) => {
        tatankaBot.sendMessage(msg.chat.id, `1 TATA = $${tataValue.toFixed(8)}`);
    });
    tatankaBot.onText(/\/buy/, (msg) => {
        tatankaBot.sendMessage(msg.chat.id, tatankaBuy);
    });

    tatankaBot.onText(/\/tata_info/, (msg) => {
        tatankaBot.sendMessage(msg.chat.id, tatankaInfo);
    });
    tatankaBot.onText(/\/tata_details/, (msg) => {
        let timeSinceLaunch = moment().diff('2022-02-10', 'days', false);
        let res = [
            `🚀 <a href="https://t.me/tatankacoin">TATA</a> 🦾 $${tataValue.toFixed(8)}`,
            `💴 <b>Market Cap</b> $${(22000000 * tataValue).toFixed(2)}`,
            `💰 <b>Circulating Supply</b> 22M`,
            `🔄 <b>Buy/Sell</b> <a href="https://pancakeswap.finance/swap?outputCurrency=0x256f624aDb3aCA12Be4C00b8B42A7C22F926d3Bf&inputCurrency=BNB">PancakeSwapV2</a> | <a href="https://poocoin.app/swap?outputCurrency=0x256f624aDb3aCA12Be4C00b8B42A7C22F926d3Bf">PooCoin Swap</a>`,
            `〽️ Charts 🛠 <a href="https://bsc.ach.tools/#/tabs/home/0x256f624aDb3aCA12Be4C00b8B42A7C22F926d3Bf">ACH</a> 💩 <a href="https://poocoin.app/tokens/0x256f624aDb3aCA12Be4C00b8B42A7C22F926d3Bf">PooCoin</a> 📈 <a href="https://dex.guru/token/0x256f624aDb3aCA12Be4C00b8B42A7C22F926d3Bf-bsc">DexGuru</a>`,
            `⏰ <b>Time Since Launch: </b> ${timeSinceLaunch} days`
        ].join('\n\n')
        tatankaBot.sendPhoto(msg.chat.id, lastGraph, {parse_mode : "HTML", caption: res});
    });
    const getBalance = (entry, decimals = 6) => {
        let res = entry.balance / Math.pow(10, entry.contract_decimals);
        if (decimals) {
            res = (Math.round(res * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);
        }
        if (res > 1000) {
            return new Intl.NumberFormat().format(res);
        } else {
            return res;
        }
        
        
    }
    const extractAndSendData = (prom, msg, send = true) => {
        tatankaBot.sendMessage(msg.chat.id, 'Please wait while I get the data');
        ret = new Promise((resolve, reject) => {
            prom.then(data => {
                try {
                    const btcbEntry = data.data.items.find(item => item.contract_ticker_symbol === 'BTCB');
                    const tataEntry = data.data.items.find(item => item.contract_address === '0x256f624aDb3aCA12Be4C00b8B42A7C22F926d3Bf');
                    let txt = [];
                    if (btcbEntry) {
                        txt.push(`BTCB Balance: ${getBalance(btcbEntry)} = ${btcbEntry.quote} USD`);
                    }
                    if (tataEntry) {
                        txt.push(`TATA Balance: ${getBalance(tataEntry, 0)} = $${(tataEntry.balance / Math.pow(10, tataEntry.contract_decimals) * tataValue).toFixed(4)}`);
                    }
                    if (!txt.length && send) {
                        tatankaBot.sendMessage(msg.chat.id, `You don't have TATA nor BTCB in your wallet`);    
                    } else {
                        if (send) {
                            tatankaBot.sendMessage(msg.chat.id, txt.join('\n'));
                        }
                    }
                    resolve(txt.join('\n'));
                } catch (e) {
                    if (send) {
                        tatankaBot.sendMessage(msg.chat.id, `Something went wrong`);
                    }
                    reject();
                }
            }, err => {
                tatankaBot.sendMessage(msg.chat.id, err)
            });
        });
        return ret;
    } 
    tatankaBot.onText(/\/community_balance/, msg => {
        extractAndSendData(tatankaBotClient.getCommunityBalance(), msg);
    });
    tatankaBot.onText(/\/my_balance (\w.+)/, (msg, match) => {
        const wallet = match[1];
        extractAndSendData(tatankaBotClient.getAddressBalance(wallet), msg);
    });
    tatankaBot.onText(/\/leave_signals/, async (msg, match) => {
        const alreadyExist = await db.existTataUser(msg.from.id, "");
        if (!alreadyExist) {
            tatankaBot.sendMessage(msg.chat.id, "You're not registered, can't remove you"   );
            return;
        }
        tatankaBot.banChatMember(signalsGroup, msg.from.id);
        db.removeTataUser(msg.from.id);
        tatankaBot.sendMessage(msg.chat.id, "You were removed from the group and records successfully");
    });
    tatankaBot.onText(/\/leave_osint/, async (msg, match) => {
        const alreadyExist = await db.existOsintUser(msg.from.id, "");
        if (!alreadyExist) {
            tatankaBot.sendMessage(msg.chat.id, "You're not registered, can't remove you");
            return;
        }
        tatankaBot.banChatMember(osintGroup, msg.from.id);
        db.removeOsintUser(msg.from.id);
        tatankaBot.sendMessage(msg.chat.id, "You were removed from the group and records successfully");
    });
    tatankaBot.onText(/\/join_osint (\w.+)/, async (msg, match) => {
        const wallet = match[1];
        if (msg.chat.type !== 'private') {
            tatankaBot.deleteMessage(msg.chat.id, msg.message_id);
            tatankaBot.sendMessage(msg.chat.id, 'Please send me this command in private.\nYou do not want to show your invite link to everyone right?');
            return;
        } 
        const alreadyExist = await db.existOsintUser(msg.from.id, wallet);
        if (alreadyExist) {
            tatankaBot.sendMessage(msg.chat.id, "User ID or wallet already registered.\nPlease unregister first by sending <pre>/leave_osint</pre> and retry", {parse_mode: "HTML"});
            return;
        }
        tatankaBot.sendMessage(msg.chat.id, 'Please wait while I check your wallet').then(m2 => {
            tatankaBotClient.getAddressBalance(wallet).then(async data => {
                tatankaBot.deleteMessage(msg.chat.id, m2.message_id);
                const tataEntry = data.data.items.find(item => item.contract_address === '0x256f624aDb3aCA12Be4C00b8B42A7C22F926d3Bf');
                const balance = tataEntry.balance / Math.pow(10, tataEntry.contract_decimals);
                if (balance >= 30000) {
                    tatankaBot.sendMessage(msg.chat.id, "You have enought TATA(200), keep it there to stay in the channel");
                    db.addOsintUser(msg.from.id, msg.from.username, wallet).then(() => {
                        tatankaBot.unbanChatMember(osintGroup, msg.from.id, {
                            only_if_banned: true
                        }).finally(async () => {
                            const link = await tatankaBot.createChatInviteLink(osintGroup, {
                                expire_date: (new Date().getTime() + 1000*60*60*12) / 1000,
                                member_limit: 1,
                                creates_join_request: false
                            }); 
                            tatankaBot.sendMessage(msg.chat.id, link.invite_link);
                        });
                    });
                } else {
                    tatankaBot.sendMessage(msg.chat.id, "Not enough TATA(200). Please make sure that your wallet has at least 30,000 TATA(200)");
                }
            });
        });
    });

    tatankaBot.onText(/\/get_signals (\w.+)/, async (msg, match) => {
        const wallet = match[1];
        if (msg.chat.type !== 'private') {
            tatankaBot.deleteMessage(msg.chat.id, msg.message_id);
            tatankaBot.sendMessage(msg.chat.id, 'Please send me this command in private.\nYou do not want to show your invite link to everyone right?');
            return;
        } 
        const alreadyExist = await db.existTataUser(msg.from.id, wallet);
        if (alreadyExist) {
            tatankaBot.sendMessage(msg.chat.id, "User ID or wallet already registered.\nPlease unregister first by sending <pre>/leave_signals</pre> and retry", {parse_mode: "HTML"});
            return;
        }
        tatankaBot.sendMessage(msg.chat.id, 'Please wait while I check your wallet').then(m2 => {
            tatankaBotClient.getAddressBalance(wallet).then(async data => {
                tatankaBot.deleteMessage(msg.chat.id, m2.message_id);
                const tataEntry = data.data.items.find(item => item.contract_address === '0x256f624aDb3aCA12Be4C00b8B42A7C22F926d3Bf');
                if (!tataEntry) {
                    tatankaBot.sendMessage(msg.chat.id, "No TATA(200) in this wallet. If you just bought it, please wait a few minutes and retry");
                } else {
                    const balance = tataEntry.balance / Math.pow(10, tataEntry.contract_decimals);
                    if (balance >= 50000) {
                        tatankaBot.sendMessage(msg.chat.id, "You have enought TATA(200), keep it there to stay in the channel");
                        db.addTataUser(msg.from.id, msg.from.username, wallet).then(() => {
                            tatankaBot.unbanChatMember(signalsGroup, msg.from.id, {
                                only_if_banned: true
                            }).finally(async () => {
                                const link = await tatankaBot.createChatInviteLink(signalsGroup, {
                                    expire_date: (new Date().getTime() + 1000*60*60*12) / 1000,
                                    member_limit: 1,
                                    creates_join_request: false
                                }); 
                                tatankaBot.sendMessage(msg.chat.id, link.invite_link);
                            });
                        });
                    } else {
                        tatankaBot.sendMessage(msg.chat.id, "Not enough TATA(200). Please make sure that your wallet has at least 50,000 TATA(200). If you just bought some, please wait a few minutes and retry");
                    }
                }
            });
        });
    });
    tatankaBot.onText(/\/get_transaction_details (\w.+)/, (msg, match) => {
        const tx = match[1];
        tatankaBot.sendMessage(msg.chat.id, 'Please wait while I get the data').then(m2 => {
            tatankaBotClient.getHashData(tx).then(data => {
                tatankaBot.deleteMessage(msg.chat.id, m2.message_id);
                const logLines = data.data.items[0].log_events.filter(l => l.sender_address === TATAContract);
                if (!logLines) {
                    tatankaBot.sendMessage(msg.chat.id, 'No TATA was transfered in this transaction');        
                    return;
                }
                const logLine = logLines[0].decoded.params;
                const val = Math.round(logLine[2].value / Math.pow(10, 18)).toFixed(2);
                txt = `⬅️From - ${logLine[0].value}\n➡️To - ${logLine[1].value}\n⭐️Amount - ${new Intl.NumberFormat().format(val)} TATA(200) = $${val * tataValue}`;
                tatankaBot.sendMessage(msg.chat.id, txt);    
            }, err => {
                tatankaBot.deleteMessage(msg.chat.id, m2.message_id);
                tatankaBot.sendMessage(msg.chat.id, err);    
            });
        });
    });

    tatankaBot.onText(/\/tata_help/, (msg, match) => {
        tatankaBot.sendMessage(msg.chat.id, tatankaHelp);
    });

    tatankaBot.onText(/\/tatanka/, msg => {
        tatankaBot.sendMessage(msg.chat.id, tatankaInfo, tatankaKeyboard);
    });
    tatankaBot.onText(/\/hop/, msg => {
        if (msg.from.username !== 'Tatankaindicator' && msg.from.username !== 'Crypto_Beast') {
            tatankaBot.sendMessage(msg.chat.id, 'Only Tatanka and Founder and my creator, and Crypto_Beast can run this command');
            return;
        }
        utils.hop("TATA", msg, tatankaBot);
    });
    tatankaBot.on("callback_query", (callbackQuery) => {
        const msg = callbackQuery.message;
        const data = callbackQuery.data;
        tatankaBot.answerCallbackQuery(callbackQuery.id).then(() => {
            switch (data) {
                case 'info':
                    tatankaBot.deleteMessage(msg.chat.id, msg.message_id);
                    tatankaBot.sendMessage(msg.chat.id, tatankaInfo, tatankaKeyboard);
                    break;
                case 'balance':
                    tatankaBot.editMessageText("Fetching data...", {chat_id: msg.chat.id, message_id: msg.message_id}).then(msg2 => {
                        extractAndSendData(tatankaBotClient.getCommunityBalance(), msg, false).then(txt => {
                            tatankaBot.deleteMessage(msg2.chat.id, msg2.message_id);
                            tatankaBot.sendMessage(msg.chat.id, txt, tatankaKeyboard);
                        })
                    });
                    break;
            }
        })
    });
    return tatankaBot;
}