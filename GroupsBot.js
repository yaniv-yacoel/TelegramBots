const moment = require("moment");
const TelegramBot = require("node-telegram-bot-api");
const { tutorialsKeyboard, tenAmendments } = require("./consts");
const { DBFacade } = require("./DBFacade");
const { Utils } = require("./Utils");
const groupsToken = process.env.PORT ? '2077947224:AAGJwAYYG8LfvG5PnwSdfZXQIraxZuHRgCM' : '2020202730:AAE0hbJSsuqpHgHowTU_HWUTUU81Q3PUdXc'
const groupsBot = new TelegramBot(groupsToken, {polling: true});

exports.initiateGroupsBot = (db, utils) => {
    const banScanInterval = 10000;
    const isSuperuser = msg => {
        return msg.from.username === 'Crypto_Beast'
    }
    const associatingGroup = [];
    let isRegisteringAdmin = false;
    const getInviteLinks = async (adminId, userId) => {
        return new Promise(async (resolve, reject) => {
            const adminGroups = await db.getAssociatedAdminGroups(adminId);
            const links = [];
            adminGroups.forEach(async row => {
                const group = row.chat_id;
                try {
                    groupsBot.unbanChatMember(Number.parseInt(group), Number.parseInt(userId), {
                        only_if_banned: true
                    }).finally(async () => {
                        const link = await groupsBot.createChatInviteLink(group, {
                            expire_date: (new Date().getTime() + 1000*60*60*12) / 1000,
                            member_limit: 1,
                            creates_join_request: false
                        }); 
                        links.push(link);
                        if (links.length === adminGroups.length) {
                            resolve(links);
                        }
                    });
                } catch (e) {
                    console.log(e);
                }
            });
        });
    }
    const terminateSubscription = async (admin, user, auto = false) => {
        const adminId = admin.id ? admin.id : admin;
        const adminGroups = await db.getAssociatedAdminGroups(adminId);
        let remainingRemovals = adminGroups.length;
        adminGroups.forEach(row => {
            groupsBot.banChatMember(Number.parseInt(row.chat_id), Number.parseInt(user.id)).then(res => {
                // groupsBot.sendMessage(adminId, `User ${user.username || user.id} was removed from ${row.chat_name}`);
                remainingRemovals--;
            }).catch((e) => {
                if (e.response.body.description === 'Bad Request: USER_NOT_PARTICIPANT') {
                    remainingRemovals--;
                } else {
                    const suffix = auto ? `.\nNext ban iteration will be in ${banScanInterval / 1000} seconds and I'll retry then.` : `\ and try again.`
                    groupsBot.sendMessage(adminId, `Failed to remove user ${user.username || user.id} from ${row.chat_name}. Make sure that I'm an admin there with ban permission${suffix}`);
                }
         }).finally(() => {
                if (remainingRemovals === 0) {
                    db.removeSubscriber(adminId, user.id);
                    setTimeout(() => {groupsBot.sendMessage(adminId, `User ${user.username || user.id} was removed from your groups and records`);}, 300);
                }
            });
        });
    }

    const subscribeUser = async (admin, user) => {
        const userSubscriptionData = await db.getSubscriptionData(user.id, admin.id);
        let msgText;
        if (userSubscriptionData) {
            msgText = `User already registered. What would you like to do?\n1) Extend subscription\n2) End subscription\n3) Check status`
        } else {
            msgText = `Subscribing a new user, congrats!🤑\nPlease send me the subscription period.\nFor example 14d, 1m, 3m, lifetime`;
        }
        groupsBot.sendMessage(admin.id, msgText, { 
            reply_markup: { 
              force_reply: true 
            }
        }).then(sentMessage => {
            groupsBot.onReplyToMessage(admin.id,
              sentMessage.message_id,
              async reply => {
                if (userSubscriptionData) {
                    if (!utils.isNaturalNumber(reply.text * 1) || reply.text * 1 > 3) {
                        groupsBot.sendMessage(admin.id, `Bad choice. Please choose 1, 2 or 2`);
                        subscribeUser(admin, user);
                    } else {
                        if (reply.text === '1') {
                            if (userSubscriptionData.end_time === null) {
                                groupsBot.sendMessage(admin.id, `💚 ${user.username || user.id} is already a lifetime member 💚`);
                                return;
                            }
                            groupsBot.sendMessage(admin.id, 'Please send me the extension period.\nFor example 14d, 1m, 3m, lifetime', { 
                                reply_markup: { 
                                  force_reply: true 
                                }
                            }).then(sentMessage => {
                                groupsBot.onReplyToMessage(admin.id,
                                  sentMessage.message_id,
                                  async reply => {
                                    let period = reply.text.toUpperCase();
                                    let now = moment(userSubscriptionData.end_time * 1);
                                    if (period.includes('D')) {
                                        now.add(period.split('D')[0] * 1, 'd');
                                    } else if (period === 'LIFETIME') {
                                        now = null;
                                    } else if (period.includes('M')) {
                                        now.add(period.split('M')[0] * 1, 'M');
                                    } else {
                                        groupsBot.sendMessage(user.id, `Illegal period. period should be a number followed by [M / D] or 'lifetime'`);
                                        subscribeUser(admin, user);
                                        return;
                                    }
                                    if (now) {
                                        db.setSubscription(user.id, now.valueOf(), user.username, admin.id);
                                        groupsBot.sendMessage(admin.id, `${user.username || user.id} is subscribed until ${now.format("dddd, MMMM Do YYYY, h:mm a")}`);
                                    } else {
                                        db.setSubscription(user.id, null, user.username, admin.id);
                                        groupsBot.sendMessage(admin.id, `${user.username || user.id} is subscribed for lifetime plan`); 
                                    }
                                });
                            });
                        } else if (reply.text === '2') {
                            terminateSubscription(admin, user);
                        } else {
                            if (userSubscriptionData.end_time === null) {
                                groupsBot.sendMessage(admin.id, `${user.username || user.id} has lifetime plan`); 
                            } else {
                                const left = userSubscriptionData.end_time - new Date().getTime();
                                const leftDays = Math.floor(left / 1000 / 60 / 60 / 24);
                                groupsBot.sendMessage(admin.id, `Remaining time for ${user.username || user.id} is ${leftDays} days`); 
                            }
                            subscribeUser(admin, user);
                        }
                    }
                } else {
                    let period = reply.text.toUpperCase();
                    let now = moment();
                    if (period.includes('S')) {
                        now.add(period.split('S')[0] * 1, 's');
                    } else if (period.includes('D')) {
                        now.add(period.split('D')[0] * 1, 'd');
                    } else if (period === 'LIFETIME') {
                        now = null;
                    } else if (period.includes('M')) {
                        now.add(period.split('M')[0] * 1, 'M');
                    } else {
                        groupsBot.sendMessage(admin.id, `Illegal period. period should be a number followed by [M / D] or 'lifetime'`);
                        subscribeUser(admin, user);
                        return;
                    }
                    if (now) {
                        db.setSubscription(user.id, now.valueOf(), user.username, admin.id);
                        groupsBot.sendMessage(admin.id, `${user.username || user.id} is subscribed until ${now.format("dddd, MMMM Do YYYY, h:mm a")}`);
                    } else {
                        db.setSubscription(user.id, null, user.username, admin.id);
                        groupsBot.sendMessage(admin.id, `${user.username || user.id} is subscribed for lifetime plan`); 
                    }
                    setTimeout(() => {
                        groupsBot.sendMessage(admin.id, 'Do you want me to generate invite links for this subscriber?', {
                            reply_markup: {
                                "inline_keyboard": [
                                    [
                                        {
                                            text: "Yes",
                                            callback_data: `createInvites|${admin.id}|${user.id}`
                                        },
                                        {
                                            text: "No",
                                            callback_data: 'none'
                                        }
                                    ]
                                ]
                            }
                        });
                    }, 300);
                }
            });
        });
    }

    groupsBot.on('message', async msg => {
        if (msg.chat.type === 'supergroup') {
            return;
        }
        if (isRegisteringAdmin) {
            const adminId = msg.from.id;
            const adminUsername = msg.from.username;
            if (isSuperuser(msg)) {
                return;
            }
            groupsBot.sendMessage(isRegisteringAdmin, `If you approve registering ${adminUsername}, please send me the groups and users quota, comma seperated. Otherwise send 'no'`, { 
                reply_markup: { 
                  force_reply: true 
                }
            }).then(sentMessage => {
                groupsBot.onReplyToMessage(isRegisteringAdmin,
                  sentMessage.message_id,
                  async reply => {
                    if (reply.text.toLowerCase() === 'no') {
                        groupsBot.sendMessage(msg.chat.id, `Superadmin doesn't approve your registration. Please contact him @Crypto_Beast`);
                        isRegisteringAdmin = false;
                    } else {
                        const parsed = reply.text.split(',');
                        await db.registerAdmin(adminId, adminUsername, ...parsed);
                        groupsBot.sendMessage(msg.chat.id, `Done! You are granted to have ${parsed[0]} groups and ${parsed[1]} users in total.`);
                        groupsBot.sendMessage(isRegisteringAdmin, `Done! Registered @${adminUsername} to have ${parsed[0]} groups and ${parsed[1]} users in total.`);
                        isRegisteringAdmin = false;
                    }
                });
            });
        } else if (associatingGroup.includes(msg.from.id) && msg.forward_from_chat) {
            await db.associateAdminGroup(msg.from.id, msg.forward_from_chat.id, msg.forward_from_chat.title);
            groupsBot.sendMessage(msg.chat.id, `Associated "${msg.forward_from_chat.title}" to @Crypto_Beast Group Manager Bot`);
            associatingGroup.splice(associatingGroup.indexOf(msg.from.id), 1);
        } else if (msg.forward_sender_name && !msg.forward_from) {
            groupsBot.sendMessage(msg.chat.id, `Failed to subscribe ${msg.forward_sender_name} as a result of his privacy settings.\nPlease instruct him to allow message forwarding in order to be registered`);
        } else if (msg.forward_from) {
            const adminQuota = await db.getRegisteredAdmin(msg.from.id);
            if (!adminQuota) {
                groupsBot.sendMessage(msg.from.id, 'You are not a registered admin.\nPlease contact @Crypto_Beast to register.')
            } else {
                const subscribersCount = await db.getNumAdminSubscribers(msg.from.id);
                if (subscribersCount * 1 >= adminQuota.subscribers_quota * 1) {
                    groupsBot.sendMessage(msg.from.id, 'You have reached your max subscribers quota. Please contact @Crypto_beast to extend it.');
                } else {
                    subscribeUser(msg.from, msg.forward_from);
                }
            }
        }
    });
    groupsBot.onText(/\/testToken/, (msg) => {
        groupsBot.sendMessage(msg.chat.id, JSON.stringify(client.getBalance('0x947a385Ff71a2f31d37c1241a4b84447dA4d5066')));
    });
    groupsBot.onText(/\/register_admin/, (msg) => {
        if (!isSuperuser(msg)) {
            groupsBot.sendMessage(msg.chat.id, 'Only @Crypto_Beast allows to run this');
            return;
        } else {
            groupsBot.sendMessage(msg.chat.id, `Registering admin for the Group Manager Bot.\nPlease ask him to send me something`).then(() => {
                isRegisteringAdmin = msg.chat.id;
                setTimeout(() => {
                    isRegisteringAdmin = null
                }, 300000);
            })
        }
    });

    groupsBot.onText(/\/get_registered_admins/, async msg => {
        if (!isSuperuser(msg)) {
            groupsBot.sendMessage(msg.chat.id, 'Only @Crypto_Beast allows to run this');
            return;
        } else {
            const res = await db.getRegisteredAdmins();
            const rows = res.map(row => 
                `${row.user_id}${row.user_name ? ' (' + row.user_name + ') ' : ''} - ${row.groups_quota} groups and ${row.subscribers_quota} users`
            ).join('\n');
            if (rows === '') {
                groupsBot.sendMessage(msg.chat.id, 'No admins are registered');
            } else {
                groupsBot.sendMessage(msg.chat.id, rows);
            }
            
        }
    });

    groupsBot.onText(/\/unregister_admin (\w.+)/, async (msg, match) => {
        if (!isSuperuser(msg)) {
            groupsBot.sendMessage(msg.chat.id, 'Only @Crypto_Beast allows to run this');
            return;
        } else {
            await db.unregisterAdmin(match[1]);
            groupsBot.sendMessage(msg.chat.id, `Admin removed from registered admins list`);
        }
        
    });

    groupsBot.onText(/\/associate_group/, async msg => {
        const adminQuota = await db.getRegisteredAdmin(msg.from.id);
        if (!adminQuota) {
            groupsBot.sendMessage(msg.from.id, 'You are not a registered admin.\nPlease contact @Crypto_Beast to register.')
        } else {
            const associatedGroups = await db.getNumAdminGroups(msg.from.id);
            if (associatedGroups === adminQuota.groups_quota) {
                groupsBot.sendMessage(msg.from.id, 'You have reached your max groups quota. Please contact @Crypto_beast to extend it.');
            } else if (msg.chat.type === 'private') {
                groupsBot.sendMessage(msg.from.id, `To register a <i>channel</i> send me a message from that channel.\nTo register a <i>group</i> just type this order in the group chat.`, {parse_mode : "HTML"});
                if (!associatingGroup.includes(msg.from.id)) {
                    associatingGroup.push(msg.from.id);
                } 
            } else {
                await db.associateAdminGroup(msg.from.id, msg.chat.id, msg.chat.title);
                groupsBot.sendMessage(msg.from.id, `Associated "${msg.chat.title}" to @Crypto_Beast Group Manager Bot`);
                groupsBot.sendMessage(msg.chat.id, `Associated "${msg.chat.title}" to @Crypto_Beast Group Manager Bot`);
            }
        }
    });
    
    groupsBot.onText(/\/remove_associated_group/, async msg => {
        const groups = await db.getAssociatedAdminGroups(msg.from.id);
        if (!groups.length) {
            groupsBot.sendMessage(msg.from.id, `You are not a registered admin, or haven't associated any group yet.\nPlease contact @Crypto_Beast to register or assist.`)
        } else {
            const groupList = groups.map((g, idx) => `${idx + 1}) ${g.chat_name}`);
            groupsBot.sendMessage(msg.from.id, `Chosse a group / channel to remove:\n${groupList.join('\n')}`, { 
                reply_markup: { 
                  force_reply: true 
                }
            }).then(sentMessage => {
                groupsBot.onReplyToMessage(msg.from.id,
                  sentMessage.message_id,
                  async reply => {
                    if (!utils.isNaturalNumber(reply.text * 1) || reply.text * 1 > groups.length) {
                        groupsBot.sendMessage(msg.chat.id, `Please choose a nunber in range 1 - ${groups.length}`);
                    } else {
                        selected = groups[reply.text * 1 - 1];
                        await db.unassociateAdminGroup(selected.user_id, selected.chat_id);
                        groupsBot.sendMessage(msg.chat.id, `Done!`);
                    }
                });
            });
        }
    });

    groupsBot.onText(/\/my_associated_groups/, async msg => {
        const groups = await db.getAssociatedAdminGroups(msg.from.id);
        if (!groups.length) {
            groupsBot.sendMessage(msg.from.id, `You are not a registered admin, or haven't associated any group yet.\nPlease contact @Crypto_Beast to register or assist.`)
        } else {
            const groupList = groups.map((g, idx) => `${idx + 1}) ${g.chat_name}`);
            groupsBot.sendMessage(msg.from.id, `Your groups are:\n${groupList.join('\n')}`)
        }
    });


    groupsBot.onText(/\/my_subscription/, async msg => {
        const userId = msg.from.id;
        const res = msg.chat.type === 'private' ? await db.getSubscriptionForUser(userId) : await db.getSubscriptionForUserInGroup(userId, msg.chat.id);
        if (!res.length) {
            groupsBot.sendMessage(msg.chat.id, `You're not registered to any group using this bot`);
            return;
        }
        res.forEach(async row => {
            const adminName = await db.getAdminName(row.admin_id);
            if (row.end_time) {
                const time = moment(row.end_time * 1);
                const left = row.end_time - new Date().getTime();
                const leftDays = Math.floor(left / 1000 / 60 / 60 / 24);
                const leftHours = Math.floor((left / 1000 / 60 / 60) % 24);
                str = `Your subscription with @${adminName} ends at ${time.format("dddd, MMMM Do YYYY, h:mm a")}, which is ${getRemainingTimeStr(leftDays, leftHours)}`;
                groupsBot.sendMessage(msg.chat.id, str, {parse_mode : "HTML"});
            } else {
                groupsBot.sendMessage(msg.chat.id, `💚 You are a lifetime member with ${adminName}  💚`);
            }
        })
    })

    groupsBot.onText(/\/get_all_subscribers/, async msg => {
        const res = await db.getAllSubscriptionsByAdmin(msg.chat.id);
        if (!res.length) {
            groupsBot.sendMessage(msg.from.id, `You are not a registered admin, or haven't associated any subscriber yet.\nPlease contact @Crypto_Beast to register or assist.`)
        } else {
            groupsBot.sendMessage(msg.from.id, `Your subscribers are:`);
            const lists = [];
            res.forEach((row, idx) => {
                let outerIdx = Math.floor(idx / 20);
                let prefix = `${row.user_id}${row.user_name ? ' (@' + row.user_name + ')' : ''} - `;
                if (!lists[outerIdx]) {
                    lists[outerIdx] = [];
                }
                if (row.end_time * 1) {
                    const left = row.end_time - new Date().getTime();;
                    const leftDays = Math.floor(left / 1000 / 60 / 60 / 24);
                    const leftHours = Math.floor((left / 1000 / 60 / 60) % 24);
                    if (leftDays < 0) {
                        lists[outerIdx].push(`👉 ${prefix} 📛<i>subscription has already ended</i>📛`);
                        terminateSubscription(msg.from, row);
                    } else {
                        lists[outerIdx].push(`👉${prefix} ${moment(row.end_time * 1).format("dddd, MMMM Do YYYY, h:mm a")} - ${getRemainingTimeStr(leftDays, leftHours)}`);
                    }
                } else {
                    lists[outerIdx].push(`👉${prefix} has lifetime subscription  💚`);
                }
            });
            lists.forEach((list, i) => {
                setTimeout(() => {
                    groupsBot.sendMessage(msg.from.id, list.join('\n'), {parse_mode : "HTML"})
                }, i * 300);
            });
        }
    });

    groupsBot.onText(/\/unsubscribe (\w.+)/, async (msg, match) => {
        const groups = await db.getAssociatedAdminGroups(msg.from.id);
        if (!groups.length) {
            groupsBot.sendMessage(msg.from.id, `You are not a registered admin, or haven't associated any group yet.\nPlease contact @Crypto_Beast to register or assist.`)
        } else {
            await terminateSubscription(msg.from, {id: match[1]});
        }
        
    });

    const getRemainingTimeStr = (leftDays, leftHours) => {
        let str = `<i>${leftDays} days, ${leftHours} hours</i>`;
        if (leftDays < 3) {
            str += '  🔴';
        } else if (leftDays < 7) {
            str += '  🟡';
        }else {
            str += '  🟢';
        }
        return str;
    }

    const scanForBan = () => {
        const now = new Date().getTime();
        db.getAllEndedSubscriptions(now).then(subs => {
            subs.forEach(user => {
                groupsBot.sendMessage(Number.parseInt(user.admin_id), `${user.user_id}${user.user_name ? ' (@' + user.user_name + ')' : ''} -  subscription has ended, unsubscribing!`);
                terminateSubscription(Number.parseInt(user.admin_id), {id: user.user_id, username: user.user_name}, true);
            })
        });
    }
    groupsBot.onText(/\/tutorials/, (msg) => {
        groupsBot.sendMessage(msg.chat.id, 
          "הקמתי עבורכם ערוץ הדרכות. להלן כמה קישורים חשובים לערוץ ולסרטונים שבו: \n" ,tutorialsKeyboard);
    })

    groupsBot.onText(/\/lac/, (msg) => {
        if (!msg.reply_to_message) {
          groupsBot.sendMessage(msg.chat.id, "עובד רק כתגובה להודעה");
        } else if (!isSuperuser(msg)) {
            groupsBot.sendMessage(msg.chat.id, "רק החיה מורשת להריץ את הפקודה חצוף!");
        } else {
          const banUser = msg.reply_to_message.from.id;
          const user = msg.reply_to_message.from.username || (msg.reply_to_message.from.first_name + msg.reply_to_message.from.last_name);
          groupsBot.sendMessage(msg.chat.id, "לק לק לק");
          setTimeout(() => groupsBot.sendMessage(msg.chat.id, "מי פה מסולק?"), 1500);
          setTimeout(() => groupsBot.sendMessage(msg.chat.id, `Bye Bye ${user ? user : '!'}`), 3000);
          setTimeout(() => groupsBot.banChatMember(msg.chat.id, banUser), 4500);
        }
    });

    groupsBot.on("callback_query", (callbackQuery) => {
        const data = callbackQuery.data.split('|');
        groupsBot.deleteMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id);
        const cmd = data[0];
        if (cmd === 'none') {
            return;
        } else if (cmd === 'bible') {
          groupsBot.answerCallbackQuery(callbackQuery.id).then(() => {
            groupsBot.sendMessage(msg.chat.id, tenAmendments);
          });
        }

        admin = data[1];
        user = data[2];
        groupsBot.answerCallbackQuery(callbackQuery.id).then(async () => {
            switch (cmd) {
              case 'createInvites':
                const links = await getInviteLinks(admin, user);
                links.forEach(link => {
                    groupsBot.sendMessage(admin, link.invite_link);
                });
            }
        });
    });
    setInterval(() => scanForBan(), banScanInterval);
}