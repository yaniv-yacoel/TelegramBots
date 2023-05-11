const moment = require("moment");
moment.locale('he');
const TelegramBot = require("node-telegram-bot-api");
const { immigrationFetchOptions } = require("./consts");
const { DBFacade } = require("./DBFacade");
const groupsToken = process.env.PORT ? '5371712647:AAEWSwt65PQr40bPEsXuP2QS0_2jbWRY9wI' : '5367817799:AAH1UpBLJPiZDlKL-7yBx7fZSUDOC1s_QFc'
const immigrationsBot = new TelegramBot(groupsToken, { polling: true });
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
locationsMap = [];
exports.initiateImmigrationsBot = (db) => {
    const getDatesAndSlots = (filteredLocations, idx, maxDays) => {
        if (idx >= filteredLocations.length) {
            return;
        }
        console.log(new Date().getTime());
        const location = filteredLocations[idx];
        fetch(`https://central.qnomy.com/CentralAPI/SearchAvailableDates?maxResults=90&serviceId=${location.ServiceId}&startDate=${moment().format().split('T')[0]}`, immigrationFetchOptions.SearchAvailableDates).then(res => res.text()).then(res => {
            try {
                console.log(res)
                res = JSON.parse(res);
            } catch (e) {
                location.done = true;
                setTimeout(() => getDatesAndSlots(filteredLocations, idx + 1, maxDays), 100);
                return;
            }
            if (!res.Success || !res.Results || !res.Results.length) {
                location.done = true;
                setTimeout(() => getDatesAndSlots(filteredLocations, idx + 1, maxDays), 100);
                return;
            }
            location.calendars = res.Results
                .sort((cal1, cal2) => moment(cal1.calendarDate).valueOf() > moment(cal2.calendarDate).valueOf() ? 1 : -1);
            // location.calendars.length = Math.min(location.calendars.length, 3);
            location.calendars.forEach(calendar => {
                let date = calendar.calendarDate.split('T')[0].split('-');
                calendar.calendarDate =
                    moment()
                        .set('year', Number.parseInt(date[0], 10))
                        .set('month', Number.parseInt(date[1], 10) - 1)
                        .set('date', Number.parseInt(date[2], 10));
                const duration = moment.duration(moment().diff(calendar.calendarDate));
                if (Math.abs(duration.asDays()) > maxDays) {
                    calendar.done = true;
                    if (location.calendars.every(cal => cal.done)) {
                        location.done = true;
                    }
                    return;
                }
                fetch(`https://central.qnomy.com/CentralAPI/SearchAvailableSlots?CalendarId=${calendar.calendarId}&ServiceId=${location.serviceId}&dayPart=0`, immigrationFetchOptions.SearchAvailableSlots)
                    .then(res => res.text()).then(res => {
                        let parsed = {}
                        try {
                            parsed = JSON.parse(res)
                            res = parsed.Results;
                            if (res && res.length > 0) {
                                calendar.times = res.sort((a, b) => a.Time > b.Time ? 1 : -1);
                            }
                        } catch (e) {
                        } finally {
                            calendar.done = true;
                            if (location.calendars.every(cal => cal.done)) {
                                location.done = true;
                            }
                        }
                    }).catch(err => {
                        console.log(err)
                        location.done = true;
                        return;
                    });
            });
            setTimeout(() => getDatesAndSlots(filteredLocations, idx + 1, maxDays), 100);
        }).catch(err => {
            console.log(err)
        });
    }
    // const fillServiceIds = () => {
    //     const locationsWithoutServiceId = locationsMap.filter(location => !location.serviceId)
    //     if (locationsWithoutServiceId.length) {
    //         locationsWithoutServiceId.forEach(location => {
    //             fetchServiceId(location);
    //         });
    //         setTimeout(fillServiceIds, 60000);
    //     } else {
    //         console.log('Done setting all service ids for all ' + locationsMap.length + 'locations');
    //     }
    // }
    // const fetchServiceId = (location) => {
    //     fetch(`https://central.qnomy.com/CentralAPI/LocationGetServices?currentPage=1&isFavorite=false&locationId=${location.LocationId}&orderBy=Distance&resultsInPage=20&serviceTypeId=156`, immigrationFetchOptions.LocationGetServices).then(res => res.text()).then(res => {
    //         try {
    //             res = JSON.parse(res).Results;
    //         } catch (e) {
    //             return;
    //         }
    //         if (!res.find) {
    //             return;
    //         }
    //         const service = res.find(r => r.serviceName === 'תיאום פגישה לתיעוד ביומטרי');
    //         if (!service) {
    //             return;
    //         }
    //         location.serviceId = res.find(r => r.serviceName === 'תיאום פגישה לתיעוד ביומטרי').serviceId;
    //     });
    // }
    const getLocationsAndServices = () => {
        fetch("https://central.qnomy.com/CentralAPI/LocationSearch?currentPage=1&isFavorite=false&orderBy=Distance&organizationId=56&position=%7B%22lat%22:%2231.8943%22,%22lng%22:%2234.8192%22,%22accuracy%22:1440%7D&resultsInPage=100&serviceTypeId=156&src=mvws", immigrationFetchOptions.LocationSearch)
            .then(res => res.text()).then(res => {
                console.log('Initialized');
                locationsMap = JSON.parse(res).Results;
                // fillServiceIds();
            });
    }
    getLocationsAndServices();
    immigrationsBot.onText(/^\/start/, async msg => {
        immigrationsBot.sendMessage(msg.chat.id, 'טרם הוגדר מיקום. אנא הגדר מיקום על מנת למקד את החיפוש. רדיוס החיפוש אמור להיות קטן מ 400 קילומטרים.\nלהגדרת המיקום הרץ את הפקודה הבאה מהטלפון לאחר הפעלת ג׳יפיאס <pre>/set_location_and_radius</pre>', { parse_mode: "HTML" });
    });
    immigrationsBot.onText(/^\/set_radius/, async msg => {
        let locationRecord = await db.getLocationAndRadius(msg.chat.id);
        if (locationRecord) {
            userLocation = JSON.parse(locationRecord.location);
            immigrationsBot.sendMessage(msg.chat.id, `שלח לי בבקשה את רדיוס החיפוש המקסימלי בקילומטרים. רדיוס החיפוש אמור להיות קטן מ 400 קילומטרים. `, {
                reply_markup: {
                    force_reply: true
                }
            }).then(sentMessage => {
                immigrationsBot.onReplyToMessage(msg.chat.id,
                    sentMessage.message_id,
                    async reply => {
                        let radius = Number.parseInt(reply.text, 10);
                        if (Number.isNaN(radius)) {
                            immigrationsBot.sendMessage(msg.chat.id, 'מספר לא תקין, נסה שוב בבקשה (מספרים ללא נקודה עשרונית בלבד)');
                        } else {
                            db.setImmigrationLocationAndRadius(msg.chat.id, JSON.parse(locationRecord.location), radius);
                            immigrationsBot.sendMessage(msg.chat.id, 'המרחק נשמר. מעתה כל החיפושים יהיו ברדיוס המבוקש. לשינוי רדיוס החיפוש הרץ שוב את הפקודה.');
                        }
                    });
            });
        } else {
            immigrationsBot.sendMessage(msg.chat.id, 'לא הוגדר מיקום. אנא הגדר מיקום לפני שתוכל לשנות את רדיוס החיפוש ע״י הרצת הפקודה  <pre>/set_location_and_radius</pre>', { parse_mode: "HTML" });
        }
    })
    immigrationsBot.onText(/^\/set_location_and_radius/, msg => {
        var option = {
            "parse_mode": "Markdown",
            "reply_markup": {
                "one_time_keyboard": true,
                "keyboard": [[{
                    text: "שתף מיקום",
                    request_location: true
                }], ["בטל"]]
            }
        };
        immigrationsBot.sendMessage(msg.chat.id, 'על מנת שאוכל לחפש לפי קרבה למיקומך, אנא שתף אותו איתי', option).then(() => {
            immigrationsBot.once("location", (msg) => {
                let location = [msg.location.latitude, msg.location.longitude];
                immigrationsBot.sendMessage(msg.chat.id, `מיקומך : ${msg.location.latitude}, ${msg.location.longitude}\nכעת שלח לי בבקשה את רדיוס החיפוש המקסימלי. רדיוס החיפוש אמור להיות קטן מ 400 קילומטרים.`, {
                    reply_markup: {
                        force_reply: true
                    }
                }).then(sentMessage => {
                    immigrationsBot.onReplyToMessage(msg.chat.id,
                        sentMessage.message_id,
                        async reply => {
                            let radius = Number.parseInt(reply.text, 10);
                            if (Number.isNaN(radius)) {
                                immigrationsBot.sendMessage(msg.chat.id, 'מספר לא תקין, נסה שוב בבקשה (מספרים ללא נקודה עשרונית בלבד)');
                            } else {
                                db.setImmigrationLocationAndRadius(msg.chat.id, location, radius);
                                immigrationsBot.sendMessage(msg.chat.id, 'המרחק נשמר. מעתה כל החיפושים יהיו ברדיוס המבוקש. לשינוי רדיוס החיפוש הרץ את הפקודה <pre>/set_radius</pre>', { parse_mode: "HTML" });
                            }
                        });
                });
            })
        })
    });

    immigrationsBot.onText(/\/find/, msg => {

        if (!locationsMap.length) {
            immigrationsBot.sendMessage(msg.chat.id, 'מבצע איתחול, אנא המתן');
            setTimeout(() => findLocations(msg, 90), 30000);
        } else {
            findLocations(msg, 90)
        }
    });
    immigrationsBot.onText(/\/latest_find (\w.+)/, (msg, match) => {
        maxDays = Number.parseInt(match[1], 10);
        if (Number.isNaN(maxDays)) {
            immigrationsBot.sendMessage(msg.chat.id, 'טווח זמן החיפוש חייב להיות מספר שלם בלבד');
            return;
        } else {
            if (!locationsMap.length) {
                immigrationsBot.sendMessage(msg.chat.id, 'מבצע איתחול, אנא המתן');
                setTimeout(() => findLocations(msg, maxDays), 30000);
            } else {
                findLocations(msg, maxDays);
            }
        }

    });

    const findLocations = async (msg, maxDays) => {
        let locationRecord = await db.getLocationAndRadius(msg.chat.id);
        let userLocation = [0, 0];
        let radius = 1000;
        if (locationRecord) {
            userLocation = JSON.parse(locationRecord.location);
            radius = locationRecord.radius;
            console.log('Initiating a search for user id ' + msg.chat.id + ' name ' + (msg.from.username || (msg.from.first_name + msg.from.last_name)) + ' radius set to ' + radius + ' KM');
        } else {
            immigrationsBot.sendMessage(msg.chat.id, 'לא הוגדר רדיוס חיפוש. על מנת לייעל את תהליך החיפוש רצוי להגדיר רדיוס חיפוש על ידי הרצת הפקודה <pre>/set_location_and_radius</pre>', { parse_mode: "HTML" });
            console.log('Initiating a search for user id ' + msg.chat.id + ' name ' + msg.from.username || (msg.from.first_name + msg.from.last_name) + ' radius unset');
        }
        let filteredLocations = JSON.parse(JSON.stringify(locationsMap));
        if (userLocation[0] && userLocation[1] && radius !== 1000) {
            filteredLocations.forEach(location => location.distanceFromMe = calcDistance(...userLocation, location.Latitude, location.Longitude));
            filteredLocations = filteredLocations
                .filter(location => location.ServiceId && location.distanceFromMe <= radius)
                .sort((l1, l2) => l1.distanceFromMe > l2.distanceFromMe ? 1 : -1);
        } else {
            filteredLocations.forEach(location => location.distanceFromMe = 0)
        }
        
        getDatesAndSlots(filteredLocations, 0, maxDays);
        let lastRemaining;
        let total = filteredLocations.length;
        immigrationsBot.sendMessage(msg.chat.id, `מתחיל לאתר נתונים עבור ${total} לשכות. התהליך יכול להמשך עד 2 דקות, אנא המתן בסבלנות לסיום התהליך ואל תריץ  שוב את הפקודה.`);
        startTime = new Date().getTime();
        const timer = setInterval(() => {
            const now = new Date().getTime();
            if (filteredLocations.every(loc => loc.done) || now - startTime > 120000) {
                console.log(`Done`);
                if (now - startTime > 120000) {
                    console.log(`time is up`);
                }
                let msgs = [];
                clearInterval(timer);
                filteredLocations = filteredLocations.filter(l => l.calendars && l.calendars.length);
                filteredLocations.forEach(location => location.calendars = location.calendars.filter(cal => cal.times && cal.times.length))
                filteredLocations = filteredLocations.filter(l => l.calendars && l.calendars.length);
                filteredLocations = filteredLocations.sort((l1, l2) => {
                    let isBefore = l1.calendars[0].calendarDate.isBefore(l2.calendars[0].calendarDate, 'day');
                    let isSame = l1.calendars[0].calendarDate.isSame(l2.calendars[0].calendarDate, 'day');
                    return isBefore ? -1 : (isSame ? 0 : 1);
                });
                filteredLocations.forEach(loc => {
                    msgs = [...msgs, printItem(loc)];
                });
                msgs = msgs.filter(m => m !== undefined);
                if (!msgs.length) {
                    immigrationsBot.sendMessage(msg.chat.id, `לא נמצאו תוצאות התואמות את החיפוש המבוקש. נסה במועד אחר או שנה את הסינון במידה וקיים (רדיוס החיפוש או הזמן המקסימלי לקביעת התור)`)
                } else {
                    msgs.forEach((txt, i) => setTimeout(() => immigrationsBot.sendMessage(msg.chat.id, txt), i * 100));
                }

            } else {
                remaining = filteredLocations.filter(loc => !loc.done).length;
                if (lastRemaining !== remaining) {
                    lastRemaining = remaining;
                    immigrationsBot.sendMessage(msg.chat.id, `מאתר נתונים - ${total} / ${total - lastRemaining}`);
                }
            }
        }, 10000)
    }

    const printItem = (location, msg) => {
        location.calendars = location.calendars.filter(cal => cal.times && cal.times.length);
        if (!location.calendars.length) {
            return;
        }
        let txt = `נמצאו התורים הבאים:`;
        if (location.distanceFromMe) {
            txt += '\nמרחק: ' + Math.round(location.distanceFromMe) + ' ק״מ';
        }
        txt += '\nעיר: ' + location.City;
        txt += `\nסניף: ${location.Description}`;
        location.calendars.length = Math.min(location.calendars.length, 3);
        location.calendars.forEach(cal => {
            txt += '\n\n\nתאריך: ' + cal.calendarDate.format('l');
            const hour = Math.floor(cal.times[0].Time / 60);
            let minutes = cal.times[0].Time - hour * 60;
            if (minutes < 10) {
                minutes = '0' + minutes
            }
            txt += '\nשעה: ' + hour + ":" + minutes;
        })
        return txt;
    }

    function calcDistance(lat1, lon1, lat2, lon2) {
        const degreesToRadians = (degrees) => {
            return degrees * Math.PI / 180;
        }
        var earthRadiusKm = 6371;

        var dLat = degreesToRadians(lat2 - lat1);
        var dLon = degreesToRadians(lon2 - lon1);

        lat1 = degreesToRadians(lat1);
        lat2 = degreesToRadians(lat2);

        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }
}